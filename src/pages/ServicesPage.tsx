import { useEffect, useState } from "react";
import { Bot, Coffee, GraduationCap, LayoutGrid, MessageCircle, Palette, Search, Shield, TvMinimalPlay } from "lucide-react";
import { Link } from "react-router-dom";
import { FacebookIcon, TikTokIcon, YouTubeIcon } from "../components/icons";
import { serviceCatalog, servicesPage } from "../data/services";
import { foldVi } from "../lib/text";
import "./shop.css";
import "./services.css";

type Category = "all" | (typeof serviceCatalog)[number]["id"];

const zaloUrl = `https://zalo.me/${servicesPage.zaloPhone}`;
const formatPrice = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });
const categoryIcons = { all: LayoutGrid, ai: Bot, streaming: TvMinimalPlay, creative: Palette, productivity: GraduationCap, vpn: Shield };
const categories = [
  { id: "all" as const, label: "Tất cả", count: serviceCatalog.reduce((count, group) => count + group.packages.length, 0) },
  ...serviceCatalog.map(({ id, label, packages }) => ({ id, label, count: packages.length })),
];

export function ServicesPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("all");
  const search = foldVi(query.trim());
  const groups = serviceCatalog
    .filter((group) => category === "all" || group.id === category)
    .map((group) => ({
      ...group,
      packages: group.packages.filter(({ name }) => foldVi(`${name} ${group.label}`).includes(search)),
    }))
    .filter((group) => group.packages.length > 0);
  const resultCount = groups.reduce((count, group) => count + group.packages.length, 0);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Bảng giá gói trải nghiệm & dịch vụ | TeaZ";
    if (!window.location.hash) window.scrollTo(0, 0);
    return () => { document.title = previousTitle; };
  }, []);

  return (
    <div className="hub service-shell">
      <div className="hub-container">
        <header className="hub-tools-toolbar">
          <Link to="/" className="hub-brand">
            <img src="/avatar.png" width="42" height="42" alt="" />
            <span>TeaZ</span>
          </Link>
          <a className="hub-button hub-button-secondary service-contact" href={zaloUrl} target="_blank" rel="noopener noreferrer">
            <MessageCircle size={17} aria-hidden="true" /> Zalo {servicesPage.zaloPhone}
          </a>
        </header>
        <main className="hub-tools-main service-page">
          <section className="service-hero" aria-labelledby="service-title">
            <div className="service-hero-copy">
              <h1 id="service-title">Gói trải nghiệm <span>&amp; dịch vụ số</span></h1>
              <p className="hub-hero-description">
                Khám phá các gói AI, thiết kế, học tập và giải trí. Nhắn Zalo để xác nhận tình trạng và điều kiện sử dụng của từng gói.
              </p>
              <div className="hub-actions">
                <a className="hub-button hub-button-light" href="#bang-gia">Xem bảng giá</a>
                <a className="hub-button hub-button-outline" href={zaloUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle size={18} aria-hidden="true" /> Nhắn Zalo
                </a>
              </div>
            </div>
            <div className="service-hero-visual">
              <img src="/teaz-digital-services.jpg" width="1536" height="1024" fetchPriority="high" alt="" />
            </div>
          </section>

          <section id="bang-gia" className="hub-section" aria-labelledby="price-list-title">
            <div className="hub-section-header">
              <div>
                <h2 className="hub-heading" id="price-list-title">Bảng giá gói trải nghiệm</h2>
                <p className="hub-description">Giá tham khảo tính bằng đồng Việt Nam. Nhắn Zalo để biết hình thức cấp quyền và hỗ trợ của từng gói.</p>
              </div>
              <a className="hub-button hub-button-secondary" href="#mang-xa-hoi">Dịch vụ mạng xã hội</a>
            </div>
            <div className="service-categories" role="group" aria-label="Nhóm gói trải nghiệm">
              {categories.map(({ id, label, count }) => {
                const Icon = categoryIcons[id];
                return (
                  <button className="service-category" data-category={id} key={id} type="button" aria-pressed={category === id} onClick={() => setCategory(id)}>
                    <span className="service-category-icon"><Icon size={22} aria-hidden="true" /></span>
                    <strong>{label}</strong>
                    <span className="service-category-count" aria-hidden="true">{count} gói</span>
                  </button>
                );
              })}
            </div>
            <div className="service-results-toolbar">
              <div className="hub-search service-search">
                <Search size={19} aria-hidden="true" />
                <label htmlFor="service-search" className="sr-only">Tìm tên gói</label>
                <input id="service-search" type="search" placeholder="Tìm gói, ví dụ Canva hoặc VPN…" value={query} onChange={(event) => setQuery(event.target.value)} />
              </div>
              <p className="service-result-count" role="status">{resultCount} gói phù hợp</p>
            </div>
            {groups.length > 0 ? (
              <div className="service-groups">
                {groups.map((group) => {
                  const Icon = categoryIcons[group.id];
                  return (
                    <section className="service-group" data-category={group.id} key={group.id} aria-labelledby={`services-${group.id}`}>
                      <h3 id={`services-${group.id}`}><Icon size={20} aria-hidden="true" />{group.label}</h3>
                      <dl>
                        {group.packages.map(({ name, appIcon, price }) => (
                          <div className="service-price-row" key={name}>
                            <dt>
                              <span className="service-app-icon">
                                <img src={`/service-icons/${appIcon}.png`} width="32" height="32" alt="" loading="lazy" decoding="async" />
                              </span>
                              <span>{name}</span>
                            </dt>
                            <dd>{formatPrice.format(price)}</dd>
                          </div>
                        ))}
                      </dl>
                    </section>
                  );
                })}
              </div>
            ) : (
              <div className="hub-empty">
                <p>Không tìm thấy gói phù hợp.</p>
                <button className="hub-button hub-button-secondary" type="button" onClick={() => { setQuery(""); setCategory("all"); }}>
                  Xem tất cả gói
                </button>
              </div>
            )}
          </section>

          <div className="hub-section service-contact-grid">
            <section id="mang-xa-hoi" className="service-social" aria-labelledby="social-service-title">
              <div className="service-social-icons" aria-hidden="true">
                <span className="hub-channel-tiktok"><TikTokIcon className="size-5" /></span>
                <span className="hub-channel-facebook"><FacebookIcon className="size-5" /></span>
                <span className="hub-channel-youtube"><YouTubeIcon className="size-5" /></span>
              </div>
              <h2 className="hub-heading" id="social-service-title">Dịch vụ tăng tương tác mạng xã hội</h2>
              <p className="hub-description">Liên hệ để biết thêm về các dịch vụ trên TikTok, Facebook và YouTube.</p>
              <a className="hub-button hub-button-primary" href={zaloUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={18} aria-hidden="true" /> Liên hệ qua Zalo
              </a>
            </section>
            <aside className="service-coffee">
              <span className="service-coffee-icon"><Coffee size={24} aria-hidden="true" /></span>
              <h2 className="hub-heading">Mời TeaZ một ly cà phê</h2>
              <p className="hub-description">Nếu thấy các công cụ TeaZ hữu ích, bạn có thể nhắn mình để ủng hộ.</p>
              <a className="hub-button hub-button-secondary" href={zaloUrl} target="_blank" rel="noopener noreferrer">Nhắn TeaZ</a>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}
