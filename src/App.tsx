import { useCallback, useEffect, useState } from "react";
import { site } from "./data/site";
import { copyText } from "./lib/clipboard";
import { useToast } from "./hooks/useToast";
import { AboutSection } from "./components/AboutSection";
import { ContactModal } from "./components/ContactModal";
import { FallingLeaves } from "./components/FallingLeaves";
import { InAppBanner } from "./components/InAppBanner";
import { LinkCards } from "./components/LinkCards";
import { ProductList } from "./components/ProductList";
import { ProfileHeader } from "./components/ProfileHeader";
import { SiteFooter } from "./components/SiteFooter";
import { Toast } from "./components/Toast";
import { Toolbar } from "./components/Toolbar";

export default function App() {
  const { message, showToast } = useToast();
  const [contactOpen, setContactOpen] = useState(false);
  const [leavesOn, setLeavesOn] = useState(true);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setLeavesOn(false);
    }
  }, []);

  const openContact = useCallback(() => setContactOpen(true), []);
  const closeContact = useCallback(() => setContactOpen(false), []);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: site.brandName,
          text: site.shareText,
          url,
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    await copyText(url);
    showToast("Đã sao chép đường dẫn trang Bio!");
  }, [showToast]);

  const handleCopyLink = useCallback(async () => {
    await copyText(window.location.href);
    showToast("Đã sao chép đường dẫn trang Bio!");
  }, [showToast]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-b from-tea-50 via-cream to-stone-100 text-slate-800 antialiased selection:bg-tea-200 selection:text-tea-900">
      <a
        href="#noi-dung"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-tea-800 focus:shadow"
      >
        Đi tới nội dung
      </a>
      <FallingLeaves enabled={leavesOn} />
      <InAppBanner />
      <main
        id="noi-dung"
        className="relative z-10 mx-auto max-w-[480px] px-4 pt-6 pb-20"
      >
        <Toolbar
          leavesOn={leavesOn}
          onToggleLeaves={() => setLeavesOn((value) => !value)}
          onShare={() => {
            void handleShare();
          }}
        />
        <ProfileHeader onContact={openContact} />
        <LinkCards onContact={openContact} />
        <ProductList />
        <AboutSection />
        <SiteFooter onCopyLink={() => void handleCopyLink()} />
      </main>
      <Toast message={message} />
      <ContactModal
        open={contactOpen}
        onClose={closeContact}
        onCopied={showToast}
      />
    </div>
  );
}
