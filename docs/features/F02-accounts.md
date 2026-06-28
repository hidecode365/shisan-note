# F02 — 口座・資産管理

## 概要

複数の口座・資産を登録・管理する機能。
銀行口座・証券口座・仮想通貨・電子マネー残高など、あらゆる資産の器を一元管理する。

---

## 対応口座タイプ

| タイプ | アイコン | カラー | 例 |
| --- | --- | --- | --- |
| bank（銀行） | Landmark | ブルー | 三菱UFJ・楽天銀行・住信SBI |
| securities（証券） | ChartCandlestick | アンバー | SBI証券・楽天証券・松井証券 |
| crypto（仮想通貨） | Bitcoin | コーラル | bitFlyer・Coincheck・GMOコイン |
| mobile_pay（電子マネー） | Smartphone | ティール | PayPay・LINE Pay・Suica・nanaco |
| cash（現金） | Wallet | グレー | 財布・小口現金 |
| other（その他） | MoreHorizontal | グレー | ポイント残高等 |

---

## 口座一覧画面

- 口座タイプ別にグループ表示
- 各口座カード：口座名・残高・タイプアイコン・カラー
- 総資産サマリー（全口座合計）を最上部に表示
- 残高の手動更新ボタン（証券・仮想通貨は価格変動があるため）
- ドラッグ&ドロップで並び順変更（将来）

---

## 口座追加・編集

### 入力フィールド

| フィールド | 必須 | 備考 |
| --- | --- | --- |
| 口座名 | ✓ | 例：三菱UFJ普通・SBI証券NISA |
| タイプ | ✓ | bank / securities / crypto / mobile_pay / cash / other |
| 初期残高 | ✓ | 登録時点の残高 |
| 通貨 | - | デフォルトJPY（将来：USD・BTC等） |
| カラー | - | カード表示色 |
| メモ | - | 口座番号末尾等の管理用メモ |

---

## 残高の扱い

残高は以下2つの方法で管理する：

1. **取引ベース**（推奨）：取引を記録するごとに自動で残高を増減
2. **手動調整**：残高調整機能で直接上書き（証券評価額の更新等に使用）

---

## 実装上の注意

- 口座削除は論理削除（is_active=0）。取引履歴は残す
- 残高は `transactions` テーブルの集計値として算出するが、パフォーマンスのために `accounts.balance` にキャッシュする
- 取引保存時に `accounts.balance` を更新する処理を必ずセットで行う

---

## 実装メモ（Claude Codeが追記する欄）

- `get_accounts` / `create_account` は accounts.rs に実装済み（実装時点から存在）
- `update_account` / `delete_account` を accounts.rs に追加。delete は論理削除（is_active=0）のみ
- `update_account` は balance も上書きする（手動調整 = 編集ダイアログの「残高（手動調整）」欄）
- AccountsPage は タイプ別グループ表示、総資産サマリー、追加・編集・削除ダイアログを実装
- 削除確認は Dialog（window.confirm は不使用）
- アイコンは lucide-react を使用：Landmark / ChartCandlestick / Bitcoin / Smartphone / Wallet / MoreHorizontal
