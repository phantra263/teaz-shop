import { Link } from "react-router-dom";
import { Share2, TreePalm } from "lucide-react";
import { servicesPage } from "../data/services";

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
      <nav aria-label="Điều hướng chính" className="hub-nav">
        <a href="#kenh-noi-dung">Các kênh</a>
        <a href="#cong-cu">Công cụ</a>
        <Link className="hub-nav-island" to="/dao-tra">
          <TreePalm size={19} aria-hidden="true" />
          Đảo Trà
        </Link>
        <Link to={servicesPage.path}>Dịch vụ</Link>
        <a href="#hop-tac">Hợp tác</a>
        <Link to="/profile">Portfolio</Link>
      </nav>
      <div className="hub-toolbar-actions">
        <button className="hub-icon-button" type="button" onClick={onShare} aria-label="Chia sẻ trang TeaZ">
          <Share2 size={18} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
