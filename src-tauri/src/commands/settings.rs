use crate::services::settings_store;
use std::path::PathBuf;

#[tauri::command]
pub fn get_claude_path() -> Result<String, String> {
    let settings = settings_store::load_settings();
    Ok(settings.claude_path.unwrap_or_default())
}

#[tauri::command(rename_all = "snake_case")]
pub fn set_claude_path(claude_path: String) -> Result<(), String> {
    let mut settings = settings_store::load_settings();
    settings.claude_path = if claude_path.is_empty() {
        None
    } else {
        Some(claude_path)
    };
    settings_store::save_settings(&settings)
}

#[tauri::command]
pub fn detect_claude_paths() -> Result<Vec<String>, String> {
    let home = dirs::home_dir().unwrap_or_default();
    let candidates = [
        home.join(".local/bin/claude"),
        home.join(".cargo/bin/claude"),
        PathBuf::from("/usr/local/bin/claude"),
        PathBuf::from("/opt/homebrew/bin/claude"),
    ];

    let mut found: Vec<String> = candidates
        .iter()
        .filter(|p| p.exists())
        .map(|p| p.to_string_lossy().to_string())
        .collect();

    // nvm 경로는 glob이므로 직접 탐색
    let nvm_base = home.join(".nvm/versions/node");
    if nvm_base.exists() {
        if let Ok(entries) = std::fs::read_dir(&nvm_base) {
            for entry in entries.flatten() {
                let claude = entry.path().join("bin/claude");
                if claude.exists() {
                    let path_str = claude.to_string_lossy().to_string();
                    if !found.contains(&path_str) {
                        found.push(path_str);
                    }
                }
            }
        }
    }

    Ok(found)
}
