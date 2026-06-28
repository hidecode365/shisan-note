export interface ShortcutDef {
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  key: string;
}

export function parseShortcut(value: string): ShortcutDef {
  const parts = value.split("+");
  const key = parts[parts.length - 1];
  return {
    ctrl: parts.includes("Ctrl"),
    alt: parts.includes("Alt"),
    shift: parts.includes("Shift"),
    key,
  };
}

export function matchesShortcut(
  e: { ctrlKey: boolean; altKey: boolean; shiftKey: boolean; key: string },
  def: ShortcutDef
): boolean {
  return (
    e.ctrlKey === def.ctrl &&
    e.altKey === def.alt &&
    e.shiftKey === def.shift &&
    e.key === def.key
  );
}

export function formatShortcut(def: ShortcutDef): string {
  const parts: string[] = [];
  if (def.ctrl) parts.push("Ctrl");
  if (def.alt) parts.push("Alt");
  if (def.shift) parts.push("Shift");
  parts.push(def.key);
  return parts.join("+");
}

export const DEFAULT_SHORTCUTS = {
  addRow: parseShortcut("Shift+Enter"),
  saveDraft: parseShortcut("Ctrl+Enter"),
};
