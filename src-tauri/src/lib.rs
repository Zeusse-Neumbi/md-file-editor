mod commands;
mod models;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            commands::file::open_file,
            commands::file::save_file,
            commands::file::open_directory,
            commands::file::check_file_status,
            commands::app::get_app_version,
            commands::app::get_app_name,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
