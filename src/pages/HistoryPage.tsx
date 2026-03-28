import { useCallback, useEffect, useState } from "react";
import { Trash2, Clock, ChevronDown, ChevronRight, Loader2, AlertCircle, Copy, Check } from "lucide-react";
import { JsonTreeView } from "../components/result/JsonTreeView";
import type { HistoryEntry } from "../lib/types";
import * as api from "../lib/tauri";

export function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api.listHistory();
      setEntries(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleDelete = async (id: string) => {
    try {
      await api.deleteHistory(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch {
      // 삭제 실패 시 목록 다시 불러오기
      refresh();
    }
  };

  const handleClearAll = async () => {
    if (!confirm("모든 변환 기록을 삭제하시겠습니까?")) return;
    try {
      await api.clearHistory();
      setEntries([]);
      setExpandedId(null);
    } catch {
      refresh();
    }
  };

  const handleCopy = async (entryId: string, output: unknown) => {
    await navigator.clipboard.writeText(JSON.stringify(output, null, 2));
    setCopied(entryId);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const inputSummary = (inputs: string[]) => {
    if (inputs.length === 0) return "";
    const first = inputs[0];
    const label = first.length > 60 ? first.slice(0, 60) + "…" : first;
    return inputs.length > 1 ? `${label} 외 ${inputs.length - 1}건` : label;
  };

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-[#666]" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">기록</h1>
        {entries.length > 0 && (
          <button
            onClick={handleClearAll}
            className="text-xs text-[#999] hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-400/10"
          >
            전체 삭제
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="text-[#666] text-sm text-center py-16">
          아직 변환 기록이 없습니다.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map((entry) => {
            const isExpanded = expandedId === entry.id;
            const successCount = entry.results.filter((r) => r.success).length;
            const failCount = entry.results.length - successCount;

            return (
              <div
                key={entry.id}
                className="border border-[#333] rounded-xl bg-[#1a1a1a] overflow-hidden"
              >
                {/* Header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#222] transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown size={16} className="text-[#666] shrink-0" />
                  ) : (
                    <ChevronRight size={16} className="text-[#666] shrink-0" />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white truncate">
                        {entry.results.map((r) => r.template_name).filter((v, i, a) => a.indexOf(v) === i).join(", ")}
                      </span>
                      {failCount > 0 && (
                        <AlertCircle size={14} className="text-red-400 shrink-0" />
                      )}
                    </div>
                    <div className="text-xs text-[#666] mt-0.5 truncate">
                      {inputSummary(entry.inputs)}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-[#555]">
                      {successCount}/{entry.results.length}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-[#555]">
                      <Clock size={12} />
                      {formatDate(entry.created_at)}
                    </div>
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-[#333]">
                    {/* Input summary */}
                    <div className="px-4 py-3 border-b border-[#282828]">
                      <div className="text-xs text-[#666] mb-1.5">입력</div>
                      <div className="flex flex-col gap-1">
                        {entry.inputs.map((input, i) => (
                          <div key={i} className="text-xs text-[#999] truncate font-mono">
                            {input}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Results */}
                    {entry.results.map((result, i) => (
                      <div key={i} className="px-4 py-3 border-b border-[#282828]">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[#ccc]">
                              {result.template_name}
                            </span>
                            {!result.success && (
                              <span className="text-xs text-red-400">실패</span>
                            )}
                            {result.duration_ms > 0 && (
                              <span className="text-xs text-[#555]">
                                {(result.duration_ms / 1000).toFixed(1)}s
                              </span>
                            )}
                          </div>
                          {result.success && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(`${entry.id}-${i}`, result.output);
                              }}
                              className="p-1.5 text-[#666] hover:text-white rounded-lg hover:bg-[#333] transition-colors"
                              title="JSON 복사"
                            >
                              {copied === `${entry.id}-${i}` ? (
                                <Check size={14} className="text-emerald-400" />
                              ) : (
                                <Copy size={14} />
                              )}
                            </button>
                          )}
                        </div>

                        {result.success ? (
                          <div className="max-h-64 overflow-y-auto">
                            <JsonTreeView data={result.output} />
                          </div>
                        ) : (
                          <div className="text-xs text-red-400/70">{result.error}</div>
                        )}
                      </div>
                    ))}

                    {/* Delete button */}
                    <div className="px-4 py-2 flex justify-end">
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="flex items-center gap-1.5 text-xs text-[#666] hover:text-red-400 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-400/10"
                      >
                        <Trash2 size={12} />
                        삭제
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
