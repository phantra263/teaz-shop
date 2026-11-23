import { ScanSearch } from "lucide-react";
import { Link } from "react-router-dom";
import { shopeePriceTool } from "../data/tools";

export function ToolBanner() {
  return (
    <aside className="hub-tool-banner" aria-labelledby="tool-banner-title">
      <div className="hub-banner-chart" aria-hidden="true">
        <span /><span /><span /><span /><span /><span />
      </div>
      <div className="hub-banner-copy">
        <h2 id="tool-banner-title">Kiểm tra giá trước khi chốt đơn</h2>
        <p>Xem lịch sử giá Shopee và các dấu hiệu tăng giá trước sale bằng tiện ích của TeaZ.</p>
      </div>
      <Link className="hub-button hub-button-secondary" to={shopeePriceTool.path}>
        <ScanSearch size={18} aria-hidden="true" /> Xem cách kiểm tra giá
      </Link>
    </aside>
  );
}
