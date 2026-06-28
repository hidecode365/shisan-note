# ShiSan Note — ToDo

最終更新：2026-06-28

---

## 凡例

- [ ] 未着手
- [~] 進行中
- [x] 完了
- ⚠️ 要検討・保留

---

## 環境構築

- [x] Tauri v2 + React 19 + TypeScript セットアップ
- [x] Tailwind CSS v4 導入
- [x] shadcn/ui（Radix + Nova preset）導入
- [x] @/ エイリアス設定（tsconfig.json + vite.config.ts）
- [x] @types/node 導入
- [x] Claude Code v2.1.187 初期化（auto memory）

---

## ドキュメント

- [x] CLAUDE.md（索引型・90行）
- [x] REQUIREMENTS.md（機能優先度・ロードマップ）
- [x] .claude/rules/frontend.md
- [x] .claude/rules/backend.md
- [x] .claude/rules/database.md
- [x] docs/00-overview.md
- [x] docs/01-architecture.md
- [x] docs/02-data-model.md
- [x] docs/features/F01-entry.md
- [x] docs/features/F02-accounts.md
- [x] docs/adr/0001-local-first.md

---

## Git / GitHub

- [x] GitHub 2FA設定
- [x] GitHubにパブリックリポジトリ作成（shisan-note）
- [x] ローカルでGit初期化（git init）
- [x] .gitignore 作成
- [x] 初回コミット・リモートpush

---

## フォルダ構成整理

- [ ] README.md 作成（ライセンス明示含む）

---

## 実装：バックエンド（Rust）

- [x] src-tauri/src/db.rs（SQLite接続・マイグレーション）
- [x] src-tauri/src/commands/accounts.rs（CRUD）
- [x] src-tauri/src/commands/categories.rs（CRUD）
- [x] src-tauri/src/commands/transactions.rs（CRUD・残高同時更新）
- [x] lib.rs に各コマンドを登録

---

## 実装：フロントエンド（React）

- [x] src/types/index.ts（共通型定義）
- [x] src/lib/tauri.ts（invoke ラッパー）
- [x] src/components/layout/Sidebar.tsx
- [x] src/components/layout/Topbar.tsx
- [ ] React Router 導入・ルーティング設定
- [x] src/pages/EntryPage.tsx（左右分割レイアウト）
- [x] src/components/features/entry/EntryForm.tsx
- [x] src/components/features/entry/TransactionList.tsx
- [x] src/components/features/entry/AccountStrip.tsx

---

## v1.0 MVP 機能

- [x] F01 記帳フォーム（手動入力）
- [ ] F02 口座・資産管理
- [ ] F03 ダッシュボード
- [ ] F04 取引一覧・検索
- [ ] F05 カテゴリ管理
- [ ] F06 CSV インポート
- [ ] F07 グラフ分析（基本）

---

## 将来タスク（v1.5〜）

### プレミアム・課金

- [ ] プレミアム機能設計・実装
- [ ] 決済サービス：Stripe（日本語対応・手数料約3.6%）
- [ ] ライセンス認証サーバー：Vercel Functions（無料枠で運用）
  - issue.ts　← Stripe Webhook受信→ライセンスキー発行
  - verify.ts　← アプリからの検証リクエスト受付
- [ ] Stripe上で商品（サブスク300〜500円）作成
- [ ] ライセンスキー設計（UUID v4形式：XXXX-XXXX-XXXX-XXXX）
- [ ] Vercel Functions実装（TypeScript・200行程度）
- [ ] アプリ側ライセンス認証実装（src-tauri/src/commands/license.rs）
  - 初回アクティベーション時のみVercelへオンライン検証
  - 検証結果をローカルに暗号化保存（AES-256）
  - 月1回バックグラウンドで再検証（サブスク失効検知）
- [ ] 設定画面にライセンスキー入力欄を実装
- [ ] .env管理（StripeシークレットキーはVercel側のみ・リポジトリに含めない）

### その他

- [ ] AI画面解析（Gemini / ユーザーAPIキー）
- [ ] 予算管理機能
- [ ] business/ ドキュメント整備（収益化戦略）
- [ ] CSV エクスポート
- [ ] LAN同期

---

## 運用ルール

- このファイルはClaudeとのすり合わせ用として、セッション開始時に共有する
- タスク完了時はステータスを [x] に更新してから次のタスクへ進む
- 要件変更は先に REQUIREMENTS.md に反映してから Claude Code へ指示する
