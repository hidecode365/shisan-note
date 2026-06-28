import { useRef, useEffect } from "react";
import { X } from "lucide-react";
import type { Account, Category, DraftRow, TransactionType } from "@/types";

const TYPE_OPTIONS: { value: TransactionType; label: string }[] = [
  { value: "expense", label: "支出" },
  { value: "income", label: "収入" },
  { value: "transfer", label: "振替" },
];

const TYPE_COLOR: Record<string, string> = {
  expense: "text-red-600",
  income: "text-green-600",
  transfer: "text-blue-600",
};

interface EntryFormRowProps {
  row: DraftRow;
  accounts: Account[];
  categories: Category[];
  focusAmount?: boolean;
  onChange: (id: string, field: keyof DraftRow, value: string) => void;
  onDelete: (id: string) => void;
  onKeyDown: (e: React.KeyboardEvent, rowId: string) => void;
}

export function EntryFormRow({
  row,
  accounts,
  categories,
  focusAmount = false,
  onChange,
  onDelete,
  onKeyDown,
}: EntryFormRowProps) {
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focusAmount) {
      amountRef.current?.focus();
      amountRef.current?.select();
    }
    // マウント時のみ実行
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const filteredCats = categories.filter(
    (c) => !c.parent_id && (c.type === row.type || c.type === "both")
  );

  const cell = "border-r border-border last:border-r-0 px-1.5 py-1 align-middle";
  const inp =
    "w-full bg-transparent text-sm focus:outline-none focus:bg-primary/5 rounded px-1 py-0.5 h-7 min-w-0";
  const sel =
    "w-full bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring rounded px-0.5 h-7 cursor-pointer min-w-0";

  const kd = (e: React.KeyboardEvent) => onKeyDown(e, row.id);

  function handleTypeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    onChange(row.id, "type", e.target.value);
    onChange(row.id, "category_id", "");
    onChange(row.id, "to_account_id", "");
  }

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/[^\d]/g, "");
    onChange(row.id, "amountStr", digits ? parseInt(digits, 10).toLocaleString("ja-JP") : "");
  }

  return (
    <tr className="bg-blue-50/40 dark:bg-blue-950/15 border-b border-border">
      {/* 日付 */}
      <td className={cell}>
        <input
          type="date"
          value={row.date}
          onChange={(e) => onChange(row.id, "date", e.target.value)}
          onKeyDown={kd}
          className={inp}
        />
      </td>

      {/* 種別 */}
      <td className={cell}>
        <select
          value={row.type}
          onChange={handleTypeChange}
          onKeyDown={kd}
          className={`${sel} font-medium ${TYPE_COLOR[row.type]}`}
        >
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value} className="text-foreground font-normal">
              {o.label}
            </option>
          ))}
        </select>
      </td>

      {/* 金額 */}
      <td className={cell}>
        <input
          ref={amountRef}
          type="text"
          inputMode="numeric"
          value={row.amountStr}
          onChange={handleAmountChange}
          onKeyDown={kd}
          placeholder="0"
          className={`${inp} text-right tabular-nums font-semibold ${TYPE_COLOR[row.type]}`}
        />
      </td>

      {/* カテゴリ / 振替先 */}
      <td className={cell}>
        {row.type === "transfer" ? (
          <select
            value={row.to_account_id}
            onChange={(e) => onChange(row.id, "to_account_id", e.target.value)}
            onKeyDown={kd}
            className={sel}
          >
            <option value="">振替先口座...</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        ) : (
          <select
            value={row.category_id}
            onChange={(e) => onChange(row.id, "category_id", e.target.value)}
            onKeyDown={kd}
            className={sel}
          >
            <option value="">カテゴリ...</option>
            {filteredCats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </td>

      {/* メモ */}
      <td className={cell}>
        <input
          type="text"
          value={row.description}
          onChange={(e) => onChange(row.id, "description", e.target.value)}
          onKeyDown={kd}
          placeholder="メモ・店名..."
          className={inp}
        />
      </td>

      {/* 削除 */}
      <td className="px-1.5 py-1 text-center align-middle">
        <button
          onClick={() => onDelete(row.id)}
          tabIndex={-1}
          className="text-muted-foreground hover:text-destructive p-0.5 rounded transition-colors"
        >
          <X size={13} />
        </button>
      </td>
    </tr>
  );
}
