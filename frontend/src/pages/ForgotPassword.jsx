import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setMsg(data.message);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-box card">
      <h1>Quên mật khẩu</h1>
      {msg ? (
        <p className="alert ok">{msg}</p>
      ) : (
        <form onSubmit={submit} className="form">
          <p className="muted">Nhập email đã đăng ký, hệ thống sẽ gửi liên kết đặt lại mật khẩu (hiệu lực 15 phút).</p>
          <label>Email<input id="forgot-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          {error && <p className="alert bad">{error}</p>}
          <button className="btn primary block" disabled={loading}>{loading ? 'Đang gửi...' : 'Gửi liên kết'}</button>
        </form>
      )}
      <p className="auth-links"><Link to="/login">‹ Quay lại đăng nhập</Link></p>
    </div>
  );
}
