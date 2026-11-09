import { useState } from 'react';
import toast from 'react-hot-toast';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import AddressForm, { EMPTY_ADDRESS, validateAddress } from '../components/AddressForm';
import { fullAddress } from '../utils/format';

function InfoTab() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ fullName: user.fullName, phone: user.phone || '' });
  const save = async (e) => {
    e.preventDefault();
    if (form.phone && !/^0\d{9}$/.test(form.phone)) return toast.error('Số điện thoại không hợp lệ');
    try {
      const { data } = await api.put('/users/me', form);
      setUser(data.user);
      toast.success(data.message);
    } catch (err) {
      toast.error(errMsg(err));
    }
  };
  return (
    <form className="form narrow" onSubmit={save}>
      <label>Email<input value={user.email} disabled /></label>
      <label>Họ và tên<input id="pf-name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></label>
      <label>Số điện thoại<input id="pf-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>      <button className="btn primary">Lưu thay đổi</button>
    </form>
  );
}

function PasswordTab() {
  const [f, setF] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const save = async (e) => {
    e.preventDefault();
    if (f.newPassword.length < 6) return toast.error('Mật khẩu mới tối thiểu 6 ký tự');
    if (f.newPassword !== f.confirm) return toast.error('Mật khẩu nhập lại không khớp');
    try {
      const { data } = await api.put('/users/me/password', f);
      toast.success(data.message);
      setF({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(errMsg(err));
    }
  };
  return (
    <form className="form narrow" onSubmit={save}>
      <label>Mật khẩu hiện tại<input id="pw-old" type="password" value={f.currentPassword} onChange={(e) => setF({ ...f, currentPassword: e.target.value })} /></label>
      <label>Mật khẩu mới<input id="pw-new" type="password" value={f.newPassword} onChange={(e) => setF({ ...f, newPassword: e.target.value })} /></label>
      <label>Nhập lại mật khẩu mới<input id="pw-confirm" type="password" value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} /></label>
      <button className="btn primary">Đổi mật khẩu</button>
    </form>
  );
}

function AddressTab() {
  const { user, setUser } = useAuth();
  const [editing, setEditing] = useState(null); // null | 'new' | addressId
  const [form, setForm] = useState(EMPTY_ADDRESS);

  const updateAddresses = (addresses) => setUser({ ...user, addresses });

  const startEdit = (a) => {
    setEditing(a ? a._id : 'new');
    setForm(a ? { ...a } : { ...EMPTY_ADDRESS, fullName: user.fullName, phone: user.phone || '' });
  };

  const save = async (e) => {
    e.preventDefault();
    const err = validateAddress(form);
    if (err) return toast.error(err);
    try {
      const { data } = editing === 'new' ? await api.post('/users/me/addresses', form) : await api.put(`/users/me/addresses/${editing}`, form);
      updateAddresses(data.addresses);
      setEditing(null);
      toast.success(data.message);
    } catch (er) {
      toast.error(errMsg(er));
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Xóa địa chỉ này?')) return;
    try {
      const { data } = await api.delete(`/users/me/addresses/${id}`);
      updateAddresses(data.addresses);
    } catch (er) {
      toast.error(errMsg(er));
    }
  };

  const setDefault = async (a) => {
    const { data } = await api.put(`/users/me/addresses/${a._id}`, { isDefault: true });
    updateAddresses(data.addresses);
  };

  return (
    <div className="stack">
      {user.addresses?.map((a) => (
        <div key={a._id} className="card pad address-row">
          <div>
            <b>{a.fullName}</b> · {a.phone} {a.isDefault && <span className="badge info">Mặc định</span>}
            <div className="muted">{fullAddress(a)}</div>
          </div>
          <div className="row-center">
            {!a.isDefault && <button className="btn ghost" onClick={() => setDefault(a)}>Đặt mặc định</button>}
            <button className="btn ghost" onClick={() => startEdit(a)}>Sửa</button>
            <button className="btn ghost danger" onClick={() => remove(a._id)}>Xóa</button>
          </div>
        </div>
      ))}
      {editing ? (
        <form className="card pad" onSubmit={save}>
          <h3>{editing === 'new' ? 'Thêm địa chỉ' : 'Sửa địa chỉ'}</h3>
          <AddressForm value={form} onChange={setForm} idPrefix="pf-addr" />
          <label className="radio">
            <input type="checkbox" checked={!!form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} /> Đặt làm địa chỉ mặc định
          </label>
          <div className="row-center">
            <button className="btn primary">Lưu</button>
            <button type="button" className="btn ghost" onClick={() => setEditing(null)}>Hủy</button>
          </div>
        </form>
      ) : (
        <button className="btn outline" onClick={() => startEdit(null)}>+ Thêm địa chỉ</button>
      )}
    </div>
  );
}

const TABS = [
  ['info', 'Thông tin cá nhân', InfoTab],
  ['password', 'Đổi mật khẩu', PasswordTab],
  ['address', 'Sổ địa chỉ', AddressTab],
];

export default function Profile() {
  const { user } = useAuth();
  const [tab, setTab] = useState('info');
  const Current = TABS.find((t) => t[0] === tab)[2];
  return (
    <>
      <h1>Tài khoản của tôi</h1>
      <div className="tabs">
        {TABS.filter((t) => user.role !== 'admin' || t[0] !== 'address').map(([k, label]) => (
          <button key={k} className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>{label}</button>
        ))}
      </div>
      <div className="card pad">
        <Current />
      </div>
    </>
  );
}
