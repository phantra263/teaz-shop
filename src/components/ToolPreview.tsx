import { ZoomIn } from "lucide-react";
import { shopeePriceTool } from "../data/tools";

export function ToolPreview({ eager = false }: { eager?: boolean }) {
  return (
    <div className="hub-tool-art">
      <a className="hub-tool-print" href="/shopee-price-history.webp" target="_blank" rel="noopener noreferrer"
        aria-label="Mở ảnh giao diện tiện ích ở kích thước đầy đủ trong tab mới">
        <img className="hub-extension-preview" src="/shopee-price-history.webp"
          width="1280" height="800" loading={eager ? "eager" : "lazy"} decoding="async"
          alt={`Ảnh chụp giao diện ${shopeePriceTool.name} trên Chrome Web Store`} />
        <ZoomIn className="hub-tool-zoom" size={32} aria-hidden="true" />
      </a>
    </div>
  );
}
