import { BadgeCheck, Mail, ShoppingBag } from "lucide-react";
import { site } from "../data/site";
import { openShopeeSmartLink } from "../lib/shopee";
import { FacebookIcon, TeaLeafMark, TikTokIcon } from "./icons";

interface ProfileHeaderProps {
  onContact: () => void;
}

export function ProfileHeader({ onContact }: ProfileHeaderProps) {
  return (
    <header className="mb-7 text-center lg:mb-5 lg:rounded-[28px] lg:border lg:border-white/80 lg:bg-white/75 lg:p-6 lg:shadow-sm lg:backdrop-blur-md">
      <div className="group relative mb-3.5 inline-block">
        <div className="mx-auto h-24 w-24 rounded-full bg-gradient-to-tr from-tea-700 via-tea-600 to-emerald-400 p-1 shadow-lg shadow-tea-600/20 transition-transform duration-300 group-hover:scale-105 lg:h-28 lg:w-28">
          <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-full bg-white">
            <div className="absolute inset-0 bg-tea-50/60" />
            <TeaLeafMark className="animate-float-slow relative z-10 -mb-0.5 h-7 w-7 text-tea-600" />
            <span className="font-display relative z-10 text-xl font-extrabold tracking-tight text-tea-900">
              TeaZ
            </span>
          </div>
        </div>
        <div
          className="absolute right-0.5 bottom-0.5 rounded-full border-2 border-white bg-tea-600 p-1 text-white shadow-sm"
          title="Kênh Review Chính Thức"
        >
          <BadgeCheck className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>

      <h1 className="font-display text-xl font-extrabold tracking-tight text-slate-900 lg:text-2xl">
        {site.brandName}
      </h1>
      <p className="mt-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-tea-700">
        <span>{site.handle}</span>
        <span className="h-1 w-1 rounded-full bg-tea-400" aria-hidden="true" />
        <span className="rounded-full bg-tea-100 px-2 py-0.5 text-[11px] text-tea-800">
          {site.followersLabel}
        </span>
      </p>

      <p className="mx-auto mt-2.5 max-w-[380px] text-sm leading-relaxed text-slate-600">
        {site.bioLead} 🍃
        <br />
        {site.bioRest}
      </p>

      <div className="mt-4 flex items-center justify-center gap-3">
        <a
          href={site.tiktokProfileUrl}
          target="_blank"
          rel="me noopener noreferrer"
          aria-label="TikTok TeaZ Shop"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-800 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-900 hover:text-white"
        >
          <TikTokIcon className="h-4 w-4" />
        </a>
        <a
          href={site.facebookPageUrl}
          target="_blank"
          rel="me noopener noreferrer"
          aria-label="Facebook TeaZ Code"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-800 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-blue-600 hover:text-white"
        >
          <FacebookIcon className="h-4 w-4" />
        </a>
        <button
          type="button"
          onClick={() => openShopeeSmartLink(site.shopeeCollectionUrl)}
          aria-label="Bộ sưu tập Shopee"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-800 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-orange-500 hover:text-white"
        >
          <ShoppingBag className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onContact}
          aria-label="Liên hệ hợp tác"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-800 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-tea-600 hover:text-white"
        >
          <Mail className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
