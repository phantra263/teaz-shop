import { ArrowRight, ArrowUpRight, Chrome } from "lucide-react";
import { Link } from "react-router-dom";
import { shopeePriceTool } from "../data/tools";

const samplePrices = [249, 249, 229, 199, 199, 219, 249, 279, 279, 249, 229, 219];

export function FeaturedTool() {
  return (
    <section className="hub-section hub-featured-tool" id="cong-cu" aria-labelledby="featured-tool-title">
      <h2 className="hub-heading" id="featured-tool-title">Công cụ <span className="hub-title-accent">Tea<span className="teaz-letter-z">Z</span></span></h2>
      <article className="hub-tool-card">
        <div className="hub-featured-tool-copy">
          <p className="hub-featured-tool-platform"><Chrome size={16} aria-hidden="true" /> Tiện ích Chrome</p>
          <h3>Kiểm tra giá Shopee trước khi mua</h3>
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
        <figure className="hub-price-preview" aria-label="Ví dụ lịch sử giá 30 ngày. Giá dao động từ 199.000 đến 279.000 đồng, hiện là 219.000 đồng.">
          <figcaption>
            <strong>Lịch sử giá 30 ngày</strong>
            <span>Dữ liệu minh họa</span>
          </figcaption>
          <div className="hub-price-chart" aria-hidden="true">
            {samplePrices.map((price, index) => (
              <span key={index} className={price === 279 ? "hub-price-peak" : undefined} style={{ height: `${(price - 150) / 1.4}%` }} />
            ))}
          </div>
          <div className="hub-price-summary">
            <div><span>Thấp nhất</span><strong>199.000 ₫</strong></div>
            <div><span>Hiện tại</span><strong>219.000 ₫</strong></div>
          </div>
        </figure>
      </article>
    </section>
  );
}
