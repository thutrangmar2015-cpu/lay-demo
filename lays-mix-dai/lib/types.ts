export type MixResult = {
  seen: string;        // AI thấy gì trong ảnh
  bridge: string;      // cầu nối hài hước từ vật trong ảnh sang nguyên liệu
  ingredient: string;  // nguyên liệu ăn được
  ingredientEmoji: string;
  partner: string;     // món đi kèm để thành công thức
  partnerEmoji: string;
  mixName: string;     // tên công thức
  steps: string[];     // 2-3 bước
  verdict: string;     // câu chốt về độ giòn
  crunch: number;      // 7-10 độ chấn động
  flavor: string;
};
