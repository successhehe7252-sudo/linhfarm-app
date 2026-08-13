# LinhFarm

Web App quản lý cửa hàng trái cây và rau củ quả Đà Lạt, xây dựng với React, Vite, Tailwind CSS, Express/tRPC và Supabase.

## Tính năng

LinhFarm bao gồm POS bán hàng với giỏ hàng số lượng lẻ và hóa đơn nhiệt, quản lý sản phẩm/tồn kho, nhập hàng, báo cáo doanh thu, cài đặt cửa hàng, upload ảnh vào Supabase Storage và menu thao tác tối ưu cho mobile.

## Yêu cầu

Cần Node.js 20 trở lên, npm hoặc pnpm, và một project Supabase. Bucket Storage cần có tên `linhfarm-images`.

## Cài đặt local

```bash
npm install
cp .env.example .env
npm run dev
```

Mở địa chỉ dev server được in trong terminal. Nếu dùng pnpm, có thể thay `npm install` bằng `pnpm install` và `npm run dev` bằng `pnpm dev`.

## Cấu hình biến môi trường

Điền các giá trị thật vào `.env`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_STORAGE_BUCKET=linhfarm-images
```

Không commit `.env` hoặc bất kỳ service-role key nào vào Git. Client chỉ dùng anon key; mọi policy RLS cần được bật trong Supabase.

## Khởi tạo Supabase

1. Mở **Supabase Dashboard → SQL Editor**.
2. Tạo một query mới và dán toàn bộ nội dung file `schema.sql`.
3. Chạy query để tạo bảng, index, RLS, RPC, bucket `linhfarm-images`, policy Storage và dữ liệu mẫu.
4. Kiểm tra **Storage → Buckets** để xác nhận bucket đã tồn tại và đang Public Read.

Schema có RPC `create_order_with_items` để tạo đơn và trừ tồn kho trong một transaction logic của database. Khi cập nhật hoặc xóa sản phẩm có ảnh, ứng dụng sẽ gọi Supabase Storage để cleanup file tương ứng.

## Scripts

```bash
npm run dev       # chạy môi trường phát triển
npm run check     # kiểm tra TypeScript
npm test          # chạy Vitest
npm run build     # build frontend và server production
npm run start     # chạy build production
```

## Deploy lên Vercel

Vercel phù hợp để host phần frontend Vite đã build. Thiết lập các biến môi trường Supabase trong **Project Settings → Environment Variables**, sau đó cấu hình build command `npm run build`.

Vì bản source này có Express/tRPC server và Manus Auth, nếu cần chạy đầy đủ backend, hãy deploy bằng một môi trường Node có process server liên tục hoặc chuyển các procedure server sang Vercel Functions trước khi xuất bản. Nếu chỉ cần bản frontend, publish thư mục output frontend sau bước build theo cấu hình Vercel phù hợp với Vite.

```bash
npm install -g vercel
vercel login
vercel
vercel --prod
```

## Cấu trúc chính

```text
client/src/pages/Home.tsx       # shell POS, Kho, Nhập, Báo cáo, Cài đặt
client/src/lib/supabase.ts      # Supabase browser client và Storage helpers
server/                         # Express/tRPC backend và test
schema.sql                      # database, RLS, RPC, Storage policies, seed data
.env.example                    # mẫu biến môi trường
```

## Debug nhanh

Nếu ảnh không hiển thị, kiểm tra URL Supabase, bucket `linhfarm-images`, policy Public Read và giá trị `image_url`. Nếu đơn hàng không tạo được, kiểm tra RPC và RLS của các bảng `orders`, `order_items` và `products`. Chạy `npm run check` trước khi mở issue để loại trừ lỗi TypeScript.
