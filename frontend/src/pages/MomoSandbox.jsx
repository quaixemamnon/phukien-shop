import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api, { errMsg } from '../api';
import { formatPrice } from '../utils/format';

// Cổng thanh toán MoMo MÔ PHỎNG (backend chạy với MOMO_MODE=mock).
// Dùng để demo luồng thanh toán ví khi chưa có tài khoản MoMo doanh nghiệp. Không phát sinh giao dịch tiền thật.
export default function MomoSandbox() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const orderId = params.get('orderId');
  const [info, setInfo] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [seconds, setSeconds] = useState(15 * 60);

  useEffect(() => {
    api.get(`/payment/momo-mock/${orderId}`).then((r) => setInfo(r.data)).catch((e) => setError(errMsg(e)));
  }, [orderId]);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const finish = async (success) => {
    setBusy(true);
    try {
      const { data } = await api.post('/payment/momo-mock/complete', { orderId, success });
      navigate(`/payment/momo-return?${data.query}`, { replace: true });
    } catch (e) {
      setError(errMsg(e));
      setBusy(false);
    }
  };

  if (error) {
    return (
      <div className="auth-box card center">
        <p className="alert bad">{error}</p>
        <Link className="btn ghost" to="/orders">Về đơn hàng của tôi</Link>
      </div>
    );
  }
  if (!info) return <p className="muted center">Đang tải giao dịch...</p>;

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <div className="momo-sandbox card">
      <div className="momo-head">
        <b>Cổng thanh toán ví MoMo</b>
        <span className="badge warn">Chế độ mô phỏng</span>
      </div>
      <p className="alert warn small">
        Đây là trang mô phỏng cổng MoMo để thử nghiệm khi chưa kết nối tài khoản MoMo doanh nghiệp. Không có tiền thật được trừ.
        Khi cấu hình khóa MoMo thật (MOMO_MODE=real), khách sẽ được chuyển sang trang của MoMo.
      </p>

      <div className="momo-body">
        <div className="momo-qr" aria-label="Mã QR mô phỏng">
          {Array.from({ length: 81 }).map((_, i) => {
            const r = Math.floor(i / 9), c = i % 9;
            const corner = (r < 3 && c < 3) || (r < 3 && c > 5) || (r > 5 && c < 3);
            const on = corner || (orderId.charCodeAt(i % orderId.length) + i) % 3 === 0;
            return <span key={i} className={on ? 'on' : ''} />;
          })}
        </div>
        <div className="momo-info">
          <div className="row"><span className="muted">Nhà cung cấp</span><b>Phụ Kiện Shop</b></div>
          <div className="row"><span className="muted">Mã đơn hàng</span><b>{info.orderCode}</b></div>
          <div className="row"><span className="muted">Mã giao dịch</span><span className="small">{orderId}</span></div>
          <div className="row total"><span>Số tiền</span><b>{formatPrice(info.amount)}</b></div>
          <p className="muted small">Giao dịch hết hạn sau <b>{mm}:{ss}</b></p>
          <button className="btn momo-btn block lg" disabled={busy || seconds === 0} onClick={() => finish(true)}>
            Xác nhận thanh toán
          </button>
          <button className="btn ghost block" disabled={busy} onClick={() => finish(false)}>Hủy giao dịch</button>
        </div>
      </div>
    </div>
  );
}
