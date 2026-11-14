import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/format';

// Trang khách quay về sau khi thanh toán MoMo
export default function PaymentResult({ gateway }) {
  const { search } = useLocation();
  const { fetchCart } = useCart();
  const [state, setState] = useState({ loading: true });
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return; // tránh gọi 2 lần trong StrictMode
    called.current = true;
    api
      .get(`/payment/${gateway}-return${search}`)
      .then((r) => {
        setState({ loading: false, ...r.data });
        if (r.data.success) fetchCart();
      })
      .catch((e) => setState({ loading: false, error: errMsg(e) }));
  }, [gateway, search, fetchCart]);

  if (state.loading) return <p className="muted center">Đang xác nhận kết quả thanh toán...</p>;

  return (
    <div className="auth-box card center">
      {state.success ? (
        <>
          <div className="result-icon ok">✓</div>
          <h1>Thanh toán thành công</h1>
          <p>Đơn hàng <b>{state.order.orderCode}</b> đã được thanh toán {formatPrice(state.order.totalAmount)}.</p>
          {state.order.orderStatus === 'cancelled' && (
            <p className="alert warn">Rất tiếc, sản phẩm vừa hết hàng nên đơn đã bị hủy. Cửa hàng sẽ liên hệ hoàn tiền cho bạn.</p>
          )}
        </>
      ) : (
        <>
          <div className="result-icon bad">!</div>
          <h1>Thanh toán chưa thành công</h1>
          <p>{state.error || 'Giao dịch bị hủy hoặc thất bại. Bạn có thể thanh toán lại trong mục chi tiết đơn hàng (trong 30 phút).'}</p>
        </>
      )}
      <div className="row-center">
        {state.order && <Link className="btn primary" to={`/orders/${state.order._id}`}>Xem đơn hàng</Link>}
        <Link className="btn ghost" to="/">Về trang chủ</Link>
      </div>
    </div>
  );
}
