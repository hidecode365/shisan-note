import { BookOpen, LayoutDashboard, Wallet, List, Tag, Settings } from "lucide-react";
import type { Page } from "@/types";

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
}

interface NavItem {
  page: Page;
  icon: React.ReactNode;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { page: "entry",        icon: <BookOpen size={16} />,        label: "記帳" },
  { page: "dashboard",    icon: <LayoutDashboard size={16} />, label: "集計" },
  { page: "accounts",     icon: <Wallet size={16} />,          label: "口座" },
  { page: "transactions", icon: <List size={16} />,            label: "一覧" },
  { page: "categories",   icon: <Tag size={16} />,             label: "分類" },
  { page: "settings",     icon: <Settings size={16} />,        label: "設定" },
];

export function Sidebar({ currentPage, setCurrentPage }: SidebarProps) {
  return (
    <aside className="w-14 bg-sidebar border-r border-sidebar-border flex flex-col items-center py-4 gap-2 flex-shrink-0">
      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mb-3">
        <span className="text-primary-foreground text-[10px] font-bold leading-none">SN</span>
      </div>
      {NAV_ITEMS.map(({ page, icon, label }) => (
        <button
          key={page}
          onClick={() => setCurrentPage(page)}
          className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-colors
            ${currentPage === page
              ? "bg-primary text-primary-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent/80"
            }`}
        >
          {icon}
          <span className="text-[9px] font-medium">{label}</span>
        </button>
      ))}
    </aside>
  );
}
