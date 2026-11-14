# Kayden Store – Website bán phụ kiện điện tử (MERN)

Đồ án tốt nghiệp: website bán phụ kiện điện tử gồm trang cho khách hàng và trang quản trị (quản trị viên, nhân viên).

- **Frontend:** ReactJS (Vite), React Router, Axios, Recharts, SheetJS (xuất Excel)
- **Backend:** Node.js, ExpressJS, Mongoose, JWT, bcryptjs, Multer, Cloudinary, Nodemailer
- **Database:** MongoDB
- **Thanh toán:** COD (thanh toán khi nhận hàng), ví MoMo (chế độ mô phỏng hoặc cổng thật)

## 1. Cấu trúc thư mục

```
phukien-shop/
├── backend/
│   ├── src/
│   │   ├── config/db.js             # Kết nối MongoDB
│   │   ├── models/                  # User, Category, Brand, Product, Cart, Order, Review
│   │   ├── controllers/             # Xử lý nghiệp vụ (Controller trong MVC)
│   │   ├── routes/                  # Định nghĩa API
│   │   ├── middlewares/             # protect (JWT), phân quyền, giới hạn đăng nhập, xử lý lỗi
│   │   ├── services/orderService.js # Giữ/hoàn kho, hủy đơn, xác nhận thanh toán, hoàn tiền
│   │   ├── utils/                   # MoMo, gửi email, tìm kiếm không dấu, cập nhật dữ liệu cũ
│   │   ├── jobs/orderJobs.js        # Tự hủy đơn MoMo quá 30 phút chưa thanh toán
│   │   ├── data/                    # Dữ liệu mẫu (sản phẩm, đơn hàng, đánh giá)
│   │   ├── seed.js                  # Tạo dữ liệu mẫu
│   │   └── server.js
│   ├── scripts/smoke-test.js        # Kiểm thử tự động 71 tình huống
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── pages/                   # Các trang khách hàng
    │   ├── pages/admin/             # Các trang quản trị
    │   ├── components/              # Header, Footer, ProductCard, AdminLayout...
    │   ├── context/                 # AuthContext, CartContext
    │   ├── utils/                   # Định dạng tiền/ngày, "Đã xem gần đây"
    │   ├── api.js                   # Cấu hình Axios + JWT
    │   └── index.css
    └── vite.config.js
```

## 2. Chạy trên máy cá nhân

