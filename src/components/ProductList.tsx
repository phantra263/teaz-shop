import { useState } from "react";
import { ArrowUpRight, Play, Search } from "lucide-react";
import { categories, products, site, type CategoryId } from "../data/site";
import { foldVi } from "../lib/text";

export function ProductList() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryId>("all");
  const search = foldVi(query.trim());
  const filtered = products.filter((product) => {
    const matchesCategory = category === "all" || product.category === category;
    const text = foldVi(`${product.name} ${product.description} ${product.categoryLabel}`);
    return matchesCategory && text.includes(search);
  });

  return (
    <section className="hub-section hub-reviews" id="san-pham" aria-labelledby="san-pham-heading">
      <div className="hub-section-header hub-reviews-header">
        <div>
          <h2 className="hub-heading" id="san-pham-heading">Sản phẩm <span className="hub-title-accent">đã review</span></h2>
          <p className="hub-description">Từ các video ghim của TeaZ trên TikTok.</p>
        </div>
        <a className="hub-review-link" href={site.shopeeCollectionUrl} target="_blank" rel="sponsored noopener noreferrer">
          Bộ sưu tập Shopee <ArrowUpRight size={16} aria-hidden="true" />
        </a>
      </div>

      <div className="hub-filters">
        <div className="hub-categories" role="group" aria-label="Lọc theo danh mục">
          {categories.map(({ id, label }) => (
            <button key={id} type="button" aria-pressed={category === id} onClick={() => setCategory(id)}>
              {label}
            </button>
          ))}
        </div>
        <div className="hub-search">
          <Search size={17} aria-hidden="true" />
          <label htmlFor="product-search" className="sr-only">Tìm sản phẩm</label>
          <input id="product-search" type="search" placeholder="Tìm sản phẩm…" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
      </div>

      <p className="sr-only" role="status">{filtered.length} sản phẩm</p>
      {filtered.length ? (
        <div className="hub-products">
          {filtered.map((product) => (
            <article className="hub-product" key={product.id}>
              <a
                className="hub-review-entry"
                href={product.reviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-labelledby={`review-action-${product.id} review-name-${product.id}`}
              >
                <div className="hub-review-cover">
                  <img src={product.cover} alt="" width={405} height={720} loading="lazy" decoding="async" />
                  <span className="hub-review-play" aria-hidden="true"><Play size={17} fill="currentColor" /></span>
                </div>
                <div className="hub-product-copy">
                  <p className="hub-review-category">{product.categoryLabel}</p>
                  <h3 id={`review-name-${product.id}`}>{product.name}</h3>
                  <p>{product.description}</p>
                  <span className="hub-review-link" id={`review-action-${product.id}`}>
                    Xem trên TikTok <ArrowUpRight size={15} aria-hidden="true" />
                  </span>
                </div>
              </a>
              {product.shopeeUrl && (
                <a
                  className="hub-review-link"
                  href={product.shopeeUrl}
                  target="_blank"
                  rel="sponsored noopener noreferrer"
                >
                  Xem trên Shopee <ArrowUpRight size={15} aria-hidden="true" />
                </a>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="hub-empty">
          <p>Không tìm thấy sản phẩm phù hợp.</p>
          <button className="hub-button hub-button-secondary" type="button" onClick={() => { setQuery(""); setCategory("all"); }}>
            Xem lại tất cả sản phẩm
          </button>
        </div>
      )}
      <p className="hub-disclosure" id="affiliate">
        TeaZ có thể nhận hoa hồng từ đơn hàng qua liên kết tiếp thị. Giá và khuyến mãi hiển thị tại sàn.
        {" "}<a href="#cong-cu">Kiểm tra lịch sử giá Shopee</a>.
      </p>
    </section>
  );
}
