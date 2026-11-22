import { Share2 } from "lucide-react";

interface ToolbarProps {
  leavesOn: boolean;
  onToggleLeaves: () => void;
  onShare: () => void;
}

export function Toolbar({ leavesOn, onToggleLeaves, onShare }: ToolbarProps) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3 lg:mb-8">
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

      <nav
        aria-label="Trong trang"
        className="hidden items-center gap-1 rounded-full border border-white/80 bg-white/70 p-1 shadow-sm backdrop-blur-sm lg:flex"
      >
        <a
          href="#san-pham"
          className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-tea-50 hover:text-tea-800"
        >
          Sản phẩm
        </a>
        <a
          href="#ve-teaz"
          className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-tea-50 hover:text-tea-800"
        >
          Về TeaZ
        </a>
        <a
          href="#cau-hoi"
          className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-tea-50 hover:text-tea-800"
        >
          Câu hỏi
        </a>
      </nav>

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
