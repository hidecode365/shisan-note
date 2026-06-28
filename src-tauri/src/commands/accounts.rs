use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;
use uuid::Uuid;
use chrono::Utc;
use crate::db::DbState;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Account {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub account_type: String,
    pub currency: String,
    pub balance: i64,
    pub color: Option<String>,
    pub icon: Option<String>,
    pub sort_order: i64,
    pub is_active: i64,
    pub note: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct AccountInput {
    pub name: String,
    #[serde(rename = "type")]
    pub account_type: String,
    pub currency: Option<String>,
    pub balance: Option<i64>,
    pub color: Option<String>,
    pub icon: Option<String>,
    pub sort_order: Option<i64>,
    pub note: Option<String>,
}

#[tauri::command]
pub fn get_accounts(state: State<'_, DbState>) -> Result<Vec<Account>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT id, name, type, currency, balance, color, icon, sort_order, is_active, note, created_at, updated_at
             FROM accounts WHERE is_active = 1 ORDER BY sort_order ASC, name ASC",
        )
        .map_err(|e| e.to_string())?;

    let accounts = stmt
        .query_map([], |row| {
            Ok(Account {
                id: row.get(0)?,
                name: row.get(1)?,
                account_type: row.get(2)?,
                currency: row.get(3)?,
                balance: row.get(4)?,
                color: row.get(5)?,
                icon: row.get(6)?,
                sort_order: row.get(7)?,
                is_active: row.get(8)?,
                note: row.get(9)?,
                created_at: row.get(10)?,
                updated_at: row.get(11)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(accounts)
}

#[tauri::command]
pub fn create_account(input: AccountInput, state: State<'_, DbState>) -> Result<Account, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().format("%Y-%m-%dT%H:%M:%SZ").to_string();
    let currency = input.currency.unwrap_or_else(|| "JPY".to_string());
    let balance = input.balance.unwrap_or(0);
    let sort_order = input.sort_order.unwrap_or(0);

    conn.execute(
        "INSERT INTO accounts (id, name, type, currency, balance, color, icon, sort_order, is_active, note, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 1, ?9, ?10, ?10)",
        params![id, input.name, input.account_type, currency, balance, input.color, input.icon, sort_order, input.note, now],
    )
    .map_err(|e| e.to_string())?;

    Ok(Account {
        id,
        name: input.name,
        account_type: input.account_type,
        currency,
        balance,
        color: input.color,
        icon: input.icon,
        sort_order,
        is_active: 1,
        note: input.note,
        created_at: now.clone(),
        updated_at: now,
    })
}
