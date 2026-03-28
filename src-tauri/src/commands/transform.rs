use crate::models::transform_result::TransformResult;
use crate::services::{claude_runner, history_store, template_store};
use crate::models::history_entry::HistoryEntry;
use std::collections::HashMap;
use std::sync::Arc;

#[tauri::command(rename_all = "snake_case")]
pub async fn run_transform(
    inputs: Vec<String>,
    template_ids: Vec<String>,
) -> Result<Vec<TransformResult>, String> {
    if inputs.is_empty() {
        return Err("No inputs provided".to_string());
    }
    if template_ids.is_empty() {
        return Err("No templates selected".to_string());
    }

    // 같은 template_id를 그룹핑: { "a1b2" => 3, "e5f6" => 1 }
    let mut count_map: HashMap<String, usize> = HashMap::new();
    let mut order: Vec<String> = Vec::new();
    for id in &template_ids {
        let entry = count_map.entry(id.clone()).or_insert_with(|| {
            order.push(id.clone());
            0
        });
        *entry += 1;
    }

    let shared_inputs = Arc::new(inputs);

    let mut handles = Vec::new();
    for id in &order {
        let count = count_map[id];
        let template = template_store::get_template(id)?;
        let inputs_ref = Arc::clone(&shared_inputs);
        let handle = tokio::spawn(async move {
            claude_runner::run_claude(&inputs_ref, &template, count).await
        });
        handles.push((handle, id.clone(), count));
    }

    let mut results = Vec::new();
    for (handle, template_id, _count) in handles {
        match handle.await {
            Ok(result) => results.push(result),
            Err(e) => {
                let template_name = template_store::get_template(&template_id)
                    .map(|t| t.name)
                    .unwrap_or_else(|_| template_id.clone());
                results.push(TransformResult {
                    template_id,
                    template_name,
                    output: serde_json::Value::Null,
                    success: false,
                    error: Some(format!("Task failed: {}", e)),
                    duration_ms: 0,
                });
            }
        }
    }

    // 히스토리 자동 저장
    let entry = HistoryEntry {
        id: uuid::Uuid::new_v4().to_string(),
        inputs: shared_inputs.as_ref().clone(),
        results: results.clone(),
        created_at: chrono::Utc::now().to_rfc3339(),
    };
    history_store::save_history(&entry).ok();

    Ok(results)
}
