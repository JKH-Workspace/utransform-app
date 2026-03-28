import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";

interface JsonTreeViewProps {
  data: unknown;
  level?: number;
}

export function JsonTreeView({ data, level = 0 }: JsonTreeViewProps) {
  if (data === null || data === undefined) {
    return <span className="text-[#999]">null</span>;
  }

  if (typeof data === "string") {
    return <span className="text-emerald-400">"{data}"</span>;
  }

  if (typeof data === "number") {
    return <span className="text-amber-400">{data.toLocaleString()}</span>;
  }

  if (typeof data === "boolean") {
    return <span className="text-purple-400">{data.toString()}</span>;
  }

  if (Array.isArray(data)) {
    return <JsonArray data={data} level={level} />;
  }

  if (typeof data === "object") {
    return <JsonObject data={data as Record<string, unknown>} level={level} />;
  }

  return <span className="text-white">{String(data)}</span>;
}

function JsonObject({ data, level }: { data: Record<string, unknown>; level: number }) {
  const entries = Object.entries(data);

  return (
    <div className="flex flex-col">
      {entries.map(([key, value]) => (
        <JsonEntry key={key} keyName={key} value={value} level={level} />
      ))}
    </div>
  );
}

function JsonArray({ data, level }: { data: unknown[]; level: number }) {
  return (
    <div className="flex flex-col">
      {data.map((item, index) => (
        <JsonEntry key={index} keyName={`[${index}]`} value={item} level={level} />
      ))}
    </div>
  );
}

function JsonEntry({ keyName, value, level }: { keyName: string; value: unknown; level: number }) {
  const [expanded, setExpanded] = useState(level < 2);
  const isExpandable =
    value !== null && typeof value === "object";

  return (
    <div>
      <div
        className={`flex items-start gap-1 py-0.5 hover:bg-white/5 rounded px-1 ${
          isExpandable ? "cursor-pointer" : ""
        }`}
        style={{ paddingLeft: `${level * 16}px` }}
        onClick={() => isExpandable && setExpanded(!expanded)}
      >
        <span className="w-4 h-5 flex items-center justify-center shrink-0">
          {isExpandable ? (
            expanded ? (
              <ChevronDown size={12} className="text-[#666]" />
            ) : (
              <ChevronRight size={12} className="text-[#666]" />
            )
          ) : null}
        </span>
        <span className="text-indigo-300 text-sm">{keyName}</span>
        <span className="text-[#555] text-sm">:</span>
        {!isExpandable && (
          <span className="text-sm ml-1">
            <JsonTreeView data={value} level={level + 1} />
          </span>
        )}
        {isExpandable && !expanded && (
          <span className="text-[#666] text-xs ml-1">
            {Array.isArray(value) ? `[${value.length}]` : `{${Object.keys(value as object).length}}`}
          </span>
        )}
      </div>
      {isExpandable && expanded && (
        <JsonTreeView data={value} level={level + 1} />
      )}
    </div>
  );
}
