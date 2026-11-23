import { useState } from "react";
import { Play, Search, ShoppingBag } from "lucide-react";
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
    <section className="hub-section" id="san-pham" aria-labelledby="san-pham-heading">
      <div className="hub-section-header">
        <div>
          <h2 className="hub-heading" id="san-pham-heading">Khám phá sản phẩm</h2>
          <p className="hub-description">Tìm theo tên hoặc chọn danh mục bạn quan tâm.</p>
        </div>
        <a className="hub-button hub-button-secondary" href={site.shopeeCollectionUrl} target="_blank" rel="sponsored noopener noreferrer">
          <ShoppingBag size={17} aria-hidden="true" /> Mở bộ sưu tập Shopee
        </a>
      </div>

      <p className="hub-disclosure" id="affiliate">
        Một số liên kết là link tiếp thị liên kết. TeaZ có thể nhận hoa hồng nếu bạn mua qua các link này.
        Giá và khuyến mãi hiển thị tại sàn.
        {" "}<a className="font-semibold underline underline-offset-2" href="#cong-cu">Kiểm tra lịch sử giá Shopee</a>.
      </p>

      <div className="hub-filters">
        <div className="hub-search">
          <Search size={19} aria-hidden="true" />
          <label htmlFor="product-search" className="sr-only">Tìm sản phẩm</label>
          <input id="product-search" type="search" placeholder="Tìm sản phẩm…" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        <div className="hub-categories" role="group" aria-label="Lọc theo danh mục">
          {categories.map(({ id, label }) => (
            <button key={id} type="button" aria-pressed={category === id} onClick={() => setCategory(id)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <p className="sr-only" role="status">{filtered.length} sản phẩm</p>
      {filtered.length ? (
        <div className="hub-products">
          {filtered.map((product) => (
            <article className="hub-product" key={product.id}>
              <div className={`hub-product-icon hub-product-${product.category}`} aria-hidden="true">{product.icon}</div>
              <div className="hub-product-copy">
                <p className="hub-category-label">{product.categoryLabel}</p>
                <h3>{product.name}</h3>
                <p>{product.description}</p>
              </div>
              <div className="hub-product-links">
                <a
                  className="hub-button hub-button-primary"
                  href={product.shopeeUrl ?? site.shopeeCollectionUrl}
                  target="_blank"
                  rel="sponsored noopener noreferrer"
                >
                  <ShoppingBag size={16} aria-hidden="true" />
                  {product.shopeeUrl ? "Xem trên Shopee" : "Bộ sưu tập Shopee"}
                </a>
                <a
                  className="hub-button hub-button-secondary"
                  href={product.reviewUrl ?? site.tiktokProfileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Play size={16} aria-hidden="true" />
                  {product.reviewUrl ? "Xem video review" : "Kênh TikTok"}
                </a>
              </div>
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
    </section>
  );
}
