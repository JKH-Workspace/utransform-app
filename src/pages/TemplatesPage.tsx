import { useState } from "react";
import { Plus, FileText } from "lucide-react";
import { TemplateCard } from "../components/template/TemplateCard";
import { TemplateEditor } from "../components/template/TemplateEditor";
import type { Template } from "../lib/types";

interface TemplatesPageProps {
  templates: {
    templates: Template[];
    loading: boolean;
    create: (name: string, description: string, jsonSchema: Record<string, unknown>) => Promise<Template>;
    update: (id: string, name: string, description: string, jsonSchema: Record<string, unknown>) => Promise<Template>;
    remove: (id: string) => Promise<void>;
  };
}

export function TemplatesPage({ templates }: TemplatesPageProps) {
  const [editing, setEditing] = useState<Template | null | "new">(null);

  const handleSave = async (data: {
    name: string;
    description: string;
    json_schema: Record<string, unknown>;
  }) => {
    if (editing === "new") {
      await templates.create(data.name, data.description, data.json_schema);
    } else if (editing) {
      await templates.update(editing.id, data.name, data.description, data.json_schema);
    }
    setEditing(null);
  };

  const handleDelete = async (id: string) => {
    await templates.remove(id);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">내 양식</h1>
        <button
          onClick={() => setEditing("new")}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
        >
          <Plus size={16} /> 새 양식
        </button>
      </div>

      {templates.loading ? (
        <div className="text-[#999] text-center py-12">불러오는 중...</div>
      ) : templates.templates.length === 0 ? (
        <div className="text-center py-16">
          <FileText size={48} className="mx-auto text-[#444] mb-4" />
          <p className="text-[#999]">등록된 양식이 없습니다</p>
          <p className="text-[#666] text-sm mt-1">새 양식을 만들어서 시작하세요</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {templates.templates.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              onEdit={(t) => setEditing(t)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {editing !== null && (
        <TemplateEditor
          template={editing === "new" ? null : editing}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
