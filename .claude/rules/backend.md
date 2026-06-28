---
globs:
  - "src-tauri/**/*"
---

# バックエンド実装ルール（src-tauri/ 配下）

このファイルは `src-tauri/` 配下のファイルを編集するときにロードされる。

---

## ディレクトリ構成

```
src-tauri/src/
├── main.rs          ← エントリーポイント
├── lib.rs           ← コマンド登録
├── db.rs            ← SQLite接続・マイグレーション
└── commands/
    ├── transactions.rs  ← 取引CRUD
    ├── accounts.rs      ← 口座CRUD
    ├── categories.rs    ← カテゴリCRUD
    ├── budgets.rs       ← 予算管理
    └── import.rs        ← CSV取込
```

---

## Tauriコマンド実装

- コマンドは機能ごとに `commands/` 配下のファイルに分割する
- すべてのコマンドは `Result<T, String>` を返す
- `unwrap()` / `expect()` は使わない。`?` 演算子か明示的なエラーハンドリングを使う
- 新しいコマンドは `lib.rs` の `invoke_handler` に登録する

```rust
#[tauri::command]
pub fn create_transaction(tx: TransactionInput) -> Result<Transaction, String> {
    // ...
    Ok(transaction)
}
```

---

## SQLite（rusqlite）

- DB接続は `db.rs` で管理する
- DBファイルパスは Tauri の `app_data_dir()` から取得する
  - Windows: `%APPDATA%\shisan-note\data.db`
- マイグレーションは `db_version` テーブルでバージョン管理する
- スキーマ定義は `docs/02-data-model.md` に従う

## 残高更新の整合性

- 取引（transaction）を作成・更新・削除したときは、必ず該当口座の
  `accounts.balance` も同じ処理内で更新する
- 残高はキャッシュ値であり、取引の集計と矛盾しないようにする

## セキュリティ

- ファイル起動は `cmd.exe` 経由ではなく `ShellExecuteW` を使う
- 外部ネットワーク通信はAI機能使用時のみ。それ以外は一切行わない
- 将来：sqlcipherでDBをAES-256暗号化する

## トレイ・アイコン

- トレイアイコンはハードコードせず `include_bytes!` でファイルを読み込む
