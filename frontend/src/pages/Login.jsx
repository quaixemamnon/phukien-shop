import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) return setError('Vui lòng nhập email và mật khẩu');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success('Đăng nhập thành công');
      if (user.role === 'admin' || user.role === 'staff') navigate('/admin');
      else navigate(location.state?.from || '/');
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-box card">
      <h1>Đăng nhập</h1>
      {params.get('expired') && <p className="alert warn">Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.</p>}
      <form onSubmit={submit} className="form">
        <label>Email<input id="login-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" /></label>
        <label>Mật khẩu<input id="login-password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="current-password" /></label>
        {error && <p className="alert bad">{error}</p>}
        <button className="btn primary block lg" disabled={loading}>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
      </form>
      <p className="auth-links">
        <Link to="/forgot-password">Quên mật khẩu?</Link>
        <span>Chưa có tài khoản? <Link to="/register">Đăng ký</Link></span>
      </p>
    </div>
  );
}
