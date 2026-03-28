mod commands;
mod models;
mod services;

use commands::{history, settings, template, transform};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            template::list_templates,
            template::get_template,
            template::create_template,
            template::update_template,
            template::delete_template,
            transform::run_transform,
            settings::get_claude_path,
            settings::set_claude_path,
            settings::detect_claude_paths,
            history::list_history,
            history::delete_history,
            history::clear_history,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
