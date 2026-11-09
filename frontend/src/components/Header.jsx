import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Header() {
  const { user, logout, isAdmin } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [keyword, setKeyword] = useState(params.get('keyword') || '');
  const [categories, setCategories] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const onProducts = location.pathname === '/products';
  const currentCat = params.get('category');

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data.filter((c) => !c.parent))).catch(() => {});
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    navigate(keyword.trim() ? `/products?keyword=${encodeURIComponent(keyword.trim())}` : '/products');
  };

  const onLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="site-header">
      <div className="container header-row">
        <Link to="/" className="logo">
          <span className="logo-mark">PK</span> Phụ Kiện Shop
        </Link>
        <form className="search" onSubmit={onSearch} role="search">
          <input id="header-search" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Tìm tai nghe, củ sạc, cáp sạc..." />
          <button className="btn primary" type="submit">Tìm</button>
        </form>
        <nav className="header-actions">
          {user ? (
            <div className="dropdown" onMouseLeave={() => setMenuOpen(false)}>
              <button className="btn ghost" onClick={() => setMenuOpen((v) => !v)}>
                Xin chào, {user.fullName.split(' ').slice(-1)[0]} ▾
              </button>
              {menuOpen && (
                <div className="dropdown-menu" onClick={() => setMenuOpen(false)}>
                  {isAdmin && <Link to="/admin">Trang quản trị</Link>}
                  {!isAdmin && <Link to="/orders">Đơn hàng của tôi</Link>}
                  <Link to="/profile">Tài khoản</Link>
                  <button onClick={onLogout}>Đăng xuất</button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link className="btn ghost" to="/login">Đăng nhập</Link>
              <Link className="btn outline" to="/register">Đăng ký</Link>
            </>
          )}
          {!isAdmin && (
            <Link to="/cart" className="cart-link" aria-label="Giỏ hàng">
              🛒 <span>Giỏ hàng</span>
              {cart.count > 0 && <b className="cart-badge">{cart.count}</b>}
            </Link>
          )}
        </nav>
      </div>
      <div className="cat-bar">
        <div className="container cat-row">
          <Link to="/products" className={onProducts && !currentCat ? 'active' : ''}>Tất cả sản phẩm</Link>
          {categories.map((c) => (
            <Link key={c._id} to={`/products?category=${c.slug}`} className={onProducts && currentCat === c.slug ? 'active' : ''}>{c.name}</Link>
          ))}
        </div>
      </div>
    </header>
  );
}
