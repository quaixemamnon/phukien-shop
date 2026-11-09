import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api';
import { Empty, Pagination, ProductCard } from '../components/common';

const SORTS = [
  ['newest', 'Mới nhất'],
  ['best_selling', 'Bán chạy'],
  ['price_asc', 'Giá tăng dần'],
  ['price_desc', 'Giá giảm dần'],
  ['rating', 'Đánh giá cao'],
];

export default function Products() {
  const [params, setParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [result, setResult] = useState({ items: [], total: 0, page: 1, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [price, setPrice] = useState({ min: params.get('minPrice') || '', max: params.get('maxPrice') || '' });

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data)).catch(() => {});
    api.get('/brands').then((r) => setBrands(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    api
      .get('/products', { params: Object.fromEntries(params) })
      .then((r) => setResult(r.data))
      .finally(() => setLoading(false));
    window.scrollTo(0, 0);
  }, [params]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next);
  };

  const selectedBrands = (params.get('brand') || '').split(',').filter(Boolean);
  const toggleBrand = (slug) => {
    const list = selectedBrands.includes(slug) ? selectedBrands.filter((b) => b !== slug) : [...selectedBrands, slug];
    setParam('brand', list.join(','));
  };

  const applyPrice = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(params);
    price.min ? next.set('minPrice', price.min) : next.delete('minPrice');
    price.max ? next.set('maxPrice', price.max) : next.delete('maxPrice');
    next.delete('page');
    setParams(next);
  };

  const keyword = params.get('keyword');
  const currentCat = categories.find((c) => c.slug === params.get('category'));

  return (
    <div className="shop-layout">
      <aside className="card filters">
        <h3>Danh mục</h3>
        <label className="radio">
          <input type="radio" name="cat" checked={!params.get('category')} onChange={() => setParam('category', '')} /> Tất cả
        </label>
        {categories.map((c) => (
          <label key={c._id} className="radio">
            <input type="radio" name="cat" checked={params.get('category') === c.slug} onChange={() => setParam('category', c.slug)} /> {c.name}
          </label>
        ))}

        <h3>Thương hiệu</h3>
        {brands.map((b) => (
          <label key={b._id} className="radio">
            <input type="checkbox" checked={selectedBrands.includes(b.slug)} onChange={() => toggleBrand(b.slug)} /> {b.name}
          </label>
        ))}

        <h3>Khoảng giá (₫)</h3>
        <form onSubmit={applyPrice} className="price-filter">
          <input id="min-price" type="number" min="0" placeholder="Từ" value={price.min} onChange={(e) => setPrice({ ...price, min: e.target.value })} />
          <input id="max-price" type="number" min="0" placeholder="Đến" value={price.max} onChange={(e) => setPrice({ ...price, max: e.target.value })} />
          <button className="btn outline block" type="submit">Áp dụng</button>
        </form>
        <button className="btn ghost block" onClick={() => { setPrice({ min: '', max: '' }); setParams({}); }}>Xóa bộ lọc</button>
      </aside>

      <section>
        <div className="toolbar">
          <h1 className="h2">
            {keyword ? `Kết quả cho “${keyword}”` : currentCat ? currentCat.name : 'Tất cả sản phẩm'}
            <span className="muted"> ({result.total} sản phẩm)</span>
          </h1>
          <select id="sort" value={params.get('sort') || 'newest'} onChange={(e) => setParam('sort', e.target.value)}>
            {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>

        {loading ? (
          <p className="muted">Đang tải...</p>
        ) : result.items.length === 0 ? (
          <Empty title="Không tìm thấy sản phẩm phù hợp"><p>Hãy thử từ khóa khác hoặc bỏ bớt bộ lọc.</p></Empty>
        ) : (
          <div className="grid products-grid">
            {result.items.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        )}
        <Pagination page={result.page} pages={result.pages} onChange={(p) => setParam('page', String(p))} />
      </section>
    </div>
  );
}
