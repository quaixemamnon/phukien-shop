const Order = require('../models/Order');
const service = require('../services/orderService');
const vnpay = require('../utils/vnpay');
const momo = require('../utils/momo');
const { ApiError, asyncHandler } = require('../utils/helpers');

const findByTxnRef = (txnRef) => Order.findOne({ 'paymentInfo.txnRef': txnRef });

// ===== VNPay =====

// GET /api/payment/vnpay-ipn - VNPay gọi về server (cần địa chỉ công khai)
exports.vnpayIpn = async (req, res) => {
  try {
    const q = req.query;
    if (!vnpay.verifyReturn(q)) return res.json({ RspCode: '97', Message: 'Invalid signature' });
    const order = await findByTxnRef(q.vnp_TxnRef);
    if (!order) return res.json({ RspCode: '01', Message: 'Order not found' });
    if (Number(q.vnp_Amount) / 100 !== order.totalAmount) return res.json({ RspCode: '04', Message: 'Invalid amount' });
    if (order.paymentStatus === 'paid') return res.json({ RspCode: '02', Message: 'Order already confirmed' });

    if (vnpay.isSuccess(q)) await service.markPaid(order, { transactionId: q.vnp_TransactionNo, bankCode: q.vnp_BankCode });
    else await service.markFailed(order);
    res.json({ RspCode: '00', Message: 'Confirm Success' });
  } catch (err) {
    console.error(err);
    res.json({ RspCode: '99', Message: 'Unknown error' });
  }
};

// GET /api/payment/vnpay-return?<tham số VNPay> - frontend gọi sau khi khách quay về website
exports.vnpayReturn = asyncHandler(async (req, res) => {
  const q = req.query;
  if (!vnpay.verifyReturn(q)) throw new ApiError(400, 'Chữ ký không hợp lệ');
  let order = await findByTxnRef(q.vnp_TxnRef);
  if (!order) throw new ApiError(404, 'Không tìm thấy đơn hàng');

  const success = vnpay.isSuccess(q) && Number(q.vnp_Amount) / 100 === order.totalAmount;
  order = success
    ? await service.markPaid(order, { transactionId: q.vnp_TransactionNo, bankCode: q.vnp_BankCode })
    : await service.markFailed(order);
  res.json({ success: order.paymentStatus === 'paid', order });
});

// ===== MoMo =====

// POST /api/payment/momo-ipn - MoMo gọi về server
exports.momoIpn = async (req, res) => {
  try {
    const p = req.body;
    if (momo.verifySignature(p)) {
      const order = await findByTxnRef(p.orderId);
      if (order && Number(p.amount) === order.totalAmount) {
        if (Number(p.resultCode) === 0) await service.markPaid(order, { transactionId: String(p.transId), bankCode: 'MOMO' });
        else await service.markFailed(order);
      }
    }
  } catch (err) {
    console.error(err);
  }
  res.status(204).end();
};

// ===== MoMo - chế độ mô phỏng (MOMO_MODE=mock) =====

async function findMyMockOrder(req, txnRef) {
  if (!momo.isMock()) throw new ApiError(404, 'Chế độ MoMo mô phỏng chưa được bật');
  const order = await Order.findOne({ 'paymentInfo.txnRef': txnRef, user: req.user._id });
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
  });
});

// POST /api/payment/momo-mock/complete { orderId, success } - khách bấm xác nhận / hủy trên trang mô phỏng
// Trả về chuỗi tham số giống hệt MoMo gửi về redirectUrl (đã ký), frontend chuyển sang /payment/momo-return
exports.momoMockComplete = asyncHandler(async (req, res) => {
  const order = await findMyMockOrder(req, req.body.orderId);
  if (order.paymentStatus === 'paid') throw new ApiError(400, 'Đơn hàng đã được thanh toán');
  const result = momo.buildMockResult({
    orderId: req.body.orderId,
    amount: order.totalAmount,
    orderInfo: `Thanh toan don hang ${order.orderCode}`,
    success: Boolean(req.body.success),
  });
  res.json({ query: new URLSearchParams(result).toString() });
});

// GET /api/payment/momo-return?<tham số MoMo> - frontend gọi sau khi khách quay về website
exports.momoReturn = asyncHandler(async (req, res) => {
  const p = req.query;
  if (!momo.verifySignature(p)) throw new ApiError(400, 'Chữ ký không hợp lệ');
  let order = await findByTxnRef(p.orderId);
  if (!order) throw new ApiError(404, 'Không tìm thấy đơn hàng');

  const success = Number(p.resultCode) === 0 && Number(p.amount) === order.totalAmount;
  order = success
    ? await service.markPaid(order, { transactionId: String(p.transId), bankCode: 'MOMO' })
    : await service.markFailed(order);
  res.json({ success: order.paymentStatus === 'paid', order });
});
