import { ArrowUpRight, ChevronRight, Flame } from "lucide-react";
import { site } from "../data/site";
import { openShopeeSmartLink } from "../lib/shopee";

interface LinkCardsProps {
  onContact: () => void;
}

export function LinkCards({ onContact }: LinkCardsProps) {
  return (
    <section aria-labelledby="lien-ket-heading" className="mb-8 space-y-3.5">
      <h2 id="lien-ket-heading" className="sr-only">
        Liên kết chính
      </h2>

      <button
        type="button"
        onClick={() => openShopeeSmartLink(site.shopeeCollectionUrl)}
        className="group relative block w-full rounded-2xl bg-gradient-to-r from-tea-700 via-tea-600 to-emerald-600 p-4 text-left text-white shadow-lg shadow-tea-700/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-tea-700/30"
      >
        <span className="shimmer-btn" aria-hidden="true" />
        <span className="absolute -top-2.5 right-4 z-10 flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-0.5 text-[10px] font-extrabold tracking-wider text-slate-950 uppercase shadow-sm">
          <Flame
            className="h-3 w-3 fill-orange-600 text-orange-600"
            aria-hidden="true"
          />
          Hot deal
        </span>
        <div className="relative z-10 flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/15 backdrop-blur-sm transition-transform group-hover:scale-105">
            <span className="text-2xl" aria-hidden="true">
              🛍️
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display truncate text-base font-bold text-white">
              Bộ Sưu Tập Đồ Hay Trên Shopee
            </h3>
            <p className="mt-0.5 line-clamp-1 text-xs text-tea-100">
              Tổng hợp toàn bộ sản phẩm đã review &amp; mã giảm giá
            </p>
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 transition-transform group-hover:translate-x-1">
            <ArrowUpRight className="h-4 w-4 text-white" aria-hidden="true" />
          </div>
        </div>
      </button>

      <a
        href={site.tiktokProfileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group block rounded-2xl border border-tea-100/80 bg-white/95 p-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
      >
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white transition-transform group-hover:scale-105">
            <span className="text-xl" aria-hidden="true">
              🎵
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display truncate text-[15px] font-bold text-slate-900">
              Giỏ Hàng TikTok Shop ({site.handle})
            </h3>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              Xem video review thực tế &amp; săn voucher Live
            </p>
          </div>
          <ChevronRight
            className="h-5 w-5 shrink-0 text-slate-400 transition-all group-hover:translate-x-0.5 group-hover:text-tea-600"
            aria-hidden="true"
          />
        </div>
      </a>

      <a
        href={site.facebookPageUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group block rounded-2xl border border-tea-100/80 bg-white/95 p-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
      >
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 transition-transform group-hover:scale-105">
            <span className="text-xl" aria-hidden="true">
              📘
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display truncate text-[15px] font-bold text-slate-900">
              TeaZ Code &amp; Chia Sẻ Công Nghệ
            </h3>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              Mẹo hay công nghệ, tự động hóa AI &amp; deal công nghệ
            </p>
          </div>
          <ChevronRight
            className="h-5 w-5 shrink-0 text-slate-400 transition-all group-hover:translate-x-0.5 group-hover:text-tea-600"
            aria-hidden="true"
          />
        </div>
      </a>

      <button
        type="button"
        onClick={onContact}
        className="group block w-full rounded-2xl border border-tea-100/80 bg-white/95 p-3.5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
      >
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-tea-200/70 bg-tea-50 text-tea-700 transition-transform group-hover:scale-105">
            <span className="text-xl" aria-hidden="true">
              💬
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display truncate text-[15px] font-bold text-slate-900">
              Nhắn Tin / Booking Review Sản Phẩm
            </h3>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              Hợp tác nhãn hàng &amp; hỗ trợ tìm link sản phẩm nhanh
            </p>
          </div>
          <ChevronRight
            className="h-5 w-5 shrink-0 text-slate-400 transition-all group-hover:translate-x-0.5 group-hover:text-tea-600"
            aria-hidden="true"
          />
        </div>
      </button>
    </section>
  );
}
