import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const darkQuery = "(prefers-color-scheme: dark)";

export function ThemeToggle() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme);
  const [systemDark, setSystemDark] = useState(() => window.matchMedia(darkQuery).matches);
  const isDark = theme ? theme === "dark" : systemDark;

  useEffect(() => {
    const query = window.matchMedia(darkQuery);
    const update = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  function toggleTheme() {
    const next = isDark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    setTheme(next);
    try {
      localStorage.setItem("teaz-theme", next);
    } catch {
      // The selection remains active for this visit.
    }
  }

  return (
    <button className="hub-icon-button" type="button" onClick={toggleTheme} aria-label="Giao diện tối" aria-pressed={isDark} title={isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}>
      {isDark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
    </button>
  );
}
