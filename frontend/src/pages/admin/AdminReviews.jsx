import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errMsg } from '../../api';
import { Badge, Pagination, Stars } from '../../components/common';
import { formatDate } from '../../utils/format';

export default function AdminReviews() {
  const [q, setQ] = useState({ hidden: '', page: 1 });
  const [data, setData] = useState({ items: [], page: 1, pages: 0 });

  const load = useCallback(() => {
    api.get('/admin/reviews', { params: q }).then((r) => setData(r.data));
  }, [q]);
  useEffect(load, [load]);

  const toggle = async (r) => {
    try {
      const { data: res } = await api.patch(`/admin/reviews/${r._id}/visibility`);
      toast.success(res.message);
      load();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  return (
    <>
      <h1>Quản lý đánh giá</h1>
      <div className="card pad filter-row">
        <select id="ar-filter" value={q.hidden} onChange={(e) => setQ({ hidden: e.target.value, page: 1 })}>
          <option value="">Tất cả</option>
          <option value="false">Đang hiển thị</option>
          <option value="true">Đã ẩn</option>
        </select>
      </div>
      <div className="card table-wrap">
        <table className="table">
          <thead><tr><th>Sản phẩm</th><th>Khách hàng</th><th>Đánh giá</th><th>Ngày</th><th>Trạng thái</th><th></th></tr></thead>
          <tbody>
            {data.items.map((r) => (
              <tr key={r._id}>
                <td>{r.product ? <Link to={`/products/${r.product.slug}`} target="_blank">{r.product.name}</Link> : '(đã xóa)'}</td>
                <td>{r.user?.fullName}<div className="muted small">{r.user?.email}</div></td>
                <td><Stars value={r.rating} /><div className="small">{r.comment}</div></td>
                <td>{formatDate(r.createdAt, false)}</td>
                <td>{r.isHidden ? <Badge>Đã ẩn</Badge> : <Badge tone="ok">Hiển thị</Badge>}</td>
                <td><button className="btn ghost" onClick={() => toggle(r)}>{r.isHidden ? 'Hiện' : 'Ẩn'}</button></td>
              </tr>
            ))}
            {data.items.length === 0 && <tr><td colSpan="6" className="muted center">Chưa có đánh giá</td></tr>}
          </tbody>
        </table>
      </div>
      <Pagination page={data.page} pages={data.pages} onChange={(page) => setQ({ ...q, page })} />
    </>
  );
}
