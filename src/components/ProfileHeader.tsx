import { useState } from "react";
import { ArrowLeft, ArrowRight, Play, ShoppingBag, TreePalm } from "lucide-react";
import { Link } from "react-router-dom";
import { site } from "../data/site";

export function ProfileHeader() {
  const [showIsland, setShowIsland] = useState(true);

  return (
    <section className="hub-hero" aria-label="Giới thiệu TeaZ">
      <div className="hub-hero-slide hub-hero-editorial" inert={showIsland}>
        <div className="hub-hero-copy">
          <p className="hub-eyebrow">{site.handle}</p>
          <h2>Chọn món <em>hợp mình.</em></h2>
          <p className="hub-hero-description">
            Xem trải nghiệm thực tế của Trà Phan về đồ làm đẹp, gia dụng, thời trang và công nghệ.
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
            alt=""
          />
        </div>
      </div>
      <div className="hub-hero-slide hub-hero-island" inert={!showIsland}>
        <div className="hub-hero-copy">
          <h1>Khám phá <span className="hub-title-accent">Đảo Trà</span></h1>
          <p className="hub-hero-description">
            Dạo từ Bến Trà qua rừng, đầm sen và những con đường ven biển trong thế giới 3D của TeaZ.
          </p>
          <div className="hub-actions">
            <Link className="hub-button hub-button-light" to="/dao-tra">
              <TreePalm size={19} aria-hidden="true" /> Vào Đảo Trà
            </Link>
          </div>
        </div>
        <div className="hub-hero-visual">
          {showIsland && (
            <video
              className="hub-hero-video"
              src="/dao-tra-trailer.mp4"
              poster="/dao-tra-trailer.webp"
              width={1280}
              height={720}
              autoPlay
              playsInline
              muted
              onEnded={() => setShowIsland(false)}
              onError={() => setShowIsland(false)}
              aria-hidden="true"
              tabIndex={-1}
            />
          )}
        </div>
      </div>
      <div className="hub-hero-switch" role="group" aria-label="Chuyển slide">
        <button type="button" aria-label="Slide trước: Đảo Trà" aria-disabled={showIsland} onClick={() => setShowIsland(true)}>
          <ArrowLeft size={21} aria-hidden="true" />
        </button>
        <button type="button" aria-label="Slide sau: TeaZ" aria-disabled={!showIsland} onClick={() => setShowIsland(false)}>
          <ArrowRight size={21} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
