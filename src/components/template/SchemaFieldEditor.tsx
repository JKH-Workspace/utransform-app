import { Plus, Trash2, ChevronRight, ChevronDown } from "lucide-react";
import { useState } from "react";
import type { FieldDef } from "../../lib/types";

const FIELD_TYPES = [
  { value: "string", label: "String" },
  { value: "number", label: "Number" },
  { value: "integer", label: "Integer" },
  { value: "boolean", label: "Boolean" },
  { value: "array", label: "Array" },
  { value: "object", label: "Object" },
  { value: "null", label: "Null" },
] as const;

interface SchemaFieldEditorProps {
  fields: FieldDef[];
  onChange: (fields: FieldDef[]) => void;
}

export function SchemaFieldEditor({ fields, onChange }: SchemaFieldEditorProps) {
  const handleAdd = () => {
    onChange([...fields, { name: "", type: "string", required: true }]);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm text-[#999]">필드 목록</label>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <Plus size={12} /> 필드 추가
        </button>
      </div>

      {fields.length === 0 ? (
        <div className="text-sm text-[#666] text-center py-6 border border-dashed border-[#333] rounded-lg">
          필드를 추가하여 스키마를 정의하세요
        </div>
      ) : (
        <div className="border border-[#333] rounded-lg overflow-hidden">
          <div className="grid grid-cols-[1fr_120px_60px_36px] gap-0 px-3 py-2 bg-[#1a1a1a] border-b border-[#333] text-xs text-[#666]">
            <span>필드명</span>
            <span>타입</span>
            <span className="text-center">필수</span>
            <span />
          </div>
          <FieldRows fields={fields} onChange={onChange} level={0} />
        </div>
      )}
    </div>
  );
}

interface FieldRowsProps {
  fields: FieldDef[];
  onChange: (fields: FieldDef[]) => void;
  level: number;
}

function FieldRows({ fields, onChange, level }: FieldRowsProps) {
  return (
    <>
      {fields.map((field, index) => (
        <FieldRow
          key={index}
          field={field}
          level={level}
          onUpdate={(updated) => {
            const next = [...fields];
            next[index] = updated;
            onChange(next);
          }}
          onRemove={() => {
            onChange(fields.filter((_, i) => i !== index));
          }}
        />
      ))}
    </>
  );
}

interface FieldRowProps {
  field: FieldDef;
  level: number;
  onUpdate: (field: FieldDef) => void;
  onRemove: () => void;
}

function FieldRow({ field, level, onUpdate, onRemove }: FieldRowProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = field.type === "object";
  const hasItems = field.type === "array";

  const handleAddChild = () => {
    onUpdate({
      ...field,
      children: [...(field.children ?? []), { name: "", type: "string", required: true }],
    });
  };

  const handleAddArrayItem = () => {
    onUpdate({
      ...field,
      items: { name: "item", type: "string", required: false },
    });
  };

  return (
    <>
      <div
        className="grid grid-cols-[1fr_120px_60px_36px] gap-0 px-3 py-1.5 border-b border-[#292929] items-center hover:bg-[#1e1e1e]"
        style={{ paddingLeft: `${12 + level * 20}px` }}
      >
        <div className="flex items-center gap-1">
          {(hasChildren || hasItems) && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[#666] hover:text-white p-0.5"
            >
              {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
          )}
          <input
            value={field.name}
            onChange={(e) => onUpdate({ ...field, name: e.target.value })}
            placeholder="필드명"
            className="bg-transparent text-sm text-white placeholder-[#555] focus:outline-none w-full"
          />
        </div>
        <select
          value={field.type}
          onChange={(e) => {
            const type = e.target.value as FieldDef["type"];
            const updated: FieldDef = { ...field, type };
            if (type === "object" && !field.children) updated.children = [];
            if (type === "array" && !field.items) updated.items = undefined;
            if (type !== "object") delete updated.children;
            if (type !== "array") delete updated.items;
            onUpdate(updated);
          }}
          className="bg-[#252525] text-sm text-white border border-[#333] rounded px-2 py-1 focus:outline-none focus:border-indigo-500"
        >
          {FIELD_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <div className="flex justify-center">
          <input
            type="checkbox"
            checked={field.required}
            onChange={(e) => onUpdate({ ...field, required: e.target.checked })}
            className="accent-indigo-500"
          />
        </div>
        <button
          onClick={onRemove}
          className="text-[#666] hover:text-red-400 transition-colors flex justify-center"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Object children */}
      {hasChildren && expanded && (
        <div>
          <FieldRows
            fields={field.children ?? []}
            onChange={(children) => onUpdate({ ...field, children })}
            level={level + 1}
          />
          <div
            className="px-3 py-1.5 border-b border-[#292929]"
            style={{ paddingLeft: `${32 + level * 20}px` }}
          >
            <button
              onClick={handleAddChild}
              className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <Plus size={10} /> 하위 필드 추가
            </button>
          </div>
        </div>
      )}

      {/* Array items type */}
      {hasItems && expanded && (
        <div>
          {field.items ? (
            <div>
              <div
                className="px-3 py-1 border-b border-[#292929] text-xs text-[#666]"
                style={{ paddingLeft: `${32 + level * 20}px` }}
              >
                배열 아이템 타입
              </div>
              <FieldRow
                field={field.items}
                level={level + 1}
                onUpdate={(items) => onUpdate({ ...field, items })}
                onRemove={() => onUpdate({ ...field, items: undefined })}
              />
            </div>
          ) : (
            <div
              className="px-3 py-1.5 border-b border-[#292929]"
              style={{ paddingLeft: `${32 + level * 20}px` }}
            >
              <button
                onClick={handleAddArrayItem}
                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <Plus size={10} /> 아이템 타입 정의
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
