import { useEffect, useState } from "react";
import { Copy, Download, Code, Eye, Check, AlertCircle } from "lucide-react";
import { JsonTreeView } from "./JsonTreeView";
import type { TransformResult } from "../../lib/types";

interface ResultPanelProps {
  results: TransformResult[];
}

export function ResultPanel({ results }: ResultPanelProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState<"tree" | "raw">("tree");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (results.length === 0) {
      setActiveTab(0);
      return;
    }
    setActiveTab((prev) => Math.min(prev, results.length - 1));
  }, [results.length]);

  if (results.length === 0) return null;

  const current = results[activeTab] ?? results[0];
  if (!current) return null;

  const jsonString = JSON.stringify(current.output, null, 2) ?? "null";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${current.template_name.replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="border border-[#333] rounded-xl bg-[#1a1a1a] overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#333] px-4">
        {/* Tabs */}
        <div className="flex gap-0">
          {results.map((r, i) => {
            // 같은 이름이 여러 개면 번호 붙이기
            const sameNameCount = results.filter((x) => x.template_name === r.template_name).length;
            const sameNameIndex = results.slice(0, i).filter((x) => x.template_name === r.template_name).length + 1;
            const label = sameNameCount > 1
              ? `${r.template_name} #${sameNameIndex}`
              : r.template_name;

            return (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                className={`px-4 py-3 text-sm border-b-2 transition-colors ${
                  i === activeTab
                    ? "border-indigo-500 text-white"
                    : "border-transparent text-[#999] hover:text-white"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode(viewMode === "tree" ? "raw" : "tree")}
            className="p-2 text-[#999] hover:text-white rounded-lg hover:bg-[#333] transition-colors"
            title={viewMode === "tree" ? "Raw JSON" : "트리 뷰"}
          >
            {viewMode === "tree" ? <Code size={16} /> : <Eye size={16} />}
          </button>
          <button
            onClick={handleCopy}
            className="p-2 text-[#999] hover:text-white rounded-lg hover:bg-[#333] transition-colors"
            title="JSON 복사"
          >
            {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
          </button>
          <button
            onClick={handleDownload}
            className="p-2 text-[#999] hover:text-white rounded-lg hover:bg-[#333] transition-colors"
            title="JSON 다운로드"
          >
            <Download size={16} />
          </button>
        </div>
      </div>

      <div className="p-4 max-h-100 overflow-y-auto">
        {!current.success ? (
          <div className="flex items-start gap-2 text-red-400 text-sm">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">변환 실패</p>
              <p className="text-red-400/70 mt-1">{current.error}</p>
            </div>
          </div>
        ) : viewMode === "tree" ? (
          <JsonTreeView data={current.output} />
        ) : (
          <pre className="text-sm font-mono text-[#ccc] whitespace-pre-wrap">
            {jsonString}
          </pre>
        )}

        <div className="mt-3 text-xs text-[#555]">
          {current.duration_ms > 0 && `${(current.duration_ms / 1000).toFixed(1)}s`}
        </div>
      </div>
    </div>
  );
}
