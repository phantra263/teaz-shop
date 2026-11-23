export const islandStops = [
  { id: "pier", name: "Bến Trà", x: 0, z: 7.1, height: 1.65, description: "Điểm xuất phát của Đảo Trà. Từ đây bạn có thể đi tới các công trình trên đảo.", href: null, action: null },
  { id: "market", name: "Chợ Trà", x: -5.3, z: 2.7, height: 2.9, description: "Ghé các gian hàng để xem sản phẩm TeaZ review và tìm bộ sưu tập Shopee.", href: "/#san-pham", action: "Xem sản phẩm" },
  { id: "lab", name: "Xưởng Tool", x: -6.3, z: -3.2, height: 3.4, description: "Tìm hiểu tiện ích TeaZ để xem lịch sử giá và đối chiếu các đợt sale trên Shopee.", href: "/tools", action: "Khám phá tiện ích" },
  { id: "studio", name: "Trạm Video", x: 6, z: 2.4, height: 3.8, description: "Mở các kênh TikTok, YouTube và Facebook của TeaZ.", href: "/#kenh-noi-dung", action: "Xem các kênh" },
  { id: "house", name: "Nhà TeaZ", x: 2.8, z: -4.6, height: 3.75, description: "Xem các dự án và portfolio lập trình của Trà Phan.", href: "/profile", action: "Xem portfolio" },
] as const;

export type IslandStop = (typeof islandStops)[number];
export type IslandStopId = IslandStop["id"];
