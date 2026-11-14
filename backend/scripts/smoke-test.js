// Kiểm thử tự động các API chính.
// Cách chạy: backend đang chạy (npm run dev) với dữ liệu mẫu (npm run seed), MOMO_MODE=mock, rồi:
//   node scripts/smoke-test.js            (mặc định gọi http://localhost:5000/api)
//   API_URL=https://.../api node scripts/smoke-test.js
// Script tự tạo tài khoản khách thử nghiệm và tự dọn đơn hàng / sản phẩm thử nghiệm của chính nó.
const BASE = process.env.API_URL || 'http://localhost:5000/api';
const ADMIN = { email: process.env.ADMIN_EMAIL || 'admin@kaydenstore.vn', password: process.env.ADMIN_PASSWORD || 'Admin@123' };
const STAFF = { email: 'nhanvien@kaydenstore.vn', password: 'Nhanvien@123' };

const results = [];
const check = (group, name, ok, detail = '') => {
  results.push({ group, name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  [${group}] ${name}${detail ? '  -> ' + detail : ''}`);
};

async function call(method, path, body, token) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* không có body */ }
  return { status: res.status, data };
}
const login = async (u) => (await call('POST', '/auth/login', u)).data?.token;
const stockOf = async (slug) => (await call('GET', `/products/${slug}`)).data.product.stock;

(async () => {
  const stamp = Date.now();
  const email = `kiemthu${stamp}@mail.com`;
  const addr = { fullName: 'Khach Kiem Thu', phone: '0911222333', province: 'Đà Nẵng', district: 'Hải Châu', ward: 'Thạch Thang', street: '10 Bạch Đằng' };

  /* ---------- 1. Tài khoản ---------- */
  let r = await call('POST', '/auth/register', { fullName: 'Khách Kiểm Thử', email, phone: '0911222333', password: '123456' });
  check('Tài khoản', 'Đăng ký tài khoản mới', r.status === 201);
  r = await call('POST', '/auth/register', { fullName: 'Khách Kiểm Thử', email, password: '123456' });
  check('Tài khoản', 'Đăng ký trùng email bị từ chối', r.status === 409, r.data?.message);
  r = await call('POST', '/auth/register', { fullName: 'A', email: 'khong-hop-le', password: '1' });
  check('Tài khoản', 'Dữ liệu đăng ký không hợp lệ bị từ chối', r.status === 400, r.data?.message);
  r = await call('POST', '/auth/login', { email, password: 'sai-mat-khau' });
  check('Tài khoản', 'Đăng nhập sai mật khẩu bị từ chối', r.status === 401);
  const token = await login({ email, password: '123456' });
  check('Tài khoản', 'Đăng nhập đúng nhận được JWT', !!token);
  r = await call('PUT', '/users/me', { fullName: 'Khách Kiểm Thử', phone: '0911222333', role: 'admin' }, token);
  check('Tài khoản', 'Không tự nâng quyền qua API cập nhật hồ sơ', r.status === 200 && r.data.user.role === 'customer');

  /* ---------- 2. Sản phẩm, tìm kiếm ---------- */
  r = await call('GET', '/products?keyword=cu sac');
  check('Sản phẩm', 'Tìm không dấu "cu sac" ra "Củ sạc"', r.data.total > 0 && r.data.items.every((p) => /củ sạc/i.test(p.name)), `${r.data.total} kết quả`);
  r = await call('GET', '/products?keyword=TAI NGHE sony');
  check('Sản phẩm', 'Tìm nhiều từ, không phân biệt hoa thường', r.data.total > 0 && r.data.items.every((p) => /sony/i.test(p.name)), `${r.data.total} kết quả`);
  r = await call('GET', '/products?category=cu-sac&sort=price_asc');
  const prices = r.data.items.map((p) => p.finalPrice);
  check('Sản phẩm', 'Lọc danh mục và sắp xếp giá tăng dần', prices.length > 0 && prices.every((v, i) => i === 0 || prices[i - 1] <= v));
  r = await call('GET', '/products?onSale=1');
  check('Sản phẩm', 'Lọc sản phẩm đang giảm giá', r.data.items.length > 0 && r.data.items.every((p) => p.salePrice != null));
  r = await call('GET', '/products?status[$ne]=x&keyword[$gt]=');
  check('Bảo mật', 'Tham số dạng toán tử MongoDB không gây lỗi', r.status === 200);
  const all = (await call('GET', '/products?limit=48')).data.items;
  const prod = all.find((p) => p.stock >= 10 && p.finalPrice >= 100000);
  r = await call('GET', `/products/by-ids?ids=${all[1]._id},${all[0]._id},khong-hop-le`);
  check('Sản phẩm', 'Đã xem gần đây: lấy theo danh sách id, giữ thứ tự', r.data.length === 2 && r.data[0]._id === all[1]._id);

  /* ---------- 3. Giỏ hàng ---------- */
  r = await call('POST', '/cart/items', { productId: prod._id, quantity: 1 });
  check('Giỏ hàng', 'Chưa đăng nhập không thêm được vào giỏ', r.status === 401);
  r = await call('POST', '/cart/items', { productId: prod._id, quantity: 2 }, token);
  check('Giỏ hàng', 'Thêm vào giỏ', r.status === 200 && r.data.count === 2);
  r = await call('POST', '/cart/items', { productId: prod._id, quantity: 999999 }, token);
  check('Giỏ hàng', 'Không thêm vượt tồn kho', r.status === 400, r.data?.message);
  r = await call('PUT', `/cart/items/${prod._id}`, { quantity: 3 }, token);
  check('Giỏ hàng', 'Cập nhật số lượng', r.data.count === 3);

  /* ---------- 4. Đặt hàng COD ---------- */
  const s0 = await stockOf(prod.slug);
  r = await call('POST', '/orders', { shippingAddress: { ...addr, phone: '123' }, paymentMethod: 'COD' }, token);
  check('Đặt hàng', 'Số điện thoại người nhận sai bị từ chối', r.status === 400);
  r = await call('POST', '/orders', { shippingAddress: addr, paymentMethod: 'VNPAY' }, token);
  check('Đặt hàng', 'Phương thức thanh toán không hỗ trợ bị từ chối', r.status === 400);
  r = await call('POST', '/orders', { shippingAddress: addr, paymentMethod: 'COD' }, token);
  const cod = r.data.order;
  check('Đặt hàng', 'Đặt hàng COD', r.status === 201 && cod.orderStatus === 'pending');
  check('Đặt hàng', 'Trừ tồn kho ngay khi đặt', s0 - (await stockOf(prod.slug)) === 3);
  check('Đặt hàng', 'Giỏ hàng được làm trống', (await call('GET', '/cart', null, token)).data.count === 0);
  check('Đặt hàng', 'Phí ship: miễn phí từ 500.000đ, dưới mức 30.000đ', cod.shippingFee === (cod.subtotal >= 500000 ? 0 : 30000));
  r = await call('POST', '/orders', { shippingAddress: addr, paymentMethod: 'COD' }, token);
  check('Đặt hàng', 'Giỏ trống thì không đặt được', r.status === 400);

  // Hủy đơn -> hoàn kho
  await call('POST', '/cart/items', { productId: prod._id, quantity: 1 }, token);
  const cod2 = (await call('POST', '/orders', { shippingAddress: addr, paymentMethod: 'COD' }, token)).data.order;
  const sBefore = await stockOf(prod.slug);
  r = await call('PATCH', `/orders/${cod2._id}/cancel`, { reason: 'Đổi ý' }, token);
  check('Đặt hàng', 'Khách hủy đơn chờ xác nhận', r.status === 200 && r.data.order.orderStatus === 'cancelled');
  check('Đặt hàng', 'Hủy đơn thì hoàn lại tồn kho', (await stockOf(prod.slug)) === sBefore + 1);

  /* ---------- 5. MoMo (mô phỏng) ---------- */
  r = await call('GET', '/payment/methods');
  check('MoMo', 'Phương thức đang bật chỉ có COD và MoMo', JSON.stringify(r.data) === '["COD","MOMO"]', JSON.stringify(r.data));
  await call('POST', '/cart/items', { productId: prod._id, quantity: 1 }, token);
  const sM = await stockOf(prod.slug);
  r = await call('POST', '/orders', { shippingAddress: addr, paymentMethod: 'MOMO' }, token);
  const momo = r.data.order;
  check('MoMo', 'Tạo đơn MoMo trả về link cổng thanh toán', r.status === 201 && /momo-sandbox\?orderId=/.test(r.data.paymentUrl || ''));
  check('MoMo', 'Đơn MoMo giữ hàng ngay khi đặt (chống bán vượt)', sM - (await stockOf(prod.slug)) === 1);
  const txn = new URL(r.data.paymentUrl, 'http://x').searchParams.get('orderId');
  const other = await login({ email: 'khachhang@kaydenstore.vn', password: 'Khach@123' });
  r = await call('GET', `/payment/momo-mock/${txn}`, null, other);
  check('MoMo', 'Khách khác không xem được giao dịch', r.status === 404);
  r = await call('POST', '/payment/momo-mock/complete', { orderId: txn, success: false }, token);
  r = await call('GET', `/payment/momo-return?${r.data.query}`);
  check('MoMo', 'Khách hủy giao dịch -> thanh toán thất bại', r.data.success === false && r.data.order.paymentStatus === 'failed');
  r = await call('POST', `/orders/${momo._id}/pay`, null, token);
  const txn2 = new URL(r.data.paymentUrl, 'http://x').searchParams.get('orderId');
  check('MoMo', 'Thanh toán lại tạo mã giao dịch mới', r.status === 200 && txn2 !== txn);
  const q = (await call('POST', '/payment/momo-mock/complete', { orderId: txn2, success: true }, token)).data.query;
  r = await call('GET', `/payment/momo-return?${q.replace(/amount=\d+/, 'amount=1000')}`);
  check('MoMo', 'Sửa số tiền trên link -> sai chữ ký', r.status === 400);
  r = await call('GET', `/payment/momo-return?${q}`);
  check('MoMo', 'Thanh toán thành công', r.data.success === true && r.data.order.paymentStatus === 'paid');
  r = await call('GET', `/payment/momo-return?${q}`);
  check('MoMo', 'Gọi lại kết quả nhiều lần vẫn an toàn', r.data.success === true);
  check('MoMo', 'Không trừ kho lần 2 khi thanh toán', sM - (await stockOf(prod.slug)) === 1);
  r = await call('POST', '/payment/momo-mock/complete', { orderId: txn2, success: true }, token);
  check('MoMo', 'Không thanh toán 2 lần một đơn', r.status === 400);

  /* ---------- 6. Phân quyền ---------- */
  const admin = await login(ADMIN);
  const staff = await login(STAFF);
  check('Phân quyền', 'Đăng nhập quản trị viên và nhân viên', !!admin && !!staff);
  r = await call('GET', '/admin/orders', null, token);
  check('Phân quyền', 'Khách hàng không vào được API quản trị', r.status === 403);
  r = await call('GET', '/admin/orders', null, staff);
  check('Phân quyền', 'Nhân viên xem được danh sách đơn', r.status === 200);
  r = await call('GET', '/admin/users', null, staff);
  check('Phân quyền', 'Nhân viên không quản lý được người dùng', r.status === 403);
  r = await call('GET', '/admin/stats/revenue?from=2026-01-01&to=2026-12-31', null, staff);
  check('Phân quyền', 'Nhân viên không xem được thống kê doanh thu', r.status === 403);
  r = await call('GET', '/admin/stats/overview', null, staff);
  check('Phân quyền', 'Tổng quan của nhân viên không có doanh thu', r.status === 200 && r.data.totalRevenue === undefined && r.data.monthly === undefined);
  r = await call('GET', '/admin/stats/overview', null, admin);
  check('Phân quyền', 'Tổng quan của quản trị viên có doanh thu', r.status === 200 && typeof r.data.totalRevenue === 'number');

  /* ---------- 7. Xử lý đơn, đánh giá ---------- */
  r = await call('PATCH', `/admin/orders/${cod._id}/status`, { status: 'delivered' }, staff);
  check('Xử lý đơn', 'Không nhảy cóc trạng thái (Chờ xác nhận -> Đã giao)', r.status === 400, r.data?.message);
  for (const s of ['confirmed', 'shipping', 'delivered']) {
    r = await call('PATCH', `/admin/orders/${cod._id}/status`, { status: s }, staff);
    check('Xử lý đơn', `Nhân viên chuyển đơn sang ${s}`, r.status === 200 && r.data.order.orderStatus === s);
  }
  check('Xử lý đơn', 'Đơn COD đã giao tự ghi nhận đã thanh toán', r.data.order.paymentStatus === 'paid');
  r = await call('PATCH', `/orders/${cod._id}/cancel`, null, token);
  check('Xử lý đơn', 'Không hủy được đơn đã giao', r.status === 400);

  r = await call('GET', `/reviews/eligible/${prod._id}`, null, token);
  check('Đánh giá', 'Được đánh giá sau khi nhận hàng', r.data.canReview === true && r.data.orderId === cod._id);
  r = await call('POST', '/reviews', { productId: prod._id, orderId: cod._id, rating: 4, comment: 'Kiểm thử tự động' }, token);
  check('Đánh giá', 'Gửi đánh giá', r.status === 201);
  const review = r.data.review;
  r = await call('POST', '/reviews', { productId: prod._id, orderId: cod._id, rating: 5 }, token);
  check('Đánh giá', 'Không đánh giá trùng', r.status === 409);
  r = await call('POST', '/reviews', { productId: prod._id, orderId: momo._id, rating: 5 }, token);
  check('Đánh giá', 'Đơn chưa giao không đánh giá được', r.status === 400);

  /* ---------- 8. Hủy đơn đã thanh toán MoMo -> hoàn tiền ---------- */
  r = await call('PATCH', `/admin/orders/${momo._id}/status`, { status: 'cancelled', note: 'Hết hàng' }, staff);
  check('Hoàn tiền', 'Nhân viên hủy đơn MoMo đã thanh toán', r.status === 200 && r.data.order.orderStatus === 'cancelled');
  r = await call('GET', '/admin/stats/overview', null, admin);
  check('Hoàn tiền', 'Tổng quan báo có đơn chờ hoàn tiền', r.data.refundPending >= 1, `${r.data.refundPending} đơn`);
  r = await call('PATCH', `/admin/orders/${momo._id}/refund`, { note: 'Kiểm thử' }, staff);
  check('Hoàn tiền', 'Nhân viên không xác nhận hoàn tiền được', r.status === 403);
  r = await call('PATCH', `/admin/orders/${momo._id}/refund`, { note: 'Kiểm thử' }, admin);
  check('Hoàn tiền', 'Quản trị viên xác nhận đã hoàn tiền', r.status === 200 && r.data.order.paymentStatus === 'refunded');
  r = await call('PATCH', `/admin/orders/${cod._id}/refund`, null, admin);
  check('Hoàn tiền', 'Đơn COD đã giao không hoàn tiền được', r.status === 400);

  /* ---------- 9. Quản trị sản phẩm, người dùng ---------- */
  const cats = (await call('GET', '/admin/categories', null, staff)).data;
  const brands = (await call('GET', '/admin/brands', null, staff)).data;
  const base = { name: `Cáp kiểm thử ${stamp}`, sku: `KT-${stamp}`, price: 100000, stock: 5, category: cats[0]._id, brand: brands[0]._id, images: ['/images/products/ugr-70427-1.svg'] };
  r = await call('POST', '/admin/products', { ...base, salePrice: 200000 }, staff);
  check('Quản lý SP', 'Giá khuyến mãi lớn hơn giá bán bị từ chối', r.status === 400);
  r = await call('POST', '/admin/products', { ...base, salePrice: 80000 }, staff);
  check('Quản lý SP', 'Nhân viên thêm sản phẩm', r.status === 201 && r.data.finalPrice === 80000);
  const newP = r.data;
  r = await call('GET', `/admin/products?keyword=cap kiem thu ${stamp}`, null, staff);
  check('Quản lý SP', 'Tìm sản phẩm không dấu trong trang quản trị', r.data.items.length === 1);
  r = await call('DELETE', `/admin/products/${newP._id}`, null, staff);
  check('Quản lý SP', 'Xóa hẳn sản phẩm chưa có trong đơn', r.status === 200 && r.data.softDeleted === false);
  r = await call('DELETE', `/admin/categories/${cats[0]._id}`, null, admin);
  check('Quản lý SP', 'Không xóa được danh mục còn sản phẩm', r.status === 400);

  const me = (await call('GET', '/auth/me', null, admin)).data;
  const u = (await call('GET', `/admin/users?keyword=${encodeURIComponent(email)}`, null, admin)).data.items[0];
  r = await call('PATCH', `/admin/users/${u._id}/role`, { role: 'staff' }, admin);
  check('Người dùng', 'Quản trị viên cấp quyền nhân viên', r.status === 200 && r.data.user.role === 'staff');
  await call('PATCH', `/admin/users/${u._id}/role`, { role: 'customer' }, admin);
  r = await call('PATCH', `/admin/users/${me._id}/role`, { role: 'customer' }, admin);
  check('Người dùng', 'Không tự đổi vai trò của chính mình', r.status === 400);
  r = await call('PATCH', `/admin/users/${me._id}/status`, null, admin);
  check('Người dùng', 'Không tự khóa tài khoản đang đăng nhập', r.status === 400);
  r = await call('PATCH', `/admin/users/${u._id}/status`, null, admin);
  check('Người dùng', 'Khóa tài khoản khách', r.status === 200 && r.data.user.isActive === false);
  r = await call('GET', '/cart', null, token);
  check('Người dùng', 'Tài khoản bị khóa không dùng được token cũ', r.status === 403);
  r = await call('POST', '/auth/login', { email, password: '123456' });
  check('Người dùng', 'Tài khoản bị khóa không đăng nhập được', r.status === 403);
  await call('PATCH', `/admin/users/${u._id}/status`, null, admin);

  /* ---------- 10. Thống kê ---------- */
  const vnToday = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
  r = await call('GET', `/admin/stats/revenue?from=${vnToday}&to=${vnToday}&groupBy=day`, null, admin);
  check('Thống kê', 'Doanh thu hôm nay gồm đơn COD vừa giao', r.status === 200 && r.data.totals.revenue >= cod.totalAmount, `${r.data.totals?.revenue}đ`);
  r = await call('GET', '/admin/stats/revenue?from=2026-12-01&to=2026-01-01', null, admin);
  check('Thống kê', 'Khoảng ngày ngược bị từ chối', r.status === 400);

  /* ---------- Dọn dữ liệu kiểm thử ---------- */
  await call('PATCH', `/admin/reviews/${review._id}/visibility`, null, admin); // ẩn đánh giá kiểm thử

  const pass = results.filter((x) => x.ok).length;
  console.log(`\nKẾT QUẢ: ${pass}/${results.length} bài đạt`);
  if (process.env.REPORT_JSON) require('fs').writeFileSync(process.env.REPORT_JSON, JSON.stringify(results, null, 2));
  process.exit(pass === results.length ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
