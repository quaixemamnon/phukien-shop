import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import api from '../api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Price, ProductCard, Stars } from '../components/common';
import ReviewForm from '../components/ReviewForm';

// Khu vực "Viết đánh giá": chỉ khách đã mua và nhận hàng mới thấy form
function WriteReview({ productId, onDone }) {
  const { user, isAdmin } = useAuth();
  const location = useLocation();
  const [elig, setElig] = useState(null);

  useEffect(() => {
    if (!user || isAdmin) return;
    api.get(`/reviews/eligible/${productId}`).then((r) => setElig(r.data)).catch(() => setElig(null));
  }, [productId, user, isAdmin]);

  if (isAdmin) return null;
  if (!user) {
    return (
      <p className="review-note">
        <Link to="/login" state={{ from: location.pathname }}>Đăng nhập</Link> để đánh giá sản phẩm bạn đã mua.
      </p>
    );
  }
  if (!elig) return null;
  if (!elig.canReview) return <p className="review-note">{elig.reason}</p>;
  return (
    <div className="review-box">
      <b>Viết đánh giá</b> <span className="muted small">(đơn hàng {elig.orderCode})</span>
      <ReviewForm orderId={elig.orderId} productId={productId} onDone={() => { setElig({ canReview: false, reason: 'Bạn đã đánh giá sản phẩm này. Cảm ơn bạn!' }); onDone(); }} />
    </div>
  );
}
import { formatDate } from '../utils/format';
import NotFound from './NotFound';

export default function ProductDetail() {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const [data, setData] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(
    (keepScroll) => {
      api
        .get(`/products/${slug}`)
        .then((r) => {
          setData(r.data);
          return api.get(`/products/${r.data.product._id}/reviews`);
        })
        .then((r) => setReviews(r.data))
        .catch((e) => e.response?.status === 404 && setNotFound(true));
      if (!keepScroll) window.scrollTo(0, 0);
    },
    [slug]
  );

  useEffect(() => {
    setData(null);
    setNotFound(false);
    setActiveImg(0);
    setQty(1);
    load(false);
  }, [load]);

  if (notFound) return <NotFound />;
  if (!data) return <p className="muted">Đang tải...</p>;
  const { product: p, related } = data;

  return (
    <>
      <nav className="breadcrumb">
        <Link to="/">Trang chủ</Link> / <Link to={`/products?category=${p.category.slug}`}>{p.category.name}</Link> / <span>{p.name}</span>
      </nav>

      <div className="detail card">
        <div className="gallery">
          <img className="main-img" src={p.images[activeImg]} alt={p.name} />
          <div className="thumbs">
            {p.images.map((src, i) => (
              <button key={src + i} className={i === activeImg ? 'active' : ''} onClick={() => setActiveImg(i)}>
                <img src={src} alt="" />
              </button>
            ))}
          </div>
        </div>

        <div className="detail-info">
          <h1>{p.name}</h1>
          <p className="muted">
            Thương hiệu: <Link to={`/products?brand=${p.brand.slug}`}>{p.brand.name}</Link> · SKU: {p.sku}
          </p>
          <p><Stars value={p.averageRating} size={16} /> <span className="muted">({p.numReviews} đánh giá) · Đã bán {p.sold}</span></p>
          <div className="big-price"><Price price={p.price} salePrice={p.salePrice} /></div>
          <p>
            Tình trạng: {p.stock > 0 ? <b className="ok-text">Còn {p.stock} sản phẩm</b> : <b className="bad-text">Hết hàng</b>}
          </p>
          {p.warrantyMonths > 0 && <p>Bảo hành: {p.warrantyMonths} tháng</p>}

          {p.stock > 0 && (
            <div className="buy-row">
              <div className="qty">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                <input id="qty" type="number" min="1" max={p.stock} value={qty} onChange={(e) => setQty(Math.min(p.stock, Math.max(1, +e.target.value || 1)))} />
                <button onClick={() => setQty((q) => Math.min(p.stock, q + 1))}>+</button>
              </div>
              <button className="btn primary lg" onClick={() => addToCart(p._id, qty)}>Thêm vào giỏ hàng</button>
            </div>
          )}
        </div>
      </div>

      <div className="detail-bottom">
        <section className="card pad">
          <h2>Mô tả sản phẩm</h2>
          <p className="pre-line">{p.description || 'Đang cập nhật.'}</p>
          {p.specifications?.length > 0 && (
            <>
              <h2>Thông số kỹ thuật</h2>
              <table className="table specs">
                <tbody>
                  {p.specifications.map((s) => (
                    <tr key={s.key}><th>{s.key}</th><td>{s.value}</td></tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </section>

        <section className="card pad">
          <h2>Đánh giá ({reviews.length})</h2>
          {reviews.length > 0 && (
            <p className="rating-summary">
              <b>{p.averageRating.toFixed(1)}</b>/5 <Stars value={p.averageRating} size={16} /> <span className="muted">({p.numReviews} đánh giá)</span>
            </p>
          )}
          <WriteReview productId={p._id} onDone={() => load(true)} />
          {reviews.length === 0 && <p className="muted">Chưa có đánh giá nào cho sản phẩm này.</p>}
          {reviews.map((r) => (
            <div key={r._id} className="review">
              <b>{r.user?.fullName || 'Khách hàng'}</b> <Stars value={r.rating} />
              <span className="muted small"> · {formatDate(r.createdAt, false)}</span>
              {r.comment && <p>{r.comment}</p>}
            </div>
          ))}
        </section>
      </div>

      {related.length > 0 && (
        <section className="section">
          <div className="section-head"><h2>Sản phẩm liên quan</h2></div>
          <div className="grid products-grid">
            {related.map((rp) => <ProductCard key={rp._id} product={rp} />)}
          </div>
        </section>
      )}
    </>
  );
}
