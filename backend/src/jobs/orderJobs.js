const Order = require('../models/Order');
const { cancelOrder, PAYMENT_TIMEOUT_MIN } = require('../services/orderService');

// Tự động hủy đơn thanh toán online quá 30 phút chưa thanh toán (chạy mỗi 5 phút)
async function cancelExpiredOrders() {
  const deadline = new Date(Date.now() - PAYMENT_TIMEOUT_MIN * 60 * 1000);
  const orders = await Order.find({
    paymentMethod: { $ne: 'COD' },
    paymentStatus: { $ne: 'paid' },
    orderStatus: 'pending',
    createdAt: { $lt: deadline },
  });
  for (const o of orders) await cancelOrder(o, 'Quá hạn thanh toán');
  if (orders.length) console.log(`Đã tự hủy ${orders.length} đơn quá hạn thanh toán`);
}

function startOrderJobs() {
  const run = () => cancelExpiredOrders().catch((e) => console.error('Lỗi job hủy đơn:', e.message));
  run();
  setInterval(run, 5 * 60 * 1000);
}

module.exports = { startOrderJobs };
