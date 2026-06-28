import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { EntryPage } from "@/pages/EntryPage";

function App() {
  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar title="記帳" />
        <main className="flex-1 overflow-hidden">
          <EntryPage />
        </main>
      </div>
    </div>
  );
}

export default App;
