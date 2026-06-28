---
globs:
  - "src/**/*"
---

# フロントエンド実装ルール（src/ 配下）

このファイルは `src/` 配下のファイルを編集するときにロードされる。

---

## ディレクトリ構成

```
src/
├── components/
│   ├── ui/          ← shadcn/ui（直接編集可だが追加はCLIで）
│   ├── layout/      ← Sidebar・Topbarなどレイアウト系
│   └── features/    ← 機能単位のコンポーネント（entry/ accounts/ など）
├── pages/           ← ルーティング単位の画面
├── hooks/           ← カスタムフック（useTransactions など）
├── lib/
│   ├── utils.ts     ← shadcn/ui ユーティリティ
│   └── tauri.ts     ← Tauriコマンド呼び出しラッパー
└── types/
    └── index.ts     ← 共通型定義
```

---

## コンポーネント実装

- 関数コンポーネント＋Hooksのみ。クラスコンポーネント禁止
- propsの型は必ず interface で定義
- 1コンポーネント1ファイル
- 大きくなったら `components/features/` 配下に機能ごとのサブフォルダを切る

## 状態管理

- v1.0は `useState` / `useContext` で管理
- データ量が増えたら Zustand を検討（Reduxは採用しない）
- ローカルストレージAPIは使わない（Tauri経由でSQLiteに保存する）

## Tauriコマンドの呼び出し

- `invoke` は直接呼ばず、`src/lib/tauri.ts` のラッパー関数経由で呼ぶ
- これによりコマンド名の変更やエラーハンドリングを一箇所に集約する

```typescript
// lib/tauri.ts に集約する例
import { invoke } from "@tauri-apps/api/core";

export async function createTransaction(tx: TransactionInput): Promise<Transaction> {
  return invoke("create_transaction", { tx });
}
```

## フォーム実装の注意

- submitはbuttonの `onClick` で処理する。`<form>` のsubmitイベントは使わない
  （Tauriのイベントと競合する場合があるため）
- 金額入力は `onChange` でカンマフォーマット処理を行う

## アイコン

- lucide-react を使う（shadcn/ui Nova presetの標準）
- インポート例：`import { ShoppingCart } from "lucide-react"`

## ダークモード

- shadcn/uiのテーマ機能を使う
- 色はCSS変数で指定し、ライト/ダーク両対応にする
