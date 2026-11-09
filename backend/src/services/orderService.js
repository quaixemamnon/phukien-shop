const Product = require('../models/Product');
const Cart = require('../models/Cart');
const sendEmail = require('../utils/sendEmail');
const vnpay = require('../utils/vnpay');
const momo = require('../utils/momo');
const { clientUrl } = require('../utils/helpers');

const PAYMENT_TIMEOUT_MIN = 30;

const ORDER_STATUS_LABEL = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
};

// Trừ tồn kho từng sản phẩm, chỉ trừ khi còn đủ hàng. Nếu một sản phẩm không đủ thì hoàn lại các sản phẩm đã trừ
async function deductStock(items) {
  const done = [];
  for (const it of items) {
    const r = await Product.updateOne(
      { _id: it.product, stock: { $gte: it.quantity } },
      { $inc: { stock: -it.quantity, sold: it.quantity } }
    );
    if (r.modifiedCount === 0) {
      for (const d of done) await Product.updateOne({ _id: d.product }, { $inc: { stock: d.quantity, sold: -d.quantity } });
      return false;
    }
    done.push(it);
  }
  return true;
}

async function restoreStock(items) {
  for (const it of items) {
    await Product.updateOne({ _id: it.product }, { $inc: { stock: it.quantity, sold: -it.quantity } });
  }
}

const clearCart = (userId) => Cart.updateOne({ user: userId }, { $set: { items: [] } });

async function cancelOrder(order, reason, byUserId) {
  if (order.stockDeducted) {
    await restoreStock(order.items);
    order.stockDeducted = false;
  }
  const needRefund = order.paymentStatus === 'paid' && order.paymentMethod !== 'COD';
  order.orderStatus = 'cancelled';
  order.cancelReason = reason;
  order.statusHistory.push({
    status: 'cancelled',
    note: needRefund ? `${reason} – cần hoàn tiền cho khách` : reason,
    updatedBy: byUserId,
  });
  await order.save();
  return order;
}

// Phương thức thanh toán đang bật: VNPay/MoMo chỉ bật khi đã điền thông tin trong .env
function enabledPaymentMethods() {
  const methods = ['COD'];
  if (process.env.VNP_TMN_CODE && process.env.VNP_HASH_SECRET) methods.push('VNPAY');
  if (momo.isConfigured()) methods.push('MOMO'); // khóa thật hoặc MOMO_MODE=mock
  return methods;
}

// Tạo link thanh toán online cho đơn hàng
async function createPaymentUrl(order, req) {
  const txnRef = `${order.orderCode}${Date.now().toString().slice(-6)}`;
  order.paymentInfo.txnRef = txnRef; // paymentInfo là nested object nên luôn tồn tại
  await order.save();
  const orderInfo = `Thanh toan don hang ${order.orderCode}`;
  if (order.paymentMethod === 'VNPAY') {
    return vnpay.buildPaymentUrl({ amount: order.totalAmount, txnRef, orderInfo, ipAddr: vnpay.getClientIp(req) });
  }
  if (order.paymentMethod === 'MOMO') {
    return momo.createPayment({ amount: order.totalAmount, orderId: txnRef, orderInfo });
  }
  return null;
}

function orderEmailHtml(order, title) {
  const rows = order.items
    .map((i) => `<tr><td>${i.name}</td><td align="center">${i.quantity}</td><td align="right">${i.price.toLocaleString('vi-VN')}₫</td></tr>`)
    .join('');
  return `<h2>${title}</h2>
    <p>Mã đơn hàng: <b>${order.orderCode}</b></p>
    <table border="1" cellpadding="6" cellspacing="0">${rows}</table>
    <p>Tổng thanh toán: <b>${order.totalAmount.toLocaleString('vi-VN')}₫</b></p>
    <p>Xem chi tiết: <a href="${clientUrl()}/orders/${order._id}">${clientUrl()}/orders/${order._id}</a></p>`;
}

async function sendOrderEmail(order, title) {
  const populated = order.populated('user') ? order : await order.populate('user', 'email fullName');
  if (populated.user && populated.user.email) {
    await sendEmail({ to: populated.user.email, subject: `${title} - ${order.orderCode}`, html: orderEmailHtml(order, title) });
  }
}

// Ghi nhận thanh toán online thành công (gọi từ IPN hoặc return URL, có thể gọi nhiều lần)
async function markPaid(order, info = {}) {
  if (order.paymentStatus === 'paid') return order;
  order.paymentStatus = 'paid';
  order.paymentInfo.transactionId = info.transactionId;
  order.paymentInfo.bankCode = info.bankCode;
  order.paymentInfo.paidAt = new Date();

  if (order.orderStatus === 'cancelled') {
    order.statusHistory.push({ status: 'cancelled', note: 'Nhận thanh toán sau khi đơn đã hủy – cần hoàn tiền cho khách' });
    await order.save();
    return order;
  }

  const ok = await deductStock(order.items);
  if (ok) {
    order.stockDeducted = true;
    order.statusHistory.push({ status: 'pending', note: `Đã thanh toán qua ${order.paymentMethod}` });
    await order.save();
    await clearCart(order.user);
    await sendOrderEmail(order, 'Đặt hàng và thanh toán thành công');
  } else {
    order.orderStatus = 'cancelled';
    order.cancelReason = 'Sản phẩm đã hết hàng sau khi thanh toán';
    order.statusHistory.push({ status: 'cancelled', note: 'Sản phẩm hết hàng – cần hoàn tiền cho khách' });
    await order.save();
  }
  return order;
}

async function markFailed(order) {
  if (order.paymentStatus === 'paid') return order;
  order.paymentStatus = 'failed';
  await order.save();
  return order;
}

module.exports = {
  PAYMENT_TIMEOUT_MIN,
  ORDER_STATUS_LABEL,
  deductStock,
  restoreStock,
  clearCart,
  cancelOrder,
  enabledPaymentMethods,
  createPaymentUrl,
  sendOrderEmail,
  markPaid,
  markFailed,
};
