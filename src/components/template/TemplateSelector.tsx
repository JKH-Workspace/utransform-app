import { Minus, Plus, Check } from "lucide-react";
import type { Template } from "../../lib/types";

interface TemplateSelectorProps {
  templates: Template[];
  counts: Record<string, number>;
  onChange: (id: string, count: number) => void;
}

export function TemplateSelector({ templates, counts, onChange }: TemplateSelectorProps) {
  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-[#999]">
        양식 선택
        {totalCount > 0 && (
          <span className="text-indigo-400 ml-2">{totalCount}개 선택됨</span>
        )}
      </label>
      {templates.length === 0 ? (
        <p className="text-sm text-[#666] py-2">
          등록된 양식이 없습니다. 먼저 양식을 만들어주세요.
        </p>
      ) : (
        <div className="border border-[#333] rounded-xl overflow-hidden max-h-52 overflow-y-auto">
          {templates.map((t, i) => {
            const count = counts[t.id] || 0;
            const isActive = count > 0;

            return (
              <div
                key={t.id}
                className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                  i > 0 ? "border-t border-[#292929]" : ""
                } ${isActive ? "bg-indigo-500/10" : "hover:bg-[#1e1e1e]"}`}
              >
                {/* 체크박스 + 이름 */}
                <button
                  onClick={() => onChange(t.id, isActive ? 0 : 1)}
                  className="flex items-center gap-2.5 flex-1 min-w-0"
                >
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border transition-colors ${
                      isActive
                        ? "bg-indigo-500 border-indigo-500"
                        : "border-[#555] hover:border-[#888]"
                    }`}
                  >
                    {isActive && <Check size={12} className="text-white" />}
                  </div>
                  <div className="flex flex-col min-w-0 text-left">
                    <span
                      className={`text-sm truncate ${
                        isActive ? "text-white" : "text-[#ccc]"
                      }`}
                    >
                      {t.name}
                    </span>
                    {t.description && (
                      <span className="text-xs text-[#666] truncate">
                        {t.description}
                      </span>
                    )}
                  </div>
                </button>

                {/* 수량 조절 */}
                {isActive && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onChange(t.id, Math.max(0, count - 1))}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[#999] hover:text-white hover:bg-[#333] transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center text-white text-sm font-medium">
                      {count}
                    </span>
                    <button
                      onClick={() => onChange(t.id, count + 1)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[#999] hover:text-white hover:bg-[#333] transition-colors"
                    >
                      <Plus size={14} />
                    </button>
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
