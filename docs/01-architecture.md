# 01 — 技術スタック・アーキテクチャ

## 技術選定の全体像

```text
┌─────────────────────────────────────────────┐
│  フロントエンド                               │
│  React 19 + TypeScript + Tailwind CSS v4    │
│  shadcn/ui（Radix + Nova preset）           │
├─────────────────────────────────────────────┤
│  デスクトップ基盤                             │
│  Tauri v2（Rust）                           │
│  Windows: WebView2（Edgeベース）             │
│  macOS: WebKit（将来）                       │
├─────────────────────────────────────────────┤
│  ローカルDB                                  │
│  SQLite（rusqlite）                         │
│  将来：sqlcipherでAES-256暗号化              │
├─────────────────────────────────────────────┤
│  配布                                        │
│  Microsoft Store（MSIX）                    │
│  GitHub Releases（.msi / .exe）             │
├─────────────────────────────────────────────┤
│  将来拡張                                    │
│  Tauri v2 Mobile → iOS / Android 同一コード  │
└─────────────────────────────────────────────┘
```

## 各技術の選定理由

### Tauri v2

- バンドルサイズ：約12MB（Electronの約180MBに対して93%削減）
- メモリ使用量：約85MB（Electronの約450MBに対して81%削減）
- セキュリティ：フロントエンドはデフォルトでサンドボックス化、OSアクセスはRustコマンドで明示的に宣言
- 将来性：v2でiOS・Androidモバイルサポートが安定版として提供

### shadcn/ui

- コンポーネントがsrc/components/ui/に直接コピーされるため、ライブラリ廃止リスクなし
- Tailwind CSSとの親和性が高い
- カスタマイズが自由

### SQLite

- ファイル1つで完結するローカルDB
- Rust側でrusqliteを使って直接操作
- 将来的にsqlcipherで暗号化予定

---

## フロントエンドのレイヤー構成

```text
src/
├── pages/           ← ルーティング単位の画面
│   ├── DashboardPage.tsx
│   ├── EntryPage.tsx
│   ├── TransactionsPage.tsx
│   ├── ChartsPage.tsx
│   ├── AccountsPage.tsx
│   ├── BudgetPage.tsx
│   └── SettingsPage.tsx
├── components/
│   ├── ui/          ← shadcn/ui（触らない）
│   ├── layout/      ← Sidebar・Topbar
│   └── features/    ← 機能コンポーネント
│       ├── entry/
│       ├── accounts/
│       ├── charts/
│       └── ...
├── hooks/           ← カスタムフック
│   ├── useTransactions.ts
│   ├── useAccounts.ts
│   └── ...
├── lib/
│   ├── utils.ts     ← shadcn/ui utilities
│   └── tauri.ts     ← Tauriコマンド呼び出しラッパー
└── types/
    └── index.ts     ← 共通型定義
```

## Rustバックエンドのレイヤー構成

```text
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

## データフロー

```text
ユーザー操作（React）
    ↓
invoke（@tauri-apps/api）
    ↓
Rustコマンド（src-tauri/src/commands/）
    ↓
SQLite（rusqlite）
    ↓
Result<T, String>で返却
    ↓
React状態更新 → UI再描画
```

---

## ルーティング

React Router v6を使用。

```text
/                → ダッシュボード
/entry           → 記帳
/transactions    → 取引一覧
/charts          → グラフ分析
/accounts        → 口座管理
/budget          → 予算管理
/settings        → 設定
```

---

## 状態管理方針

v1.0はReactの `useState` / `useContext` で管理。
データ量が増えてきた段階でZustandの導入を検討する。
Reduxは過剰なため採用しない。

---

## AI機能のアーキテクチャ（v1.5以降）

```text
スクリーンショット取得（Tauri OS API）
    ↓
解析エンジン選択（優先順）
    1. ローカルLLM（Ollama検出時）→ コストゼロ・完全オフライン
    2. ユーザー設定APIキー（Claude Haiku / GPT-4o-mini / Gemini）
    3. Gemini無償API（お試し機能）
    ↓
構造化データ抽出
{ date, amount, store, category, items }
    ↓
記帳フォームに自動入力
```
