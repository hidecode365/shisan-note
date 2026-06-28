import { useState, useEffect, useCallback, useRef } from "react";
import { AccountStrip } from "@/components/features/entry/AccountStrip";
import { TransactionList } from "@/components/features/entry/TransactionList";
import { ConfirmDialog } from "@/components/features/entry/ConfirmDialog";
import {
  getAccounts,
  getCategories,
  getTransactions,
  createTransactionsBulk,
  updateTransactionsBulk,
  getSettings,
} from "@/lib/tauri";
import type {
  Account,
  Category,
  Transaction,
  DraftRow,
  TransactionInput,
  TransactionType,
  TransactionUpdateInput,
} from "@/types";
import { DEFAULT_SHORTCUTS, matchesShortcut, parseShortcut } from "@/lib/shortcuts";
import type { ShortcutDef } from "@/lib/shortcuts";

type Mode = "normal" | "add" | "edit";

interface Shortcuts {
  addRow: ShortcutDef;
  saveDraft: ShortcutDef;
}

interface ConfirmState {
  open: boolean;
  message: string;
  onConfirm: () => void;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function currentYearMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function newDraftRow(date: string): DraftRow {
  return {
    id: crypto.randomUUID(),
    date,
    type: "expense",
    amountStr: "",
    category_id: "",
    payment_method: "",
    description: "",
    to_account_id: "",
  };
}

function hasDraftContent(rows: DraftRow[]): boolean {
  return rows.some((r) => r.amountStr || r.description || r.category_id);
}

export function EntryPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [draftRows, setDraftRows] = useState<DraftRow[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [yearMonth, setYearMonth] = useState(currentYearMonth());
  const [search, setSearch] = useState("");
  const [newlyConfirmedIds, setNewlyConfirmedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [shortcuts, setShortcuts] = useState<Shortcuts>(DEFAULT_SHORTCUTS);
  const [mode, setMode] = useState<Mode>("normal");
  const [editChanges, setEditChanges] = useState<Record<string, Partial<Transaction>>>({});
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    open: false,
    message: "",
    onConfirm: () => {},
  });

  useEffect(() => {
    getSettings()
      .then((s) => {
        setShortcuts({
          addRow: s["shortcut.entry.add_row"]
            ? parseShortcut(s["shortcut.entry.add_row"])
            : DEFAULT_SHORTCUTS.addRow,
          saveDraft: s["shortcut.entry.save_draft"]
            ? parseShortcut(s["shortcut.entry.save_draft"])
            : DEFAULT_SHORTCUTS.saveDraft,
        });
      })
      .catch(console.error);
  }, []);

  const loadAccounts = useCallback(async () => {
    try {
      const data = await getAccounts();
      setAccounts(data);
      setSelectedAccountId((prev) => {
        if (prev && data.find((a) => a.id === prev)) return prev;
        return (data.find((a) => a.type === "cash") ?? data[0])?.id ?? "";
      });
    } catch (e) {
      console.error("口座読み込みエラー:", e);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      setCategories(await getCategories());
    } catch (e) {
      console.error("カテゴリ読み込みエラー:", e);
    }
  }, []);

  // 口座・カテゴリは初回のみ（deps変化なし）
  useEffect(() => { loadAccounts(); }, [loadAccounts]);
  useEffect(() => { loadCategories(); }, [loadCategories]);

  // 取引は selectedAccountId / yearMonth が変わるたびに直接再取得
  useEffect(() => {
    console.log("[EntryPage] useEffect fired: selectedAccountId=", selectedAccountId, "yearMonth=", yearMonth);
    let cancelled = false;
    getTransactions(selectedAccountId || undefined, yearMonth)
      .then((data) => {
        console.log("[EntryPage] got", data.length, "rows for yearMonth=", yearMonth, " cancelled=", cancelled);
        if (!cancelled) setTransactions(data);
      })
      .catch((e) => {
        console.error("[EntryPage] 取引読み込みエラー:", e);
      });
    return () => { cancelled = true; };
  }, [selectedAccountId, yearMonth]);

  // 保存・削除後などの命令的リフレッシュ用
  async function refreshTransactions() {
    try {
      setTransactions(
        await getTransactions(selectedAccountId || undefined, yearMonth)
      );
    } catch (e) {
      console.error("取引読み込みエラー:", e);
    }
  }

