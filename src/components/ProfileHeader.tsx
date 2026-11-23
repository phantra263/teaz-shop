import { Play, ShoppingBag } from "lucide-react";
import { site } from "../data/site";
import { HeroScene } from "./HeroScene";

export function ProfileHeader({ motionEnabled }: { motionEnabled: boolean }) {
  return (
    <section className="hub-hero" aria-labelledby="hero-title">
      <div className="hub-hero-copy">
        <p className="hub-eyebrow">TeaZ Review · {site.handle}</p>
        <h1 id="hero-title">Review có tâm.<br />Chọn đồ hợp mình.</h1>
        <p className="hub-hero-description">
          Khám phá đồ làm đẹp, gia dụng, thời trang và công nghệ cùng Trà Phan.
          Xem nội dung review và tìm bộ sưu tập Shopee của TeaZ.
        </p>
        <div className="hub-actions">
          <a className="hub-button hub-button-light" href="#san-pham">
            <ShoppingBag size={18} aria-hidden="true" /> Khám phá sản phẩm
          </a>
          <a className="hub-button hub-button-outline" href="#kenh-noi-dung">
            <Play size={17} aria-hidden="true" /> Xem các kênh
          </a>
        </div>
      </div>
      <div className="hub-hero-visual">
        <img
          className="hub-hero-image"
          src="/teaz-editorial-hero.jpg"
          width="1536"
          height="1024"
          fetchPriority="high"
          alt=""
        />
        {motionEnabled && <HeroScene />}
      </div>
    </section>
  );
}
