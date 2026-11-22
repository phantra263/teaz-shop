/**
 * Nội dung trang bio TeaZ.
 * Sửa tên kênh, link, sản phẩm và FAQ tại đây.
 *
 * Canonical và Open Graph lấy domain từ VITE_SITE_URL trong file .env.
 * Khi đổi mô tả ngắn hoặc FAQ, cập nhật cùng nội dung trong index.html
 * để Zalo, Facebook và máy tìm kiếm đọc được trước khi chạy JavaScript.
 */

export interface Product {
  id: number;
  name: string;
  category: "beauty" | "home" | "fashion" | "tech";
  categoryLabel: string;
  description: string;
  badge: string;
  icon: string;
  shopeeUrl: string;
  tiktokUrl: string;
}

export const SITE_URL = (
  import.meta.env.VITE_SITE_URL || "https://teaz-shop.store"
).replace(/\/$/, "");

export const site = {
  brandName: "TeaZ Review | Săn Deal Chuẩn",
  handle: "@teaz_shop",
  followersLabel: "1.2K+ Followers",
  bioLead: "Review có tâm – Chọn đồ chất lượng",
  bioRest: "Tổng hợp Deal hời TikTok Shop & Shopee mỗi ngày",
  description:
    "Review có tâm – Chọn đồ chất lượng. TeaZ Review (@teaz_shop) tổng hợp deal hời TikTok Shop và Shopee: làm đẹp, gia dụng, thời trang và công nghệ.",
  shopeeCollectionUrl: "https://collshp.com/phancongtra",
  tiktokProfileUrl: "https://www.tiktok.com/@teaz_shop",
  facebookPageUrl: "https://www.facebook.com/teaz.code",
  bookingEmail: "booking@vinhanadv.online",
  shareText: "Tổng hợp deal hời TikTok Shop & Shopee từ TeaZ Review",
} as const;

export const categories = [
  { id: "all", label: "Tất cả" },
  { id: "beauty", label: "✨ Làm đẹp" },
  { id: "home", label: "🍳 Gia dụng" },
  { id: "fashion", label: "👕 Thời trang" },
  { id: "tech", label: "⚡ Công nghệ" },
] as const;

export type CategoryId = (typeof categories)[number]["id"];

export const products: Product[] = [
  {
    id: 1,
    name: "Xịt Khoáng Serum d'Alba White Truffle",
    category: "beauty",
    categoryLabel: "Làm đẹp",
    description:
      "Cấp ẩm căng bóng 2 lớp tinh chất nấm Truffle trắng, tia sương siêu mịn.",
    badge: "Bán chạy #1",
    icon: "✨",
    shopeeUrl: site.shopeeCollectionUrl,
    tiktokUrl: site.tiktokProfileUrl,
  },
  {
    id: 2,
    name: "Bộ Nồi Chảo Redchef Cán Tháo Rời",
    category: "home",
    categoryLabel: "Gia dụng",
    description:
      "Chống dính gốm an toàn, tháo cán xếp gọn tiết kiệm 70% diện tích bếp.",
    badge: "Deal Hời",
    icon: "🍳",
    shopeeUrl: site.shopeeCollectionUrl,
    tiktokUrl: site.tiktokProfileUrl,
  },
  {
    id: 3,
    name: "Áo Thun Nam Cổ Trụ / Polo Tối Giản",
    category: "fashion",
    categoryLabel: "Thời trang",
    description:
      "Chất vải thoáng mát, co giãn nhẹ, form đứng dáng dễ phối đi làm & đi chơi.",
    badge: "Gợi ý",
    icon: "👕",
    shopeeUrl: site.shopeeCollectionUrl,
    tiktokUrl: site.tiktokProfileUrl,
  },
  {
    id: 4,
    name: "Phụ Kiện Setup Bàn Làm Việc & Cáp Sạc Nhanh",
    category: "tech",
    categoryLabel: "Công nghệ",
    description:
      "Cáp truyền dữ liệu tốc độ cao & phụ kiện gọn góc làm việc đa thiết bị.",
    badge: "Mới",
    icon: "⚡",
    shopeeUrl: site.shopeeCollectionUrl,
    tiktokUrl: site.tiktokProfileUrl,
  },
];

export const aboutParagraphs = [
  "TeaZ Review (@teaz_shop) gom link các sản phẩm đã review trên TikTok Shop và Shopee. Mỗi món được chọn sau khi dùng thực tế: nói rõ điểm hợp, điểm chưa hợp, rồi gắn link bộ sưu tập để tự đối chiếu giá.",
  "Trang này dành cho người xem video của TeaZ và cần một chỗ để mở giỏ Shopee, giỏ TikTok Shop, hoặc nhắn booking review cho nhãn hàng.",
];

export const faqs = [
  {
    question: "Deal trên trang này lấy từ đâu?",
    answer:
      "Từ video review trên TikTok @teaz_shop và bộ sưu tập Shopee của TeaZ. Link dẫn tới gian hàng hoặc bộ sưu tập, không phải trang trung gian giữ link.",
  },
  {
    question: "Vì sao bấm Shopee trong TikTok đôi khi không mở app?",
    answer:
      "Trình duyệt nhúng của TikTok và Facebook thường chặn chuyển sang app Shopee. Hãy mở trang này bằng Safari hoặc Chrome (menu ••• rồi chọn Mở bằng trình duyệt) rồi bấm lại link.",
  },
  {
    question: "Nhãn hàng muốn gửi sản phẩm review thì liên hệ thế nào?",
    answer:
      "Gửi brief và thông tin mẫu qua email booking@vinhanadv.online hoặc nhắn Fanpage TeaZ Code. TeaZ ưu tiên sản phẩm có thể review thẳng trên TikTok Shop.",
  },
] as const;
