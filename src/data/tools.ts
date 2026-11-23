export const shopeePriceTool = {
  name: "Shopee Price History & Fake Sale Detector",
  description: "Xem biến động giá trên Shopee, nhận cảnh báo khi có dấu hiệu tăng giá trước đợt sale và theo dõi mức giá bạn muốn mua.",
  path: "/tools",
  storeUrl: "https://chromewebstore.google.com/detail/shopee-price-history-fake/ngnoeeglkhplafkpapdjakonomobijnk",
  guideUrl: "https://www.facebook.com/share/v/1MmmsarGfT/",
} as const;

export const shopeePriceFeatures = [
  {
    title: "Lịch sử giá 30–90 ngày",
    description: "Xem biểu đồ ngay dưới giá trên trang sản phẩm Shopee.vn, kèm giá cao nhất, thấp nhất và trung bình.",
  },
  {
    title: "Cảnh báo tăng giá trước sale",
    description: "Đối chiếu mức giá đang hiển thị với lịch sử giá khi tiện ích phát hiện dấu hiệu tăng giá trước khuyến mãi.",
  },
  {
    title: "Theo dõi giá mục tiêu",
    description: "Thêm sản phẩm vào danh sách theo dõi để nhận thông báo khi giá giảm về mức bạn mong muốn.",
  },
] as const;
