# ShiSan Note — 要件定義 ルートインデックス

## プロダクト概要

**ShiSan Note**（しさんノート）は、Windows 11向けのローカル完結型 家計・資産管理アプリ。
データは一切外部送信せず、ユーザーのPC内にのみ保存する「プライバシーファースト」を核心価値とする。
将来的にはmacOS・Linuxへのクロスプラットフォーム展開を視野に入れる。

- 開発者：hidecode365
- リポジトリ：github.com/hidecode365/shisan-note
- 技術スタック：Tauri v2 + React + TypeScript + Rust + Tailwind CSS + shadcn/ui

---

## ドキュメント構成

| ファイル | 内容 |
| --- | --- |
| `docs/00-overview.md` | プロダクト概要・コンセプト・非機能要件 |
| `docs/01-architecture.md` | 技術スタック・レイヤー構成・ディレクトリ構成 |
| `docs/02-data-model.md` | DB設計（SQLiteスキーマ・暗号化方針） |
| `docs/03-ui-design.md` | デザインシステム・画面共通ルール |
| `docs/features/F01-entry.md` | 記帳機能 |
| `docs/features/F02-accounts.md` | 口座・資産管理 |
| `docs/features/F03-dashboard.md` | ダッシュボード |
| `docs/features/F04-transactions.md` | 取引一覧・検索・フィルタ |
| `docs/features/F05-categories.md` | カテゴリ管理 |
| `docs/features/F06-import-csv.md` | CSV取込（銀行・クレカ明細） |
| `docs/features/F07-charts.md` | グラフ分析 |
| `docs/features/F08-budget.md` | 予算管理 |
| `docs/features/F09-import-ai.md` | AI画面解析（v1.5以降） |
| `docs/features/F10-settings.md` | 設定画面（ショートカット設定・将来の拡張基盤） |
| `docs/features/F10-subscription.md` | サブスクリプション課金（v2.0以降） |
| `docs/adr/0001-local-first.md` | なぜローカル保存を選んだか |
| `docs/adr/0002-inline-entry-ux.md` | 記帳UIをインライン表入力方式に変更 |

---

## 機能優先度・ロードマップ

### v1.0 MVP（最初にリリースするもの）

| 優先度 | 機能 | ドキュメント |
| --- | --- | --- |
| 1 | 記帳フォーム（手動入力） | F01 |
| 2 | 口座・資産管理 | F02 |
| 3 | ダッシュボード | F03 |
| 4 | 取引一覧・検索 | F04 |
| 5 | カテゴリ管理 | F05 |
| 6 | CSVインポート | F06 |
| 7 | カテゴリ別グラフ | F07（基本のみ） |
| 8 | 設定画面（ショートカット設定・将来の拡張基盤） | F10 |

### v1.5（ファン獲得後）

| 機能 | ドキュメント |
| --- | --- |
| AI画面解析（Gemini無償API・ユーザーAPIキー対応） | F09 |
| 予算管理・アラート | F08 |
| グラフ拡張（ウォーターフォール・折れ線） | F07 |

### v2.0（収益化フェーズ）

| 機能 | ドキュメント |
| --- | --- |
| サブスクリプション課金（低額・月300〜500円） | F10 |
| CSVエクスポート（Excel・会計ソフト連携） | F06拡張 |
| ローカルLAN同期 or 自前クラウド選択式 | 未作成 |
| レシートOCR | F09拡張 |

---

## 用語集

| 用語 | 定義 |
| --- | --- |
| 口座 | 銀行口座・証券口座・仮想通貨口座・モバイルペイ残高など資産を保持する器 |
| 取引 | 収入・支出・振替のいずれかの記録1件 |
| カテゴリ | 取引の分類（食費・交通費など）。階層構造（親・子）を持つ |
| 振替 | 口座間の資金移動（支出でも収入でもない） |
| 総資産 | 全口座残高の合計 |
| frecency | 頻度（frequency）＋直近性（recency）を組み合わせたランキング指標 |
