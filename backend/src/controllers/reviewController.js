const Review = require('../models/Review');
const Order = require('../models/Order');
const { ApiError, asyncHandler, paginate } = require('../utils/helpers');

// POST /api/reviews { productId, orderId, rating, comment }
exports.createReview = asyncHandler(async (req, res) => {
  const { productId, orderId, rating, comment } = req.body;
  const order = await Order.findOne({ _id: orderId, user: req.user._id, orderStatus: 'delivered', 'items.product': productId });
  if (!order) throw new ApiError(400, 'Bạn chỉ có thể đánh giá sản phẩm đã mua và đã nhận hàng');
  if (await Review.exists({ user: req.user._id, product: productId, order: orderId })) {
    throw new ApiError(409, 'Bạn đã đánh giá sản phẩm này cho đơn hàng này');
  }
  const review = await Review.create({ product: productId, order: orderId, user: req.user._id, rating: Number(rating), comment });
  await Review.recalcProduct(productId);
  res.status(201).json({ message: 'Cảm ơn bạn đã đánh giá', review });
});

// GET /api/reviews/eligible/:productId - khách hiện tại có được đánh giá sản phẩm này không
// Trả về { canReview, orderId, reason }
exports.checkEligible = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const delivered = await Order.find({ user: req.user._id, orderStatus: 'delivered', 'items.product': productId })
    .select('_id orderCode')
    .sort({ deliveredAt: -1 });
  if (!delivered.length) {
    const anyOrder = await Order.exists({ user: req.user._id, orderStatus: { $ne: 'cancelled' }, 'items.product': productId });
    return res.json({
      canReview: false,
      reason: anyOrder ? 'Bạn có thể đánh giá sau khi đơn hàng chứa sản phẩm này được giao thành công.' : 'Chỉ khách hàng đã mua sản phẩm này mới có thể đánh giá.',
    });
  }
  const reviewed = await Review.find({ user: req.user._id, product: productId }).distinct('order');
  const pending = delivered.find((o) => !reviewed.some((id) => id.equals(o._id)));
  if (!pending) return res.json({ canReview: false, reason: 'Bạn đã đánh giá sản phẩm này. Cảm ơn bạn!' });
  res.json({ canReview: true, orderId: pending._id, orderCode: pending.orderCode });
});

// GET /api/reviews/order/:orderId - danh sách sản phẩm khách đã đánh giá trong đơn
exports.getMyReviewsByOrder = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ user: req.user._id, order: req.params.orderId }).select('product rating comment');
  res.json(reviews);
});

// ===== Admin =====

// GET /api/admin/reviews?hidden=&page=
exports.adminList = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query, 20);
  const filter = {};
  if (req.query.hidden === 'true') filter.isHidden = true;
  if (req.query.hidden === 'false') filter.isHidden = false;
  const [items, total] = await Promise.all([
    Review.find(filter)
      .populate('user', 'fullName email')
      .populate('product', 'name slug images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments(filter),
  ]);
  res.json({ items, total, page, pages: Math.ceil(total / limit) });
});

// PATCH /api/admin/reviews/:id/visibility
exports.toggleVisibility = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(404, 'Không tìm thấy đánh giá');
  review.isHidden = !review.isHidden;
  await review.save();
  await Review.recalcProduct(review.product);
  res.json({ message: review.isHidden ? 'Đã ẩn đánh giá' : 'Đã hiện đánh giá', review });
});
