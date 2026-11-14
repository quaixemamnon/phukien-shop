const Order = require('../models/Order');
const service = require('../services/orderService');
const momo = require('../utils/momo');
const { ApiError, asyncHandler } = require('../utils/helpers');

const findByTxnRef = (txnRef) => Order.findOne({ 'paymentInfo.txnRef': String(txnRef || '') });

// Áp dụng kết quả MoMo trả về (dùng chung cho IPN và trang kết quả)
async function applyMomoResult(p) {
  const order = await findByTxnRef(p.orderId);
  if (!order) throw new ApiError(404, 'Không tìm thấy đơn hàng');
  const success = Number(p.resultCode) === 0 && Number(p.amount) === order.totalAmount;
  return success ? service.markPaid(order, { transactionId: String(p.transId), bankCode: 'MOMO' }) : service.markFailed(order);
}

// POST /api/payment/momo-ipn - MoMo gọi về server (cần địa chỉ công khai)
exports.momoIpn = async (req, res) => {
  try {
    if (momo.verifySignature(req.body)) await applyMomoResult(req.body);
  } catch (err) {
    console.error('Lỗi xử lý IPN MoMo:', err.message);
  }
  res.status(204).end();
};

// GET /api/payment/momo-return?<tham số MoMo> - frontend gọi khi khách quay về website
exports.momoReturn = asyncHandler(async (req, res) => {
  if (!momo.verifySignature(req.query)) throw new ApiError(400, 'Chữ ký không hợp lệ');
  const order = await applyMomoResult(req.query);
  res.json({ success: order.paymentStatus === 'paid', order });
});

// ===== MoMo - chế độ mô phỏng (MOMO_MODE=mock) =====

async function findMyMockOrder(req, txnRef) {
  if (!momo.isMock()) throw new ApiError(404, 'Chế độ MoMo mô phỏng chưa được bật');
  const order = await Order.findOne({ 'paymentInfo.txnRef': String(txnRef || ''), user: req.user._id });
  if (!order) throw new ApiError(404, 'Không tìm thấy giao dịch');
  return order;
}

// GET /api/payment/momo-mock/:txnRef - thông tin hiển thị trên trang cổng mô phỏng
exports.momoMockInfo = asyncHandler(async (req, res) => {
  const order = await findMyMockOrder(req, req.params.txnRef);
  res.json({
    orderId: req.params.txnRef,
    orderCode: order.orderCode,
    amount: order.totalAmount,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
    expiresAt: new Date(order.createdAt.getTime() + service.PAYMENT_TIMEOUT_MIN * 60 * 1000),
  });
});

// POST /api/payment/momo-mock/complete { orderId, success } - khách bấm xác nhận / hủy trên trang mô phỏng.
// Trả về chuỗi tham số giống hệt MoMo gửi về redirectUrl (đã ký), frontend chuyển sang /payment/momo-return
exports.momoMockComplete = asyncHandler(async (req, res) => {
  const order = await findMyMockOrder(req, req.body.orderId);
  if (order.paymentStatus === 'paid') throw new ApiError(400, 'Đơn hàng đã được thanh toán');
  const expired = Date.now() - order.createdAt.getTime() > service.PAYMENT_TIMEOUT_MIN * 60 * 1000;
  if (order.orderStatus === 'cancelled' || expired) throw new ApiError(400, 'Đơn hàng đã hủy hoặc quá hạn thanh toán');
  const result = momo.buildMockResult({
    orderId: String(req.body.orderId),
    amount: order.totalAmount,
    orderInfo: `Thanh toan don hang ${order.orderCode}`,
    success: req.body.success === true,
  });
  res.json({ query: new URLSearchParams(result).toString() });
});
