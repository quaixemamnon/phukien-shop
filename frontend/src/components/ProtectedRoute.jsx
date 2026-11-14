import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Bắt buộc đăng nhập
export function RequireAuth() {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <p className="muted center">Đang tải...</p>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <Outlet />;
}

// Chỉ cho các vai trò được liệt kê (mặc định: nhân viên và quản trị viên)
export function RequireRole({ roles = ['admin', 'staff'] }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <p className="muted center">Đang tải...</p>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!roles.includes(user.role)) {
    const isBackoffice = user.role === 'admin' || user.role === 'staff';
    return <Navigate to={isBackoffice ? '/admin' : '/'} replace />;
  }
  return <Outlet />;
}
