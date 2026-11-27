import { Share2 } from "lucide-react";
import { MainNav } from "./MainNav";
import { ThemeToggle } from "./ThemeToggle";

interface ToolbarProps {
  onShare: () => void;
}

export function Toolbar({ onShare }: ToolbarProps) {
  return (
    <header className="hub-toolbar">
      <a href="#dau-trang" className="hub-brand" aria-label="TeaZ, đầu trang">
        <img src="/avatar.png" alt="" width="42" height="42" />
        <span>TeaZ</span>
      </a>
      <MainNav />
      <div className="hub-toolbar-actions">
        <ThemeToggle />
        <button className="hub-icon-button" type="button" onClick={onShare} aria-label="Chia sẻ trang TeaZ">
          <Share2 size={18} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
