import { aboutParagraphs, products, site } from "./site";
import { shopeePriceFeatures, shopeePriceTool } from "./tools";
import { islandStops, type IslandStopId } from "./island";

type PlaceLink = { label: string; href: string; sponsored?: boolean };
type PlaceEntry = { title: string; description: string; cover?: string; notesUrl?: string; link?: PlaceLink };
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
    heading: "Kệ trưng bày công cụ",
    intro: "Ghé bàn demo để xem các công cụ do TeaZ phát triển.",
    preview: [shopeePriceTool.name, ...shopeePriceFeatures.map(({ title }) => title)],
    entries: [{
      title: shopeePriceTool.name,
      description: shopeePriceTool.description,
      cover: shopeePriceTool.cover,
      link: { label: "Khám phá tiện ích", href: shopeePriceTool.path },
    }],
    links: [
      { label: "Mở Chrome Web Store", href: shopeePriceTool.storeUrl },
      { label: "Xem video hướng dẫn", href: shopeePriceTool.guideUrl },
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
    heading: "Ghé quầy, xem review",
    intro: "Chọn món bạn vừa thấy ở Chợ Trà để xem video của TeaZ hoặc đọc ghi chú trước khi mua.",
    preview: products.map(({ name }) => name),
    entries: products.map(({ name, description, reviewUrl, cover, slug }) => ({
      title: name,
      description,
      cover,
      notesUrl: `/review/${slug}.html`,
      link: { label: "Xem video review", href: reviewUrl },
    })),
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
