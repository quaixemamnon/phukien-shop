import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { ProductCard } from '../components/common';

function Section({ title, link, items }) {
  if (!items?.length) return null;
  return (
    <section className="section">
      <div className="section-head">
        <h2>{title}</h2>
        {link && <Link to={link}>Xem tất cả ›</Link>}
      </div>
      <div className="grid products-grid">
        {items.map((p) => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/products/home').then((r) => setData(r.data)).catch(() => setData({}));
  }, []);

  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">Phụ kiện chính hãng</p>
          <h1>Sạc nhanh hơn, nghe hay hơn, làm việc gọn hơn</h1>
          <p>Tai nghe, củ sạc GaN, cáp sạc, sạc dự phòng từ Anker, Baseus, Ugreen, Sony... Miễn phí giao hàng cho đơn từ 500.000₫.</p>
          <Link to="/products" className="btn primary lg">Mua sắm ngay</Link>
        </div>
      </section>

      {data?.categories?.length > 0 && (
        <section className="section">
          <div className="section-head"><h2>Danh mục</h2></div>
          <div className="grid cat-grid">
            {data.categories.map((c) => (
              <Link key={c._id} to={`/products?category=${c.slug}`} className="card cat-card">
                {c.image && <img src={c.image} alt="" />}
                <span>{c.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {!data && <p className="muted center">Đang tải sản phẩm...</p>}
      <Section title="Đang giảm giá" items={data?.onSale} link="/products?sort=price_asc" />
      <Section title="Bán chạy" items={data?.bestSelling} link="/products?sort=best_selling" />
      <Section title="Sản phẩm mới" items={data?.newest} link="/products?sort=newest" />
    </>
  );
}
