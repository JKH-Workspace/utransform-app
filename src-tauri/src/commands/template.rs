use crate::models::template::Template;
use crate::services::template_store;
use chrono::Utc;
use uuid::Uuid;

#[tauri::command]
pub fn list_templates() -> Result<Vec<Template>, String> {
    template_store::list_templates()
}

#[tauri::command]
pub fn get_template(id: String) -> Result<Template, String> {
    template_store::get_template(&id)
}

#[tauri::command(rename_all = "snake_case")]
pub fn create_template(
    name: String,
    description: String,
    json_schema: serde_json::Value,
) -> Result<Template, String> {
    let now = Utc::now().to_rfc3339();
    let template = Template {
        id: Uuid::new_v4().to_string(),
        name,
        description,
        json_schema: Some(json_schema),
        example_output: None,
        created_at: now.clone(),
        updated_at: now,
    };
    template_store::save_template(&template)?;
    Ok(template)
}

#[tauri::command(rename_all = "snake_case")]
pub fn update_template(
    id: String,
    name: String,
    description: String,
    json_schema: serde_json::Value,
) -> Result<Template, String> {
    let existing = template_store::get_template(&id)?;
    let template = Template {
        id,
        name,
        description,
        json_schema: Some(json_schema),
        example_output: None,
        created_at: existing.created_at,
        updated_at: Utc::now().to_rfc3339(),
    };
    template_store::save_template(&template)?;
    Ok(template)
}

#[tauri::command]
pub fn delete_template(id: String) -> Result<(), String> {
    template_store::delete_template(&id)
}
