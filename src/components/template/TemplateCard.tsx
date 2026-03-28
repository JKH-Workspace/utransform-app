import { Pencil, Trash2 } from "lucide-react";
import type { Template } from "../../lib/types";

interface TemplateCardProps {
  template: Template;
  onEdit: (t: Template) => void;
  onDelete: (id: string) => void;
}

export function TemplateCard({ template, onEdit, onDelete }: TemplateCardProps) {
  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-5 flex flex-col gap-3 hover:border-[#555] transition-colors">
      <div>
        <h3 className="text-base font-semibold text-white">{template.name}</h3>
        <p className="text-sm text-[#999] mt-1 line-clamp-2">{template.description}</p>
      </div>
      <div className="text-xs text-[#666] font-mono">
        {template.json_schema?.properties
          ? `${Object.keys(template.json_schema.properties).length} fields`
          : "no schema"}
      </div>
      <div className="flex gap-2 mt-auto">
        <button
          onClick={() => onEdit(template)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#999] hover:text-white bg-[#252525] hover:bg-[#333] rounded-lg transition-colors"
        >
          <Pencil size={14} /> 수정
        </button>
        <button
          onClick={() => onDelete(template.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#999] hover:text-red-400 bg-[#252525] hover:bg-[#333] rounded-lg transition-colors"
        >
          <Trash2 size={14} /> 삭제
        </button>
      </div>
    </div>
  );
}
