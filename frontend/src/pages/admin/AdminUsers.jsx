import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errMsg } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Badge, OrderBadge, Pagination } from '../../components/common';
import { formatDate, formatPrice } from '../../utils/format';

function UserDetail({ id, onClose }) {
  const [d, setD] = useState(null);
  useEffect(() => {
    api.get(`/admin/users/${id}`).then((r) => setD(r.data));
  }, [id]);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal card pad" onClick={(e) => e.stopPropagation()}>
        <button className="btn ghost modal-close" onClick={onClose} aria-label="Đóng">✕</button>
        {!d ? (
          <p className="muted">Đang tải...</p>
        ) : (
          <>
            <h2>{d.user.fullName}</h2>
            <p>{d.user.email} · {d.user.phone || 'Chưa có SĐT'}</p>
            <p className="muted small">Tham gia: {formatDate(d.user.createdAt, false)} · Đơn đã giao: {d.deliveredOrders} · Đã chi: {formatPrice(d.totalSpent)}</p>
            <h3>Đơn hàng gần đây</h3>
            <table className="table">
              <thead><tr><th>Mã đơn</th><th>Ngày</th><th>Tổng</th><th>Trạng thái</th></tr></thead>
              <tbody>
                {d.orders.map((o) => (
                  <tr key={o._id}>
                    <td><Link to={`/admin/orders/${o._id}`}>{o.orderCode}</Link></td>
                    <td>{formatDate(o.createdAt, false)}</td>
                    <td>{formatPrice(o.totalAmount)}</td>
                    <td><OrderBadge status={o.orderStatus} /></td>
                  </tr>
                ))}
                {d.orders.length === 0 && <tr><td colSpan="4" className="muted">Chưa có đơn hàng</td></tr>}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [q, setQ] = useState({ keyword: '', role: '', status: '', page: 1 });
  const [keyword, setKeyword] = useState('');
  const [data, setData] = useState({ items: [], page: 1, pages: 0, total: 0 });
  const [detailId, setDetailId] = useState(null);

  const load = useCallback(() => {
    api.get('/admin/users', { params: q }).then((r) => setData(r.data));
  }, [q]);
  useEffect(load, [load]);

  const toggleStatus = async (u) => {
    if (!window.confirm(`${u.isActive ? 'Khóa' : 'Mở khóa'} tài khoản ${u.email}?`)) return;
    try {
      const { data: res } = await api.patch(`/admin/users/${u._id}/status`);
      toast.success(res.message);
      load();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const changeRole = async (u, role) => {
    try {
      const { data: res } = await api.patch(`/admin/users/${u._id}/role`, { role });
      toast.success(res.message);
      load();
    } catch (e) {
      toast.error(errMsg(e));
      load();
    }
  };

  return (
    <>
      <h1>Quản lý người dùng <span className="muted">({data.total})</span></h1>
      <div className="card pad filter-row">
        <form onSubmit={(e) => { e.preventDefault(); setQ({ ...q, keyword, page: 1 }); }}>
          <input id="au-search" placeholder="Tìm theo tên, email, SĐT" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
        </form>
        <select id="au-role" value={q.role} onChange={(e) => setQ({ ...q, role: e.target.value, page: 1 })}>
          <option value="">Mọi vai trò</option>
          <option value="customer">Khách hàng</option>
          <option value="admin">Quản trị viên</option>
        </select>
        <select id="au-status" value={q.status} onChange={(e) => setQ({ ...q, status: e.target.value, page: 1 })}>
          <option value="">Mọi trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="locked">Đã khóa</option>
        </select>
      </div>
      <div className="card table-wrap">
        <table className="table">
          <thead><tr><th>Họ tên</th><th>Email</th><th>SĐT</th><th>Vai trò</th><th>Ngày tạo</th><th>Trạng thái</th><th></th></tr></thead>
          <tbody>
            {data.items.map((u) => (
              <tr key={u._id}>
                <td>{u.fullName}</td>
                <td>{u.email}</td>
                <td>{u.phone}</td>
                <td>
                  <select value={u.role} disabled={u._id === me._id} onChange={(e) => changeRole(u, e.target.value)}>
                    <option value="customer">Khách hàng</option>
                    <option value="admin">Quản trị viên</option>
                  </select>
                </td>
                <td>{formatDate(u.createdAt, false)}</td>
                <td>{u.isActive ? <Badge tone="ok">Hoạt động</Badge> : <Badge tone="bad">Đã khóa</Badge>}</td>
                <td className="actions">
                  <button className="btn ghost" onClick={() => setDetailId(u._id)}>Chi tiết</button>
                  {u._id !== me._id && (
                    <button className={`btn ghost ${u.isActive ? 'danger' : ''}`} onClick={() => toggleStatus(u)}>{u.isActive ? 'Khóa' : 'Mở khóa'}</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={data.page} pages={data.pages} onChange={(page) => setQ({ ...q, page })} />
      {detailId && <UserDetail id={detailId} onClose={() => setDetailId(null)} />}
    </>
  );
}
