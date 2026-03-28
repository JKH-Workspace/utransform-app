import { useState } from "react";
import { Play, Loader2 } from "lucide-react";
import { InputArea } from "../components/input/InputArea";
import { TemplateSelector } from "../components/template/TemplateSelector";
import { ResultPanel } from "../components/result/ResultPanel";
import { useInputItems } from "../hooks/useInputItems";
import { useTransform } from "../hooks/useTransform";
import type { Template } from "../lib/types";

interface TransformPageProps {
  templates: {
    templates: Template[];
    loading: boolean;
  };
}

export function TransformPage({ templates }: TransformPageProps) {
  const inputItems = useInputItems();
  const transform = useTransform();
  const [counts, setCounts] = useState<Record<string, number>>({});

  const handleCountChange = (id: string, count: number) => {
    setCounts((prev) => {
      const next = { ...prev };
      if (count <= 0) {
        delete next[id];
      } else {
        next[id] = count;
      }
      return next;
    });
  };

  // counts를 template_ids 배열로 펼치기
  // { "abc": 3, "def": 1 } → ["abc", "abc", "abc", "def"]
  const templateIds = Object.entries(counts).flatMap(([id, count]) =>
    Array(count).fill(id)
  );

  const canRun = inputItems.items.length > 0 && templateIds.length > 0 && !transform.loading;

  const handleRun = async () => {
    if (!canRun) return;
    await transform.run(inputItems.items, templateIds);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto flex flex-col gap-6">
      <h1 className="text-xl font-bold">변환</h1>

      <InputArea
        items={inputItems.items}
        onAdd={inputItems.add}
        onRemove={inputItems.remove}
      />

      <TemplateSelector
        templates={templates.templates}
        counts={counts}
        onChange={handleCountChange}
      />

      <button
        onClick={handleRun}
        disabled={!canRun}
        className="flex items-center justify-center gap-2 w-full py-3 text-sm font-medium bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {transform.loading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            변환 중...
          </>
        ) : (
          <>
            <Play size={18} />
            변환 실행 {templateIds.length > 1 && `(${templateIds.length}건)`}
          </>
        )}
      </button>

      {transform.error && (
        <div className="text-red-400 text-sm bg-red-400/10 rounded-xl px-4 py-3">
          {transform.error}
        </div>
      )}

      <ResultPanel results={transform.results} />
    </div>
  );
}
