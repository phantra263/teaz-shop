import { useEffect, useState } from "react";
import { BriefcaseBusiness, Handshake, Layers, Radio, Wrench } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { servicesPage } from "../data/services";
import { shopeePriceTool } from "../data/tools";

function FloatingIslandIcon() {
  return <i className="hub-floating-island" aria-hidden="true" />;
}

const items = [
  { label: "Các kênh", to: "/#kenh-noi-dung", icon: Radio },
  { label: "Công cụ", to: "/#cong-cu", page: shopeePriceTool.path, icon: Wrench },
  { label: "Đảo Trà", to: "/dao-tra", page: "/dao-tra", icon: FloatingIslandIcon },
  { label: "Dịch vụ", to: servicesPage.path, page: servicesPage.path, icon: Layers },
  { label: "Hợp tác", to: "/#hop-tac", icon: Handshake },
  { label: "Portfolio", to: "/profile", page: "/profile", icon: BriefcaseBusiness },
];

export function MainNav({ mobileOnly = false }: { mobileOnly?: boolean }) {
  const { pathname, hash } = useLocation();
  const isHome = pathname === "/";
  const [visibleSection, setVisibleSection] = useState(hash);

  useEffect(() => {
    if (!isHome || mobileOnly) return;
    const sections = items.flatMap(({ to }) => {
      const element = to.startsWith("/#") && document.getElementById(to.slice(2));
      return element ? [element] : [];
    });
    let frame = 0;
    function update() {
      frame = 0;
      const line = window.matchMedia("(width > 760px)").matches ? 100 : 48;
      const section = sections.find(element => {
        const { top, bottom } = element.getBoundingClientRect();
        return top <= line && bottom >= line;
      });
      setVisibleSection(section ? `#${section.id}` : "");
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [isHome, mobileOnly, hash]);
  if (mobileOnly && isHome) return null;

  return (
    <nav aria-label="Điều hướng chính" className={mobileOnly ? "hub-nav hub-nav-secondary" : "hub-nav"}>
      {items.map(({ label, to, page, icon: Icon }) => {
        const currentPage = page && (pathname === page || pathname.startsWith(`${page}/`));
        const currentSection = isHome && to === `/${visibleSection}`;
        return (
          <Link
            key={to}
            className={to === "/dao-tra" ? "hub-nav-island" : undefined}
            to={to}
            aria-current={currentPage ? "page" : currentSection ? "location" : undefined}
          >
            <Icon size={20} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
