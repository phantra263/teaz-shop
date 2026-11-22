import { useEffect, useState } from "react";
import { CircleCheck } from "lucide-react";

export function Toast({ message }: { message: string | null }) {
  const [shown, setShown] = useState("Đã sao chép liên kết!");

  useEffect(() => {
    if (message) setShown(message);
  }, [message]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-xs font-medium whitespace-nowrap text-white shadow-xl transition-all duration-300 ${
        message
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-2 opacity-0"
      }`}
    >
      <CircleCheck className="h-4 w-4 text-tea-400" aria-hidden="true" />
      <span>{shown}</span>
    </div>
  );
}
