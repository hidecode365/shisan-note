use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;
use uuid::Uuid;
use chrono::Utc;
use crate::db::DbState;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Transaction {
    pub id: String,
    pub date: String,
    #[serde(rename = "type")]
    pub transaction_type: String,
    pub amount: i64,
    pub account_id: String,
    pub to_account_id: Option<String>,
    pub category_id: Option<String>,
    pub subcategory_id: Option<String>,
    pub description: Option<String>,
    pub payment_method: Option<String>,
    pub tags: Option<String>,
    pub is_recurring: i64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct TransactionInput {
    pub date: String,
    #[serde(rename = "type")]
    pub transaction_type: String,
    pub amount: i64,
    pub account_id: String,
    pub to_account_id: Option<String>,
    pub category_id: Option<String>,
    pub description: Option<String>,
    pub payment_method: Option<String>,
}

fn map_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<Transaction> {
    Ok(Transaction {
        id: row.get(0)?,
        date: row.get(1)?,
        transaction_type: row.get(2)?,
        amount: row.get(3)?,
        account_id: row.get(4)?,
        to_account_id: row.get(5)?,
        category_id: row.get(6)?,
        subcategory_id: row.get(7)?,
        description: row.get(8)?,
        payment_method: row.get(9)?,
        tags: row.get(10)?,
        is_recurring: row.get(11)?,
        created_at: row.get(12)?,
        updated_at: row.get(13)?,
    })
}

#[tauri::command]
pub fn get_transactions(
    account_id: Option<String>,
    year_month: Option<String>,
    state: State<'_, DbState>,
) -> Result<Vec<Transaction>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;

    // ★ 受信した生の year_month を先にログ（Some/None を明確に判別）
    eprintln!("[get_transactions] account_id={:?}  year_month_raw={:?}", account_id, year_month);

    let ym = year_month.unwrap_or_else(|| Utc::now().format("%Y-%m").to_string());
    let date_like = format!("{}-__", ym);
    eprintln!("[get_transactions] → resolved ym={}  date_like={}", ym, date_like);

    let select = "SELECT id, date, type, amount, account_id, to_account_id, category_id, subcategory_id,
                         description, payment_method, tags, is_recurring, created_at, updated_at
                  FROM transactions";

    let transactions: Vec<Transaction> = if let Some(aid) = account_id {
        let mut stmt = conn
            .prepare(&format!(
                "{} WHERE (account_id = ?1 OR to_account_id = ?1) AND date LIKE ?2
                 ORDER BY date DESC, created_at DESC",
                select
            ))
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(params![aid, date_like], map_row)
            .map_err(|e| e.to_string())?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| e.to_string())?;
        rows
    } else {
        let mut stmt = conn
            .prepare(&format!(
                "{} WHERE date LIKE ?1 ORDER BY date DESC, created_at DESC",
                select
            ))
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(params![date_like], map_row)
            .map_err(|e| e.to_string())?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| e.to_string())?;
        rows
    };

    Ok(transactions)
}

#[tauri::command]
pub fn create_transaction(
    input: TransactionInput,
    state: State<'_, DbState>,
) -> Result<Transaction, String> {
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().format("%Y-%m-%dT%H:%M:%SZ").to_string();

    let tx = conn.transaction().map_err(|e| e.to_string())?;

    tx.execute(
        "INSERT INTO transactions
         (id, date, type, amount, account_id, to_account_id, category_id,
          description, payment_method, is_recurring, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 0, ?10, ?10)",
        params![
            id, input.date, input.transaction_type, input.amount,
            input.account_id, input.to_account_id, input.category_id,
            input.description, input.payment_method, now
        ],
    )
    .map_err(|e| e.to_string())?;

    match input.transaction_type.as_str() {
        "expense" => {
            tx.execute(
                "UPDATE accounts SET balance = balance - ?1, updated_at = ?2 WHERE id = ?3",
                params![input.amount, now, input.account_id],
            )
            .map_err(|e| e.to_string())?;
        }
        "income" => {
            tx.execute(
                "UPDATE accounts SET balance = balance + ?1, updated_at = ?2 WHERE id = ?3",
                params![input.amount, now, input.account_id],
            )
            .map_err(|e| e.to_string())?;
        }
        "transfer" => {
            tx.execute(
                "UPDATE accounts SET balance = balance - ?1, updated_at = ?2 WHERE id = ?3",
                params![input.amount, now, input.account_id],
            )
            .map_err(|e| e.to_string())?;
            if let Some(ref to_id) = input.to_account_id {
                tx.execute(
                    "UPDATE accounts SET balance = balance + ?1, updated_at = ?2 WHERE id = ?3",
                    params![input.amount, now, to_id],
                )
                .map_err(|e| e.to_string())?;
            }
        }
        _ => {}
    }

    tx.commit().map_err(|e| e.to_string())?;

    Ok(Transaction {
        id,
        date: input.date,
        transaction_type: input.transaction_type,
        amount: input.amount,
        account_id: input.account_id,
        to_account_id: input.to_account_id,
        category_id: input.category_id,
        subcategory_id: None,
        description: input.description,
        payment_method: input.payment_method,
        tags: None,
        is_recurring: 0,
        created_at: now.clone(),
        updated_at: now,
    })
}

