import { ArrowRightLeft, FileText, History, Settings } from "lucide-react";
import type { Page } from "../../lib/types";

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const navButton = (page: Page, icon: React.ReactNode, title: string) => (
    <button
      onClick={() => onNavigate(page)}
      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
        currentPage === page
          ? "bg-indigo-500/20 text-indigo-400"
          : "text-[#999] hover:text-white hover:bg-[#333]"
      }`}
      title={title}
    >
      {icon}
    </button>
  );

  return (
    <div className="w-14 bg-[#1a1a1a] border-r border-[#333] flex flex-col items-center py-4 gap-2">
      {navButton("transform", <ArrowRightLeft size={20} />, "변환")}
      {navButton("templates", <FileText size={20} />, "내 양식")}
      {navButton("history", <History size={20} />, "기록")}
      <div className="mt-auto">
        {navButton("settings", <Settings size={20} />, "설정")}
      </div>
    </div>
  );
}
