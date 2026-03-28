import { useState } from "react";
import { X, ChevronDown, ChevronRight } from "lucide-react";
import { SchemaFieldEditor } from "./SchemaFieldEditor";
import { fieldsToSchema, schemaToFields, validateSchema } from "../../lib/jsonSchemaGenerator";
import type { Template, FieldDef, JsonSchema } from "../../lib/types";

type Mode = "gui" | "json";

interface TemplateEditorProps {
  template?: Template | null;
  onSave: (data: {
    name: string;
    description: string;
    json_schema: JsonSchema;
  }) => void;
  onClose: () => void;
}

function initFields(template?: Template | null): FieldDef[] {
  if (template?.json_schema) {
    return schemaToFields(template.json_schema);
  }
  return [{ name: "이름", type: "string", required: true }];
}

function initJsonText(template?: Template | null): string {
  if (template?.json_schema) {
    return JSON.stringify(template.json_schema, null, 2);
  }
  return "";
}

export function TemplateEditor({ template, onSave, onClose }: TemplateEditorProps) {
  const [name, setName] = useState(template?.name ?? "");
  const [description, setDescription] = useState(template?.description ?? "");
  const [mode, setMode] = useState<Mode>("gui");
  const [fields, setFields] = useState<FieldDef[]>(initFields(template));
  const [jsonText, setJsonText] = useState(initJsonText(template));
  const [error, setError] = useState<string | null>(null);
  const [schemaOpen, setSchemaOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const currentSchema = mode === "gui" ? fieldsToSchema(fields) : null;

  const handleModeSwitch = (next: Mode) => {
    setError(null);
    if (next === "json" && mode === "gui") {
      setJsonText(JSON.stringify(fieldsToSchema(fields), null, 2));
    }
    if (next === "gui" && mode === "json") {
      try {
        const parsed = JSON.parse(jsonText);
        const err = validateSchema(parsed);
        if (err) {
          setError(err);
          return;
        }
        setFields(schemaToFields(parsed));
      } catch {
        setError("유효한 JSON이 아닙니다");
        return;
      }
    }
    setMode(next);
  };

  const validateFields = (defs: FieldDef[] = fields, path = ""): string | null => {
    if (defs.length === 0 && !path) return "최소 1개 이상의 필드가 필요합니다";
    const names = defs.map((f) => f.name);
    const prefix = path ? `${path} > ` : "";
    if (names.some((n) => !n.trim())) return `${prefix}필드명을 입력해주세요`;
    if (new Set(names).size !== names.length) return `${prefix}중복된 필드명이 있습니다`;
    for (const f of defs) {
      if (f.type === "object" && f.children?.length) {
        const childErr = validateFields(f.children, `${prefix}${f.name}`);
        if (childErr) return childErr;
      }
      if (f.type === "array" && f.items?.type === "object" && f.items.children?.length) {
        const itemErr = validateFields(f.items.children, `${prefix}${f.name}[]`);
        if (itemErr) return itemErr;
      }
    }
    return null;
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setError(null);

    let schema: JsonSchema;

    if (mode === "gui") {
      const fieldError = validateFields();
      if (fieldError) {
        setError(fieldError);
        return;
      }
      schema = fieldsToSchema(fields);
    } else {
      try {
        const parsed = JSON.parse(jsonText);
        const schemaError = validateSchema(parsed);
        if (schemaError) {
          setError(schemaError);
          return;
        }
        schema = parsed;
      } catch {
        setError("유효한 JSON이 아닙니다");
        return;
      }
    }

    setSaving(true);
    try {
      onSave({ name, description, json_schema: schema });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-[#333]">
          <h2 className="text-lg font-semibold">
            {template ? "양식 수정" : "새 양식"}
          </h2>
          <button onClick={onClose} className="text-[#999] hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* Name */}
          <div>
            <label className="block text-sm text-[#999] mb-1.5">이름</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 캠페인 보고서"
              className="w-full bg-[#252525] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-[#999] mb-1.5">설명</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="예: 슬랙 메시지를 캠페인 보고서 JSON으로 변환"
              className="w-full bg-[#252525] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Mode tabs */}
          <div className="flex gap-0 border-b border-[#333]">
            <button
              onClick={() => handleModeSwitch("gui")}
              className={`px-4 py-2 text-sm border-b-2 transition-colors ${
                mode === "gui"
                  ? "border-indigo-500 text-white"
                  : "border-transparent text-[#999] hover:text-white"
              }`}
            >
              필드 편집기
            </button>
            <button
              onClick={() => handleModeSwitch("json")}
              className={`px-4 py-2 text-sm border-b-2 transition-colors ${
                mode === "json"
                  ? "border-indigo-500 text-white"
                  : "border-transparent text-[#999] hover:text-white"
              }`}
            >
              JSON Schema 직접 입력
            </button>
          </div>

          {/* GUI mode */}
          {mode === "gui" && (
            <SchemaFieldEditor fields={fields} onChange={setFields} />
          )}

          {/* JSON mode */}
          {mode === "json" && (
            <div>
              <textarea
                value={jsonText}
                onChange={(e) => {
                  setJsonText(e.target.value);
                  setError(null);
                }}
                placeholder='{"type": "object", "properties": { ... }}'
                rows={12}
                className={`w-full bg-[#252525] border rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none resize-none ${
                  error ? "border-red-500" : "border-[#333] focus:border-indigo-500"
                }`}
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Schema preview (GUI mode only) */}
          {mode === "gui" && fields.length > 0 && (
            <div className="border border-[#333] rounded-lg overflow-hidden">
              <button
                onClick={() => setSchemaOpen(!schemaOpen)}
                className="flex items-center gap-1.5 w-full px-3 py-2 text-xs text-[#999] hover:text-white hover:bg-[#252525] transition-colors"
              >
                {schemaOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                스키마 미리보기
              </button>
              {schemaOpen && currentSchema && (
                <pre className="px-3 py-2 text-xs font-mono text-[#888] bg-[#0d0d0d] border-t border-[#333] max-h-48 overflow-y-auto">
                  {JSON.stringify(currentSchema, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-5 border-t border-[#333]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[#999] hover:text-white bg-[#252525] hover:bg-[#333] rounded-lg transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="px-4 py-2 text-sm text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
