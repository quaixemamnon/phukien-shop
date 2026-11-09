# Phụ Kiện Shop – Website bán phụ kiện điện tử (MERN)

Đồ án tốt nghiệp: website bán phụ kiện điện tử gồm trang cho khách hàng và trang quản trị.

- **Frontend:** ReactJS (Vite), React Router, Axios, Recharts, SheetJS (xuất Excel)
- **Backend:** Node.js, ExpressJS, Mongoose, JWT, bcryptjs, Multer, Cloudinary, Nodemailer
- **Database:** MongoDB
- **Thanh toán:** COD, VNPay (sandbox), MoMo (test)

## 1. Cấu trúc thư mục

```
phukien-shop/
├── backend/
│   ├── src/
│   │   ├── config/db.js            # Kết nối MongoDB
│   │   ├── models/                 # Model: User, Category, Brand, Product, Cart, Order, Review
│   │   ├── controllers/            # Xử lý nghiệp vụ (Controller trong MVC)
│   │   ├── routes/                 # Định nghĩa API
│   │   ├── middlewares/            # protect (JWT), isAdmin, xử lý lỗi
│   │   ├── services/orderService.js# Trừ/hoàn kho, hủy đơn, xác nhận thanh toán
│   │   ├── utils/                  # VNPay, MoMo, gửi email, hàm tiện ích
│   │   ├── jobs/orderJobs.js       # Tự hủy đơn online quá 30 phút chưa thanh toán
│   │   ├── seed.js                 # Tạo dữ liệu mẫu
│   │   └── server.js
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── pages/                  # Các trang khách hàng
    │   ├── pages/admin/            # Các trang quản trị
    │   ├── components/             # Header, Footer, ProductCard, AdminLayout...
    │   ├── context/                # AuthContext, CartContext
    │   ├── api.js                  # Cấu hình Axios + JWT
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
| Quản trị viên | admin@phukien.vn | giá trị `SEED_ADMIN_PASSWORD` trong `.env` (mặc định `Admin@123`) |
| Khách hàng | khachhang@phukien.vn | Khach@123 |

### Bước 2 – Frontend (mở terminal khác)
```bash
cd frontend
npm install
npm run dev      # mở http://localhost:5173
```
Khi chạy dev, Vite tự chuyển các request `/api` sang `http://localhost:5000`, không cần cấu hình thêm.

## 3. Cấu hình tùy chọn

| Chức năng | Biến môi trường | Ghi chú |
|---|---|---|
| Lưu ảnh lên Cloudinary | `CLOUDINARY_*` | Bỏ trống thì ảnh lưu vào `backend/uploads/` |
| Gửi email (xác nhận đơn, quên mật khẩu) | `SMTP_*` | Bỏ trống thì nội dung email in ra console của backend |
| VNPay | `VNP_TMN_CODE`, `VNP_HASH_SECRET` | Đăng ký tài khoản test tại https://sandbox.vnpayment.vn/devreg/ |
| MoMo | `MOMO_MODE`, `MOMO_*` | `MOMO_MODE=mock` (mặc định): cổng MoMo mô phỏng ngay trong website, không cần tài khoản. `MOMO_MODE=real`: điền khóa do MoMo cấp tại business.momo.vn |

**Thẻ test VNPay (sandbox):** ngân hàng NCB, số thẻ `9704198526191432198`, tên `NGUYEN VAN A`, ngày phát hành `07/15`, OTP `123456`.

**MoMo chế độ mô phỏng (`MOMO_MODE=mock`):** khi khách chọn Ví MoMo, website chuyển sang trang `/payment/momo-sandbox` có ghi rõ “Chế độ mô phỏng”. Khách bấm “Xác nhận thanh toán” hoặc “Hủy giao dịch”, backend tạo dữ liệu trả về đúng định dạng MoMo và ký HMAC SHA256 giống MoMo thật, sau đó đi qua cùng luồng kiểm tra chữ ký, cập nhật đơn, trừ kho như khi dùng cổng thật. Không có giao dịch tiền thật. Khi có khóa MoMo, chỉ cần đổi `MOMO_MODE=real` và điền 3 khóa, không phải sửa code. (Bộ khóa test công khai cũ `partnerCode=MOMO` hiện bị cổng test của MoMo trả về HTTP 403.)

