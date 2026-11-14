// Dữ liệu mẫu để demo: khách hàng mẫu, đơn hàng đã giao và đánh giá (dùng trong seed.js)
// daysAgo: đơn được đặt cách hôm nay bao nhiêu ngày

const CUSTOMERS = [
  {
    fullName: 'Nguyễn Văn An', email: 'khachhang@kaydenstore.vn', phone: '0912345678',
    address: { fullName: 'Nguyễn Văn An', phone: '0912345678', province: 'TP. Hồ Chí Minh', district: 'Quận 10', ward: 'Phường 12', street: '268 Lý Thường Kiệt' },
  },
  {
    fullName: 'Trần Thị Bình', email: 'binh@kaydenstore.vn', phone: '0987123456',
    address: { fullName: 'Trần Thị Bình', phone: '0987123456', province: 'Hà Nội', district: 'Cầu Giấy', ward: 'Dịch Vọng Hậu', street: '144 Xuân Thủy' },
  },
  {
    fullName: 'Lê Minh Cường', email: 'cuong@kaydenstore.vn', phone: '0905678123',
    address: { fullName: 'Lê Minh Cường', phone: '0905678123', province: 'Đà Nẵng', district: 'Hải Châu', ward: 'Thạch Thang', street: '25 Bạch Đằng' },
  },
];

const ORDERS = [
  { customer: 0, daysAgo: 140, paymentMethod: 'COD', skus: ['SONY-WH1000XM5', 'BAS-E3'] },
  { customer: 1, daysAgo: 110, paymentMethod: 'MOMO', skus: ['SONY-WH1000XM5', 'UGR-70427'] },
  { customer: 2, daysAgo: 80, paymentMethod: 'COD', skus: ['ANK-A2667', 'ANK-A1334'] },
  { customer: 0, daysAgo: 52, paymentMethod: 'MOMO', skus: ['ANK-A2667', 'LOG-M331'] },
  { customer: 1, daysAgo: 30, paymentMethod: 'COD', skus: ['LOG-M331', 'UGR-IP15-CLR'] },
  { customer: 2, daysAgo: 12, paymentMethod: 'MOMO', skus: ['LOG-K380'] },
];

// order: chỉ số trong ORDERS
const REVIEWS = [
  { order: 0, sku: 'SONY-WH1000XM5', rating: 5, comment: 'Chống ồn rất tốt, đeo cả buổi không bị đau tai. Pin dùng gần một tuần mới phải sạc.' },
  { order: 0, sku: 'BAS-E3', rating: 3, comment: 'Âm thanh tạm ổn trong tầm giá, nhưng chơi game thì thấy hơi trễ tiếng.' },
  { order: 1, sku: 'SONY-WH1000XM5', rating: 4, comment: 'Âm thanh hay, kết nối ổn định. Hơi nặng một chút khi đeo lâu.' },
  { order: 1, sku: 'UGR-70427', rating: 5, comment: 'Cáp chắc chắn, sạc MacBook ổn định, đầu cắm không bị lỏng.' },
  { order: 2, sku: 'ANK-A2667', rating: 5, comment: 'Đi công tác mang một củ là đủ cho cả laptop và điện thoại, sạc lâu không bị nóng.' },
  { order: 2, sku: 'ANK-A1334', rating: 4, comment: 'Pin nhẹ, bỏ túi quần được. Sạc đầy điện thoại được khoảng 2 lần.' },
  { order: 3, sku: 'ANK-A2667', rating: 5, comment: 'Củ sạc nhỏ gọn, sạc 3 thiết bị cùng lúc vẫn nhanh. Giao hàng nhanh.' },
  // Đơn 3 (khachhang@kaydenstore.vn) cố ý để LOG-M331 chưa đánh giá, để thử chức năng viết đánh giá khi demo
  { order: 4, sku: 'LOG-M331', rating: 5, comment: 'Click rất êm, dùng trong thư viện không làm phiền ai.' },
  { order: 4, sku: 'UGR-IP15-CLR', rating: 4, comment: 'Ốp trong, ôm máy, cầm không trơn. Dùng một tháng thấy hơi ngả vàng nhẹ.' },
  { order: 5, sku: 'LOG-K380', rating: 5, comment: 'Gõ êm, chuyển qua lại giữa iPad và laptop rất tiện, pin lâu.' },
];

// Tài khoản nhân viên mẫu (vai trò staff: xử lý đơn hàng, sản phẩm; không xem doanh thu, không quản lý người dùng)
const STAFF = { fullName: 'Phạm Thu Hà', email: 'nhanvien@kaydenstore.vn', phone: '0938111222', password: 'Nhanvien@123' };

module.exports = { CUSTOMERS, ORDERS, REVIEWS, STAFF, PASSWORD: 'Khach@123' };
