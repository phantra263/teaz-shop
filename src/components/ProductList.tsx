import { useMemo, useState } from "react";
import { Play, Search, ShoppingBag } from "lucide-react";
import {
  categories,
  products,
  type CategoryId,
  type Product,
} from "../data/site";
import { openShopeeSmartLink } from "../lib/shopee";
import { foldVi } from "../lib/text";

const accentByCategory: Record<Product["category"], string> = {
  beauty: "border-amber-200/70 bg-amber-50 text-amber-600",
  home: "border-rose-200/70 bg-rose-50 text-rose-600",
  fashion: "border-slate-200 bg-slate-100 text-slate-700",
  tech: "border-sky-200/70 bg-sky-50 text-sky-600",
};

export function ProductList() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryId>("all");

  const filtered = useMemo(() => {
    const folded = foldVi(query.trim());
    return products.filter((item) => {
      const matchCategory = category === "all" || item.category === category;
      const haystack = foldVi(
        `${item.name} ${item.description} ${item.categoryLabel}`,
      );
      return matchCategory && haystack.includes(folded);
    });
  }, [category, query]);

  return (
    <section
      id="san-pham"
      aria-labelledby="san-pham-heading"
      className="rounded-3xl border border-tea-100 bg-white/85 p-4 shadow-sm backdrop-blur-md lg:p-6"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-5 w-2 rounded-full bg-tea-600" aria-hidden="true" />
          <h2
            id="san-pham-heading"
            className="font-display text-base font-bold text-slate-900 lg:text-lg"
          >
            Sản Phẩm Đã Review
          </h2>
        </div>
        <span className="rounded-full border border-tea-200/60 bg-tea-50 px-2.5 py-1 text-[11px] font-medium text-tea-700">
          Link chính hãng
        </span>
      </div>

      <div className="relative mb-3">
        <label htmlFor="product-search" className="sr-only">
          Tìm sản phẩm đã review
        </label>
        <Search
          className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          id="product-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm tên sản phẩm (vd: xịt khoáng d'Alba, nồi Redchef...)"
          className="w-full rounded-xl border border-slate-200/80 bg-slate-50 py-2 pr-4 pl-9 text-xs transition placeholder:text-slate-400 focus:border-tea-500 focus:ring-2 focus:ring-tea-500/30 focus:outline-none lg:py-2.5 lg:text-sm"
        />
      </div>

      <div
        className="no-scrollbar mb-1 flex items-center gap-1.5 overflow-x-auto pb-3"
        role="group"
        aria-label="Lọc theo danh mục"
      >
        {categories.map((item) => {
          const active = category === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={active}
              onClick={() => setCategory(item.id)}
              className={
                active
                  ? "shrink-0 rounded-full bg-tea-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition"
                  : "shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-tea-50 hover:text-tea-700"
              }
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm font-medium text-slate-500">
            Không tìm thấy sản phẩm khớp từ khóa.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCategory("all");
            }}
            className="mt-2 text-xs font-semibold text-tea-600 hover:underline"
          >
            Xem lại tất cả sản phẩm
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-slate-200/75 bg-slate-50/90 p-3.5 shadow-sm transition-all hover:border-tea-200 hover:bg-white lg:p-4"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-5">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border text-2xl ${accentByCategory[item.category]} lg:h-14 lg:w-14`}
                >
                  <span aria-hidden="true">{item.icon}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-md bg-tea-100/80 px-2 py-0.5 text-[10px] font-bold tracking-wide text-tea-700 uppercase">
                      {item.badge}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {item.categoryLabel}
                    </span>
                  </div>
                  <h3 className="font-display mt-1 text-sm leading-snug font-bold text-slate-900 lg:text-base">
                    {item.name}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500 lg:text-sm">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 border-t border-slate-200/60 pt-2.5 lg:w-44 lg:shrink-0 lg:grid-cols-1 lg:border-0 lg:pt-0">
                <button
                  type="button"
                  onClick={() => openShopeeSmartLink(item.shopeeUrl)}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-tea-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-tea-700"
                >
                  <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="whitespace-nowrap">Mua tại Shopee</span>
                </button>
                <a
                  href={item.tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-100"
                >
                  <Play className="h-3.5 w-3.5 text-slate-700" aria-hidden="true" />
                  <span className="whitespace-nowrap">Xem Video Review</span>
                </a>
              </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
