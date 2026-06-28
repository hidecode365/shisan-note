import { useEffect, useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { EntryFormRow } from "@/components/features/entry/EntryForm";
import type { Account, Category, DraftRow, Transaction, TransactionType } from "@/types";
import type { ShortcutDef } from "@/lib/shortcuts";
import { formatShortcut } from "@/lib/shortcuts";
import { deleteTransaction } from "@/lib/tauri";

type Mode = "normal" | "add" | "edit";

const TYPE_OPTIONS: { value: TransactionType; label: string }[] = [
  { value: "expense", label: "支出" },
  { value: "income", label: "収入" },
  { value: "transfer", label: "振替" },
];

const TYPE_BADGE: Record<string, string> = {
  expense: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  income: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  transfer: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

const TYPE_LABEL: Record<string, string> = {
  expense: "支出",
  income: "収入",
  transfer: "振替",
};

const TYPE_COLOR: Record<string, string> = {
  expense: "text-red-600",
  income: "text-green-600",
  transfer: "text-blue-600",
};

function fmtAmt(amount: number, type: string): string {
  const sign = type === "income" ? "+" : type === "expense" ? "-" : "";
  return `${sign}¥${amount.toLocaleString("ja-JP")}`;
}

function formatDate(iso: string): string {
  return iso.replace(/-/g, "/");
}

// ─── 編集可能な確定済み行 ────────────────────────────────────────────

interface EditableRowProps {
  tx: Transaction;
  changes: Partial<Transaction>;
  accounts: Account[];
  categories: Category[];
  onEditChange: (id: string, update: Partial<Transaction>) => void;
  onDelete: (id: string) => void;
}

function EditableConfirmedRow({
  tx,
  changes,
  accounts,
  categories,
  onEditChange,
  onDelete,
}: EditableRowProps) {
  const merged = { ...tx, ...changes } as Transaction;
  const [amountStr, setAmountStr] = useState(
    () => merged.amount.toLocaleString("ja-JP")
  );

  const isChanged = (field: keyof Transaction) => field in changes;

  const filteredCats = categories.filter(
    (c) => !c.parent_id && (c.type === merged.type || c.type === "both")
  );

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/[^\d]/g, "");
    setAmountStr(digits ? parseInt(digits, 10).toLocaleString("ja-JP") : "");
    onEditChange(tx.id, { amount: digits ? parseInt(digits, 10) : 0 });
  }

  function handleTypeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    onEditChange(tx.id, {
      type: e.target.value as TransactionType,
      category_id: undefined,
      to_account_id: undefined,
    });
  }

  const cell = "border-r border-border last:border-r-0 px-1.5 py-1 align-middle";
  const highlighted = "bg-yellow-200 dark:bg-yellow-700/40";
  const inp =
    "w-full bg-transparent text-sm focus:outline-none focus:bg-primary/5 rounded px-1 py-0.5 h-7 min-w-0";
  const sel =
    "w-full bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring rounded px-0.5 h-7 cursor-pointer min-w-0";

  return (
    <tr className="border-b border-border">
      <td className={`${cell} ${isChanged("date") ? highlighted : ""}`}>
        <input
          type="date"
          value={merged.date}
          onChange={(e) => onEditChange(tx.id, { date: e.target.value })}
          className={inp}
        />
      </td>

      <td className={`${cell} ${isChanged("type") ? highlighted : ""}`}>
        <select
          value={merged.type}
          onChange={handleTypeChange}
          className={`${sel} font-medium ${TYPE_COLOR[merged.type] ?? ""}`}
        >
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value} className="text-foreground font-normal">
              {o.label}
            </option>
          ))}
        </select>
      </td>

      <td className={`${cell} ${isChanged("amount") ? highlighted : ""}`}>
        <input
          type="text"
          inputMode="numeric"
          value={amountStr}
          onChange={handleAmountChange}
          className={`${inp} text-right tabular-nums font-semibold ${TYPE_COLOR[merged.type] ?? ""}`}
        />
      </td>

      <td
        className={`${cell} ${
          isChanged("category_id") || isChanged("to_account_id") ? highlighted : ""
        }`}
      >
        {merged.type === "transfer" ? (
          <select
            value={merged.to_account_id ?? ""}
            onChange={(e) =>
              onEditChange(tx.id, { to_account_id: e.target.value || undefined })
            }
            className={sel}
          >
            <option value="">振替先口座...</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        ) : (
          <select
            value={merged.category_id ?? ""}
            onChange={(e) =>
              onEditChange(tx.id, { category_id: e.target.value || undefined })
            }
            className={sel}
          >
            <option value="">カテゴリ...</option>
            {filteredCats.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
      </td>

      <td className={`${cell} ${isChanged("description") ? highlighted : ""}`}>
        <input
          type="text"
          value={merged.description ?? ""}
          onChange={(e) =>
            onEditChange(tx.id, { description: e.target.value || undefined })
          }
          placeholder="メモ・店名..."
          className={inp}
        />
      </td>

      <td className="px-1.5 py-1 text-center align-middle">
        <button
          onClick={() => onDelete(tx.id)}
          tabIndex={-1}
          className="text-muted-foreground hover:text-destructive p-0.5 rounded transition-colors"
        >
          <Trash2 size={13} />
        </button>
      </td>
    </tr>
  );
}

// ─── TransactionList ──────────────────────────────────────────────────

interface TransactionListProps {
  transactions: Transaction[];
  draftRows: DraftRow[];
  accounts: Account[];
  categories: Category[];
  newlyConfirmedIds: string[];
  mode: Mode;
  editChanges: Record<string, Partial<Transaction>>;
  onEditChange: (id: string, update: Partial<Transaction>) => void;
  addRowShortcut: ShortcutDef;
  saveDraftShortcut: ShortcutDef;
  onAddRow: () => void;
  onChange: (id: string, field: keyof DraftRow, value: string) => void;
  onDeleteDraft: (id: string) => void;
  onRowKeyDown: (e: React.KeyboardEvent, rowId: string) => void;
  onDeleteConfirmed: (id: string) => void;
}

export function TransactionList({
  transactions,
  draftRows,
  accounts,
  categories,
  newlyConfirmedIds,
  mode,
  editChanges,
  onEditChange,
  addRowShortcut,
  saveDraftShortcut,
  onAddRow,
  onChange,
  onDeleteDraft,
  onRowKeyDown,
  onDeleteConfirmed,
}: TransactionListProps) {
  const [highlightIds, setHighlightIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (newlyConfirmedIds.length === 0) return;
    setHighlightIds(new Set(newlyConfirmedIds));
    const t = setTimeout(() => setHighlightIds(new Set()), 2000);
    return () => clearTimeout(t);
  }, [newlyConfirmedIds]);

  const accountMap = Object.fromEntries(accounts.map((a) => [a.id, a.name]));
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  async function handleDeleteConfirmed(id: string) {
    try {
      await deleteTransaction(id);
      onDeleteConfirmed(id);
    } catch (e) {
      console.error("削除失敗:", e);
    }
  }

  const thCls =
    "px-2 py-2 text-left text-xs font-medium text-muted-foreground border-b border-border border-r last:border-r-0 bg-muted/30 whitespace-nowrap";

  const isEmpty = draftRows.length === 0 && transactions.length === 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-sm" style={{ minWidth: 680 }}>
          <colgroup>
            <col style={{ width: 108 }} />
            <col style={{ width: 64 }} />
            <col style={{ width: 104 }} />
            <col />
            <col />
            <col style={{ width: 36 }} />
          </colgroup>

          <thead className="sticky top-0 z-10">
            <tr>
              <th className={thCls}>日付</th>
              <th className={thCls}>種別</th>
              <th className={`${thCls} text-right`}>金額</th>
              <th className={thCls}>カテゴリ / 振替先</th>
              <th className={thCls}>メモ・店名</th>
              <th className={`${thCls} text-center`}></th>
            </tr>
          </thead>

          <tbody>
            {/* 下書き行（追加モード） */}
            {draftRows.map((row, index) => (
              <EntryFormRow
                key={row.id}
                row={row}
                accounts={accounts}
                categories={categories}
                focusAmount={index === draftRows.length - 1}
                onChange={onChange}
                onDelete={onDeleteDraft}
                onKeyDown={onRowKeyDown}
              />
            ))}

            {/* + 行を追加ボタン（追加モードのみ） */}
            {mode === "add" && (
              <tr>
                <td colSpan={6} className="border-b border-border px-1.5 py-1">
                  <button
                    onClick={onAddRow}
                    className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded py-1 transition-colors"
                  >
                    <Plus size={12} />
                    行を追加
                  </button>
                </td>
              </tr>
            )}

            {/* 仕切り */}
            {draftRows.length > 0 && transactions.length > 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-0.5 text-[10px] text-muted-foreground bg-muted/20 border-y border-dashed border-border"
                >
                  確定済み
                </td>
              </tr>
            )}

            {/* 確定済み行 */}
            {transactions.map((tx) =>
              mode === "edit" ? (
                <EditableConfirmedRow
                  key={tx.id}
                  tx={tx}
                  changes={editChanges[tx.id] ?? {}}
                  accounts={accounts}
                  categories={categories}
                  onEditChange={onEditChange}
                  onDelete={handleDeleteConfirmed}
                />
              ) : (
                <tr
                  key={tx.id}
                  className={`border-b border-border transition-colors ${
                    highlightIds.has(tx.id)
                      ? "bg-green-50 dark:bg-green-950/20"
                      : "hover:bg-accent/30"
                  }`}
                >
                  <td className="px-2 py-1.5 border-r border-border tabular-nums text-sm">
                    {formatDate(tx.date)}
                  </td>
                  <td className="px-2 py-1.5 border-r border-border">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${TYPE_BADGE[tx.type] ?? ""}`}
                    >
                      {TYPE_LABEL[tx.type] ?? tx.type}
                    </span>
                  </td>
                  <td
                    className={`px-2 py-1.5 border-r border-border text-right font-semibold tabular-nums ${TYPE_COLOR[tx.type] ?? ""}`}
                  >
                    {fmtAmt(tx.amount, tx.type)}
                  </td>
                  <td className="px-2 py-1.5 border-r border-border text-sm text-muted-foreground truncate max-w-[1px]">
                    {tx.type === "transfer"
                      ? `→ ${accountMap[tx.to_account_id ?? ""] ?? ""}`
                      : (categoryMap[tx.category_id ?? ""] ?? "")}
                  </td>
                  <td className="px-2 py-1.5 border-r border-border text-sm truncate max-w-[1px]">
                    {tx.description ?? ""}
                  </td>
                  <td className="px-1.5 py-1.5 text-center">
                    <button
                      onClick={() => handleDeleteConfirmed(tx.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-0.5 rounded"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              )
            )}

            {/* 空状態 */}
            {isEmpty && (
              <tr>
                <td colSpan={6} className="py-16 text-center text-muted-foreground text-sm">
                  「追加」({formatShortcut(addRowShortcut)}) で入力行を追加し、
                  {formatShortcut(saveDraftShortcut)} で一括保存できます。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* フッター */}
      <div className="border-t border-border bg-muted/20 px-4 py-2 flex items-center gap-4 text-xs text-muted-foreground flex-shrink-0">
        <span>{transactions.length}件</span>
        <span className="text-red-600 font-medium">
          支出 ¥{totalExpense.toLocaleString("ja-JP")}
        </span>
        <span className="text-green-600 font-medium">
          収入 ¥{totalIncome.toLocaleString("ja-JP")}
        </span>
        <span className={`font-medium ${balance >= 0 ? "text-green-600" : "text-red-600"}`}>
          収支 {balance >= 0 ? "+" : ""}¥{balance.toLocaleString("ja-JP")}
        </span>
      </div>
    </div>
  );
}
