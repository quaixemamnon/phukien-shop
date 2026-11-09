import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errMsg } from '../../api';
import { BackLink } from '../../components/OrderInfo';

const EMPTY = {
  name: '', sku: '', price: '', salePrice: '', stock: 0, category: '', brand: '',
  description: '', warrantyMonths: 12, images: [], specifications: [], isActive: true,
};

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    api.get('/admin/categories').then((r) => setCategories(r.data));
    api.get('/admin/brands').then((r) => setBrands(r.data));
    if (isEdit) {
      api.get(`/admin/products/${id}`).then((r) => setForm({ ...EMPTY, ...r.data, salePrice: r.data.salePrice ?? '' }));
    }
  }, [id, isEdit]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const upload = async (e) => {
    const files = [...e.target.files];
    if (!files.length) return;
    const fd = new FormData();
    files.forEach((f) => fd.append('images', f));
    setUploading(true);
    try {
      const { data } = await api.post('/upload', fd);
      setForm((f) => ({ ...f, images: [...f.images, ...data.urls] }));
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const addImageUrl = () => {
    if (!imageUrl.trim()) return;
    setForm((f) => ({ ...f, images: [...f.images, imageUrl.trim()] }));
    setImageUrl('');
  };

  const removeImage = (i) => setForm((f) => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }));
  const setSpec = (i, k, v) =>
    setForm((f) => ({ ...f, specifications: f.specifications.map((s, idx) => (idx === i ? { ...s, [k]: v } : s)) }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.images.length) return toast.error('Cần ít nhất 1 ảnh sản phẩm');
    const body = {
      ...form,
      price: Number(form.price),
      salePrice: form.salePrice === '' ? null : Number(form.salePrice),
      stock: Number(form.stock),
      warrantyMonths: Number(form.warrantyMonths),
      specifications: form.specifications.filter((s) => s.key && s.value),
    };
    if (body.salePrice != null && body.salePrice > body.price) return toast.error('Giá khuyến mãi phải nhỏ hơn giá bán');
    setSaving(true);
    try {
      if (isEdit) await api.put(`/admin/products/${id}`, body);
      else await api.post('/admin/products', body);
      toast.success(isEdit ? 'Đã cập nhật sản phẩm' : 'Đã thêm sản phẩm');
      navigate('/admin/products');
    } catch (err) {
      toast.error(errMsg(err));
      setSaving(false);
    }
  };

  return (
    <>
      <BackLink to="/admin/products">Danh sách sản phẩm</BackLink>
      <h1>{isEdit ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</h1>
      <form className="card pad form" onSubmit={submit}>
        <div className="grid-2">
          <label>Tên sản phẩm *<input id="pf-name" required value={form.name} onChange={set('name')} /></label>
          <label>Mã SKU *<input id="pf-sku" required value={form.sku} onChange={set('sku')} /></label>
          <label>Giá bán (₫) *<input id="pf-price" type="number" min="0" required value={form.price} onChange={set('price')} /></label>
          <label>Giá khuyến mãi (₫)<input id="pf-sale" type="number" min="0" value={form.salePrice} onChange={set('salePrice')} placeholder="Bỏ trống nếu không giảm giá" /></label>
          <label>Số lượng tồn kho *<input id="pf-stock" type="number" min="0" required value={form.stock} onChange={set('stock')} /></label>
          <label>Bảo hành (tháng)<input id="pf-warranty" type="number" min="0" value={form.warrantyMonths} onChange={set('warrantyMonths')} /></label>
          <label>Danh mục *
            <select id="pf-cat" required value={form.category} onChange={set('category')}>
              <option value="">-- Chọn danh mục --</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}{!c.isActive ? ' (đã ẩn)' : ''}</option>)}
            </select>
          </label>
          <label>Thương hiệu *
            <select id="pf-brand" required value={form.brand} onChange={set('brand')}>
              <option value="">-- Chọn thương hiệu --</option>
              {brands.map((b) => <option key={b._id} value={b._id}>{b.name}{!b.isActive ? ' (đã ẩn)' : ''}</option>)}
            </select>
          </label>
        </div>

        <label>Mô tả<textarea id="pf-desc" rows="5" value={form.description} onChange={set('description')} /></label>

        <div>
          <b>Hình ảnh *</b>
          <div className="image-list">
            {form.images.map((src, i) => (
              <div key={src + i} className="image-item">
                <img src={src} alt="" />
                <button type="button" onClick={() => removeImage(i)} aria-label="Xóa ảnh">✕</button>
                {i === 0 && <span>Ảnh chính</span>}
              </div>
            ))}
          </div>
          <div className="row-center">
            <label className="btn outline">
              {uploading ? 'Đang tải lên...' : 'Tải ảnh từ máy'}
              <input type="file" accept="image/*" multiple hidden onChange={upload} disabled={uploading} />
            </label>
            <input id="pf-imgurl" placeholder="Hoặc dán URL ảnh" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
            <button type="button" className="btn ghost" onClick={addImageUrl}>Thêm URL</button>
          </div>
        </div>

        <div>
          <b>Thông số kỹ thuật</b>
          {form.specifications.map((s, i) => (
            <div key={i} className="spec-row">
              <input placeholder="Tên thông số (VD: Công suất)" value={s.key} onChange={(e) => setSpec(i, 'key', e.target.value)} />
              <input placeholder="Giá trị (VD: 65W)" value={s.value} onChange={(e) => setSpec(i, 'value', e.target.value)} />
              <button type="button" className="btn ghost danger" onClick={() => setForm((f) => ({ ...f, specifications: f.specifications.filter((_, idx) => idx !== i) }))}>✕</button>
            </div>
          ))}
          <button type="button" className="btn ghost" onClick={() => setForm((f) => ({ ...f, specifications: [...f.specifications, { key: '', value: '' }] }))}>+ Thêm thông số</button>
        </div>

        <label className="radio"><input type="checkbox" checked={form.isActive} onChange={set('isActive')} /> Hiển thị sản phẩm trên website</label>
        <div className="row-center">
          <button className="btn primary lg" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu sản phẩm'}</button>
          <button type="button" className="btn ghost" onClick={() => navigate('/admin/products')}>Hủy</button>
        </div>
      </form>
    </>
  );
}
