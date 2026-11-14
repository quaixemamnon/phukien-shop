// Cập nhật dữ liệu cũ cho khớp phiên bản hiện tại. Chạy mỗi lần server khởi động, chạy lại nhiều lần vẫn an toàn.
const Product = require('../models/Product');
const Order = require('../models/Order');
const { normalizeText } = require('./helpers');

async function runMigrations() {
  // 1. Tạo trường searchText (tìm kiếm không dấu) cho sản phẩm tạo trước khi có chức năng này
  const products = await Product.find({ $or: [{ searchText: { $exists: false } }, { searchText: '' }] }).select('name sku');
  for (const p of products) {
    await Product.updateOne({ _id: p._id }, { $set: { searchText: normalizeText(`${p.name} ${p.sku}`) } });
  }
  // 2. Đã bỏ VNPay: đơn cũ thanh toán VNPay chuyển sang nhóm thanh toán online MoMo để không lỗi khi cập nhật
  const vnpay = await Order.collection.updateMany({ paymentMethod: 'VNPAY' }, { $set: { paymentMethod: 'MOMO' } });

  if (products.length || vnpay.modifiedCount) {
    console.log(`Đã cập nhật dữ liệu cũ: ${products.length} sản phẩm, ${vnpay.modifiedCount} đơn VNPay`);
  }
}

module.exports = { runMigrations };
