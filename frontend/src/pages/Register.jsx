import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errMsg } from '../api';

const validate = (f) => {
  const e = {};
  if (f.fullName.trim().length < 2) e.fullName = 'Họ tên tối thiểu 2 ký tự';
  if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Email không hợp lệ';
  if (f.phone && !/^0\d{9}$/.test(f.phone)) e.phone = 'Số điện thoại gồm 10 số, bắt đầu bằng 0';
  if (f.password.length < 6) e.password = 'Mật khẩu tối thiểu 6 ký tự';
  if (f.confirm !== f.password) e.confirm = 'Mật khẩu nhập lại không khớp';
  return e;
};

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      toast.success(data.message);
      navigate('/login');
    } catch (err) {
      setErrors({ server: errMsg(err) });
    } finally {
      setLoading(false);
    }
  };

  const field = (k, label, type = 'text') => (
    <label>
      {label}
      <input id={`reg-${k}`} type={type} value={form[k]} onChange={set(k)} className={errors[k] ? 'invalid' : ''} />
      {errors[k] && <small className="bad-text">{errors[k]}</small>}
    </label>
  );

  return (
    <div className="auth-box card">
      <h1>Đăng ký tài khoản</h1>
      <form onSubmit={submit} className="form">
        {field('fullName', 'Họ và tên')}
        {field('email', 'Email', 'email')}
        {field('phone', 'Số điện thoại (không bắt buộc)', 'tel')}
        {field('password', 'Mật khẩu', 'password')}
        {field('confirm', 'Nhập lại mật khẩu', 'password')}
        {errors.server && <p className="alert bad">{errors.server}</p>}
        <button className="btn primary block lg" disabled={loading}>{loading ? 'Đang xử lý...' : 'Đăng ký'}</button>
      </form>
      <p className="auth-links"><span>Đã có tài khoản? <Link to="/login">Đăng nhập</Link></span></p>
    </div>
  );
}
