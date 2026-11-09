const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    rating: { type: Number, required: [true, 'Vui lòng chọn số sao'], min: 1, max: 5 },
    comment: { type: String, maxlength: [1000, 'Nhận xét tối đa 1000 ký tự'], default: '' },
    isHidden: { type: Boolean, default: false },
  },
  { timestamps: true }
);

reviewSchema.index({ user: 1, product: 1, order: 1 }, { unique: true });
reviewSchema.index({ product: 1, createdAt: -1 });

// Tính lại điểm trung bình của sản phẩm (chỉ tính đánh giá không bị ẩn)
reviewSchema.statics.recalcProduct = async function recalcProduct(productId) {
  const Product = mongoose.model('Product');
  const [stat] = await this.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(String(productId)), isHidden: false } },
    { $group: { _id: '$product', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await Product.updateOne(
    { _id: productId },
    { averageRating: stat ? Math.round(stat.avg * 10) / 10 : 0, numReviews: stat ? stat.count : 0 }
  );
};

module.exports = mongoose.model('Review', reviewSchema);
