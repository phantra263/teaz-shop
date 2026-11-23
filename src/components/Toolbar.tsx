import { Link } from "react-router-dom";
import { Play, Pause, Share2 } from "lucide-react";
import { servicesPage } from "../data/services";

interface ToolbarProps {
  onShare: () => void;
  motionEnabled: boolean;
  onToggleMotion: () => void;
}

export function Toolbar({ onShare, motionEnabled, onToggleMotion }: ToolbarProps) {
  return (
    <header className="hub-toolbar">
      <a href="#dau-trang" className="hub-brand" aria-label="TeaZ Review, đầu trang">
        <img src="/avatar.png" alt="" width="42" height="42" />
        <span>TeaZ <strong>Review</strong></span>
      </a>
      <nav aria-label="Điều hướng chính" className="hub-nav">
        <a href="#kenh-noi-dung">Các kênh</a>
        <a href="#san-pham">Sản phẩm</a>
        <a href="#cong-cu">Công cụ</a>
        <Link to={servicesPage.path}>Dịch vụ</Link>
        <a href="#hop-tac">Hợp tác</a>
        <Link to="/profile">Portfolio</Link>
      </nav>
      <div className="hub-toolbar-actions">
        <button
          className="hub-icon-button"
          type="button"
          onClick={onToggleMotion}
          aria-pressed={motionEnabled}
          aria-label="Hiệu ứng chuyển động"
          title={motionEnabled ? "Tắt hiệu ứng chuyển động" : "Bật hiệu ứng chuyển động"}
        >
          {motionEnabled ? <Pause size={17} aria-hidden="true" /> : <Play size={17} aria-hidden="true" />}
        </button>
        <button className="hub-icon-button" type="button" onClick={onShare} aria-label="Chia sẻ trang TeaZ">
          <Share2 size={18} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
