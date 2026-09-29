# Chụp Đại Mix Đại cùng Lay's

Web game UGC: nhận thử thách chụp ngẫu nhiên, AI (Claude vision) soi ảnh, bắc cầu sang 1 nguyên liệu và ra công thức mix với Lay's.

## Chạy local
```
npm install
cp .env.example .env.local   # điền ANTHROPIC_API_KEY
npm run dev
```

## Deploy Vercel
1. Đẩy thư mục này lên GitHub, Import project trên Vercel (tự nhận Next.js).
2. Settings > Environment Variables: thêm `ANTHROPIC_API_KEY` (tuỳ chọn `ANTHROPIC_MODEL`).
3. Deploy.

## Chỉnh nội dung
- `lib/config.ts`: danh sách thử thách, vị Lay's được phép dùng.
- `app/api/mix/route.ts`: prompt, luật an toàn, độ dài từng trường.
- `app/globals.css`: màu, font.

## Lưu ý trước khi public
- Chưa có rate limit. Nên thêm (vd Upstash Ratelimit theo IP) để tránh bị spam đốt API.
- Ảnh không lưu trên server, chỉ gửi qua Claude để phân tích.