### Yêu cầu
- Node.js 18 trở lên (https://nodejs.org)
- MongoDB: cài MongoDB Community Server trên máy, hoặc tạo database miễn phí trên MongoDB Atlas

### Bước 1 – Backend
```bash
cd backend
npm install
cp .env.example .env        # Windows: copy .env.example .env
```
Mở file `.env`, sửa `MONGO_URI` và `JWT_SECRET`. Sau đó tạo dữ liệu mẫu và chạy server:
```bash
npm run seed     # XÓA dữ liệu cũ và tạo dữ liệu mẫu
npm run dev      # chạy tại http://localhost:5000
```

Ảnh sản phẩm mẫu là ảnh thật từ Unsplash (cần Internet, nguồn ảnh trong `IMAGE_CREDITS.md`). Không có mạng thì dùng `npm run seed -- --svg` để lấy ảnh minh họa vẽ sẵn. Đã có dữ liệu và chỉ muốn cập nhật ảnh (không xóa đơn hàng): `npm run seed:images`.

Tài khoản mẫu sau khi seed:

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Quản trị viên | admin@kaydenstore.vn | giá trị `SEED_ADMIN_PASSWORD` trong `.env` (mặc định `Admin@123`) |
| Nhân viên | nhanvien@kaydenstore.vn | Nhanvien@123 |
| Khách hàng | khachhang@kaydenstore.vn, binh@kaydenstore.vn, cuong@kaydenstore.vn | Khach@123 |

### Bước 2 – Frontend (mở terminal khác)
```bash
cd frontend
npm install
npm run dev      # mở http://localhost:5173
```
Khi chạy dev, Vite tự chuyển các request `/api` sang `http://localhost:5000`, không cần cấu hình thêm.

### Bước 3 – Kiểm thử tự động (không bắt buộc)
Khi backend đang chạy với dữ liệu mẫu:
```bash
cd backend
node scripts/smoke-test.js
```
Script chạy 71 tình huống (đăng ký, giỏ hàng, đặt hàng, MoMo, phân quyền, hoàn tiền, thống kê...) và in kết quả PASS/FAIL. Nên chạy trên database thử nghiệm vì script tạo thêm tài khoản và đơn hàng.

## 3. Cấu hình tùy chọn

| Chức năng | Biến môi trường | Ghi chú |
|---|---|---|
| Lưu ảnh lên Cloudinary | `CLOUDINARY_*` | Bỏ trống thì ảnh lưu vào `backend/uploads/` |
| Gửi email (xác nhận đơn, quên mật khẩu) | `SMTP_*` | Bỏ trống thì nội dung email in ra console của backend |
| MoMo | `MOMO_MODE`, `MOMO_*` | `MOMO_MODE=mock` (mặc định): cổng MoMo mô phỏng ngay trong website, không cần tài khoản. `MOMO_MODE=real`: điền khóa do MoMo cấp tại business.momo.vn |

**MoMo chế độ mô phỏng (`MOMO_MODE=mock`):** khi khách chọn Ví MoMo, website chuyển sang trang `/payment/momo-sandbox` có ghi rõ “Chế độ mô phỏng”. Khách bấm “Xác nhận thanh toán” hoặc “Hủy giao dịch”, backend tạo dữ liệu trả về đúng định dạng MoMo và ký HMAC SHA256 giống MoMo thật, sau đó đi qua cùng luồng kiểm tra chữ ký, cập nhật đơn như khi dùng cổng thật. Không có giao dịch tiền thật. Khi có khóa MoMo, chỉ cần đổi `MOMO_MODE=real` và điền 3 khóa, không phải sửa code. (Bộ khóa test công khai cũ `partnerCode=MOMO` hiện bị cổng test của MoMo trả về HTTP 403.)

**Lưu ý về IPN:** MoMo chỉ gọi được IPN tới địa chỉ công khai. Khi chạy trên máy, website vẫn xác nhận thanh toán qua trang kết quả (redirect URL), nên không cần IPN.

## 4. Phân quyền

| Chức năng | Khách hàng | Nhân viên | Quản trị viên |
|---|:-:|:-:|:-:|
| Mua hàng, giỏ hàng, đánh giá | ✓ | | |
| Quản lý sản phẩm, danh mục, thương hiệu, đánh giá | | ✓ | ✓ |
| Xử lý đơn hàng (xác nhận, giao, hủy) | | ✓ | ✓ |
| Xác nhận đã hoàn tiền cho đơn MoMo bị hủy | | | ✓ |
| Quản lý người dùng, phân quyền | | | ✓ |
| Thống kê doanh thu, xuất Excel | | | ✓ |

## 5. Danh sách API chính

| Phương thức | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| POST | /api/auth/register | Đăng ký | Công khai |
| POST | /api/auth/login | Đăng nhập, trả về JWT (tối đa 10 lần / 15 phút) | Công khai |
| POST | /api/auth/forgot-password | Gửi link đặt lại mật khẩu | Công khai |
| GET | /api/products | Danh sách sản phẩm (tìm không dấu, lọc, sắp xếp, phân trang) | Công khai |
| GET | /api/products/by-ids | Sản phẩm theo danh sách id (mục Đã xem gần đây) | Công khai |
| GET | /api/products/:slug | Chi tiết sản phẩm | Công khai |
| GET/POST/PUT/DELETE | /api/cart, /api/cart/items | Giỏ hàng | Khách hàng |
| POST | /api/orders | Đặt hàng | Khách hàng |
| GET | /api/orders/my | Đơn hàng của tôi | Khách hàng |
| PATCH | /api/orders/:id/cancel | Hủy đơn (khi chờ xác nhận) | Khách hàng |
| POST | /api/orders/:id/pay | Thanh toán lại đơn MoMo (trong 30 phút) | Khách hàng |
| GET/POST | /api/reviews/eligible/:productId, /api/reviews | Kiểm tra quyền và gửi đánh giá | Khách hàng |
| GET | /api/payment/methods | Phương thức thanh toán đang bật | Công khai |
| GET / POST | /api/payment/momo-return, /api/payment/momo-ipn | Nhận kết quả MoMo (kiểm tra chữ ký) | Công khai |
| * | /api/admin/products, categories, brands, reviews | Quản lý sản phẩm và danh mục | Nhân viên, Admin |
| GET/PATCH | /api/admin/orders | Quản lý đơn, cập nhật trạng thái | Nhân viên, Admin |
| PATCH | /api/admin/orders/:id/refund | Xác nhận đã hoàn tiền | Admin |
| GET/PATCH | /api/admin/users | Quản lý người dùng, phân quyền | Admin |
| GET | /api/admin/stats/overview | Tổng quan (nhân viên không thấy doanh thu) | Nhân viên, Admin |
| GET | /api/admin/stats/revenue | Thống kê doanh thu | Admin |

## 6. Quy tắc nghiệp vụ đã cài đặt

- Trạng thái đơn: Chờ xác nhận → Đã xác nhận → Đang giao → Đã giao. Hủy được khi đơn ở “Chờ xác nhận” (khách, nhân viên, admin) hoặc “Đã xác nhận” (nhân viên, admin).
- Đơn hàng (cả COD và MoMo) **giữ hàng ngay khi đặt** bằng cách trừ tồn kho, để không bán vượt số lượng. Hủy đơn thì hoàn lại tồn kho.
- Đơn MoMo chưa thanh toán sau 30 phút sẽ tự hủy và trả hàng về kho. Trong 30 phút khách có thể bấm “Thanh toán lại”.
- Đơn MoMo đã thanh toán mà bị hủy sẽ hiện “cần hoàn tiền”; admin hoàn tiền xong bấm “Xác nhận đã hoàn tiền”.
- Miễn phí vận chuyển cho đơn từ 500.000₫, dưới mức này phí 30.000₫.
- Chỉ đánh giá được sản phẩm trong đơn đã giao, mỗi sản phẩm trong một đơn chỉ đánh giá một lần.
- Xóa sản phẩm đã có trong đơn hàng thì chỉ ẩn (xóa mềm). Không xóa được danh mục/thương hiệu còn sản phẩm.
- Doanh thu chỉ tính các đơn “Đã giao” và “Đã thanh toán”.
- Tìm kiếm không phân biệt dấu và hoa thường (“cu sac anker” tìm ra “Củ sạc … Anker”).

## 7. Triển khai lên Internet (miễn phí)

### Cách nhanh: 1 dịch vụ trên Render (khuyên dùng)

Repo đã có sẵn `render.yaml`. Backend sẽ phục vụ luôn giao diện React, nên chỉ cần 1 dịch vụ và 1 đường link.

1. Tạo database miễn phí trên **MongoDB Atlas** (cluster M0), tạo database user, mục *Network Access* thêm `0.0.0.0/0`, lấy chuỗi kết nối dạng `mongodb+srv://user:pass@cluster.xxxxx.mongodb.net/phukien_shop`.
2. Vào https://dashboard.render.com → **New** → **Blueprint** → chọn repo `phukien-shop`.
3. Điền `MONGO_URI` (chuỗi ở bước 1) và `SEED_ADMIN_PASSWORD` (mật khẩu admin bạn muốn) → **Apply**.
4. Chờ build khoảng 3–5 phút. Lần chạy đầu server tự tạo dữ liệu mẫu. Link có dạng `https://kayden-store-xxxx.onrender.com`.

Gói miễn phí của Render sẽ “ngủ” sau 15 phút không có ai truy cập; lần mở tiếp theo mất khoảng 30–50 giây để khởi động lại.

### Cách tách riêng frontend (Vercel) và backend (Render)

1. **Database – MongoDB Atlas:** như bước 1 ở trên.
2. **Backend – Render:** New → Web Service → chọn repo, *Root Directory* `backend`, *Build Command* `npm install`, *Start Command* `npm start`. Thêm biến môi trường như trong `.env` (đổi `CLIENT_URL`, `MOMO_REDIRECT_URL` thành địa chỉ frontend; `SERVER_URL`, `MOMO_IPN_URL` thành địa chỉ backend). Nên dùng Cloudinary vì ổ đĩa của Render bị xóa khi khởi động lại.
3. **Frontend – Vercel:** Import repo, *Root Directory* `frontend`, framework Vite. Thêm biến `VITE_API_URL=https://<ten-backend>.onrender.com/api`. File `vercel.json` đã cấu hình để các đường dẫn của React Router không bị lỗi 404.
