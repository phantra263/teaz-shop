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
  category: Exclude<CategoryId, "all">;
  categoryLabel: string;
  description: string;
  cover: string;
  shopeeUrl?: string;
  reviewUrl: string;
}

export const SITE_URL = (
  import.meta.env.VITE_SITE_URL || "https://teaz-shop.store"
).replace(/\/$/, "");

export const site = {
  brandName: "TeaZ",
  pageTitle: "TeaZ | Review sản phẩm, Shopee & TikTok Shop",
  handle: "@teaz_shop",
  shopeeCollectionUrl: "https://collshp.com/phancongtra",
  tiktokProfileUrl: "https://www.tiktok.com/@teaz_shop",
  youtubeChannelUrl: "https://www.youtube.com/@traz6298",
  facebookPageUrl: "https://www.facebook.com/teaz.code",
  bookingEmail: "phantra2212@gmail.com",
  shareText: "Review sản phẩm, bộ sưu tập Shopee và các kênh của TeaZ.",
} as const;

export const categories = [
  { id: "all", label: "Tất cả" },
  { id: "personal-care", label: "Chăm sóc cá nhân" },
  { id: "beauty", label: "Làm đẹp" },
  { id: "home", label: "Gia dụng" },
] as const;

export type CategoryId = (typeof categories)[number]["id"];

export const products: Product[] = [
  {
    id: 3,
    name: "Dầu nóng Hàn Quốc Antiphlamine có đầu lăn",
    category: "personal-care",
    categoryLabel: "Chăm sóc cá nhân",
    description: "Video giới thiệu thiết kế chai và thanh lăn răng cưa gắn bên hông.",
    cover: "/reviews/antiphlamine.avif",
    reviewUrl: "https://www.tiktok.com/@teaz_shop/video/7712452283572899090",
  },
  {
    id: 1,
    name: "Xịt khoáng d’Alba White Truffle First Spray Serum",
    category: "beauty",
    categoryLabel: "Làm đẹp",
    description: "Video giới thiệu tia xịt mịn và độ bóng nhẹ sau khi dùng.",
    cover: "/reviews/dalba.avif",
    reviewUrl: "https://www.tiktok.com/@teaz_shop/video/7710108122848808200",
  },
  {
    id: 2,
    name: "Bộ nồi chảo Redchef cán tháo rời",
    category: "home",
    categoryLabel: "Gia dụng",
    description: "Bộ màu kem có cán tháo rời để xếp gọn. Video có đoạn áp chảo thử.",
    cover: "/reviews/redchef.avif",
    reviewUrl: "https://www.tiktok.com/@teaz_shop/video/7710962187103177991",
  },
];

export const aboutParagraphs = [
  "Mình là Trà Phan, người làm nội dung tại TeaZ. Mình chia sẻ góc nhìn về đồ làm đẹp, gia dụng, thời trang và công nghệ để bạn cân nhắc món nào hợp với nhu cầu của mình.",
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
