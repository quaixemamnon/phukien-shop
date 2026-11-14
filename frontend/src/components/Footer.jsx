export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <h4>Kayden Store</h4>
          <p>Phụ kiện điện tử chính hãng: tai nghe, củ sạc, cáp sạc, sạc dự phòng, chuột, bàn phím.</p>
        </div>
        <div>
          <h4>Liên hệ</h4>
          <p>Địa chỉ: 268 Lý Thường Kiệt, Quận 10, TP. Hồ Chí Minh</p>
          <p>Hotline: 0909 123 456</p>
          <p>Email: hotro@kaydenstore.vn</p>
        </div>
        <div>
          <h4>Chính sách</h4>
          <p>Miễn phí giao hàng cho đơn từ 500.000₫</p>
          <p>Đổi trả trong 7 ngày nếu lỗi do nhà sản xuất</p>
          <p>Thanh toán khi nhận hàng (COD) hoặc ví MoMo</p>
        </div>
      </div>
      <p className="copyright">© {new Date().getFullYear()} Kayden Store - Đồ án tốt nghiệp</p>
    </footer>
  );
}
