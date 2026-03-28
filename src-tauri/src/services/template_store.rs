use crate::models::template::Template;
use std::fs;
use std::path::PathBuf;

fn templates_dir() -> PathBuf {
    let base = dirs::data_dir().unwrap_or_else(|| PathBuf::from("."));
    let dir = base.join("uTransform").join("templates");
    fs::create_dir_all(&dir).ok();
    dir
}

pub fn list_templates() -> Result<Vec<Template>, String> {
    let dir = templates_dir();
    let mut templates = Vec::new();

    let entries = fs::read_dir(&dir).map_err(|e| e.to_string())?;
    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) == Some("json") {
            let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
            if let Ok(template) = serde_json::from_str::<Template>(&content) {
                templates.push(template);
            }
        }
    }

    templates.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
    Ok(templates)
}

pub fn get_template(id: &str) -> Result<Template, String> {
    let path = templates_dir().join(format!("{}.json", id));
    let content = fs::read_to_string(&path).map_err(|e| format!("Template not found: {}", e))?;
    serde_json::from_str(&content).map_err(|e| e.to_string())
}

pub fn save_template(template: &Template) -> Result<(), String> {
    let path = templates_dir().join(format!("{}.json", template.id));
    let content = serde_json::to_string_pretty(template).map_err(|e| e.to_string())?;
    fs::write(&path, content).map_err(|e| e.to_string())
}

pub fn delete_template(id: &str) -> Result<(), String> {
    let path = templates_dir().join(format!("{}.json", id));
    fs::remove_file(&path).map_err(|e| format!("Failed to delete: {}", e))
}
