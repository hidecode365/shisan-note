mod db;
mod commands;

use std::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            use tauri::Manager;
            let data_dir = app.path().app_data_dir()?;
            std::fs::create_dir_all(&data_dir)?;
            let db_path = data_dir.join("data.db");
            let conn = db::initialize(&db_path)?;
            app.manage(db::DbState(Mutex::new(conn)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::accounts::get_accounts,
            commands::accounts::create_account,
            commands::accounts::update_account,
            commands::accounts::delete_account,
            commands::categories::get_categories,
            commands::transactions::get_transactions,
            commands::transactions::create_transaction,
            commands::transactions::create_transactions_bulk,
            commands::transactions::delete_transaction,
            commands::transactions::update_transactions_bulk,
            commands::settings::get_settings,
            commands::settings::save_setting,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application")
}
