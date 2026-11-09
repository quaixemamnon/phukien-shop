// Trang quản lý dùng chung cho Danh mục và Thương hiệu
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api, { errMsg } from '../api';
import { Badge } from './common';

export default function TaxonomyManager({ title, endpoint, imageField, hasParent }) {
  const empty = { name: '', description: '', [imageField]: '', isActive: true, ...(hasParent ? { parent: '' } : {}) };
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);

  const load = useCallback(() => {
    api.get(`/admin/${endpoint}`).then((r) => setItems(r.data));
  }, [endpoint]);
  useEffect(load, [load]);

  const reset = () => {
    setForm(empty);
    setEditingId(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) await api.put(`/admin/${endpoint}/${editingId}`, form);
      else await api.post(`/admin/${endpoint}`, form);
      toast.success(editingId ? 'Đã cập nhật' : 'Đã thêm');
      reset();
      load();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const edit = (it) => {
    setEditingId(it._id);
    setForm({ name: it.name, description: it.description || '', [imageField]: it[imageField] || '', isActive: it.isActive, ...(hasParent ? { parent: it.parent || '' } : {}) });
    window.scrollTo(0, 0);
  };

  const toggle = async (it) => {
    try {
      await api.put(`/admin/${endpoint}/${it._id}`, { isActive: !it.isActive });
      load();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const remove = async (it) => {
    if (!window.confirm(`Xóa "${it.name}"?`)) return;
    try {
      const { data } = await api.delete(`/admin/${endpoint}/${it._id}`);
      toast.success(data.message);
      load();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const nameOf = (id) => items.find((i) => i._id === id)?.name || '';

  return (
    <>
      <h1>{title}</h1>
      <form className="card pad form" onSubmit={submit}>
        <h3>{editingId ? `Sửa: ${form.name}` : 'Thêm mới'}</h3>
        <div className="grid-2">
          <label>Tên *<input id={`${endpoint}-name`} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label>{imageField === 'logo' ? 'Logo (URL)' : 'Ảnh (URL)'}<input id={`${endpoint}-img`} value={form[imageField]} onChange={(e) => setForm({ ...form, [imageField]: e.target.value })} /></label>
          {hasParent && (
            <label>Danh mục cha
              <select id={`${endpoint}-parent`} value={form.parent} onChange={(e) => setForm({ ...form, parent: e.target.value })}>
                <option value="">-- Không có --</option>
                {items.filter((i) => i._id !== editingId && !i.parent).map((i) => <option key={i._id} value={i._id}>{i.name}</option>)}
              </select>
            </label>
          )}
          <label>Mô tả<input id={`${endpoint}-desc`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
        </div>
        <label className="radio"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Hiển thị</label>
        <div className="row-center">
          <button className="btn primary">{editingId ? 'Lưu thay đổi' : 'Thêm'}</button>
          {editingId && <button type="button" className="btn ghost" onClick={reset}>Hủy</button>}
        </div>
      </form>

      <div className="card table-wrap">
        <table className="table">
          <thead><tr><th></th><th>Tên</th>{hasParent && <th>Danh mục cha</th>}<th>Số sản phẩm</th><th>Trạng thái</th><th></th></tr></thead>
          <tbody>
            {items.map((it) => (
              <tr key={it._id}>
                <td>{it[imageField] && <img className="thumb-sm" src={it[imageField]} alt="" />}</td>
                <td>{it.name}<div className="muted small">/{it.slug}</div></td>
                {hasParent && <td>{nameOf(it.parent)}</td>}
                <td>{it.productCount}</td>
                <td>{it.isActive ? <Badge tone="ok">Hiển thị</Badge> : <Badge>Đã ẩn</Badge>}</td>
                <td className="actions">
                  <button className="btn ghost" onClick={() => edit(it)}>Sửa</button>
                  <button className="btn ghost" onClick={() => toggle(it)}>{it.isActive ? 'Ẩn' : 'Hiện'}</button>
                  <button className="btn ghost danger" onClick={() => remove(it)}>Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
