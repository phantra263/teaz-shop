import { useEffect, useState } from "react";

export function Toast({ message }: { message: string | null }) {
  const [shown, setShown] = useState("");

  useEffect(() => {
    if (message) setShown(message);
  }, [message]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`hub-toast fixed bottom-5 left-1/2 z-50 w-max max-w-[calc(100%-2rem)] -translate-x-1/2 rounded-2xl bg-slate-900 px-4 py-2.5 text-center text-sm font-medium text-white shadow-xl transition-all duration-300 ${
        message
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-2 opacity-0"
      }`}
    >
      <span>{shown}</span>
    </div>
  );
}
