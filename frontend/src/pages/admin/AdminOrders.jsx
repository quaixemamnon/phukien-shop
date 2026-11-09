import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../api';
import { OrderBadge, PayBadge, Pagination } from '../../components/common';
import { formatDate, formatPrice, ORDER_STATUS, PAYMENT_METHOD } from '../../utils/format';

export default function AdminOrders() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState({ items: [], page: 1, pages: 0, total: 0, counts: {} });
  const [keyword, setKeyword] = useState(params.get('keyword') || '');

  useEffect(() => {
    api.get('/admin/orders', { params: Object.fromEntries(params) }).then((r) => setData(r.data));
  }, [params]);

  const setParam = (k, v) => {
    const next = new URLSearchParams(params);
    v ? next.set(k, v) : next.delete(k);
    if (k !== 'page') next.delete('page');
    setParams(next);
  };
  const status = params.get('status') || '';

  return (
    <>
      <h1>Quản lý đơn hàng</h1>
      <div className="tabs">
        <button className={!status ? 'active' : ''} onClick={() => setParam('status', '')}>Tất cả</button>
        {Object.entries(ORDER_STATUS).map(([k, v]) => (
          <button key={k} className={status === k ? 'active' : ''} onClick={() => setParam('status', k)}>
            {v.label} {data.counts[k] ? `(${data.counts[k]})` : ''}
          </button>
        ))}
      </div>
      <div className="card pad filter-row">
        <form onSubmit={(e) => { e.preventDefault(); setParam('keyword', keyword.trim()); }}>
          <input id="ao-search" placeholder="Mã đơn, tên hoặc SĐT người nhận" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
        </form>
        <select id="ao-method" value={params.get('paymentMethod') || ''} onChange={(e) => setParam('paymentMethod', e.target.value)}>
          <option value="">Mọi phương thức</option>
          {Object.entries(PAYMENT_METHOD).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <label className="inline">Từ <input id="ao-from" type="date" value={params.get('from') || ''} onChange={(e) => setParam('from', e.target.value)} /></label>
        <label className="inline">Đến <input id="ao-to" type="date" value={params.get('to') || ''} onChange={(e) => setParam('to', e.target.value)} /></label>
      </div>

      <div className="card table-wrap">
        <table className="table">
          <thead><tr><th>Mã đơn</th><th>Người nhận</th><th>Ngày đặt</th><th>Tổng tiền</th><th>Thanh toán</th><th>Trạng thái</th></tr></thead>
          <tbody>
            {data.items.map((o) => (
              <tr key={o._id}>
                <td><Link to={`/admin/orders/${o._id}`}><b>{o.orderCode}</b></Link></td>
                <td>{o.shippingAddress?.fullName}<div className="muted small">{o.shippingAddress?.phone}</div></td>
                <td>{formatDate(o.createdAt)}</td>
                <td>{formatPrice(o.totalAmount)}</td>
                <td>{o.paymentMethod}<div><PayBadge status={o.paymentStatus} /></div></td>
                <td><OrderBadge status={o.orderStatus} /></td>
              </tr>
            ))}
            {data.items.length === 0 && <tr><td colSpan="6" className="muted center">Không có đơn hàng</td></tr>}
          </tbody>
        </table>
      </div>
      <Pagination page={data.page} pages={data.pages} onChange={(p) => setParam('page', String(p))} />
    </>
  );
}
