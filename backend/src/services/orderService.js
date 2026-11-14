const Product = require('../models/Product');
const Cart = require('../models/Cart');
const sendEmail = require('../utils/sendEmail');
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

// Đơn đã thanh toán online mà bị hủy thì cần hoàn tiền cho khách
const needsRefund = (order) => order.orderStatus === 'cancelled' && order.paymentMethod !== 'COD' && order.paymentStatus === 'paid';

async function cancelOrder(order, reason, byUserId) {
  if (order.stockDeducted) {
    await restoreStock(order.items);
    order.stockDeducted = false;
  }
  order.orderStatus = 'cancelled';
  order.cancelReason = reason;
  order.statusHistory.push({
    status: 'cancelled',
    note: needsRefund(order) ? `${reason} – cần hoàn tiền cho khách` : reason,
    updatedBy: byUserId,
  });
  await order.save();
  return order;
}

// Phương thức thanh toán đang bật: COD luôn bật, MoMo bật khi có khóa thật hoặc MOMO_MODE=mock
function enabledPaymentMethods() {
  const methods = ['COD'];
  if (momo.isConfigured()) methods.push('MOMO');
  return methods;
}

// Tạo link thanh toán MoMo cho đơn hàng (mỗi lần thanh toán dùng một mã giao dịch mới)
async function createPaymentUrl(order) {
  if (order.paymentMethod !== 'MOMO') return null;
  const txnRef = `${order.orderCode}${Date.now().toString().slice(-6)}`;
  order.paymentInfo.txnRef = txnRef; // paymentInfo là nested object nên luôn tồn tại
  await order.save();
  return momo.createPayment({ amount: order.totalAmount, orderId: txnRef, orderInfo: `Thanh toan don hang ${order.orderCode}` });
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

// Ghi nhận thanh toán MoMo thành công (gọi từ IPN hoặc trang kết quả, gọi nhiều lần vẫn an toàn).
// Hàng đã được giữ (trừ kho) từ lúc đặt nên ở đây không trừ kho nữa.
async function markPaid(order, info = {}) {
  if (order.paymentStatus === 'paid') return order;
  order.paymentStatus = 'paid';
  order.paymentInfo.transactionId = info.transactionId;
  order.paymentInfo.bankCode = info.bankCode;
  order.paymentInfo.paidAt = new Date();
  if (order.orderStatus === 'cancelled') {
    // Khách trả tiền sau khi đơn đã tự hủy (quá 30 phút) -> phải hoàn tiền
    order.statusHistory.push({ status: 'cancelled', note: 'Nhận thanh toán sau khi đơn đã hủy – cần hoàn tiền cho khách' });
  } else {
    order.statusHistory.push({ status: 'pending', note: `Đã thanh toán qua ${order.paymentMethod}` });
  }
  await order.save();
  if (order.orderStatus !== 'cancelled') await sendOrderEmail(order, 'Thanh toán thành công');
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
  needsRefund,
  cancelOrder,
  enabledPaymentMethods,
  createPaymentUrl,
  sendOrderEmail,
  markPaid,
  markFailed,
};
