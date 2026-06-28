import { BookOpen } from "lucide-react";

export function Sidebar() {
  return (
    <aside className="w-14 bg-sidebar border-r border-sidebar-border flex flex-col items-center py-4 gap-2 flex-shrink-0">
      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mb-3">
        <span className="text-primary-foreground text-[10px] font-bold leading-none">SN</span>
      </div>
      <button className="w-10 h-10 rounded-lg bg-sidebar-accent flex flex-col items-center justify-center gap-0.5 text-sidebar-foreground hover:bg-sidebar-accent/80 transition-colors">
        <BookOpen size={16} />
        <span className="text-[9px] font-medium">記帳</span>
      </button>
    </aside>
  );
}
