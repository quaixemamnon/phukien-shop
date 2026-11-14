import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import AddressForm, { EMPTY_ADDRESS, validateAddress } from '../components/AddressForm';
import { formatPrice, fullAddress, shippingFeeOf, PAYMENT_METHOD } from '../utils/format';

export default function Checkout() {
  const { user, setUser } = useAuth();
  const { cart, loaded, fetchCart } = useCart();
  const navigate = useNavigate();
  const addresses = user?.addresses || [];
  const [addressId, setAddressId] = useState(() => (addresses.find((a) => a.isDefault) || addresses[0])?._id || 'new');
  const [newAddress, setNewAddress] = useState({ ...EMPTY_ADDRESS, fullName: user?.fullName || '', phone: user?.phone || '' });
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [methods, setMethods] = useState(['COD']);

  // Cập nhật sổ địa chỉ mới nhất và lấy các phương thức thanh toán đang bật
  useEffect(() => {
    api.get('/users/me').then((r) => setUser(r.data)).catch(() => {});
    api.get('/payment/methods').then((r) => setMethods(r.data)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!loaded) return <p className="muted">Đang tải...</p>;
  if (!cart.items.length && !submitting) return <Navigate to="/cart" replace />;

  const fee = shippingFeeOf(cart.subtotal);

  const placeOrder = async () => {
    const body = { paymentMethod, note };
    if (addressId === 'new') {
      const err = validateAddress(newAddress);
      if (err) return toast.error(err);
      body.shippingAddress = newAddress;
    } else {
      body.addressId = addressId;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post('/orders', body);
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl; // chuyển sang cổng MoMo
        return;
      }
      await fetchCart();
      toast.success('Đặt hàng thành công!');
      navigate(`/orders/${data.order._id}`, { replace: true });
    } catch (e) {
      toast.error(errMsg(e));
      setSubmitting(false);
    }
  };

  return (
    <>
      <h1>Thanh toán</h1>
      <div className="two-col">
        <div className="stack">
          <section className="card pad">
            <h2>1. Địa chỉ giao hàng</h2>
            {addresses.map((a) => (
              <label key={a._id} className="option">
                <input type="radio" name="address" checked={addressId === a._id} onChange={() => setAddressId(a._id)} />
                <span>
                  <b>{a.fullName}</b> · {a.phone} {a.isDefault && <em className="badge info">Mặc định</em>}
                  <br />
                  <span className="muted">{fullAddress(a)}</span>
                </span>
              </label>
            ))}
            <label className="option">
              <input type="radio" name="address" checked={addressId === 'new'} onChange={() => setAddressId('new')} />
              <span>Giao đến địa chỉ khác</span>
            </label>
            {addressId === 'new' && <AddressForm value={newAddress} onChange={setNewAddress} idPrefix="checkout" />}
          </section>

          <section className="card pad">
            <h2>2. Phương thức thanh toán</h2>
            {Object.entries(PAYMENT_METHOD).filter(([k]) => methods.includes(k)).map(([k, label]) => (
              <label key={k} className="option">
                <input type="radio" name="payment" checked={paymentMethod === k} onChange={() => setPaymentMethod(k)} />
                <span>{label}</span>
              </label>
            ))}
            {paymentMethod !== 'COD' && (
              <p className="muted small">Bạn sẽ được chuyển sang trang {PAYMENT_METHOD[paymentMethod]} để thanh toán. Đơn hàng chưa thanh toán sẽ tự hủy sau 30 phút.</p>
            )}
            <label className="form">
              Ghi chú cho cửa hàng
              <textarea id="order-note" rows="2" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ví dụ: giao giờ hành chính" />
            </label>
          </section>
        </div>

        <aside className="card pad summary">
          <h2>Đơn hàng</h2>
          {cart.items.map((i) => (
            <div key={i.product._id} className="row small">
              <span>{i.product.name} × {i.quantity}</span>
              <span>{formatPrice(i.lineTotal)}</span>
            </div>
          ))}
          <hr />
          <div className="row"><span>Tạm tính</span><b>{formatPrice(cart.subtotal)}</b></div>
          <div className="row"><span>Phí vận chuyển</span><b>{fee === 0 ? 'Miễn phí' : formatPrice(fee)}</b></div>
          <div className="row total"><span>Tổng thanh toán</span><b>{formatPrice(cart.subtotal + fee)}</b></div>
          <button className="btn primary block lg" disabled={submitting || !cart.canCheckout} onClick={placeOrder}>
            {submitting ? 'Đang xử lý...' : 'Đặt hàng'}
          </button>
        </aside>
      </div>
    </>
  );
}
