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
  icon: string;
  shopeeUrl?: string;
  reviewUrl?: string;
}

export const SITE_URL = (
  import.meta.env.VITE_SITE_URL || "https://teaz-shop.store"
).replace(/\/$/, "");

export const site = {
  brandName: "TeaZ Review | Review sản phẩm, Shopee & TikTok Shop",
  handle: "@teaz_shop",
  shopeeCollectionUrl: "https://collshp.com/phancongtra",
  tiktokProfileUrl: "https://www.tiktok.com/@teaz_shop",
  youtubeChannelUrl: "https://www.youtube.com/@traz6298",
  facebookPageUrl: "https://www.facebook.com/teaz.code",
  bookingEmail: "phantra2212@gmail.com",
  shareText: "Review sản phẩm, bộ sưu tập Shopee và các kênh của TeaZ Review.",
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
    icon: "✨",
  },
  {
    id: 2,
    name: "Bộ Nồi Chảo Redchef Cán Tháo Rời",
    category: "home",
    categoryLabel: "Gia dụng",
    description:
      "Chống dính gốm an toàn, tháo cán xếp gọn tiết kiệm 70% diện tích bếp.",
    icon: "🍳",
  },
  {
    id: 3,
    name: "Áo Thun Nam Cổ Trụ / Polo Tối Giản",
    category: "fashion",
    categoryLabel: "Thời trang",
    description:
      "Chất vải thoáng mát, co giãn nhẹ, form đứng dáng dễ phối đi làm & đi chơi.",
    icon: "👕",
  },
  {
    id: 4,
    name: "Phụ Kiện Setup Bàn Làm Việc & Cáp Sạc Nhanh",
    category: "tech",
    categoryLabel: "Công nghệ",
    description:
      "Cáp truyền dữ liệu tốc độ cao & phụ kiện gọn góc làm việc đa thiết bị.",
    icon: "⚡",
  },
];

export const aboutParagraphs = [
  "Mình là Trà Phan, người làm nội dung tại TeaZ Review. Mình chia sẻ góc nhìn về đồ làm đẹp, gia dụng, thời trang và công nghệ để bạn cân nhắc món nào hợp với nhu cầu của mình.",
  "Bạn có thể xem nội dung trên TikTok và YouTube, tìm sản phẩm trong bộ sưu tập Shopee hoặc theo dõi những chia sẻ về công nghệ trên Facebook TeaZ Code.",
];

export const faqs = [
  {
    question: "Làm sao tìm sản phẩm trong video của TeaZ?",
    answer:
      "Nhập tên sản phẩm vào ô tìm kiếm hoặc lọc theo danh mục. Nút Bộ sưu tập Shopee mở danh sách chung để bạn tìm món cần mua.",
  },
  {
    question: "Vì sao bấm Shopee trong TikTok đôi khi không mở app?",
    answer:
      "Nếu trình duyệt trong TikTok hoặc Facebook không mở được liên kết, chọn Mở bằng trình duyệt trong menu rồi thử lại bằng Safari hoặc Chrome.",
  },
  {
    question: "Nhãn hàng muốn gửi sản phẩm review thì liên hệ thế nào?",
    answer:
      `Gửi brief, thông tin sản phẩm và kênh mong muốn qua ${site.bookingEmail} hoặc nhắn Facebook TeaZ Code.`,
  },
] as const;
