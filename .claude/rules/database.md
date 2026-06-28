---
globs:
  - "src-tauri/src/db.rs"
  - "src-tauri/src/commands/**/*"
  - "docs/02-data-model.md"
---

# データベース実装ルール

このファイルはDB・スキーマ・マイグレーション関連を扱うときの指針。
スキーマの正式定義は `docs/02-data-model.md` を参照すること（こちらが正）。

---

## 基本方針

- 金額：INTEGER（円単位）。浮動小数点は使わない
- 日付：TEXT（YYYY-MM-DD、ISO 8601）
- ID：TEXT（UUID）
- 真偽値：INTEGER（0 / 1）
- タグ等の配列：TEXT（JSON文字列）

---

## テーブル一覧

| テーブル | 役割 |
|---|---|
| accounts | 口座・資産 |
| categories | カテゴリ（階層構造） |
| transactions | 取引（収入・支出・振替） |
| budgets | 予算 |
| recurring_transactions | 固定費テンプレート |
| db_version | マイグレーション管理 |

詳細なカラム定義は `docs/02-data-model.md` を参照。

---

## マイグレーション運用

- スキーマ変更時は `db_version` をインクリメントする
- マイグレーションは前方互換を保ち、既存ユーザーのデータを壊さない
- カラム追加は `ALTER TABLE`、複雑な変更は新テーブル作成＋データ移行

## 外部キー整合性

- `transactions.account_id` → `accounts.id`
- `transactions.category_id` → `categories.id`
- `categories.parent_id` → `categories.id`（自己参照・階層）
- 口座・カテゴリの削除は論理削除（is_active=0）。取引履歴は残す

## 初期データ

- 初回起動時にデフォルトカテゴリ（支出13・収入5）を投入する
- デフォルトカテゴリの定義は `docs/02-data-model.md` を参照
