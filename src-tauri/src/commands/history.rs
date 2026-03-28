use crate::models::history_entry::HistoryEntry;
use crate::services::history_store;

#[tauri::command]
pub fn list_history() -> Result<Vec<HistoryEntry>, String> {
    history_store::list_history()
}

#[tauri::command]
pub fn delete_history(id: String) -> Result<(), String> {
    history_store::delete_history(&id)
}

#[tauri::command]
pub fn clear_history() -> Result<(), String> {
    history_store::clear_history()
}
