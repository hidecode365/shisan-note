import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { EntryPage } from "@/pages/EntryPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { AccountsPage } from "@/pages/AccountsPage";
import { TransactionsPage } from "@/pages/TransactionsPage";
import { CategoriesPage } from "@/pages/CategoriesPage";
import { SettingsPage } from "@/pages/SettingsPage";
import type { Page } from "@/types";

const PAGE_TITLES: Record<Page, string> = {
  entry:        "記帳",
  dashboard:    "ダッシュボード",
  accounts:     "口座・資産管理",
  transactions: "取引一覧",
  categories:   "カテゴリ管理",
  settings:     "設定",
};

function PageContent({ page }: { page: Page }) {
  switch (page) {
    case "entry":        return <EntryPage />;
    case "dashboard":    return <DashboardPage />;
    case "accounts":     return <AccountsPage />;
    case "transactions": return <TransactionsPage />;
    case "categories":   return <CategoriesPage />;
    case "settings":     return <SettingsPage />;
  }
}

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("entry");

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar title={PAGE_TITLES[currentPage]} />
        <main className="flex-1 overflow-hidden">
          <PageContent page={currentPage} />
        </main>
      </div>
    </div>
  );
}

export default App;
