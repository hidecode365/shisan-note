# CLAUDE.md — ShiSan Note

ShiSan Note（しさんノート）= Windows向けローカル完結型 家計・資産管理アプリ。
データは外部送信せずPC内のみに保存する「プライバシーファースト」が核心価値。
将来 macOS / Linux / モバイルへ展開予定。

このファイルは索引兼・全機能共通ルール。詳細は `docs/` を参照すること。

---

## ドキュメントの読み方

- 全体像・機能一覧・ロードマップ → `REQUIREMENTS.md`
- 現在のタスク状況 → `ToDo.md`
- 機能を実装するとき → `docs/features/FXX-*.md`（仕様＋実装メモ）
- データ構造 → `docs/02-data-model.md`
- 設計判断の背景 → `docs/adr/`
- フロントエンド作業時 → `.claude/rules/frontend.md` が自動ロードされる
- Rust作業時 → `.claude/rules/backend.md` が自動ロードされる

機能を実装する前に、必ず対応する `docs/features/FXX-*.md` を読むこと。

---

## ToDo管理

- `ToDo.md`（プロジェクトルート）がタスク管理の唯一の情報源
- セッション開始時に必ず参照し、現在の状況を把握する
- タスク完了時は該当項目を `[ ]` → `[x]` に更新する
- 新規タスクが発生した場合は合意の上で追記する
- 要件変更は `REQUIREMENTS.md` に先に反映してから `ToDo.md` を更新する

---

## 技術スタック

- Tauri v2（Rustバックエンド）
- React 19 + TypeScript
- Tailwind CSS v4（@tailwindcss/vite プラグイン）
- shadcn/ui（Radix + Nova preset）
- SQLite（rusqlite、将来 sqlcipher で暗号化）

---

## ビルド・テストコマンド

```powershell
npx tsc --noEmit        # 型チェック
cargo build             # Rustビルド（src-tauri内 or --manifest-path指定）
npm run tauri dev       # 開発起動
npm run tauri build     # プロダクションビルド
```

実装の最後は必ず `cargo build` を通し、`npm run tauri dev` で起動確認する。

---

## 触ってはいけないもの

- `src/components/ui/` … shadcn/ui生成物。コンポーネント追加は `npx shadcn@latest add` を使う
- `tsconfig.json` の `paths` … `@/*` エイリアス設定済み。`baseUrl` は追加しない（TS7.0で非推奨）
- `src-tauri/target/` … ビルド成果物
- `node_modules/` … 依存パッケージ

---

## 全機能共通ルール

### 命名

- ファイル名：ケバブケース（`entry-form.tsx`）
- コンポーネント名：パスカルケース（`EntryForm`）
- importは `@/` エイリアスを使う

### データの扱い

- 金額は整数（円単位）で保存・計算する。浮動小数点は使わない
- 日付はISO 8601（YYYY-MM-DD）のTEXTで保存
- ID はUUIDを使う

### エラーハンドリング

- Rust：すべて `Result<T, String>` で返す。`unwrap()` 禁止
- TypeScript：`any` 禁止。propsの型は必ず interface で定義

### スタイリング

- Tailwindユーティリティクラスのみ。インラインスタイル原則禁止
- カスタムカラーは `src/App.css` の `:root` にCSS変数で定義

---

## Claude Codeへの指示ルール

1. 要件変更は先に `REQUIREMENTS.md` または `docs/features/FXX-*.md` に反映してから指示する
2. プロンプトの末尾は「`cargo build` を通して、`npm run tauri dev` で起動して」で締める
3. `npm run tauri dev` 起動後のスクリーンキャプチャによる自動GUIテストは不要
4. `tsc --noEmit` や `cargo build` などの従来のテストは引き続き実施する
5. 推測・不確かな情報は「おそらく〜と思われる」と前置きする
6. 機能固有の重要な実装判断は、その機能の `docs/features/FXX-*.md` の「## 実装メモ」欄に追記する
7. 全機能に効く普遍ルールのみ、このCLAUDE.mdに追記する（200行を超えないこと）

## テスト方針

- 自動GUIテスト（スクリーンショット・ウィンドウ操作）は実施しない
- 動作確認は `npm run tauri dev` で起動して目視確認を促すのみ
- `cargo build` と `tsc --noEmit` によるビルドエラーチェックは引き続き実施
