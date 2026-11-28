import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { shopeePriceTool } from "../data/tools";

export function ToolBanner() {
  return (
    <aside className="hub-tool-banner" aria-labelledby="tool-banner-title">
      <img className="hub-banner-icon" src="/shopee-price-icon.png" width="60" height="60" alt="" />
      <div className="hub-banner-copy">
        <span className="hub-banner-platform">
          <img src="/chrome-logo.svg" width="18" height="18" alt="" /> Tiện ích Chrome của TeaZ
        </span>
        <h2 id="tool-banner-title">Kiểm tra giá trước khi chốt đơn</h2>
        <p>Xem lịch sử giá Shopee và nhận cảnh báo tăng giá trước sale.</p>
      </div>
      <Link className="hub-button hub-extension-action" to={shopeePriceTool.path}>
        Xem cách kiểm tra giá <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </aside>
  );
}
