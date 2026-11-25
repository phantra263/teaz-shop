import { aboutParagraphs, products, site } from "./site";
import { shopeePriceFeatures, shopeePriceTool } from "./tools";
import { islandStops, type IslandStopId } from "./island";

type PlaceLink = { label: string; href: string; sponsored?: boolean };
type PlaceEntry = { title: string; description: string; link?: PlaceLink };
type ContentStop = Extract<IslandStopId, "market" | "lab" | "studio" | "house">;

export type IslandPlace = {
  id: ContentStop;
  slug: string;
  heading: string;
  intro: string;
  preview: readonly string[];
  entries: readonly PlaceEntry[];
  links: readonly PlaceLink[];
};

export const islandPlaces: readonly IslandPlace[] = [
  {
    id: "lab",
    slug: "xuong-tool",
    heading: shopeePriceTool.name,
    intro: shopeePriceTool.description,
    preview: shopeePriceFeatures.map(({ title }) => title),
    entries: shopeePriceFeatures,
    links: [
      { label: "Mở Chrome Web Store", href: shopeePriceTool.storeUrl },
      { label: "Xem video hướng dẫn", href: shopeePriceTool.guideUrl },
      { label: "Cách cài và sử dụng", href: shopeePriceTool.path },
    ],
  },
  {
    id: "studio",
    slug: "tram-video",
    heading: "Các kênh của TeaZ",
    intro: "Xem review sản phẩm và nội dung công nghệ trên các kênh của TeaZ.",
    preview: ["TikTok · Review nhanh", "YouTube · Video của TeaZ", "Facebook · TeaZ Code"],
    entries: [
      { title: "TikTok", description: "Review nhanh và nội dung TikTok Shop từ @teaz_shop.", link: { label: "Mở TikTok", href: site.tiktokProfileUrl } },
      { title: "YouTube", description: "Xem các video trên kênh @traz6298.", link: { label: "Mở YouTube", href: site.youtubeChannelUrl } },
      { title: "Facebook", description: "Theo dõi nội dung công nghệ từ TeaZ Code.", link: { label: "Mở Facebook", href: site.facebookPageUrl } },
    ],
    links: [{ label: "Xem video hướng dẫn tiện ích", href: shopeePriceTool.guideUrl }],
  },
  {
    id: "market",
    slug: "cho-tra",
    heading: "Sản phẩm TeaZ giới thiệu",
    intro: "Tìm các món làm đẹp, đồ gia dụng, thời trang và phụ kiện công nghệ đã được TeaZ giới thiệu.",
    preview: products.map(({ categoryLabel }) => categoryLabel),
    entries: products.map(({ name, description }) => ({ title: name, description })),
    links: [
      { label: "Mở bộ sưu tập Shopee", href: site.shopeeCollectionUrl, sponsored: true },
      { label: "Tìm và lọc sản phẩm", href: "/#san-pham" },
    ],
  },
  {
    id: "house",
    slug: "nha-teaz",
    heading: "Trà Phan và TeaZ",
    intro: aboutParagraphs[0],
    preview: ["Portfolio Trà Phan", "Kênh TeaZ Code"],
    entries: [
      { title: "Dự án lập trình", description: "Xem các dự án và thông tin nghề nghiệp trong portfolio của Trà Phan.", link: { label: "Mở portfolio", href: "/profile" } },
      { title: "Nội dung TeaZ", description: aboutParagraphs[1], link: { label: "Mở TeaZ Code", href: site.facebookPageUrl } },
    ],
    links: [],
  },
];

export function islandPlacePath(place: IslandPlace) {
  return `/dao-tra/dia-diem/${place.slug}`;
}

export function islandPlaceName(place: IslandPlace) {
  return islandStops.find(({ id }) => id === place.id)?.name ?? place.heading;
}
