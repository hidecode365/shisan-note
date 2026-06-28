import { Search, Save, ChevronLeft, ChevronRight, CalendarDays, Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Account, DraftRow } from "@/types";
import { formatShortcut } from "@/lib/shortcuts";
import type { ShortcutDef } from "@/lib/shortcuts";

type Mode = "normal" | "add" | "edit";

interface AccountStripProps {
  accounts: Account[];
  selectedAccountId: string;
  onSelectAccount: (id: string) => void;
  yearMonth: string;
  onYearMonthChange: (ym: string) => void;
  search: string;
  onSearchChange: (s: string) => void;
  draftRows: DraftRow[];
  mode: Mode;
  onToggleAdd: () => void;
  onToggleEdit: () => void;
  onSave: () => void;
  saving: boolean;
  saveCount: number;
  addRowShortcut: ShortcutDef;
  saveDraftShortcut: ShortcutDef;
}

function fmt(n: number): string {
  return `¥${n.toLocaleString("ja-JP")}`;
}

function formatYearMonth(ym: string): string {
  const [y, m] = ym.split("-");
  return `${y}年${m}月`;
}

function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function AccountStrip({
  accounts,
  selectedAccountId,
  onSelectAccount,
  yearMonth,
  onYearMonthChange,
  search,
  onSearchChange,
  draftRows,
  mode,
  onToggleAdd,
  onToggleEdit,
  onSave,
  saving,
  saveCount,
  addRowShortcut,
  saveDraftShortcut,
}: AccountStripProps) {
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  const draftExpense = draftRows
    .filter((r) => r.type === "expense")
    .reduce((s, r) => s + (parseInt(r.amountStr.replace(/,/g, ""), 10) || 0), 0);
  const draftIncome = draftRows
    .filter((r) => r.type === "income")
    .reduce((s, r) => s + (parseInt(r.amountStr.replace(/,/g, ""), 10) || 0), 0);

  const inputCls =
    "px-2 py-1.5 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  const saveBtnLabel =
    mode === "normal"
      ? "一括保存（0件）"
      : mode === "add"
      ? `一括保存（${saveCount}件追加）`
      : `一括保存（${saveCount}件変更）`;

  const segBase =
    "flex items-center gap-1 px-2.5 py-1.5 text-sm transition-colors focus:outline-none";
  const segActive = "bg-primary text-primary-foreground";
  const segIdle = "bg-background text-foreground hover:bg-accent";

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-background flex-shrink-0 flex-wrap gap-y-1.5">
      {/* 口座ドロップダウン */}
      <select
        value={selectedAccountId}
        onChange={(e) => onSelectAccount(e.target.value)}
        className={`${inputCls} font-medium`}
      >
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>

      {selectedAccount && (
        <span className="text-sm font-semibold tabular-nums">
          {fmt(selectedAccount.balance)}
        </span>
      )}

      <span className="text-xs text-muted-foreground">
        総資産 {fmt(totalBalance)}
      </span>

      <div className="w-px h-4 bg-border mx-1" />

      {/* 月フィルタ */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => onYearMonthChange(shiftMonth(yearMonth, -1))}
          className="p-1.5 rounded-md border border-input bg-background text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <ChevronLeft size={14} />
        </button>
        <div className="relative">
          <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-input bg-background text-sm select-none whitespace-nowrap cursor-pointer">
            {formatYearMonth(yearMonth)}
            <CalendarDays size={13} className="text-muted-foreground" />
          </span>
          <input
            type="month"
            value={yearMonth}
            onChange={(e) => onYearMonthChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full"
          />
        </div>
        <button
          onClick={() => onYearMonthChange(shiftMonth(yearMonth, 1))}
          className="p-1.5 rounded-md border border-input bg-background text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* 検索 */}
      <div className="relative">
        <Search
          size={13}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="検索..."
          className={`${inputCls} pl-8 w-32`}
        />
      </div>

      {/* 下書き小計 */}
      {draftRows.length > 0 && (
        <div className="flex items-center gap-2 text-xs ml-2">
          <span className="text-muted-foreground">下書き {draftRows.length}件</span>
          {draftExpense > 0 && (
            <span className="text-red-600 font-medium tabular-nums">
              -{fmt(draftExpense)}
            </span>
          )}
          {draftIncome > 0 && (
            <span className="text-green-600 font-medium tabular-nums">
              +{fmt(draftIncome)}
            </span>
          )}
        </div>
      )}

      {/* モード切り替え + 一括保存 */}
      <div className="ml-auto flex items-center gap-2">
        <div className="flex rounded-md border border-input overflow-hidden">
          <button
            onClick={onToggleAdd}
            title={`追加モード (${formatShortcut(addRowShortcut)} で行追加)`}
            className={`${segBase} border-r border-input ${mode === "add" ? segActive : segIdle}`}
          >
            <Plus size={13} />
            追加
          </button>
          <button
            onClick={onToggleEdit}
            title="編集モード"
            className={`${segBase} ${mode === "edit" ? segActive : segIdle}`}
          >
            <Pencil size={13} />
            編集
          </button>
        </div>

        <Button
          size="sm"
          onClick={onSave}
          disabled={saving || mode === "normal" || saveCount === 0}
          title={`一括保存 (${formatShortcut(saveDraftShortcut)})`}
        >
          <Save size={13} className="mr-1" />
          {saving ? "保存中..." : saveBtnLabel}
        </Button>
      </div>
    </div>
  );
}
