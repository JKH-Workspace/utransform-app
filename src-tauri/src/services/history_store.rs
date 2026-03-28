use crate::models::history_entry::HistoryEntry;
use std::fs;
use std::path::PathBuf;

fn history_dir() -> PathBuf {
    let base = dirs::data_dir().unwrap_or_else(|| PathBuf::from("."));
    let dir = base.join("uTransform").join("history");
    fs::create_dir_all(&dir).ok();
    dir
}

pub fn list_history() -> Result<Vec<HistoryEntry>, String> {
    let dir = history_dir();
    let mut entries = Vec::new();

    let dir_entries = fs::read_dir(&dir).map_err(|e| e.to_string())?;
    for entry in dir_entries.flatten() {
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) == Some("json") {
            let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
            if let Ok(history) = serde_json::from_str::<HistoryEntry>(&content) {
                entries.push(history);
            }
        }
    }

    entries.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    Ok(entries)
}

pub fn save_history(entry: &HistoryEntry) -> Result<(), String> {
    let path = history_dir().join(format!("{}.json", entry.id));
    let content = serde_json::to_string_pretty(entry).map_err(|e| e.to_string())?;
    fs::write(&path, content).map_err(|e| e.to_string())
}

pub fn delete_history(id: &str) -> Result<(), String> {
    let path = history_dir().join(format!("{}.json", id));
    fs::remove_file(&path).map_err(|e| format!("Failed to delete: {}", e))
}

pub fn clear_history() -> Result<(), String> {
    let dir = history_dir();
    let entries = fs::read_dir(&dir).map_err(|e| e.to_string())?;
    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) == Some("json") {
            fs::remove_file(&path).ok();
        }
    }
    Ok(())
}
