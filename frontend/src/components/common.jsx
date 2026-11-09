import { Link } from 'react-router-dom';
import { formatPrice, ORDER_STATUS, PAYMENT_STATUS } from '../utils/format';
import { useCart } from '../context/CartContext';

export function Stars({ value = 0, size = 14 }) {
  const full = Math.round(value);
  return (
    <span className="stars" style={{ fontSize: size }} aria-label={`${value} sao`}>
      {'★★★★★'.slice(0, full)}
      <span className="stars-off">{'★★★★★'.slice(full)}</span>
    </span>
  );
}

export function Price({ price, salePrice }) {
  const onSale = salePrice != null && salePrice < price;
  return (
    <span className="price">
      <b>{formatPrice(onSale ? salePrice : price)}</b>
      {onSale && <s>{formatPrice(price)}</s>}
      {onSale && <em className="discount">-{Math.round((1 - salePrice / price) * 100)}%</em>}
    </span>
  );
}

export function ProductCard({ product }) {
  const { addToCart } = useCart();
  return (
    <div className="card product-card">
      <Link to={`/products/${product.slug}`} className="product-thumb">
        <img src={product.images?.[0]} alt={product.name} loading="lazy" />
      </Link>
      <div className="product-body">
        <Link to={`/products/${product.slug}`} className="product-name">{product.name}</Link>
        <Price price={product.price} salePrice={product.salePrice} />
        <div className="product-meta">
          <Stars value={product.averageRating} /> <span className="muted">Đã bán {product.sold}</span>
        </div>
        <button className="btn primary block" disabled={product.stock === 0} onClick={() => addToCart(product._id, 1)}>
          {product.stock === 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
        </button>
      </div>
    </div>
  );
}

export function Badge({ tone = 'muted', children }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

export const OrderBadge = ({ status }) => <Badge tone={ORDER_STATUS[status]?.tone}>{ORDER_STATUS[status]?.label || status}</Badge>;
export const PayBadge = ({ status }) => <Badge tone={PAYMENT_STATUS[status]?.tone}>{PAYMENT_STATUS[status]?.label || status}</Badge>;

export function Pagination({ page, pages, onChange }) {
  if (!pages || pages <= 1) return null;
  const nums = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) nums.push(i);
  return (
    <div className="pagination">
      <button className="btn ghost" disabled={page <= 1} onClick={() => onChange(page - 1)}>‹</button>
      {nums.map((n) => (
        <button key={n} className={`btn ${n === page ? 'primary' : 'ghost'}`} onClick={() => onChange(n)}>{n}</button>
      ))}
      <button className="btn ghost" disabled={page >= pages} onClick={() => onChange(page + 1)}>›</button>
    </div>
  );
}

export function Empty({ title, children }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {children}
    </div>
  );
}
