import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="empty">
      <h1>404</h1>
      <p>Trang bạn tìm không tồn tại hoặc sản phẩm đã ngừng bán.</p>
      <Link className="btn primary" to="/">Về trang chủ</Link>
    </div>
  );
}
