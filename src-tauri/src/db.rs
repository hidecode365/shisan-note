use rusqlite::{Connection, Result, params};
use std::path::Path;
use std::sync::Mutex;
use uuid::Uuid;
use chrono::Utc;

pub struct DbState(pub Mutex<Connection>);

pub fn initialize(db_path: &Path) -> Result<Connection> {
    let conn = Connection::open(db_path)?;
    conn.execute_batch("PRAGMA foreign_keys = ON;")?;
    migrate(&conn)?;
    Ok(conn)
}

fn now_str() -> String {
    Utc::now().format("%Y-%m-%dT%H:%M:%SZ").to_string()
}

fn migrate(conn: &Connection) -> Result<()> {
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS db_version (
            version    INTEGER PRIMARY KEY,
            applied_at TEXT NOT NULL
        );",
    )?;

    let version: i32 = conn
        .query_row(
            "SELECT COALESCE(MAX(version), 0) FROM db_version",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0);

    if version < 1 {
        migrate_v1(conn)?;
        conn.execute(
            "INSERT INTO db_version (version, applied_at) VALUES (1, ?1)",
            [now_str()],
        )?;
    }

    if version < 2 {
        conn.execute(
            "UPDATE categories SET icon = 'Signal' WHERE name = '通信費'",
            [],
        )?;
        conn.execute(
            "INSERT INTO db_version (version, applied_at) VALUES (2, ?1)",
            [now_str()],
        )?;
    }

    if version < 3 {
        let now = now_str();
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS settings (
                key        TEXT PRIMARY KEY,
                value      TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );",
        )?;
        conn.execute(
            "INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES ('shortcut.entry.add_row', 'Shift+Enter', ?1)",
            [&now],
        )?;
        conn.execute(
            "INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES ('shortcut.entry.save_draft', 'Ctrl+Enter', ?1)",
            [&now],
        )?;
        conn.execute(
            "INSERT INTO db_version (version, applied_at) VALUES (3, ?1)",
            [&now],
        )?;
    }

    Ok(())
}

fn migrate_v1(conn: &Connection) -> Result<()> {
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS accounts (
            id         TEXT PRIMARY KEY,
            name       TEXT NOT NULL,
            type       TEXT NOT NULL,
            currency   TEXT NOT NULL DEFAULT 'JPY',
            balance    INTEGER NOT NULL DEFAULT 0,
            color      TEXT,
            icon       TEXT,
            sort_order INTEGER NOT NULL DEFAULT 0,
            is_active  INTEGER NOT NULL DEFAULT 1,
            note       TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS categories (
            id         TEXT PRIMARY KEY,
            name       TEXT NOT NULL,
            parent_id  TEXT,
            type       TEXT NOT NULL,
            icon       TEXT,
            color      TEXT,
            sort_order INTEGER NOT NULL DEFAULT 0,
            is_active  INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (parent_id) REFERENCES categories(id)
        );

        CREATE TABLE IF NOT EXISTS transactions (
            id             TEXT PRIMARY KEY,
            date           TEXT NOT NULL,
            type           TEXT NOT NULL,
            amount         INTEGER NOT NULL,
            account_id     TEXT NOT NULL,
            to_account_id  TEXT,
            category_id    TEXT,
            subcategory_id TEXT,
            description    TEXT,
            payment_method TEXT,
            tags           TEXT,
            receipt_image  TEXT,
            is_recurring   INTEGER DEFAULT 0,
            created_at     TEXT NOT NULL,
            updated_at     TEXT NOT NULL,
            FOREIGN KEY (account_id) REFERENCES accounts(id),
            FOREIGN KEY (to_account_id) REFERENCES accounts(id),
            FOREIGN KEY (category_id) REFERENCES categories(id),
            FOREIGN KEY (subcategory_id) REFERENCES categories(id)
        );

        CREATE TABLE IF NOT EXISTS budgets (
            id          TEXT PRIMARY KEY,
            category_id TEXT NOT NULL,
            year_month  TEXT NOT NULL,
            amount      INTEGER NOT NULL,
            created_at  TEXT NOT NULL,
            updated_at  TEXT NOT NULL,
            FOREIGN KEY (category_id) REFERENCES categories(id)
        );

        CREATE TABLE IF NOT EXISTS recurring_transactions (
            id             TEXT PRIMARY KEY,
            type           TEXT NOT NULL,
            amount         INTEGER NOT NULL,
            account_id     TEXT NOT NULL,
            category_id    TEXT,
            description    TEXT,
            payment_method TEXT,
            day_of_month   INTEGER,
            is_active      INTEGER NOT NULL DEFAULT 1,
            created_at     TEXT NOT NULL,
            updated_at     TEXT NOT NULL
        );",
    )?;

    seed_categories(conn)?;
    seed_accounts(conn)?;

    Ok(())
}

fn seed_categories(conn: &Connection) -> Result<()> {
    let now = now_str();

    let expense_cats: &[(&str, &str)] = &[
        ("食費", "ShoppingCart"),
        ("交通費", "Train"),
        ("光熱費", "Zap"),
        ("通信費", "Signal"),
        ("住居費", "Home"),
        ("医療費", "Stethoscope"),
        ("娯楽", "Tv"),
        ("衣服", "Shirt"),
        ("日用品", "Package"),
        ("教育", "BookOpen"),
        ("交際費", "Users"),
        ("特別支出", "Star"),
        ("その他", "MoreHorizontal"),
    ];

    for (i, (name, icon)) in expense_cats.iter().enumerate() {
        let id = Uuid::new_v4().to_string();
        conn.execute(
            "INSERT INTO categories (id, name, parent_id, type, icon, sort_order, created_at, updated_at)
             VALUES (?1, ?2, NULL, 'expense', ?3, ?4, ?5, ?5)",
            params![id, name, icon, i as i64, now],
        )?;
    }

    let income_cats: &[(&str, &str)] = &[
        ("給与", "Wallet"),
        ("賞与", "TrendingUp"),
        ("副業収入", "Briefcase"),
        ("投資収益", "PiggyBank"),
        ("その他収入", "Plus"),
    ];

    for (i, (name, icon)) in income_cats.iter().enumerate() {
        let id = Uuid::new_v4().to_string();
        conn.execute(
            "INSERT INTO categories (id, name, parent_id, type, icon, sort_order, created_at, updated_at)
             VALUES (?1, ?2, NULL, 'income', ?3, ?4, ?5, ?5)",
            params![id, name, icon, i as i64, now],
        )?;
    }

    Ok(())
}

fn seed_accounts(conn: &Connection) -> Result<()> {
    let now = now_str();
    let id = Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO accounts (id, name, type, currency, balance, sort_order, created_at, updated_at)
         VALUES (?1, '財布（現金）', 'cash', 'JPY', 0, 0, ?2, ?2)",
        params![id, now],
    )?;
    Ok(())
}
