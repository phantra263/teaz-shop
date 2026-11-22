import { Share2 } from "lucide-react";

interface ToolbarProps {
  leavesOn: boolean;
  onToggleLeaves: () => void;
  onShare: () => void;
}

export function Toolbar({ leavesOn, onToggleLeaves, onShare }: ToolbarProps) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <button
        type="button"
        onClick={onToggleLeaves}
        aria-pressed={leavesOn}
        title="Bật hoặc tắt hiệu ứng lá trà"
        className="flex items-center gap-1.5 rounded-full border border-tea-100 bg-white/80 px-3 py-1.5 text-xs font-medium text-tea-800 shadow-sm backdrop-blur-sm transition hover:bg-white"
      >
        <span aria-hidden="true">🍃</span>
        <span>{leavesOn ? "Hiệu ứng: Bật" : "Hiệu ứng: Tắt"}</span>
      </button>

      <button
        type="button"
        onClick={onShare}
        title="Chia sẻ trang Bio"
        aria-label="Chia sẻ trang Bio"
        className="rounded-full border border-slate-200/70 bg-white/80 p-2 text-slate-700 shadow-sm backdrop-blur-sm transition hover:bg-white hover:text-tea-700"
      >
        <Share2 className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
