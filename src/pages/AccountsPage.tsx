import { useState, useEffect, useCallback } from "react";
import {
  Landmark, ChartCandlestick, Bitcoin, Smartphone, Wallet, MoreHorizontal,
  Plus, Pencil, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { getAccounts, createAccount, updateAccount, deleteAccount } from "@/lib/tauri";
import type { Account, AccountInput, AccountUpdateInput } from "@/types";

type AccountType = "bank" | "securities" | "crypto" | "mobile_pay" | "cash" | "other";

const TYPE_CONFIG: Record<AccountType, {
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  defaultColor: string;
}> = {
  bank:       { label: "銀行",         Icon: Landmark,          defaultColor: "#3b82f6" },
  securities: { label: "証券",         Icon: ChartCandlestick,  defaultColor: "#f59e0b" },
  crypto:     { label: "仮想通貨",     Icon: Bitcoin,           defaultColor: "#f97316" },
  mobile_pay: { label: "電子マネー",   Icon: Smartphone,        defaultColor: "#14b8a6" },
  cash:       { label: "現金",         Icon: Wallet,            defaultColor: "#6b7280" },
  other:      { label: "その他",       Icon: MoreHorizontal,    defaultColor: "#6b7280" },
};

const TYPE_ORDER: AccountType[] = ["bank", "securities", "crypto", "mobile_pay", "cash", "other"];

const PRESET_COLORS = [
  "#3b82f6", "#f59e0b", "#f97316", "#14b8a6",
  "#22c55e", "#a855f7", "#ef4444", "#6b7280",
];

interface FormState {
  name: string;
  type: AccountType;
  balanceStr: string;
  color: string;
  note: string;
}

const DEFAULT_FORM: FormState = {
  name: "",
  type: "bank",
  balanceStr: "0",
  color: PRESET_COLORS[0],
  note: "",
};

function formatJPY(amount: number): string {
  return "¥" + amount.toLocaleString("ja-JP");
}

export function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogMode, setDialogMode] = useState<"add" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<Account | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAccounts();
      setAccounts(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  const grouped = TYPE_ORDER
    .map(type => ({ type, accounts: accounts.filter(a => a.type === type) }))
    .filter(g => g.accounts.length > 0);

  function openAdd() {
    setForm(DEFAULT_FORM);
    setEditTarget(null);
    setDialogMode("add");
  }

  function openEdit(account: Account) {
    const type = account.type as AccountType;
    setForm({
      name: account.name,
      type,
      balanceStr: account.balance.toLocaleString("ja-JP"),
      color: account.color ?? TYPE_CONFIG[type].defaultColor,
      note: account.note ?? "",
    });
    setEditTarget(account);
    setDialogMode("edit");
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function handleBalanceChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/[^\d]/g, "");
    setField("balanceStr", digits ? parseInt(digits, 10).toLocaleString("ja-JP") : "0");
  }

  async function handleSubmit() {
    if (!form.name.trim()) return;
    const balance = parseInt(form.balanceStr.replace(/,/g, ""), 10) || 0;
    setSaving(true);
    try {
      if (dialogMode === "add") {
        const input: AccountInput = {
          name: form.name.trim(),
          type: form.type,
          balance,
          color: form.color,
          note: form.note.trim() || undefined,
        };
        const created = await createAccount(input);
        setAccounts(prev => [...prev, created]);
      } else if (dialogMode === "edit" && editTarget) {
        const input: AccountUpdateInput = {
          id: editTarget.id,
          name: form.name.trim(),
          type: form.type,
          balance,
          color: form.color,
          note: form.note.trim() || undefined,
        };
        const updated = await updateAccount(input);
        setAccounts(prev => prev.map(a => a.id === updated.id ? updated : a));
      }
      setDialogMode(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteAccount(deleteTarget.id);
      setAccounts(prev => prev.filter(a => a.id !== deleteTarget.id));
      setDeleteTarget(null);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        読み込み中...
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto p-4 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">口座・資産管理</h1>
          <Button size="sm" onClick={openAdd}>
            <Plus size={14} className="mr-1" />
            口座を追加
          </Button>
        </div>

        {/* Total assets */}
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">総資産</p>
          <p className="text-2xl font-bold tabular-nums">{formatJPY(totalBalance)}</p>
          <p className="text-xs text-muted-foreground mt-1">{accounts.length} 口座</p>
        </div>

        {/* Empty state */}
        {accounts.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-12">
            口座が登録されていません。「口座を追加」から始めてください。
          </p>
        )}

        {/* Grouped by type */}
        {grouped.map(({ type, accounts: typeAccounts }) => {
          const cfg = TYPE_CONFIG[type];
          const GroupIcon = cfg.Icon;
          return (
            <div key={type} className="space-y-2">
              <div className="flex items-center gap-1.5 px-1 text-sm font-medium text-muted-foreground">
                <GroupIcon size={14} />
                <span>{cfg.label}</span>
                <span className="text-xs">（{typeAccounts.length}）</span>
              </div>
              <div className="space-y-2">
                {typeAccounts.map(account => {
                  const acfg = TYPE_CONFIG[account.type as AccountType];
                  const AIcon = acfg.Icon;
                  const color = account.color ?? acfg.defaultColor;
                  return (
                    <div
                      key={account.id}
                      className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
                    >
                      {/* Icon */}
                      <div
                        className="shrink-0 flex items-center justify-center w-9 h-9 rounded-full"
                        style={{ backgroundColor: color + "22", color }}
                      >
                        <AIcon size={18} />
                      </div>

                      {/* Name + currency */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{account.name}</p>
                        <p className="text-xs text-muted-foreground">{account.currency}</p>
                      </div>

                      {/* Balance */}
                      <p className="shrink-0 text-sm font-semibold tabular-nums">
                        {formatJPY(account.balance)}
                      </p>

                      {/* Actions */}
                      <div className="shrink-0 flex items-center gap-0.5">
                        <button
                          onClick={() => openEdit(account)}
                          className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(account)}
                          className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit dialog */}
      <Dialog open={dialogMode !== null} onOpenChange={open => { if (!open) setDialogMode(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{dialogMode === "add" ? "口座を追加" : "口座を編集"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {/* Name */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">口座名 *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setField("name", e.target.value)}
                placeholder="例：三菱UFJ普通・SBI証券NISA"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            {/* Type */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">タイプ *</label>
              <select
                value={form.type}
                onChange={e => setField("type", e.target.value as AccountType)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {TYPE_ORDER.map(t => (
                  <option key={t} value={t}>{TYPE_CONFIG[t].label}</option>
                ))}
              </select>
            </div>

            {/* Balance */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                {dialogMode === "add" ? "初期残高 *" : "残高（手動調整）"}
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={form.balanceStr}
                onChange={handleBalanceChange}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            {/* Color */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">カラー</label>
              <div className="flex items-center gap-2 flex-wrap">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setField("color", c)}
                    className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                    style={{
                      backgroundColor: c,
                      outline: form.color === c ? `2px solid ${c}` : "none",
                      outlineOffset: "2px",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Note */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">メモ</label>
              <input
                type="text"
                value={form.note}
                onChange={e => setField("note", e.target.value)}
                placeholder="口座番号末尾など"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogMode(null)}>キャンセル</Button>
            <Button onClick={handleSubmit} disabled={!form.name.trim() || saving}>
              {dialogMode === "add" ? "追加" : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={deleteTarget !== null} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>口座を削除</DialogTitle>
            <DialogDescription>
              「{deleteTarget?.name}」を削除しますか？取引履歴は残ります（論理削除）。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>キャンセル</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>削除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
