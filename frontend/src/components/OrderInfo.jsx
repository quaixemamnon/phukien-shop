// Hiển thị thông tin đơn hàng, dùng chung cho khách hàng và admin
import { Link } from 'react-router-dom';
import { OrderBadge, PayBadge } from './common';
import { formatDate, formatPrice, fullAddress, ORDER_STATUS, PAYMENT_METHOD } from '../utils/format';

export default function OrderInfo({ order, renderItemAction }) {
  const a = order.shippingAddress || {};
  return (
    <div className="two-col">
      <section className="card pad">
        <h2>Sản phẩm</h2>
        {order.items.map((i) => (
          <div key={String(i.product)} className="order-item">
            <img src={i.image} alt="" />
            <div className="grow">
              <div>{i.name}</div>
              <span className="muted small">{formatPrice(i.price)} × {i.quantity}</span>
            </div>
            <b>{formatPrice(i.price * i.quantity)}</b>
            {renderItemAction && renderItemAction(i)}
          </div>
        ))}
        <hr />
        <div className="row"><span>Tạm tính</span><span>{formatPrice(order.subtotal)}</span></div>
        <div className="row"><span>Phí vận chuyển</span><span>{order.shippingFee ? formatPrice(order.shippingFee) : 'Miễn phí'}</span></div>
        <div className="row total"><span>Tổng thanh toán</span><b>{formatPrice(order.totalAmount)}</b></div>
      </section>

      <aside className="stack">
        <section className="card pad">
          <h2>Thông tin</h2>
          <p>Trạng thái: <OrderBadge status={order.orderStatus} /></p>
          <p>Thanh toán: {PAYMENT_METHOD[order.paymentMethod]} · <PayBadge status={order.paymentStatus} /></p>
          {order.paymentInfo?.transactionId && <p className="small muted">Mã giao dịch: {order.paymentInfo.transactionId}</p>}
          <p className="small muted">Ngày đặt: {formatDate(order.createdAt)}</p>
          {order.cancelReason && <p className="bad-text">Lý do hủy: {order.cancelReason}</p>}
          {order.note && <p>Ghi chú: {order.note}</p>}
        </section>
        <section className="card pad">
          <h2>Giao đến</h2>
          <p><b>{a.fullName}</b> · {a.phone}</p>
          <p className="muted">{fullAddress(a)}</p>
          {order.user?.email && <p className="small muted">Tài khoản: {order.user.fullName} ({order.user.email})</p>}
        </section>
        <section className="card pad">
          <h2>Lịch sử trạng thái</h2>
          <ul className="timeline">
            {[...order.statusHistory].reverse().map((h, idx) => (
              <li key={idx}>
                <b>{ORDER_STATUS[h.status]?.label || h.status}</b>
                <span className="muted small"> · {formatDate(h.updatedAt)}</span>
                {h.note && <div className="small">{h.note}</div>}
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  );
}

export const BackLink = ({ to, children }) => <Link to={to} className="back-link">‹ {children}</Link>;
