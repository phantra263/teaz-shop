import { ChartNoAxesCombined } from "lucide-react";
import { Link } from "react-router-dom";
import { shopeePriceTool } from "../data/tools";

export function FeaturedTool() {
  return (
    <section className="hub-section" id="cong-cu" aria-labelledby="featured-tool-title">
      <h2 className="hub-heading" id="featured-tool-title">Công cụ TeaZ</h2>
      <article className="hub-tool-card">
        <span className="hub-tool-icon" aria-hidden="true"><ChartNoAxesCombined size={28} /></span>
        <div className="hub-tool-copy">
          <p className="hub-category-label">Tiện ích Chrome</p>
          <h3>{shopeePriceTool.name}</h3>
          <p className="hub-description">{shopeePriceTool.description}</p>
        </div>
        <div className="hub-actions">
          <Link className="hub-button hub-button-secondary" to={shopeePriceTool.path}>Xem cách dùng</Link>
          <a className="hub-button hub-button-primary" href={shopeePriceTool.storeUrl} target="_blank" rel="noopener noreferrer">
            Cài trên Chrome
          </a>
        </div>
      </article>
    </section>
  );
}
