import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { FacebookIcon } from "./icons";
import { site } from "../data/site";
import { copyText } from "../lib/clipboard";

interface ContactModalProps {
  onClose: () => void;
}

export function ContactModal({ onClose }: ContactModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  async function copyEmail() {
    try {
      await copyText(site.bookingEmail);
      setStatus("Đã sao chép email liên hệ.");
    } catch {
      setStatus("Không thể sao chép. Bạn có thể bấm vào địa chỉ để mở ứng dụng email.");
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="contact-title"
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl bg-white p-5 text-slate-900 shadow-2xl backdrop:bg-slate-900/65 sm:p-6"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="contact-title" className="font-display text-xl font-extrabold">Liên hệ &amp; Booking Review</h2>
          <button type="button" onClick={onClose} className="hub-icon-button shrink-0" aria-label="Đóng">
            <X size={19} aria-hidden="true" />
          </button>
        </div>

        <p className="mb-4 leading-relaxed text-slate-600">
          Gửi brief, thông tin sản phẩm và kênh mong muốn để TeaZ trao đổi về nội dung hợp tác.
        </p>

        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div>
              <p className="mb-0.5 text-sm text-slate-600">Email booking</p>
              <a className="break-all font-semibold text-tea-800 underline" href={`mailto:${site.bookingEmail}`}>
                {site.bookingEmail}
              </a>
            </div>
            <button className="hub-button hub-button-primary" type="button" onClick={() => void copyEmail()}>
              Sao chép
            </button>
          </div>
          <a className="hub-button hub-button-secondary w-full" href={site.facebookPageUrl} target="_blank" rel="noopener noreferrer">
            <FacebookIcon className="size-5 text-blue-700" /> Nhắn Facebook TeaZ Code
          </a>
          <p className="text-sm text-slate-700 empty:hidden" role="status">{status}</p>
        </div>
      </div>
    </dialog>
  );
}
