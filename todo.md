# LinhFarm interaction completion

- [x] Thêm state sản phẩm có thể thêm, sửa, xóa và lọc theo danh mục.
- [x] Tạo modal form sản phẩm với validate và URL ảnh.
- [x] Thêm menu thao tác từng dòng kho hàng.
- [x] Tạo modal phiếu nhập hàng với nhà cung cấp, sản phẩm, số lượng và đơn giá.
- [x] Cập nhật tồn kho và chi phí nhập sau khi lưu phiếu.
- [x] Tạo modal thông tin cửa hàng, thông tin hóa đơn và VietQR.
- [x] Lưu state cài đặt và dùng lại dữ liệu trong hóa đơn/QR.
- [x] Chạy typecheck, build và kiểm thử responsive các luồng chính.

## Header interaction update

- [x] Ẩn Hamburger trên mobile và cân bằng lại padding Header.
- [x] Thêm state mở/đóng Popover thông báo và danh sách cảnh báo cửa hàng.
- [x] Thêm state mở/đóng menu Avatar, vai trò và đăng xuất.
- [x] Đồng bộ tiêu đề Header theo POS, Kho, Nhập, Báo cáo, Cài đặt.
- [x] Chạy typecheck, build và screenshot responsive.

## Supabase integration

- [x] Nâng cấp dự án lên full-stack và cài @supabase/supabase-js.
- [x] Cấu hình NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY, kèm test endpoint.
- [x] Tạo schema.sql với products, orders, order_items, purchase_orders, purchase_order_items, store_settings và dữ liệu mẫu.
- [x] Tạo client Supabase tại client/src/lib/supabase.ts.
- [x] Nối CRUD sản phẩm, tạo đơn POS và trừ tồn kho qua Supabase RPC.
- [x] Nối Dashboard với truy vấn orders thực tế và chạy test/build.
- [x] Sửa và kiểm chứng cấu trúc schema.sql, sẵn sàng dán/chạy trong Supabase SQL Editor; đã xác nhận unique conflict target, bảng, RLS, RPC và seed data.

## Product image upload

- [x] Thay URL ảnh bằng file picker/drag-drop và preview URL.createObjectURL.
- [x] Upload ảnh khi lưu vào bucket linhfarm-images và lưu public URL vào products.image_url.
- [x] Xóa ảnh cũ khi cập nhật ảnh mới và khi xóa sản phẩm.
- [x] Bổ sung bucket và policy Public Read vào schema.sql.
- [x] Viết test upload path, upload-on-save helper, cleanup mock; chạy build và screenshot responsive.

## Product context menu positioning

- [x] Tự động mở menu 3 chấm lên trên khi gần đáy viewport.
- [x] Thêm padding-bottom khoảng 100px cho danh sách Kho hàng trên mobile.
- [x] Tăng z-index và kiểm soát overflow để menu không bị che bởi Bottom Navigation.
- [x] Kiểm thử helper hướng menu, UI contract item cuối, typecheck/build và screenshot responsive.

## Source package export

- [x] Tạo `.env.example` với cấu hình Supabase và storage bucket.
- [x] Viết README.md hướng dẫn cài đặt, chạy dev, import schema và deploy Vercel.
- [x] Kiểm tra schema.sql và cấu trúc source trước khi nén.
- [x] Tạo ZIP sạch, loại bỏ node_modules, dist, logs và file secrets.
- [x] Kiểm tra nội dung ZIP và gửi file tải xuống.

## GitHub export

- [ ] Kiểm tra trạng thái Git và loại trừ secrets khỏi commit.
- [ ] Xác thực repository đích và cấu hình remote tạm thời.
- [ ] Commit source code và push lên branch chính.
- [ ] Xác minh commit/remote sau khi push và thu hồi thông tin xác thực tạm thời.