#[tauri::command]
pub fn delete_transaction(id: String, state: State<'_, DbState>) -> Result<(), String> {
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    let now = Utc::now().format("%Y-%m-%dT%H:%M:%SZ").to_string();

    let tx_opt: Option<Transaction> = conn
        .query_row(
            "SELECT id, date, type, amount, account_id, to_account_id, category_id, subcategory_id,
                    description, payment_method, tags, is_recurring, created_at, updated_at
             FROM transactions WHERE id = ?1",
            params![id],
            map_row,
        )
        .ok();

    let Some(record) = tx_opt else {
        return Ok(());
    };

    let tx = conn.transaction().map_err(|e| e.to_string())?;

    match record.transaction_type.as_str() {
        "expense" => {
            tx.execute(
                "UPDATE accounts SET balance = balance + ?1, updated_at = ?2 WHERE id = ?3",
                params![record.amount, now, record.account_id],
            )
            .map_err(|e| e.to_string())?;
        }
        "income" => {
            tx.execute(
                "UPDATE accounts SET balance = balance - ?1, updated_at = ?2 WHERE id = ?3",
                params![record.amount, now, record.account_id],
            )
            .map_err(|e| e.to_string())?;
        }
        "transfer" => {
            tx.execute(
                "UPDATE accounts SET balance = balance + ?1, updated_at = ?2 WHERE id = ?3",
                params![record.amount, now, record.account_id],
            )
            .map_err(|e| e.to_string())?;
            if let Some(ref to_id) = record.to_account_id {
                tx.execute(
                    "UPDATE accounts SET balance = balance - ?1, updated_at = ?2 WHERE id = ?3",
                    params![record.amount, now, to_id],
                )
                .map_err(|e| e.to_string())?;
            }
        }
        _ => {}
    }

    tx.execute("DELETE FROM transactions WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;

    tx.commit().map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn create_transactions_bulk(
    inputs: Vec<TransactionInput>,
    state: State<'_, DbState>,
) -> Result<Vec<Transaction>, String> {
    if inputs.is_empty() {
        return Ok(vec![]);
    }

    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    let now = Utc::now().format("%Y-%m-%dT%H:%M:%SZ").to_string();
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    let mut results = Vec::new();

    for input in inputs {
        let id = Uuid::new_v4().to_string();

        tx.execute(
            "INSERT INTO transactions
             (id, date, type, amount, account_id, to_account_id, category_id,
              description, payment_method, is_recurring, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 0, ?10, ?10)",
            params![
                id, input.date, input.transaction_type, input.amount,
                input.account_id, input.to_account_id, input.category_id,
                input.description, input.payment_method, now
            ],
        )
        .map_err(|e| e.to_string())?;

        match input.transaction_type.as_str() {
            "expense" => {
                tx.execute(
                    "UPDATE accounts SET balance = balance - ?1, updated_at = ?2 WHERE id = ?3",
                    params![input.amount, now, input.account_id],
                )
                .map_err(|e| e.to_string())?;
            }
            "income" => {
                tx.execute(
                    "UPDATE accounts SET balance = balance + ?1, updated_at = ?2 WHERE id = ?3",
                    params![input.amount, now, input.account_id],
                )
                .map_err(|e| e.to_string())?;
            }
            "transfer" => {
                tx.execute(
                    "UPDATE accounts SET balance = balance - ?1, updated_at = ?2 WHERE id = ?3",
                    params![input.amount, now, input.account_id],
                )
                .map_err(|e| e.to_string())?;
                if let Some(ref to_id) = input.to_account_id {
                    tx.execute(
                        "UPDATE accounts SET balance = balance + ?1, updated_at = ?2 WHERE id = ?3",
                        params![input.amount, now, to_id],
                    )
                    .map_err(|e| e.to_string())?;
                }
            }
            _ => {}
        }

        results.push(Transaction {
            id,
            date: input.date,
            transaction_type: input.transaction_type,
            amount: input.amount,
            account_id: input.account_id,
            to_account_id: input.to_account_id,
            category_id: input.category_id,
            subcategory_id: None,
            description: input.description,
            payment_method: input.payment_method,
            tags: None,
            is_recurring: 0,
            created_at: now.clone(),
            updated_at: now.clone(),
        });
    }

    tx.commit().map_err(|e| e.to_string())?;
    Ok(results)
}

#[derive(Debug, Deserialize)]
pub struct TransactionUpdateInput {
    pub id: String,
    pub date: String,
    #[serde(rename = "type")]
    pub transaction_type: String,
    pub amount: i64,
    pub account_id: String,
    pub to_account_id: Option<String>,
    pub category_id: Option<String>,
    pub description: Option<String>,
    pub payment_method: Option<String>,
}

#[tauri::command]
pub fn update_transactions_bulk(
    updates: Vec<TransactionUpdateInput>,
    state: State<'_, DbState>,
) -> Result<(), String> {
    if updates.is_empty() {
        return Ok(());
    }

    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    let now = Utc::now().format("%Y-%m-%dT%H:%M:%SZ").to_string();
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    for upd in &updates {
        let (old_type, old_amount, old_account_id, old_to_id): (String, i64, String, Option<String>) =
            tx.query_row(
                "SELECT type, amount, account_id, to_account_id FROM transactions WHERE id = ?1",
                params![upd.id],
                |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?)),
            )
            .map_err(|e| e.to_string())?;

        // 旧残高を逆算して戻す
        match old_type.as_str() {
            "expense" => {
                tx.execute(
                    "UPDATE accounts SET balance = balance + ?1, updated_at = ?2 WHERE id = ?3",
                    params![old_amount, now, old_account_id],
                ).map_err(|e| e.to_string())?;
            }
            "income" => {
                tx.execute(
                    "UPDATE accounts SET balance = balance - ?1, updated_at = ?2 WHERE id = ?3",
                    params![old_amount, now, old_account_id],
                ).map_err(|e| e.to_string())?;
            }
            "transfer" => {
                tx.execute(
                    "UPDATE accounts SET balance = balance + ?1, updated_at = ?2 WHERE id = ?3",
                    params![old_amount, now, old_account_id],
                ).map_err(|e| e.to_string())?;
                if let Some(ref to_id) = old_to_id {
                    tx.execute(
                        "UPDATE accounts SET balance = balance - ?1, updated_at = ?2 WHERE id = ?3",
                        params![old_amount, now, to_id],
                    ).map_err(|e| e.to_string())?;
                }
            }
            _ => {}
        }

        // 新残高を適用
        match upd.transaction_type.as_str() {
            "expense" => {
                tx.execute(
                    "UPDATE accounts SET balance = balance - ?1, updated_at = ?2 WHERE id = ?3",
                    params![upd.amount, now, upd.account_id],
                ).map_err(|e| e.to_string())?;
            }
            "income" => {
                tx.execute(
                    "UPDATE accounts SET balance = balance + ?1, updated_at = ?2 WHERE id = ?3",
                    params![upd.amount, now, upd.account_id],
                ).map_err(|e| e.to_string())?;
            }
            "transfer" => {
                tx.execute(
                    "UPDATE accounts SET balance = balance - ?1, updated_at = ?2 WHERE id = ?3",
                    params![upd.amount, now, upd.account_id],
                ).map_err(|e| e.to_string())?;
                if let Some(ref to_id) = upd.to_account_id {
                    tx.execute(
                        "UPDATE accounts SET balance = balance + ?1, updated_at = ?2 WHERE id = ?3",
                        params![upd.amount, now, to_id],
                    ).map_err(|e| e.to_string())?;
                }
            }
            _ => {}
        }

        tx.execute(
            "UPDATE transactions SET date = ?1, type = ?2, amount = ?3, account_id = ?4,
             to_account_id = ?5, category_id = ?6, description = ?7, payment_method = ?8,
             updated_at = ?9 WHERE id = ?10",
            params![
                upd.date, upd.transaction_type, upd.amount, upd.account_id,
                upd.to_account_id, upd.category_id, upd.description, upd.payment_method,
                now, upd.id
            ],
        ).map_err(|e| e.to_string())?;
    }

    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}
