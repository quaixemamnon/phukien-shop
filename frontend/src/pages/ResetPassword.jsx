import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errMsg } from '../api';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 6) return setError('Mật khẩu tối thiểu 6 ký tự');
    if (password !== confirm) return setError('Mật khẩu nhập lại không khớp');
    try {
      const { data } = await api.post(`/auth/reset-password/${token}`, { password });
      toast.success(data.message);
      navigate('/login');
    } catch (err) {
      setError(errMsg(err));
    }
  };

  return (
    <div className="auth-box card">
      <h1>Đặt lại mật khẩu</h1>
      <form onSubmit={submit} className="form">
        <label>Mật khẩu mới<input id="reset-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        <label>Nhập lại mật khẩu<input id="reset-confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></label>
        {error && <p className="alert bad">{error}</p>}
        <button className="btn primary block">Đặt lại mật khẩu</button>
      </form>
    </div>
  );
}
