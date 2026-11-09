export const formatPrice = (n) => `${Number(n || 0).toLocaleString('vi-VN')}₫`;

export const formatDate = (d, withTime = true) =>
  d
    ? new Date(d).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
      })
    : '';

export const ORDER_STATUS = {
  pending: { label: 'Chờ xác nhận', tone: 'warn' },
  confirmed: { label: 'Đã xác nhận', tone: 'info' },
  shipping: { label: 'Đang giao', tone: 'info' },
  delivered: { label: 'Đã giao', tone: 'ok' },
  cancelled: { label: 'Đã hủy', tone: 'bad' },
};

export const PAYMENT_STATUS = {
  pending: { label: 'Chưa thanh toán', tone: 'warn' },
  paid: { label: 'Đã thanh toán', tone: 'ok' },
  failed: { label: 'Thanh toán thất bại', tone: 'bad' },
  refunded: { label: 'Đã hoàn tiền', tone: 'muted' },
};

export const PAYMENT_METHOD = {
  COD: 'Thanh toán khi nhận hàng',
  VNPAY: 'VNPay',
  MOMO: 'Ví MoMo',
};

export const fullAddress = (a) => (a ? [a.street, a.ward, a.district, a.province].filter(Boolean).join(', ') : '');

export const SHIPPING_FEE = 30000;
export const FREE_SHIP_FROM = 500000;
export const shippingFeeOf = (subtotal) => (subtotal >= FREE_SHIP_FROM ? 0 : SHIPPING_FEE);
