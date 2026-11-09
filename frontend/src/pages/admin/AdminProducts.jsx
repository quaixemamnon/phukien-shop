import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errMsg } from '../../api';
import { Badge, Pagination } from '../../components/common';
import { formatPrice } from '../../utils/format';

export default function AdminProducts() {
  const [q, setQ] = useState({ keyword: '', category: '', status: '', page: 1 });
  const [keywordInput, setKeywordInput] = useState('');
  const [categories, setCategories] = useState([]);
  const [data, setData] = useState({ items: [], page: 1, pages: 0, total: 0 });

  const load = useCallback(() => {
    api.get('/admin/products', { params: q }).then((r) => setData(r.data));
  }, [q]);

  useEffect(load, [load]);
  useEffect(() => {
    api.get('/admin/categories').then((r) => setCategories(r.data));
  }, []);

  const toggle = async (p) => {
    try {
      const { data: res } = await api.patch(`/admin/products/${p._id}/visibility`);
      toast.success(res.message);
      load();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const remove = async (p) => {
    if (!window.confirm(`Xóa sản phẩm "${p.name}"?\nNếu sản phẩm đã có trong đơn hàng, hệ thống sẽ chỉ ẩn sản phẩm.`)) return;
    try {
      const { data: res } = await api.delete(`/admin/products/${p._id}`);
      toast.success(res.message);
      load();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  return (
    <>
      <div className="toolbar">
        <h1>Quản lý sản phẩm <span className="muted">({data.total})</span></h1>
        <Link to="/admin/products/new" className="btn primary">+ Thêm sản phẩm</Link>
      </div>
      <div className="card pad filter-row">
        <form onSubmit={(e) => { e.preventDefault(); setQ({ ...q, keyword: keywordInput, page: 1 }); }}>
          <input id="ap-search" placeholder="Tìm theo tên hoặc SKU" value={keywordInput} onChange={(e) => setKeywordInput(e.target.value)} />
        </form>
        <select id="ap-cat" value={q.category} onChange={(e) => setQ({ ...q, category: e.target.value, page: 1 })}>
          <option value="">Tất cả danh mục</option>
          {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <select id="ap-status" value={q.status} onChange={(e) => setQ({ ...q, status: e.target.value, page: 1 })}>
          <option value="">Tất cả trạng thái</option>
          <option value="active">Đang bán</option>
          <option value="hidden">Đã ẩn</option>
          <option value="out">Hết hàng</option>
        </select>
      </div>

      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr><th>Ảnh</th><th>Tên sản phẩm</th><th>SKU</th><th>Danh mục</th><th>Giá</th><th>Tồn</th><th>Đã bán</th><th>Trạng thái</th><th></th></tr>
          </thead>
          <tbody>
            {data.items.map((p) => (
              <tr key={p._id}>
                <td><img className="thumb-sm" src={p.images[0]} alt="" /></td>
                <td>{p.name}<div className="muted small">{p.brand?.name}</div></td>
                <td>{p.sku}</td>
                <td>{p.category?.name}</td>
                <td>{formatPrice(p.finalPrice)}{p.salePrice != null && <div className="muted small"><s>{formatPrice(p.price)}</s></div>}</td>
                <td className={p.stock <= 5 ? 'bad-text' : ''}>{p.stock}</td>
                <td>{p.sold}</td>
                <td>{p.isActive ? <Badge tone="ok">Đang bán</Badge> : <Badge>Đã ẩn</Badge>}</td>
                <td className="actions">
                  <Link className="btn ghost" to={`/admin/products/${p._id}/edit`}>Sửa</Link>
                  <button className="btn ghost" onClick={() => toggle(p)}>{p.isActive ? 'Ẩn' : 'Hiện'}</button>
                  <button className="btn ghost danger" onClick={() => remove(p)}>Xóa</button>
                </td>
              </tr>
            ))}
            {data.items.length === 0 && <tr><td colSpan="9" className="muted center">Không có sản phẩm</td></tr>}
          </tbody>
        </table>
      </div>
      <Pagination page={data.page} pages={data.pages} onChange={(page) => setQ({ ...q, page })} />
    </>
  );
}
