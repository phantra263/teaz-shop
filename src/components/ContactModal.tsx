import { useEffect, useRef } from "react";
import { ExternalLink, MessageCircle, Sparkles, X } from "lucide-react";
import { site } from "../data/site";
import { copyText } from "../lib/clipboard";

interface ContactModalProps {
  open: boolean;
  onClose: () => void;
  onCopied: (message: string) => void;
}

export function ContactModal({ open, onClose, onCopied }: ContactModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-title"
        className="w-full max-w-[420px] rounded-3xl border border-tea-100 bg-white p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-tea-100 text-tea-700">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </span>
            <h2
              id="contact-title"
              className="font-display text-base font-bold text-slate-900"
            >
              Liên Hệ &amp; Booking Review
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <p className="mb-4 text-xs leading-relaxed text-slate-600">
          Nhãn hàng cần gửi mẫu trải nghiệm, booking video TikTok Shop hoặc bạn
          cần tìm link deal sản phẩm nào, nhắn trực tiếp cho TeaZ qua các kênh
          dưới đây nhé:
        </p>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-slate-50 p-3">
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-slate-400">
                Email hợp tác / Booking
              </p>
              <p className="truncate text-xs font-bold text-slate-800">
                {site.bookingEmail}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                void copyText(site.bookingEmail).then(() => {
                  onCopied("Đã sao chép Email liên hệ!");
                });
              }}
              className="shrink-0 rounded-xl bg-tea-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-tea-700"
            >
              Copy
            </button>
          </div>

          <a
            href={site.facebookPageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50/70 p-3 transition hover:bg-blue-50"
          >
            <div className="flex items-center gap-2.5">
              <MessageCircle className="h-5 w-5 text-blue-600" aria-hidden="true" />
              <div>
                <p className="text-xs font-bold text-slate-900">
                  Nhắn qua Fanpage TeaZ Code
                </p>
                <p className="text-[11px] text-slate-500">
                  Phản hồi nhanh trong ngày
                </p>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-blue-600" aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  );
}
