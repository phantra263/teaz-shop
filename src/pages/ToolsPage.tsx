import { useEffect } from "react";
import { Bell, ChartNoAxesCombined, ScanSearch } from "lucide-react";
import { Link } from "react-router-dom";
import { FacebookIcon } from "../components/icons";
import { ThemeToggle } from "../components/ThemeToggle";
import { shopeePriceFeatures, shopeePriceTool } from "../data/tools";
import "./shop.css";

const featureIcons = [ChartNoAxesCombined, ScanSearch, Bell];

export function ToolsPage() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${shopeePriceTool.name} | Công cụ TeaZ`;
    window.scrollTo(0, 0);
    return () => { document.title = previousTitle; };
  }, []);

  return (
    <div className="hub">
      <div className="hub-container">
        <header className="hub-tools-toolbar">
          <Link to="/" className="hub-brand">
            <img src="/avatar.png" width="42" height="42" alt="" />
            <span>TeaZ</span>
          </Link>
          <div className="hub-toolbar-actions">
            <Link className="hub-button hub-button-secondary" to="/profile">Portfolio Trà Phan</Link>
            <ThemeToggle />
          </div>
        </header>
        <main className="hub-tools-main">
          <section className="hub-tools-hero" aria-labelledby="tool-title">
            <span className="hub-tool-icon" aria-hidden="true"><ChartNoAxesCombined size={34} /></span>
            <p className="hub-eyebrow">Tiện ích Chrome của TeaZ</p>
            <h1 id="tool-title">{shopeePriceTool.name}</h1>
            <p className="hub-hero-description">{shopeePriceTool.description}</p>
            <a className="hub-button hub-button-light" href={shopeePriceTool.storeUrl} target="_blank" rel="noopener noreferrer">
              Mở Chrome Web Store
            </a>
          </section>
          <section className="hub-section" aria-labelledby="tool-features">
            <h2 id="tool-features" className="hub-heading">Tiện ích giúp bạn làm gì?</h2>
            <div className="hub-tool-features">
              {shopeePriceFeatures.map(({ title, description }, index) => {
                const Icon = featureIcons[index];
                return (
                  <article className="hub-tool-feature" key={title}>
                    <Icon size={24} aria-hidden="true" />
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </article>
                );
              })}
            </div>
          </section>
          <section className="hub-section hub-tool-guide" aria-labelledby="tool-guide">
            <h2 id="tool-guide" className="hub-heading">Cách dùng</h2>
            <ol>
              <li>Mở Chrome Web Store trên máy tính và chọn <strong>Thêm vào Chrome</strong>.</li>
              <li>Mở trang sản phẩm trên Shopee.vn để xem biểu đồ giá bên dưới giá hiện tại.</li>
              <li>Thêm sản phẩm vào danh sách theo dõi và đặt mức giá bạn muốn.</li>
            </ol>
            <div className="hub-actions">
              <a className="hub-button hub-button-primary" href={shopeePriceTool.guideUrl} target="_blank" rel="noopener noreferrer">
                <FacebookIcon className="size-4" /> Xem hướng dẫn trên Facebook
              </a>
              <a className="hub-button hub-button-secondary" href="/#san-pham">Khám phá sản phẩm TeaZ</a>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
