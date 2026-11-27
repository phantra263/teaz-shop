import { site } from "../data/site";
import { FacebookIcon, ShopeeIcon, TikTokIcon, YouTubeIcon } from "./icons";

const channels = [
  {
    name: "TikTok",
    detail: "Review nhanh và TikTok Shop",
    href: site.tiktokProfileUrl,
    icon: TikTokIcon,
    style: "tiktok",
    rel: "me noopener noreferrer",
  },
  {
    name: "YouTube",
    detail: "Video trên kênh @traz6298",
    href: site.youtubeChannelUrl,
    icon: YouTubeIcon,
    style: "youtube",
    rel: "me noopener noreferrer",
  },
  {
    name: "Shopee",
    detail: "Bộ sưu tập sản phẩm TeaZ",
    href: site.shopeeCollectionUrl,
    icon: ShopeeIcon,
    style: "shopee",
    rel: "sponsored noopener noreferrer",
  },
  {
    name: "Facebook",
    detail: "Công nghệ và tin từ TeaZ Code",
    href: site.facebookPageUrl,
    icon: FacebookIcon,
    style: "facebook",
    rel: "me noopener noreferrer",
  },
];

export function LinkCards() {
  return (
    <section className="hub-section" id="kenh-noi-dung" aria-labelledby="channels-title">
      <h2 className="hub-heading" id="channels-title">Theo dõi <span className="hub-title-accent">Tea<span className="teaz-letter-z">Z</span></span></h2>
      <div className="hub-channel-grid">
        {channels.map(({ name, detail, href, icon: Icon, style, rel }) => (
          <a className="hub-channel" key={name} href={href} target="_blank" rel={rel}>
            <span className={`hub-channel-icon hub-channel-${style}`}>
              <Icon className="size-6" />
            </span>
            <span>
              <strong>{name}</strong>
              <small>{detail}</small>
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
