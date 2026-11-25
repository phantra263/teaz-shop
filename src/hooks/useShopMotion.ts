import { useEffect, useState } from "react";

const storageKey = "teaz-shop-motion-preference";
const reduceQuery = "(prefers-reduced-motion: reduce)";

export function useShopMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia(reduceQuery).matches);
  const [preference] = useState<boolean | null>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved === "on") return true;
      if (saved === "off") return false;
    } catch {
      // Follow the device setting when storage is unavailable.
    }
    return null;
  });

  useEffect(() => {
    const query = window.matchMedia(reduceQuery);
    const update = () => setReduced(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return preference ?? !reduced;
}