  // --- ドラフト操作 ---

  function addDraftRow() {
    const date =
      draftRows.length > 0 ? draftRows[draftRows.length - 1].date : todayStr();
    setDraftRows((prev) => [...prev, newDraftRow(date)]);
  }

  function updateDraftRow(id: string, field: keyof DraftRow, value: string) {
    setDraftRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  }

  function deleteDraftRow(id: string) {
    setDraftRows((prev) => prev.filter((r) => r.id !== id));
  }

  // --- カスタム確認ダイアログ ---

  function showConfirm(message: string, onConfirm: () => void) {
    setConfirmState({ open: true, message, onConfirm });
  }

  function closeConfirm() {
    setConfirmState((prev) => ({ ...prev, open: false }));
  }

  function handleConfirmOk() {
    const cb = confirmState.onConfirm;
    closeConfirm();
    cb();
  }

  // --- モード切り替え ---

  function toggleAddMode() {
    if (mode === "add") {
      if (hasDraftContent(draftRows)) {
        showConfirm("入力中の内容が失われます。よろしいですか？", () => {
          setDraftRows([]);
          setMode("normal");
        });
        return;
      }
      setDraftRows([]);
      setMode("normal");
    } else if (mode === "edit") {
      if (Object.keys(editChanges).length > 0) {
        showConfirm("編集中の変更内容が失われます。よろしいですか？", () => {
          setEditChanges({});
          setDraftRows([newDraftRow(todayStr())]);
          setMode("add");
        });
        return;
      }
      setEditChanges({});
      setDraftRows([newDraftRow(todayStr())]);
      setMode("add");
    } else {
      setDraftRows([newDraftRow(todayStr())]);
      setMode("add");
    }
  }

  function toggleEditMode() {
    if (mode === "edit") {
      if (Object.keys(editChanges).length > 0) {
        showConfirm("編集中の変更内容が失われます。よろしいですか？", () => {
          setEditChanges({});
          setMode("normal");
        });
        return;
      }
      setEditChanges({});
      setMode("normal");
    } else if (mode === "add") {
      if (hasDraftContent(draftRows)) {
        showConfirm("入力中の内容が失われます。よろしいですか？", () => {
          setDraftRows([]);
          setMode("edit");
        });
        return;
      }
      setDraftRows([]);
      setMode("edit");
    } else {
      setMode("edit");
    }
  }

  // --- 一括保存（追加モード） ---

  async function saveDrafts() {
    const validRows = draftRows.filter(
      (r) => parseInt(r.amountStr.replace(/,/g, ""), 10) > 0
    );
    if (validRows.length === 0 || !selectedAccountId) return;

    const inputs: TransactionInput[] = validRows.map((r) => ({
      date: r.date,
      type: r.type as TransactionType,
      amount: parseInt(r.amountStr.replace(/,/g, ""), 10),
      account_id: selectedAccountId,
      to_account_id: r.type === "transfer" ? r.to_account_id || undefined : undefined,
      category_id: r.category_id || undefined,
      description: r.description || undefined,
      payment_method: r.payment_method || undefined,
    }));

    setSaving(true);
    try {
      const saved = await createTransactionsBulk(inputs);
      setNewlyConfirmedIds(saved.map((t) => t.id));
      setTimeout(() => setNewlyConfirmedIds([]), 2100);

      const validIds = new Set(validRows.map((r) => r.id));
      setDraftRows((prev) => prev.filter((r) => !validIds.has(r.id)));
      setMode("normal");

      await loadAccounts();
      await refreshTransactions();
    } catch (e) {
      console.error("保存エラー:", e);
    } finally {
      setSaving(false);
    }
  }

  // --- 一括保存（編集モード） ---

