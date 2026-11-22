import { useState } from "react";
import { ExternalLink, X } from "lucide-react";

function isInAppBrowser() {
  const ua = navigator.userAgent || "";
  return /TikTok|BytedanceWebview|musical_ly|FBAN|FBAV|FB_IAB/i.test(ua);
}

export function InAppBanner() {
  const [visible, setVisible] = useState(
    () =>
      document.documentElement.classList.contains("in-app-browser") ||
      isInAppBrowser(),
  );

  if (!visible) return null;

  return (
    <div className="sticky top-0 z-50 border-b border-tea-500/30 bg-slate-900/95 px-4 py-3 text-white shadow-lg backdrop-blur-md">
      <div className="mx-auto flex max-w-[480px] items-start gap-3 lg:max-w-6xl">
        <div className="mt-0.5 shrink-0 rounded-xl bg-tea-500/20 p-2 text-tea-400">
          <ExternalLink className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="flex-1 text-xs leading-relaxed">
          <p className="mb-0.5 text-sm font-semibold text-tea-300">
            Mở bằng trình duyệt ngoài để áp mã Shopee!
          </p>
          <p className="text-slate-300">
            Bấm dấu{" "}
            <span className="inline-block rounded bg-white/15 px-1.5 py-0.5 font-bold text-white">
              •••
            </span>{" "}
            ở góc trên bên phải → chọn{" "}
            <span className="font-semibold text-white underline">
              Mở bằng trình duyệt (Safari/Chrome)
            </span>{" "}
            để tự nhảy sang App Shopee.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="p-1 text-slate-400 hover:text-white"
          aria-label="Đóng thông báo"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
