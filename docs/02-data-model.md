# 02 — データモデル（SQLiteスキーマ）

## 基本方針

- SQLiteファイルをユーザーのアプリデータフォルダに保存
- 将来的にsqlcipherでAES-256暗号化予定
- マイグレーションはバージョン管理（db_versionテーブルで管理）
- 日付はISO 8601形式（YYYY-MM-DD）でTEXT保存
- 金額は整数（円単位）で保存（浮動小数点エラー回避）

---

## テーブル定義

### accounts（口座・資産）

```sql
CREATE TABLE accounts (
    id          TEXT PRIMARY KEY,  -- UUID
    name        TEXT NOT NULL,     -- 口座名（例：三菱UFJ普通）
    type        TEXT NOT NULL,     -- bank / securities / crypto / mobile_pay / cash / other
    currency    TEXT NOT NULL DEFAULT 'JPY',
    balance     INTEGER NOT NULL DEFAULT 0,  -- 残高（円）
    color       TEXT,              -- UIカラー（hex）
    icon        TEXT,              -- アイコン名
    sort_order  INTEGER NOT NULL DEFAULT 0,
    is_active   INTEGER NOT NULL DEFAULT 1,  -- 0=非表示
    note        TEXT,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
);
```

### categories（カテゴリ）

```sql
CREATE TABLE categories (
    id          TEXT PRIMARY KEY,  -- UUID
    name        TEXT NOT NULL,     -- カテゴリ名
    parent_id   TEXT,              -- 親カテゴリID（NULLなら親カテゴリ）
    type        TEXT NOT NULL,     -- expense / income / both
    icon        TEXT,
    color       TEXT,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    is_active   INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL,
    FOREIGN KEY (parent_id) REFERENCES categories(id)
);
```

### transactions（取引）

```sql
CREATE TABLE transactions (
    id              TEXT PRIMARY KEY,  -- UUID
    date            TEXT NOT NULL,     -- YYYY-MM-DD
    type            TEXT NOT NULL,     -- expense / income / transfer
    amount          INTEGER NOT NULL,  -- 金額（円・正の整数）
    account_id      TEXT NOT NULL,     -- 支出元・収入先口座
    to_account_id   TEXT,              -- 振替先口座（type=transferのみ）
    category_id     TEXT,
    subcategory_id  TEXT,
    description     TEXT,              -- メモ・店名
    payment_method  TEXT,              -- cash / credit_card / suica / paypay / other
    tags            TEXT,              -- JSON配列 ["旅行","食費"]
    receipt_image   TEXT,              -- 画像パス（将来）
    is_recurring    INTEGER DEFAULT 0, -- 固定費フラグ
    created_at      TEXT NOT NULL,
    updated_at      TEXT NOT NULL,
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    FOREIGN KEY (to_account_id) REFERENCES accounts(id),
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (subcategory_id) REFERENCES categories(id)
);
```

### budgets（予算）

```sql
CREATE TABLE budgets (
    id          TEXT PRIMARY KEY,  -- UUID
    category_id TEXT NOT NULL,
    year_month  TEXT NOT NULL,     -- YYYY-MM
    amount      INTEGER NOT NULL,  -- 予算額
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);
```

### recurring_transactions（固定費テンプレート）

```sql
CREATE TABLE recurring_transactions (
    id              TEXT PRIMARY KEY,
    type            TEXT NOT NULL,
    amount          INTEGER NOT NULL,
    account_id      TEXT NOT NULL,
    category_id     TEXT,
    description     TEXT,
    payment_method  TEXT,
    day_of_month    INTEGER,  -- 毎月何日
    is_active       INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT NOT NULL,
    updated_at      TEXT NOT NULL
);
```

### db_version（マイグレーション管理）

```sql
CREATE TABLE db_version (
    version     INTEGER PRIMARY KEY,
    applied_at  TEXT NOT NULL
);
```

---

## デフォルトカテゴリ（初期データ）

### 支出カテゴリ

| 親カテゴリ | 子カテゴリ |
| --- | --- |
| 食費 | 自炊・外食・カフェ・お菓子 |
| 交通費 | 電車・バス・タクシー・ガソリン |
| 光熱費 | 電気・ガス・水道 |
| 通信費 | スマホ・インターネット |
| 住居費 | 家賃・管理費・修繕 |
| 医療費 | 病院・薬・健康診断 |
| 娯楽 | サブスク・映画・ゲーム・書籍 |
| 衣服 | 衣類・靴・アクセサリー |
| 日用品 | 消耗品・掃除用品 |
| 教育 | 習い事・資格・書籍 |
| 交際費 | 飲み会・プレゼント |
| 特別支出 | 旅行・家電・家具 |
| その他 | — |

### 収入カテゴリ

| カテゴリ |
| --- |
| 給与 |
| 賞与 |
| 副業収入 |
| 投資収益（配当・売却益） |
| その他収入 |

---

## 口座タイプ定義

| type | 説明 | 例 |
| --- | --- | --- |
| bank | 銀行口座 | 三菱UFJ・楽天銀行 |
| securities | 証券口座 | SBI証券・楽天証券 |
| crypto | 仮想通貨 | bitFlyer・Coincheck |
| mobile_pay | モバイルペイ | PayPay・LINE Pay・Suica |
| cash | 現金 | 財布 |
| other | その他 | ポイント残高等 |

---

## DBファイルパス

```text
Windows: %APPDATA%\shisan-note\data.db
macOS:   ~/Library/Application Support/shisan-note/data.db
Linux:   ~/.local/share/shisan-note/data.db
```

Tauriの `app_data_dir()` を使って取得する。
