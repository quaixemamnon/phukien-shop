import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { Empty, OrderBadge, PayBadge } from '../components/common';
import { formatDate, formatPrice, ORDER_STATUS } from '../utils/format';

export default function MyOrders() {
  const [status, setStatus] = useState('');
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    setOrders(null);
    api.get('/orders/my', { params: status ? { status } : {} }).then((r) => setOrders(r.data));
  }, [status]);

  return (
    <>
      <h1>Đơn hàng của tôi</h1>
      <p className="muted small">Bấm vào một đơn để xem chi tiết. Khi đơn chuyển sang “Đã giao”, bạn có thể đánh giá từng sản phẩm trong trang chi tiết đơn.</p>
      <div className="tabs">
        <button className={!status ? 'active' : ''} onClick={() => setStatus('')}>Tất cả</button>
        {Object.entries(ORDER_STATUS).map(([k, v]) => (
          <button key={k} className={status === k ? 'active' : ''} onClick={() => setStatus(k)}>{v.label}</button>
        ))}
      </div>

      {!orders ? (
        <p className="muted">Đang tải...</p>
      ) : orders.length === 0 ? (
        <Empty title="Chưa có đơn hàng nào"><Link className="btn primary" to="/products">Mua sắm ngay</Link></Empty>
      ) : (
        <div className="stack">
          {orders.map((o) => (
            <Link key={o._id} to={`/orders/${o._id}`} className="card pad order-row">
              <div>
                <b>{o.orderCode}</b> <span className="muted small">· {formatDate(o.createdAt)}</span>
                <div className="muted small">{o.items.map((i) => `${i.name} × ${i.quantity}`).join(', ')}</div>
              </div>
              <div className="order-row-right">
                <OrderBadge status={o.orderStatus} /> <PayBadge status={o.paymentStatus} />
                <b>{formatPrice(o.totalAmount)}</b>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
