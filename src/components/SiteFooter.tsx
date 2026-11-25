import { Link } from "react-router-dom";

interface SiteFooterProps {
  onCopyLink: () => void;
  leavesOn: boolean;
  onToggleLeaves: () => void;
}

export function SiteFooter({ onCopyLink, leavesOn, onToggleLeaves }: SiteFooterProps) {
  return (
    <footer className="hub-footer">
      <p>© {new Date().getFullYear()} TeaZ</p>
      <nav aria-label="Cuối trang">
        <a href="#affiliate">Tiếp thị liên kết</a>
        <a href="#cau-hoi">Câu hỏi</a>
        <a href="#cong-cu">Công cụ</a>
        <Link to="/profile">Portfolio</Link>
      </nav>
      <div>
        <button type="button" onClick={onCopyLink}>Sao chép link</button>
        <button type="button" aria-pressed={leavesOn} onClick={onToggleLeaves}>Hiệu ứng lá</button>
      </div>
    </footer>
  );
}
