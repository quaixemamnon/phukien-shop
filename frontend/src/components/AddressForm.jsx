// Form địa chỉ dùng chung cho trang Thanh toán và Tài khoản
export const EMPTY_ADDRESS = { fullName: '', phone: '', province: '', district: '', ward: '', street: '' };

export const validateAddress = (a) => {
  if (!a.fullName.trim() || !a.street.trim() || !a.ward.trim() || !a.district.trim() || !a.province.trim()) {
    return 'Vui lòng nhập đầy đủ thông tin địa chỉ';
  }
  if (!/^0\d{9}$/.test(a.phone)) return 'Số điện thoại gồm 10 số, bắt đầu bằng 0';
  return '';
};

export default function AddressForm({ value, onChange, idPrefix = 'addr' }) {
  const set = (k) => (e) => onChange({ ...value, [k]: e.target.value });
  const input = (k, label, type = 'text') => (
    <label>
      {label}
      <input id={`${idPrefix}-${k}`} type={type} value={value[k] || ''} onChange={set(k)} />
    </label>
  );
  return (
    <div className="form grid-2">
      {input('fullName', 'Họ tên người nhận')}
      {input('phone', 'Số điện thoại', 'tel')}
      {input('province', 'Tỉnh / Thành phố')}
      {input('district', 'Quận / Huyện')}
      {input('ward', 'Phường / Xã')}
      {input('street', 'Số nhà, tên đường')}
    </div>
  );
}
