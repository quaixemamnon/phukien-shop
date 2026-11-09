// Tích hợp ví MoMo (API v2) theo tài liệu https://developers.momo.vn
//
// Có 2 chế độ (biến MOMO_MODE trong .env):
//  - real: gọi cổng MoMo thật (môi trường test hoặc production), cần partnerCode/accessKey/secretKey do MoMo cấp
//  - mock: mô phỏng cổng MoMo ngay trong website để demo khi chưa có tài khoản MoMo doanh nghiệp.
//          Dữ liệu trả về có cùng định dạng và cùng cách ký HMAC SHA256 như MoMo thật,
//          nên phần kiểm tra chữ ký / cập nhật đơn hàng được chạy giống hệt khi dùng cổng thật.
const crypto = require('crypto');
const { clientUrl } = require('./helpers');

const isMock = () => String(process.env.MOMO_MODE || '').toLowerCase() === 'mock';

function config() {
  if (isMock()) {
    return {
      partnerCode: process.env.MOMO_PARTNER_CODE || 'MOMOMOCK',
      accessKey: process.env.MOMO_ACCESS_KEY || 'mock-access-key',
      secretKey: process.env.MOMO_SECRET_KEY || 'mock-secret-key',
    };
  }
  return {
    partnerCode: process.env.MOMO_PARTNER_CODE,
    accessKey: process.env.MOMO_ACCESS_KEY,
    secretKey: process.env.MOMO_SECRET_KEY,
  };
}

const isConfigured = () => {
  const c = config();
  return Boolean(c.partnerCode && c.accessKey && c.secretKey);
};

const hmac256 = (data) => crypto.createHmac('sha256', config().secretKey || '').update(data).digest('hex');

// Chuỗi ký cho dữ liệu MoMo trả về (redirect và IPN có cùng các trường)
const resultRawSignature = (p) =>
  `accessKey=${config().accessKey}&amount=${p.amount}&extraData=${p.extraData || ''}` +
  `&message=${p.message}&orderId=${p.orderId}&orderInfo=${p.orderInfo}&orderType=${p.orderType}` +
  `&partnerCode=${p.partnerCode}&payType=${p.payType}&requestId=${p.requestId}` +
  `&responseTime=${p.responseTime}&resultCode=${p.resultCode}&transId=${p.transId}`;

async function createPayment({ amount, orderId, orderInfo }) {
  if (!isConfigured()) throw Object.assign(new Error('Chưa cấu hình MoMo'), { status: 500 });

  // Chế độ mô phỏng: chuyển khách sang trang cổng MoMo mô phỏng của website
  if (isMock()) {
    return `${clientUrl()}/payment/momo-sandbox?orderId=${encodeURIComponent(orderId)}`;
  }

  const { partnerCode, accessKey } = config();
  const redirectUrl = process.env.MOMO_REDIRECT_URL;
  const ipnUrl = process.env.MOMO_IPN_URL;
  const requestId = orderId;
  const requestType = 'captureWallet';
  const extraData = '';
  const raw =
    `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}` +
    `&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}` +
    `&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

  let res;
  try {
    res = await fetch(process.env.MOMO_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        partnerCode, accessKey, requestId, amount, orderId, orderInfo,
        redirectUrl, ipnUrl, extraData, requestType, lang: 'vi', signature: hmac256(raw),
      }),
    });
  } catch (err) {
    throw Object.assign(new Error('Không kết nối được tới cổng thanh toán MoMo, vui lòng thử lại sau'), { status: 502 });
  }
  // MoMo có thể trả về trang HTML (VD 403 Forbidden) thay vì JSON
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    console.error(`MoMo trả về HTTP ${res.status}:`, text.slice(0, 200));
    throw Object.assign(
      new Error(`Cổng MoMo từ chối yêu cầu (HTTP ${res.status}). Vui lòng chọn phương thức thanh toán khác`),
      { status: 502 }
    );
  }
  if (data.resultCode !== 0) {
    throw Object.assign(new Error(`Không tạo được giao dịch MoMo: ${data.message}`), { status: 502 });
  }
  return data.payUrl;
}

function verifySignature(p) {
  return Boolean(p && p.signature) && hmac256(resultRawSignature(p)) === p.signature;
}

// Chế độ mô phỏng: tạo dữ liệu trả về giống hệt MoMo (kèm chữ ký) khi khách xác nhận / hủy trên trang mô phỏng
function buildMockResult({ orderId, amount, orderInfo, success }) {
  const now = Date.now();
  const p = {
    partnerCode: config().partnerCode,
    orderId,
    requestId: orderId,
    amount: String(amount),
    orderInfo,
    orderType: 'momo_wallet',
    transId: success ? String(now).slice(-10) : '0',
    resultCode: success ? '0' : '1006',
    message: success ? 'Thành công.' : 'Giao dịch bị từ chối bởi người dùng.',
    payType: 'qr',
    responseTime: String(now),
    extraData: '',
  };
  p.signature = hmac256(resultRawSignature(p));
  return p;
}

module.exports = { isMock, isConfigured, createPayment, verifySignature, buildMockResult };
