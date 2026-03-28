import { useState } from "react";
import { Sidebar } from "./components/layout/Sidebar";
import { TransformPage } from "./pages/TransformPage";
import { TemplatesPage } from "./pages/TemplatesPage";
import { SettingsPage } from "./pages/SettingsPage";
import { HistoryPage } from "./pages/HistoryPage";
import { useTemplates } from "./hooks/useTemplates";
import type { Page } from "./lib/types";

function App() {
  const [page, setPage] = useState<Page>("transform");
  const templateState = useTemplates();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar currentPage={page} onNavigate={setPage} />
      <main className="flex-1 overflow-y-auto">
        {page === "transform" && <TransformPage templates={templateState} />}
        {page === "templates" && <TemplatesPage templates={templateState} />}
        {page === "history" && <HistoryPage />}
        {page === "settings" && <SettingsPage />}
      </main>
    </div>
  );
}

export default App;
