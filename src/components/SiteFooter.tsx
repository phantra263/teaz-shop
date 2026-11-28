import { Link } from "react-router-dom";

export function SiteFooter() {
  return (
    <footer className="hub-footer">
      <p>© {new Date().getFullYear()} TeaZ</p>
      <nav aria-label="Cuối trang">
        <a href="#cau-hoi">Câu hỏi</a>
        <a href="#cong-cu">Công cụ</a>
        <Link to="/profile">Portfolio</Link>
      </nav>
    </footer>
  );
}