**Lưu ý về IPN:** VNPay/MoMo chỉ gọi được IPN đến địa chỉ công khai. Khi chạy trên máy, website vẫn xác nhận thanh toán qua trang kết quả (return URL), nên không cần IPN. Nếu muốn thử IPN, dùng ngrok để tạo địa chỉ công khai cho backend.

## 4. Danh sách API chính

| Phương thức | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| POST | /api/auth/register | Đăng ký | Công khai |
| POST | /api/auth/login | Đăng nhập, trả về JWT | Công khai |
| POST | /api/auth/forgot-password | Gửi link đặt lại mật khẩu | Công khai |
| GET | /api/products | Danh sách sản phẩm (lọc, sắp xếp, phân trang) | Công khai |
| GET | /api/products/:slug | Chi tiết sản phẩm | Công khai |
| GET/POST/PUT/DELETE | /api/cart, /api/cart/items | Giỏ hàng | Khách hàng |
| POST | /api/orders | Đặt hàng | Khách hàng |
| GET | /api/orders/my | Đơn hàng của tôi | Khách hàng |
| PATCH | /api/orders/:id/cancel | Hủy đơn (khi chờ xác nhận) | Khách hàng |
| POST | /api/reviews | Đánh giá sản phẩm đã mua | Khách hàng |
| GET | /api/payment/vnpay-return | Xác nhận kết quả VNPay | Công khai (có kiểm tra chữ ký) |
| * | /api/admin/products | Quản lý sản phẩm | Admin |
| * | /api/admin/categories, /api/admin/brands | Danh mục, thương hiệu | Admin |
| GET/PATCH | /api/admin/orders | Quản lý đơn, cập nhật trạng thái | Admin |
| GET/PATCH | /api/admin/users | Quản lý người dùng | Admin |
| GET | /api/admin/stats/overview, /api/admin/stats/revenue | Thống kê | Admin |

## 5. Quy tắc nghiệp vụ đã cài đặt

- Trạng thái đơn: Chờ xác nhận → Đã xác nhận → Đang giao → Đã giao. Hủy được khi đơn ở “Chờ xác nhận” (khách hoặc admin) hoặc “Đã xác nhận” (admin).
- Đơn COD trừ tồn kho ngay khi đặt. Đơn VNPay/MoMo trừ tồn kho khi thanh toán thành công. Hủy đơn thì hoàn lại tồn kho.
- Đơn online chưa thanh toán sau 30 phút sẽ tự hủy. Trong 30 phút khách có thể bấm “Thanh toán lại”.
- Miễn phí vận chuyển cho đơn từ 500.000₫, dưới mức này phí 30.000₫.
- Chỉ đánh giá được sản phẩm trong đơn đã giao, mỗi sản phẩm trong một đơn chỉ đánh giá một lần.
- Xóa sản phẩm đã có trong đơn hàng thì chỉ ẩn (xóa mềm). Không xóa được danh mục/thương hiệu còn sản phẩm.
- Doanh thu chỉ tính các đơn “Đã giao” và “Đã thanh toán”.

## 6. Triển khai lên Internet (miễn phí)

1. **Database – MongoDB Atlas:** tạo cluster M0 miễn phí, tạo user, ở mục *Network Access* cho phép `0.0.0.0/0`, copy chuỗi kết nối vào `MONGO_URI`.
2. **Backend – Render (https://render.com):** New → Web Service → chọn repo GitHub, *Root Directory* `backend`, *Build Command* `npm install`, *Start Command* `npm start`. Thêm các biến môi trường như trong `.env` (đổi `CLIENT_URL` thành địa chỉ frontend, `SERVER_URL` thành địa chỉ Render, `VNP_RETURN_URL`, `MOMO_REDIRECT_URL` thành địa chỉ frontend, `MOMO_IPN_URL` thành địa chỉ backend). Nên dùng Cloudinary vì ổ đĩa của Render bị xóa khi khởi động lại.
3. **Frontend – Vercel (https://vercel.com):** Import repo, *Root Directory* `frontend`, framework Vite. Thêm biến `VITE_API_URL=https://<ten-backend>.onrender.com/api`. File `vercel.json` đã cấu hình để các đường dẫn của React Router không bị lỗi 404.
4. Chạy `npm run seed` một lần với `MONGO_URI` của Atlas (chạy trên máy cá nhân) để có dữ liệu mẫu, sau đó **đổi mật khẩu admin**.
