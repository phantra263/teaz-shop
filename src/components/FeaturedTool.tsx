import { ArrowRight, ArrowUpRight, Chrome } from "lucide-react";
import { Link } from "react-router-dom";
import { shopeePriceTool } from "../data/tools";

import { ToolPreview } from "./ToolPreview";

export function FeaturedTool() {
  return (
    <section className="hub-section hub-featured-tool" id="cong-cu" aria-labelledby="featured-tool-title">
      <h2 className="hub-heading" id="featured-tool-title">Công cụ <span className="hub-title-accent">Tea<span className="teaz-letter-z">Z</span></span></h2>
      <article className="hub-tool-card">
        <div className="hub-featured-tool-copy">
          <p className="hub-featured-tool-platform"><Chrome size={16} aria-hidden="true" /> Tiện ích Chrome</p>
          <h3>Kiểm tra giá Shopee <em>trước khi mua</em></h3>
          <p className="hub-featured-tool-name" lang="en">{shopeePriceTool.name}</p>
          <p className="hub-featured-tool-description">{shopeePriceTool.description}</p>
          <div className="hub-actions">
            <a className="hub-button hub-button-light" href={shopeePriceTool.storeUrl} target="_blank" rel="noopener noreferrer">
              Cài trên Chrome <ArrowUpRight size={17} aria-hidden="true" />
            </a>
            <Link className="hub-featured-tool-guide" to={shopeePriceTool.path}>
              Xem cách dùng <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
        <ToolPreview />
      </article>
    </section>
  );
}
