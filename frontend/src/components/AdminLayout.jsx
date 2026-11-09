import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MENU = [
  ['/admin', 'Tổng quan', true],
  ['/admin/products', 'Sản phẩm'],
  ['/admin/categories', 'Danh mục'],
  ['/admin/brands', 'Thương hiệu'],
  ['/admin/orders', 'Đơn hàng'],
  ['/admin/users', 'Người dùng'],
  ['/admin/reviews', 'Đánh giá'],
  ['/admin/stats', 'Thống kê doanh thu'],
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <div className="admin">
      <aside className={`admin-side ${open ? 'open' : ''}`}>
        <Link to="/admin" className="logo light"><span className="logo-mark">PK</span> Quản trị</Link>
        <nav onClick={() => setOpen(false)}>
          {MENU.map(([to, label, end]) => (
            <NavLink key={to} to={to} end={end}>{label}</NavLink>
          ))}
        </nav>
        <Link to="/" className="side-foot">‹ Về trang bán hàng</Link>
      </aside>
      <div className="admin-main">
        <header className="admin-top">
          <button className="btn ghost menu-btn" onClick={() => setOpen((v) => !v)} aria-label="Menu">☰</button>
          <span className="grow" />
          <span className="muted">{user.fullName}</span>
          <button className="btn ghost" onClick={() => { logout(); navigate('/login'); }}>Đăng xuất</button>
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
