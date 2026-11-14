import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// [đường dẫn, tên menu, chỉ quản trị viên?]
const MENU = [
  ['/admin', 'Tổng quan', false],
  ['/admin/products', 'Sản phẩm', false],
  ['/admin/categories', 'Danh mục', false],
  ['/admin/brands', 'Thương hiệu', false],
  ['/admin/orders', 'Đơn hàng', false],
  ['/admin/reviews', 'Đánh giá', false],
  ['/admin/users', 'Người dùng', true],
  ['/admin/stats', 'Thống kê doanh thu', true],
];

export const ROLE_LABEL = { admin: 'Quản trị viên', staff: 'Nhân viên', customer: 'Khách hàng' };

export default function AdminLayout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <div className="admin">
      <aside className={`admin-side ${open ? 'open' : ''}`}>
        <Link to="/admin" className="logo light"><span className="logo-mark">KS</span> {isAdmin ? 'Quản trị' : 'Nhân viên'}</Link>
        <nav onClick={() => setOpen(false)}>
          {MENU.filter(([, , adminOnly]) => isAdmin || !adminOnly).map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/admin'}>{label}</NavLink>
          ))}
        </nav>
        <Link to="/" className="side-foot">‹ Về trang bán hàng</Link>
      </aside>
      <div className="admin-main">
        <header className="admin-top">
          <button className="btn ghost menu-btn" onClick={() => setOpen((v) => !v)} aria-label="Menu">☰</button>
          <span className="grow" />
          <span className="muted">{user.fullName} · {ROLE_LABEL[user.role]}</span>
          <button className="btn ghost" onClick={() => { logout(); navigate('/login'); }}>Đăng xuất</button>
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
