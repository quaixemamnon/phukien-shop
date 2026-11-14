import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errMsg } from '../../api';
import OrderInfo, { BackLink } from '../../components/OrderInfo';
import { useAuth } from '../../context/AuthContext';

// Các bước chuyển trạng thái hợp lệ (giống backend)
const ACTIONS = {
  pending: [['confirmed', 'Xác nhận đơn', 'primary'], ['cancelled', 'Hủy đơn', 'danger']],
  confirmed: [['shipping', 'Chuyển sang Đang giao', 'primary'], ['cancelled', 'Hủy đơn', 'danger']],
  shipping: [['delivered', 'Xác nhận Đã giao', 'primary']],
  delivered: [],
  cancelled: [],
};

export default function AdminOrderDetail() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const [order, setOrder] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.get(`/admin/orders/${id}`).then((r) => setOrder(r.data));
  }, [id]);
  useEffect(load, [load]);

  if (!order) return <p className="muted">Đang tải...</p>;

  const change = async (status) => {
    let note;
    if (status === 'cancelled') {
      note = window.prompt('Nhập lý do hủy đơn:', 'Hết hàng / khách không nhận');
      if (note === null) return;
    }
    setBusy(true);
    try {
      const { data } = await api.patch(`/admin/orders/${id}/status`, { status, note });
      toast.success(data.message);
      setOrder(data.order.user?.email ? data.order : { ...data.order, user: order.user });
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const waitingPayment = order.paymentMethod !== 'COD' && order.paymentStatus !== 'paid' && order.orderStatus === 'pending';
  const needRefund = order.orderStatus === 'cancelled' && order.paymentMethod !== 'COD' && order.paymentStatus === 'paid';

  const refund = async () => {
    const note = window.prompt('Ghi chú hoàn tiền (ví dụ: đã chuyển lại qua MoMo, mã GD...):', '');
    if (note === null) return;
    setBusy(true);
    try {
      const { data } = await api.patch(`/admin/orders/${id}/refund`, { note });
      toast.success(data.message);
      setOrder({ ...data.order, user: order.user });
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <BackLink to="/admin/orders">Danh sách đơn hàng</BackLink>
      <div className="toolbar">
        <h1>Đơn hàng {order.orderCode}</h1>
        <div className="row-center">
          {ACTIONS[order.orderStatus].map(([s, label, tone]) => (
            <button key={s} className={`btn ${tone === 'danger' ? 'outline danger' : 'primary'}`} disabled={busy || (waitingPayment && s !== 'cancelled')} onClick={() => change(s)}>
              {label}
            </button>
          ))}
        </div>
      </div>
      {waitingPayment && <p className="alert warn">Đơn thanh toán online đang chờ khách thanh toán. Hệ thống sẽ tự hủy nếu quá 30 phút.</p>}
      {needRefund && (
        <div className="alert warn row-between">
          <span>Đơn đã thanh toán qua MoMo nhưng bị hủy, cần hoàn tiền cho khách.</span>
          {isAdmin ? (
            <button className="btn primary" disabled={busy} onClick={refund}>Xác nhận đã hoàn tiền</button>
          ) : (
            <span className="small">Báo quản trị viên để hoàn tiền.</span>
          )}
        </div>
      )}
      <OrderInfo order={order} />
    </>
  );
}
