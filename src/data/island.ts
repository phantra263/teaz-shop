import { islandLayoutScale } from "../lib/islandTerrain";

const stops = [
  { id: "pier", name: "Bến Trà", x: 0, z: 11.1, height: 1.65, description: "Điểm xuất phát của Đảo Trà. Từ đây bạn có thể đi tới các công trình trên đảo.", href: null, action: null },
  { id: "market", name: "Chợ Trà", x: -5.3, z: 2.7, height: 2.9, description: "Ghé các gian hàng để xem sản phẩm TeaZ review và tìm bộ sưu tập Shopee.", href: "/#san-pham", action: "Xem sản phẩm" },
  { id: "lab", name: "Xưởng Tool", x: -6.3, z: -3.2, height: 3.4, description: "Tìm hiểu tiện ích TeaZ để xem lịch sử giá và đối chiếu các đợt sale trên Shopee.", href: "/tools", action: "Khám phá tiện ích" },
  { id: "studio", name: "Trạm Video", x: 6, z: 2.4, height: 3.8, description: "Mở các kênh TikTok, YouTube và Facebook của TeaZ.", href: "/#kenh-noi-dung", action: "Xem các kênh" },
  { id: "house", name: "Nhà TeaZ", x: 2.8, z: -4.6, height: 3.75, description: "Xem các dự án và portfolio lập trình của Trà Phan.", href: "/profile", action: "Xem portfolio" },
  { id: "grove", name: "Rừng Gió", x: -13.4, z: -4.1, height: 2.25, description: "Đi dọc bìa rừng để gặp thỏ, gọi chim hoặc đưa tay đón bướm.", href: null, action: null },
  { id: "pond", name: "Đầm Sen", x: 12.4, z: -3.65, height: 1.85, description: "Dừng bên bờ để gọi vịt bơi tới hoặc đón bướm giữa những bụi hoa.", href: null, action: null },
] as const;

export const islandStops = stops.map((stop) => ({ ...stop, x: stop.x * islandLayoutScale, z: stop.z * islandLayoutScale }));

export type IslandStop = (typeof islandStops)[number];
export type IslandStopId = IslandStop["id"];
