import { Link } from "react-router-dom";
import { site } from "../data/site";

interface SiteFooterProps {
  onCopyLink: () => void;
}

export function SiteFooter({ onCopyLink }: SiteFooterProps) {
  return (
    <footer className="mt-8 space-y-2 text-center lg:mt-12 lg:flex lg:items-center lg:justify-between lg:gap-4 lg:space-y-0 lg:border-t lg:border-tea-100 lg:pt-6 lg:text-left">
      <nav
        aria-label="Trong trang"
        className="flex items-center justify-center gap-3 text-[11px] text-slate-500 lg:justify-start lg:text-xs"
      >
        <a href="#san-pham" className="hover:text-tea-700">
          Sản phẩm
        </a>
        <span aria-hidden="true">•</span>
        <a href="#ve-teaz" className="hover:text-tea-700">
          Về TeaZ
        </a>
        <span aria-hidden="true">•</span>
        <a href="#cau-hoi" className="hover:text-tea-700">
          Câu hỏi
        </a>
        <span aria-hidden="true">•</span>
        <Link to="/profile" className="hover:text-tea-700">
          Portfolio
        </Link>
      </nav>
      <p className="text-[11px] text-slate-400">
        © {new Date().getFullYear()}{" "}
        <strong className="text-slate-600">
          TeaZ Review ({site.handle})
        </strong>{" "}
        • Chọn lọc &amp; Chia sẻ trải nghiệm thực tế
      </p>
      <button
        type="button"
        onClick={onCopyLink}
        className="text-[11px] text-slate-500 underline decoration-dotted hover:text-tea-700"
      >
        Sao chép link Bio
      </button>
    </footer>
  );
}
