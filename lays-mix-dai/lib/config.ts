// Toàn bộ nội dung chỉnh được nằm ở file này.

export type Challenge = { id: string; top: string; main: string; sub: string; hint: string };

// 3 thử thách lấy từ deck. Thêm/bớt tuỳ ý.
export const CHALLENGES: Challenge[] = [
  { id: "do-vat", top: "Chụp", main: "Đồ Vật", sub: "Gần Nhất", hint: "Món đồ nào ở gần bạn nhất lúc này?" },
  { id: "mau-ao", top: "Chụp", main: "Màu Áo", sub: "Đang Mặc", hint: "Chĩa camera vào áo bạn hoặc người bên cạnh." },
  { id: "khung-canh", top: "Chụp", main: "Khung Cảnh", sub: "Sau Lưng", hint: "Quay lại và chụp thứ đang ở sau lưng bạn." },
];

// Chỉ liệt kê vị đã được xác nhận. Vị trong deck: Khoai Tây Tự Nhiên.
// Bổ sung vị khác khi brand confirm, AI sẽ chỉ chọn trong list này.
export const FLAVORS = [
  { id: "original", name: "Lay's Vị Khoai Tây Tự Nhiên" },
];

export const MAX_IMAGE_SIDE = 1024; // px, resize trước khi gửi lên server