  async function saveEdits() {
    const changedIds = Object.keys(editChanges);
    if (changedIds.length === 0 || saving) return;

    const updates: TransactionUpdateInput[] = changedIds.map((id) => {
      const original = transactions.find((t) => t.id === id)!;
      const ch = editChanges[id];
      return {
        id,
        date: ch.date ?? original.date,
        type: (ch.type ?? original.type) as TransactionType,
        amount: ch.amount ?? original.amount,
        account_id: original.account_id,
        to_account_id: "to_account_id" in ch ? ch.to_account_id : original.to_account_id,
        category_id: "category_id" in ch ? ch.category_id : original.category_id,
        description: "description" in ch ? ch.description : original.description,
        payment_method: original.payment_method,
      };
    });

    setSaving(true);
    try {
      await updateTransactionsBulk(updates);
      setEditChanges({});
      setMode("normal");
      await loadAccounts();
      await refreshTransactions();
    } catch (e) {
      console.error("更新エラー:", e);
    } finally {
      setSaving(false);
    }
  }

  function handleSave() {
    if (mode === "add") saveDrafts();
    else if (mode === "edit") saveEdits();
  }

  // --- 編集変更追跡 ---

  function handleEditChange(id: string, update: Partial<Transaction>) {
    setEditChanges((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? {}), ...update },
    }));
  }

  // --- 確定済み行の削除 ---

  function handleDeleteConfirmed(id: string) {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    setEditChanges((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    loadAccounts();
  }

  // --- グローバルキーハンドラ（refパターンでstale closure回避） ---

  const globalKeyHandlerRef = useRef<(e: KeyboardEvent) => void>(() => {});

  globalKeyHandlerRef.current = (e: KeyboardEvent) => {
    // 確認ダイアログが開いているときは Esc / ショートカットを横取りしない
    if (confirmState.open) return;

    if (matchesShortcut(e, shortcuts.saveDraft)) {
      e.preventDefault();
      if (mode === "add") saveDrafts();
      else if (mode === "edit") saveEdits();
    }
    if (e.key === "Escape") {
      if (mode === "add") toggleAddMode();
      else if (mode === "edit") toggleEditMode();
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => globalKeyHandlerRef.current(e);
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // --- 行内キーハンドラ（Shift+Enter → 行追加） ---

  function handleRowKeyDown(e: React.KeyboardEvent, _rowId: string) {
    if (matchesShortcut(e, shortcuts.addRow)) {
      e.preventDefault();
      addDraftRow();
    }
  }

  // --- saveCount ---

  const saveCount =
    mode === "add"
      ? draftRows.filter((r) => parseInt(r.amountStr.replace(/,/g, ""), 10) > 0).length
      : mode === "edit"
      ? Object.keys(editChanges).length
      : 0;

  // --- 検索フィルタ ---

  const filtered = search.trim()
    ? transactions.filter((tx) => {
        const q = search.toLowerCase();
        const catName = categories.find((c) => c.id === tx.category_id)?.name ?? "";
        return (
          tx.description?.toLowerCase().includes(q) ||
          catName.toLowerCase().includes(q)
        );
      })
    : transactions;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <AccountStrip
        accounts={accounts}
        selectedAccountId={selectedAccountId}
        onSelectAccount={setSelectedAccountId}
        yearMonth={yearMonth}
        onYearMonthChange={setYearMonth}
        search={search}
        onSearchChange={setSearch}
        draftRows={draftRows}
        mode={mode}
        onToggleAdd={toggleAddMode}
        onToggleEdit={toggleEditMode}
        onSave={handleSave}
        saving={saving}
        saveCount={saveCount}
        addRowShortcut={shortcuts.addRow}
        saveDraftShortcut={shortcuts.saveDraft}
      />
      <div className="flex-1 overflow-hidden">
        <TransactionList
          transactions={filtered}
          draftRows={draftRows}
          accounts={accounts}
          categories={categories}
          newlyConfirmedIds={newlyConfirmedIds}
          mode={mode}
          editChanges={editChanges}
          onEditChange={handleEditChange}
          addRowShortcut={shortcuts.addRow}
          saveDraftShortcut={shortcuts.saveDraft}
          onAddRow={addDraftRow}
          onChange={updateDraftRow}
          onDeleteDraft={deleteDraftRow}
          onRowKeyDown={handleRowKeyDown}
          onDeleteConfirmed={handleDeleteConfirmed}
        />
      </div>

      <ConfirmDialog
        open={confirmState.open}
        message={confirmState.message}
        onConfirm={handleConfirmOk}
        onCancel={closeConfirm}
      />
    </div>
  );
}
