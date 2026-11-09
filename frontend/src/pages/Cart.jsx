import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Empty } from '../components/common';
import { formatPrice, shippingFeeOf, FREE_SHIP_FROM } from '../utils/format';

export default function Cart() {
  const { cart, loaded, updateQty, removeItem } = useCart();
  const navigate = useNavigate();

  if (!loaded) return <p className="muted">Đang tải giỏ hàng...</p>;
  if (cart.items.length === 0)
    return (
      <Empty title="Giỏ hàng đang trống">
        <Link className="btn primary" to="/products">Tiếp tục mua sắm</Link>
      </Empty>
    );

  const fee = shippingFeeOf(cart.subtotal);

  return (
    <>
      <h1>Giỏ hàng ({cart.count} sản phẩm)</h1>
      <div className="two-col">
        <div className="card">
          {cart.items.map(({ product: p, quantity, lineTotal, available, overStock }) => (
            <div key={p._id} className={`cart-item ${!available ? 'disabled' : ''}`}>
              <img src={p.images?.[0]} alt="" />
              <div className="cart-info">
                <Link to={`/products/${p.slug}`}>{p.name}</Link>
                <span className="muted small">Đơn giá: {formatPrice(p.finalPrice)}</span>
                {!available && <span className="bad-text small">Sản phẩm đã ngừng bán hoặc hết hàng</span>}
                {available && overStock && <span className="bad-text small">Chỉ còn {p.stock} sản phẩm</span>}
              </div>
              <div className="qty">
                <button onClick={() => quantity > 1 && updateQty(p._id, quantity - 1)} disabled={quantity <= 1}>−</button>
                <input value={quantity} readOnly aria-label="Số lượng" />
                <button onClick={() => updateQty(p._id, quantity + 1)} disabled={quantity >= p.stock}>+</button>
              </div>
              <b className="line-total">{formatPrice(lineTotal)}</b>
              <button className="btn ghost danger" onClick={() => removeItem(p._id)} aria-label="Xóa">✕</button>
            </div>
          ))}
        </div>

        <aside className="card pad summary">
          <div className="row"><span>Tạm tính</span><b>{formatPrice(cart.subtotal)}</b></div>
          <div className="row"><span>Phí vận chuyển</span><b>{fee === 0 ? 'Miễn phí' : formatPrice(fee)}</b></div>
          {fee > 0 && <p className="muted small">Mua thêm {formatPrice(FREE_SHIP_FROM - cart.subtotal)} để được miễn phí vận chuyển</p>}
          <div className="row total"><span>Tổng cộng</span><b>{formatPrice(cart.subtotal + fee)}</b></div>
          {!cart.canCheckout && <p className="alert warn small">Vui lòng xóa hoặc điều chỉnh các sản phẩm không hợp lệ trước khi thanh toán.</p>}
          <button className="btn primary block lg" disabled={!cart.canCheckout} onClick={() => navigate('/checkout')}>Thanh toán</button>
          <Link to="/products" className="btn ghost block">Tiếp tục mua sắm</Link>
        </aside>
      </div>
    </>
  );
}
