const mongoose = require('mongoose');

const ORDER_STATUSES = ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'];

const orderSchema = new mongoose.Schema(
  {
    orderCode: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        name: String,
        image: String,
        price: Number,
        quantity: { type: Number, min: 1 },
        _id: false,
      },
    ],
    shippingAddress: {
      fullName: String,
      phone: String,
      street: String,
      ward: String,
      district: String,
      province: String,
    },
    subtotal: { type: Number, required: true },
    shippingFee: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['COD', 'VNPAY', 'MOMO'], default: 'COD' },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    paymentInfo: {
      txnRef: String, // mã giao dịch gửi sang cổng thanh toán
      transactionId: String,
      bankCode: String,
      paidAt: Date,
    },
    orderStatus: { type: String, enum: ORDER_STATUSES, default: 'pending' },
    statusHistory: [
      {
        status: String,
        note: String,
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        updatedAt: { type: Date, default: Date.now },
        _id: false,
      },
    ],
    // true khi đã trừ tồn kho cho đơn này (để biết có cần hoàn kho khi hủy hay không)
    stockDeducted: { type: Boolean, default: false },
    note: String,
    cancelReason: String,
    deliveredAt: Date,
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ 'paymentInfo.txnRef': 1 });

module.exports = mongoose.model('Order', orderSchema);
module.exports.ORDER_STATUSES = ORDER_STATUSES;
