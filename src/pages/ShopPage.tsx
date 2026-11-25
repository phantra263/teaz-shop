import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { site } from "../data/site";
import { copyText } from "../lib/clipboard";
import { useShopMotion } from "../hooks/useShopMotion";
import { useToast } from "../hooks/useToast";
import { AboutSection } from "../components/AboutSection";
import { ContactModal } from "../components/ContactModal";
import { FallingLeaves } from "../components/FallingLeaves";
import { FeaturedTool } from "../components/FeaturedTool";
import { InAppBanner } from "../components/InAppBanner";
import { LinkCards } from "../components/LinkCards";
import { ProductList } from "../components/ProductList";
import { ProfileHeader } from "../components/ProfileHeader";
import { SiteFooter } from "../components/SiteFooter";
import { Toast } from "../components/Toast";
import { Toolbar } from "../components/Toolbar";
import { ToolBanner } from "../components/ToolBanner";
import "./shop.css";

export function ShopPage() {
  const { message, showToast } = useToast();
  const [contactOpen, setContactOpen] = useState(false);
  const [leavesOn, setLeavesOn] = useState(false);
  const { motionEnabled, toggleMotion } = useShopMotion();

  useEffect(() => {
    document.title = site.brandName;
  }, []);

  const closeContact = useCallback(() => setContactOpen(false), []);
  const copyPageLink = useCallback(async () => {
    try {
      await copyText(window.location.href);
      showToast("Đã sao chép link TeaZ Review.");
    } catch {
      showToast("Không thể sao chép. Bạn có thể lấy link trên thanh địa chỉ.");
    }
  }, [showToast]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: site.brandName, text: site.shareText, url: window.location.href });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    await copyPageLink();
  }, [copyPageLink]);

  return (
    <div className="hub" id="dau-trang" data-motion-enabled={motionEnabled}>
      <a href="#noi-dung" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-3">
        Đi tới nội dung
      </a>
      <FallingLeaves enabled={motionEnabled && leavesOn} />
      <InAppBanner />
      <div className="hub-container">
        <Toolbar onShare={() => void handleShare()} motionEnabled={motionEnabled} onToggleMotion={toggleMotion} />
        <main id="noi-dung">
          <ProfileHeader />
          <ToolBanner />
          <LinkCards />
          <ProductList />
          <FeaturedTool />
          <section className="hub-section hub-booking" id="hop-tac" aria-labelledby="booking-title">
            <div>
              <h2 className="hub-heading" id="booking-title">Hợp tác cùng TeaZ</h2>
              <p className="hub-description">
                Gửi brief, thông tin sản phẩm và kênh bạn muốn triển khai để trao đổi về video review hoặc chiến dịch affiliate.
              </p>
            </div>
            <div className="hub-actions">
              <button className="hub-button hub-button-primary" type="button" onClick={() => setContactOpen(true)}>
                <Mail size={18} aria-hidden="true" /> Liên hệ booking
              </button>
              <Link className="hub-button hub-button-secondary" to="/profile">Portfolio Trà Phan</Link>
            </div>
          </section>
          <AboutSection />
        </main>
        <SiteFooter onCopyLink={() => void copyPageLink()} leavesOn={leavesOn} onToggleLeaves={() => setLeavesOn((value) => !value)} />
      </div>
      <Toast message={message} />
      {contactOpen && <ContactModal onClose={closeContact} />}
    </div>
  );
}
