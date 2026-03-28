import { useState, useEffect } from "react";
import { Upload, Link, X, Type } from "lucide-react";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { open } from "@tauri-apps/plugin-dialog";

interface InputAreaProps {
  items: string[];
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
}

function looksLikeUrl(value: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(value);
}

function isUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function displayLabel(value: string): string {
  const content = value.replace(/^(TEXT|FILE|URL): /, "");
  if (content.length > 40) return content.slice(0, 40) + "...";
  return content;
}

function getIcon(value: string) {
  if (value.startsWith("URL: ")) return <Link size={14} />;
  if (value.startsWith("FILE: ")) return <Upload size={14} />;
  return <Type size={14} />;
}

export function InputArea({ items, onAdd, onRemove }: InputAreaProps) {
  const [text, setText] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Tauri 네이티브 드래그 앤 드롭 → 경로 추가
  useEffect(() => {
    const unlisten = getCurrentWebview().onDragDropEvent((event) => {
      if (event.payload.type === "over") {
        setIsDragOver(true);
      } else if (event.payload.type === "drop") {
        setIsDragOver(false);
        for (const path of event.payload.paths) {
          onAdd(`FILE: ${path}`);
        }
      } else if (event.payload.type === "leave") {
        setIsDragOver(false);
      }
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [onAdd]);

  // 파일 선택 대화상자 → 경로 추가
  const handlePickFile = async () => {
    const selected = await open({ multiple: true });
    if (!selected) return;
    const paths = Array.isArray(selected) ? selected : [selected];
    for (const path of paths) {
      onAdd(`FILE: ${path}`);
    }
  };

  const handleAddText = () => {
    const value = text.trim();
    if (!value) return;
    setUrlError(null);

    if (looksLikeUrl(value)) {
      if (!isUrl(value)) {
        setUrlError("http 또는 https URL만 지원합니다");
        return;
      }
      onAdd(`URL: ${value}`);
    } else {
      onAdd(`TEXT: ${value}`);
    }
    setText("");
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium text-[#999]">입력</label>

      {/* Text / URL input */}
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.metaKey) handleAddText();
          }}
          placeholder="텍스트 또는 URL을 입력하세요 (Cmd+Enter로 추가)"
          rows={3}
          className="w-full bg-[#252525] border border-[#333] rounded-xl px-4 py-3 text-sm text-white placeholder-[#666] focus:outline-none focus:border-indigo-500 resize-none"
        />
        {text.trim() && (
          <button
            onClick={handleAddText}
            className="absolute right-3 bottom-3 px-3 py-1 text-xs bg-indigo-500 hover:bg-indigo-600 text-white rounded-md transition-colors"
          >
            추가
          </button>
        )}
      </div>

      {urlError && (
        <p className="text-red-400 text-xs">{urlError}</p>
      )}

      {/* File drop zone */}
      <div
        onClick={handlePickFile}
        className={`border-2 border-dashed rounded-xl px-4 py-6 text-center cursor-pointer transition-colors ${
          isDragOver
            ? "border-indigo-500 bg-indigo-500/10"
            : "border-[#333] hover:border-[#555]"
        }`}
      >
        <Upload size={24} className="mx-auto text-[#666] mb-2" />
        <p className="text-sm text-[#999]">
          {isDragOver ? "여기에 놓으세요" : "파일을 드래그하거나 클릭해서 선택"}
        </p>
      </div>

      {/* Added items */}
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-1">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#252525] border border-[#333] rounded-full text-sm group"
            >
              <span className="text-[#999]">{getIcon(item)}</span>
              <span className="text-white max-w-50 truncate">{displayLabel(item)}</span>
              <button
                onClick={() => onRemove(index)}
                className="text-[#666] hover:text-red-400 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
