// Tích hợp VNPay (phiên bản 2.1.0) theo tài liệu https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html
const crypto = require('crypto');

function encodeSorted(params) {
  return Object.keys(params)
    .sort()
    .map((k) => `${k}=${encodeURIComponent(params[k]).replace(/%20/g, '+')}`)
    .join('&');
}

function hmac512(data) {
  return crypto.createHmac('sha512', process.env.VNP_HASH_SECRET || '').update(Buffer.from(data, 'utf-8')).digest('hex');
}

// yyyyMMddHHmmss theo giờ Việt Nam (GMT+7)
function vnDate(d) {
  const t = new Date(d.getTime() + 7 * 3600 * 1000);
  const p = (n) => String(n).padStart(2, '0');
  return `${t.getUTCFullYear()}${p(t.getUTCMonth() + 1)}${p(t.getUTCDate())}${p(t.getUTCHours())}${p(t.getUTCMinutes())}${p(t.getUTCSeconds())}`;
}

function getClientIp(req) {
  let ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1';
  if (ip === '::1') ip = '127.0.0.1';
  if (ip.startsWith('::ffff:')) ip = ip.slice(7);
  return ip;
}

function buildPaymentUrl({ amount, txnRef, orderInfo, ipAddr }) {
  if (!process.env.VNP_TMN_CODE || !process.env.VNP_HASH_SECRET) {
    throw Object.assign(new Error('Chưa cấu hình VNPay (VNP_TMN_CODE, VNP_HASH_SECRET)'), { status: 500 });
  }
  const now = new Date();
  const params = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: process.env.VNP_TMN_CODE,
    vnp_Locale: 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: txnRef,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: 'other',
    vnp_Amount: Math.round(amount * 100),
    vnp_ReturnUrl: process.env.VNP_RETURN_URL,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: vnDate(now),
    vnp_ExpireDate: vnDate(new Date(now.getTime() + 15 * 60 * 1000)),
  };
  const query = encodeSorted(params);
  return `${process.env.VNP_URL}?${query}&vnp_SecureHash=${hmac512(query)}`;
}

// Kiểm tra chữ ký dữ liệu VNPay trả về (return URL và IPN)
function verifyReturn(query) {
  const params = { ...query };
  const secureHash = params.vnp_SecureHash;
  delete params.vnp_SecureHash;
  delete params.vnp_SecureHashType;
  if (!secureHash) return false;
  return hmac512(encodeSorted(params)).toLowerCase() === String(secureHash).toLowerCase();
}

const isSuccess = (query) => query.vnp_ResponseCode === '00' && (query.vnp_TransactionStatus || '00') === '00';

module.exports = { buildPaymentUrl, verifyReturn, isSuccess, getClientIp };
