import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import api from '../../api';
import { OrderBadge } from '../../components/common';
import { formatDate, formatPrice } from '../../utils/format';

const shortMoney = (v) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}tr` : v >= 1e3 ? `${Math.round(v / 1e3)}k` : v);

export default function Dashboard() {
  const [d, setD] = useState(null);
  useEffect(() => {
    api.get('/admin/stats/overview').then((r) => setD(r.data));
  }, []);
  if (!d) return <p className="muted">Đang tải...</p>;

  // Nhân viên không nhận số liệu doanh thu từ server (d.totalRevenue không có)
  const showRevenue = d.totalRevenue !== undefined;
  const cards = [
    showRevenue && ['Doanh thu (đơn đã giao)', formatPrice(d.totalRevenue)],
    ['Tổng đơn hàng', d.orderCount],
    ['Đơn chờ xác nhận', d.pendingOrders, '/admin/orders?status=pending'],
    d.refundPending > 0 && ['Đơn hủy chờ hoàn tiền', d.refundPending, '/admin/orders?status=cancelled'],
    ['Khách hàng', d.customerCount],
    ['Sản phẩm đang bán', d.productCount],
  ].filter(Boolean);

  return (
    <>
      <h1>Tổng quan</h1>
      <div className="grid stat-grid">
        {cards.map(([label, value, link]) => (
          <div key={label} className="card pad stat">
            <span className="muted small">{label}</span>
            <b>{value}</b>
            {link && <Link to={link} className="small">Xử lý ngay ›</Link>}
          </div>
        ))}
      </div>

      {showRevenue && <section className="card pad">
        <h2>Doanh thu 12 tháng gần nhất</h2>
        {d.monthly.length === 0 ? (
          <p className="muted">Chưa có đơn hàng đã giao.</p>
        ) : (
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={d.monthly}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="_id" />
                <YAxis tickFormatter={shortMoney} width={50} />
                <Tooltip formatter={(v, n) => (n === 'revenue' ? [formatPrice(v), 'Doanh thu'] : [v, 'Số đơn'])} />
                <Bar dataKey="revenue" fill="#0a6a94" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>}

      <div className="two-col even">
        <section className="card pad">
          <h2>Sản phẩm bán chạy</h2>
          <table className="table">
            <thead><tr><th>Sản phẩm</th><th>Đã bán</th>{showRevenue && <th>Doanh thu</th>}</tr></thead>
            <tbody>
              {d.topProducts.map((p) => (
                <tr key={p._id}><td>{p.name}</td><td>{p.quantity}</td>{showRevenue && <td>{formatPrice(p.revenue)}</td>}</tr>
              ))}
              {d.topProducts.length === 0 && <tr><td colSpan="3" className="muted">Chưa có dữ liệu</td></tr>}
            </tbody>
          </table>
        </section>
        <section className="card pad">
          <h2>Sắp hết hàng (≤ 5)</h2>
          <table className="table">
            <thead><tr><th>Sản phẩm</th><th>SKU</th><th>Tồn</th></tr></thead>
            <tbody>
              {d.lowStock.map((p) => (
                <tr key={p._id}><td><Link to={`/admin/products/${p._id}/edit`}>{p.name}</Link></td><td>{p.sku}</td><td className="bad-text">{p.stock}</td></tr>
              ))}
              {d.lowStock.length === 0 && <tr><td colSpan="3" className="muted">Không có sản phẩm sắp hết</td></tr>}
            </tbody>
          </table>
        </section>
      </div>

      <section className="card pad">
        <h2>Đơn hàng mới</h2>
        <table className="table">
          <thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Ngày đặt</th><th>Tổng tiền</th><th>Trạng thái</th></tr></thead>
          <tbody>
            {d.recentOrders.map((o) => (
              <tr key={o._id}>
                <td><Link to={`/admin/orders/${o._id}`}>{o.orderCode}</Link></td>
                <td>{o.user?.fullName}</td>
                <td>{formatDate(o.createdAt)}</td>
                <td>{formatPrice(o.totalAmount)}</td>
                <td><OrderBadge status={o.orderStatus} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
