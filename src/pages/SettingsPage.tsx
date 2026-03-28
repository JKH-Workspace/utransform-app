import { useState, useEffect } from "react";
import { CheckCircle, Search, FolderOpen } from "lucide-react";
import { getClaudePath, setClaudePath, detectClaudePaths } from "../lib/tauri";

export function SettingsPage() {
  const [currentPath, setCurrentPath] = useState("");
  const [candidates, setCandidates] = useState<string[]>([]);
  const [customPath, setCustomPath] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [detecting, setDetecting] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const path = await getClaudePath();
      setCurrentPath(path);
      setCustomPath(path);
    } catch (e) {
      console.error(e);
    }
    detect();
  };

  const detect = async () => {
    setDetecting(true);
    try {
      const paths = await detectClaudePaths();
      setCandidates(paths);
    } catch (e) {
      console.error(e);
    } finally {
      setDetecting(false);
    }
  };

  const handleSelect = async (path: string) => {
    setSaving(true);
    try {
      await setClaudePath(path);
      setCurrentPath(path);
      setCustomPath(path);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCustom = async () => {
    if (!customPath.trim()) return;
    await handleSelect(customPath.trim());
  };

  return (
    <div className="p-6 max-w-2xl mx-auto flex flex-col gap-6">
      <h1 className="text-xl font-bold">설정</h1>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#999]">CLAUDE CODE 경로</label>
          <p className="text-xs text-[#666]">
            변환에 사용할 Claude Code CLI의 경로를 선택하세요
          </p>
        </div>

        {/* 현재 설정 */}
        {currentPath && (
          <div className="flex items-center gap-2 px-4 py-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-sm">
            <CheckCircle size={16} className="text-indigo-400 shrink-0" />
            <span className="text-indigo-300">현재:</span>
            <code className="text-white font-mono text-xs">{currentPath}</code>
          </div>
        )}

        {/* 자동 탐지된 후보 */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Search size={14} className="text-[#999]" />
            <span className="text-sm text-[#999]">
              {detecting ? "탐색 중..." : `자동 탐지 (${candidates.length}개 발견)`}
            </span>
          </div>

          {candidates.length === 0 && !detecting && (
            <p className="text-sm text-[#666] px-4 py-3 bg-[#252525] rounded-xl">
              Claude Code가 발견되지 않았습니다. 아래에서 직접 입력해주세요.
            </p>
          )}

          {candidates.map((path) => (
            <button
              key={path}
              onClick={() => handleSelect(path)}
              disabled={saving}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left transition-colors ${
                path === currentPath
                  ? "bg-indigo-500/20 border border-indigo-500/30"
                  : "bg-[#252525] border border-[#333] hover:border-[#555]"
              }`}
            >
              <FolderOpen size={16} className="text-[#999] shrink-0" />
              <code className="text-white font-mono text-xs">{path}</code>
              {path === currentPath && (
                <span className="ml-auto text-xs text-indigo-400">사용 중</span>
              )}
            </button>
          ))}
        </div>

        {/* 직접 입력 */}
        <div className="flex flex-col gap-2 mt-2">
          <label className="text-sm text-[#999]">직접 입력</label>
          <div className="flex gap-2">
            <input
              value={customPath}
              onChange={(e) => setCustomPath(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveCustom();
              }}
              placeholder="/path/to/claude"
              className="flex-1 bg-[#252525] border border-[#333] rounded-lg px-4 py-2 text-sm text-white font-mono placeholder-[#666] focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleSaveCustom}
              disabled={!customPath.trim() || saving}
              className="px-4 py-2 text-sm bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors disabled:opacity-40"
            >
              저장
            </button>
          </div>
        </div>

        {/* 저장 완료 피드백 */}
        {saved && (
          <div className="flex items-center gap-2 text-sm text-green-400">
            <CheckCircle size={14} />
            저장되었습니다
          </div>
        )}
      </div>
    </div>
  );
}
