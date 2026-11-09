const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const service = require('../services/orderService');
const { ApiError, asyncHandler, escapeRegex, paginate, pick } = require('../utils/helpers');

/* ======================= SẢN PHẨM ======================= */
const PRODUCT_FIELDS = ['name', 'sku', 'description', 'price', 'salePrice', 'stock', 'images', 'category', 'brand', 'specifications', 'warrantyMonths', 'isActive'];

// GET /api/admin/products?keyword=&category=&status=&page=
exports.listProducts = asyncHandler(async (req, res) => {
  const { keyword, category, status } = req.query;
  const { page, limit, skip } = paginate(req.query, 20, 100);
  const filter = {};
  if (keyword) {
    const rx = { $regex: escapeRegex(keyword.trim()), $options: 'i' };
    filter.$or = [{ name: rx }, { sku: rx }];
  }
  if (category) filter.category = category;
  if (status === 'active') filter.isActive = true;
  if (status === 'hidden') filter.isActive = false;
  if (status === 'out') filter.stock = 0;

  const [items, total] = await Promise.all([
    Product.find(filter).populate('category', 'name').populate('brand', 'name').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);
  res.json({ items, total, page, pages: Math.ceil(total / limit) });
});

// GET /api/admin/products/:id
exports.getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Không tìm thấy sản phẩm');
  res.json(product);
});

// POST /api/admin/products
exports.createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(pick(req.body, PRODUCT_FIELDS));
  res.status(201).json(product);
});

// PUT /api/admin/products/:id
exports.updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Không tìm thấy sản phẩm');
  product.set(pick(req.body, PRODUCT_FIELDS));
  await product.save();
  res.json(product);
});

// PATCH /api/admin/products/:id/visibility
exports.toggleProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Không tìm thấy sản phẩm');
  product.isActive = !product.isActive;
  await product.save();
  res.json({ message: product.isActive ? 'Đã hiện sản phẩm' : 'Đã ẩn sản phẩm', product });
});

// DELETE /api/admin/products/:id - đã có trong đơn hàng thì chỉ ẩn (xóa mềm)
exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Không tìm thấy sản phẩm');
  if (await Order.exists({ 'items.product': product._id })) {
    product.isActive = false;
    await product.save();
    return res.json({ message: 'Sản phẩm đã có trong đơn hàng nên được ẩn thay vì xóa', softDeleted: true });
  }
  await product.deleteOne();
  res.json({ message: 'Đã xóa sản phẩm', softDeleted: false });
});

/* ======================= ĐƠN HÀNG ======================= */
const NEXT_STATUS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipping', 'cancelled'],
  shipping: ['delivered'],
  delivered: [],
  cancelled: [],
};

// GET /api/admin/orders?status=&paymentMethod=&keyword=&from=&to=&page=
exports.listOrders = asyncHandler(async (req, res) => {
  const { status, paymentMethod, keyword, from, to } = req.query;
  const { page, limit, skip } = paginate(req.query, 20, 100);
  const filter = {};
  if (status) filter.orderStatus = status;
  if (paymentMethod) filter.paymentMethod = paymentMethod;
  if (keyword) {
    const rx = { $regex: escapeRegex(keyword.trim()), $options: 'i' };
    filter.$or = [{ orderCode: rx }, { 'shippingAddress.fullName': rx }, { 'shippingAddress.phone': rx }];
  }
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(`${from}T00:00:00+07:00`);
    if (to) filter.createdAt.$lte = new Date(`${to}T23:59:59+07:00`);
  }
  const [items, total, counts] = await Promise.all([
    Order.find(filter).populate('user', 'fullName email').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(filter),
    Order.aggregate([{ $group: { _id: '$orderStatus', count: { $sum: 1 } } }]),
  ]);
  res.json({ items, total, page, pages: Math.ceil(total / limit), counts: Object.fromEntries(counts.map((c) => [c._id, c.count])) });
});

// PATCH /api/admin/orders/:id/status { status, note }
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Không tìm thấy đơn hàng');

  const L = service.ORDER_STATUS_LABEL;
  if (!NEXT_STATUS[order.orderStatus].includes(status)) {
    throw new ApiError(400, `Không thể chuyển đơn từ "${L[order.orderStatus]}" sang "${L[status] || status}"`);
  }
  if (status !== 'cancelled' && order.paymentMethod !== 'COD' && order.paymentStatus !== 'paid') {
    throw new ApiError(400, 'Đơn thanh toán online chưa được thanh toán, chưa thể xử lý');
  }

  if (status === 'cancelled') {
    await service.cancelOrder(order, note || 'Cửa hàng hủy đơn', req.user._id);
  } else {
    order.orderStatus = status;
    if (status === 'delivered') {
      order.deliveredAt = new Date();
      if (order.paymentMethod === 'COD') {
        order.paymentStatus = 'paid';
        order.paymentInfo.paidAt = new Date();
      }
    }
    order.statusHistory.push({ status, note: note || L[status], updatedBy: req.user._id });
    await order.save();
  }
  res.json({ message: `Đã cập nhật trạng thái: ${L[status]}`, order });
});

/* ======================= NGƯỜI DÙNG ======================= */

// GET /api/admin/users?keyword=&role=&status=&page=
exports.listUsers = asyncHandler(async (req, res) => {
  const { keyword, role, status } = req.query;
  const { page, limit, skip } = paginate(req.query, 20, 100);
  const filter = {};
  if (keyword) {
    const rx = { $regex: escapeRegex(keyword.trim()), $options: 'i' };
    filter.$or = [{ fullName: rx }, { email: rx }, { phone: rx }];
  }
  if (role) filter.role = role;
  if (status === 'active') filter.isActive = true;
  if (status === 'locked') filter.isActive = false;
  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  res.json({ items, total, page, pages: Math.ceil(total / limit) });
});

// GET /api/admin/users/:id - kèm lịch sử mua hàng
exports.getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'Không tìm thấy người dùng');
  const [orders, [stat]] = await Promise.all([
    Order.find({ user: user._id }).sort({ createdAt: -1 }).limit(20),
    Order.aggregate([
      { $match: { user: user._id, orderStatus: 'delivered' } },
      { $group: { _id: null, totalSpent: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
    ]),
  ]);
  res.json({ user, orders, totalSpent: stat ? stat.totalSpent : 0, deliveredOrders: stat ? stat.count : 0 });
});

// PATCH /api/admin/users/:id/status - khóa / mở khóa
exports.toggleUserStatus = asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) throw new ApiError(400, 'Không thể khóa tài khoản đang đăng nhập');
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'Không tìm thấy người dùng');
  user.isActive = !user.isActive;
  await user.save({ validateBeforeSave: false });
  res.json({ message: user.isActive ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản', user });
});

// PATCH /api/admin/users/:id/role { role }
exports.changeUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['customer', 'admin'].includes(role)) throw new ApiError(400, 'Vai trò không hợp lệ');
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'Không tìm thấy người dùng');
  if (user.role === 'admin' && role === 'customer' && (await User.countDocuments({ role: 'admin' })) <= 1) {
    throw new ApiError(400, 'Hệ thống phải còn ít nhất một quản trị viên');
  }
  user.role = role;
  await user.save({ validateBeforeSave: false });
  res.json({ message: 'Đã cập nhật vai trò', user });
});

/* ======================= THỐNG KÊ ======================= */
const TZ = 'Asia/Ho_Chi_Minh';
const REVENUE_MATCH = { orderStatus: 'delivered', paymentStatus: 'paid' };

// GET /api/admin/stats/overview
exports.overview = asyncHandler(async (req, res) => {
  const since = new Date();
  since.setMonth(since.getMonth() - 11, 1);
  since.setHours(0, 0, 0, 0);

  const [[rev], orderCount, pendingOrders, customerCount, productCount, lowStock, monthly, topProducts, recentOrders] = await Promise.all([
    Order.aggregate([{ $match: REVENUE_MATCH }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
    Order.countDocuments(),
    Order.countDocuments({ orderStatus: 'pending' }),
    User.countDocuments({ role: 'customer' }),
    Product.countDocuments({ isActive: true }),
    Product.find({ isActive: true, stock: { $lte: 5 } }).select('name sku stock').sort({ stock: 1 }).limit(10),
    Order.aggregate([
      { $match: { ...REVENUE_MATCH, createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt', timezone: TZ } }, revenue: { $sum: '$totalAmount' }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    topProductsAgg({}),
    Order.find().populate('user', 'fullName').sort({ createdAt: -1 }).limit(6),
  ]);

  res.json({
    totalRevenue: rev ? rev.total : 0,
    orderCount,
    pendingOrders,
    customerCount,
    productCount,
    lowStock,
    monthly,
    topProducts,
    recentOrders,
  });
});

function topProductsAgg(match, limit = 5) {
  return Order.aggregate([
    { $match: { ...REVENUE_MATCH, ...match } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        name: { $first: '$items.name' },
        image: { $first: '$items.image' },
        quantity: { $sum: '$items.quantity' },
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
      },
    },
    { $sort: { quantity: -1 } },
    { $limit: limit },
  ]);
}

// GET /api/admin/stats/revenue?from=YYYY-MM-DD&to=YYYY-MM-DD&groupBy=day|month|year
exports.revenue = asyncHandler(async (req, res) => {
  const { from, to, groupBy = 'day' } = req.query;
  if (!from || !to) throw new ApiError(400, 'Vui lòng chọn khoảng thời gian');
  const start = new Date(`${from}T00:00:00+07:00`);
  const end = new Date(`${to}T23:59:59+07:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) throw new ApiError(400, 'Ngày không hợp lệ');
  if (start > end) throw new ApiError(400, 'Ngày bắt đầu phải trước ngày kết thúc');

  const format = { day: '%Y-%m-%d', month: '%Y-%m', year: '%Y' }[groupBy] || '%Y-%m-%d';
  const match = { createdAt: { $gte: start, $lte: end } };

  const [series, [totals], topProducts, byCategory, statusCounts] = await Promise.all([
    Order.aggregate([
      { $match: { ...REVENUE_MATCH, ...match } },
      { $group: { _id: { $dateToString: { format, date: '$createdAt', timezone: TZ } }, revenue: { $sum: '$totalAmount' }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $match: { ...REVENUE_MATCH, ...match } },
      { $group: { _id: null, revenue: { $sum: '$totalAmount' }, orders: { $sum: 1 }, avg: { $avg: '$totalAmount' } } },
    ]),
    topProductsAgg(match, 10),
    Order.aggregate([
      { $match: { ...REVENUE_MATCH, ...match } },
      { $unwind: '$items' },
      { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'p' } },
      { $unwind: '$p' },
      { $lookup: { from: 'categories', localField: 'p.category', foreignField: '_id', as: 'c' } },
      { $unwind: '$c' },
      { $group: { _id: '$c._id', name: { $first: '$c.name' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
      { $sort: { revenue: -1 } },
    ]),
    Order.aggregate([{ $match: match }, { $group: { _id: '$orderStatus', count: { $sum: 1 } } }]),
  ]);

  res.json({
    series,
    totals: totals ? { revenue: totals.revenue, orders: totals.orders, avg: Math.round(totals.avg) } : { revenue: 0, orders: 0, avg: 0 },
    topProducts,
    byCategory,
    statusCounts: Object.fromEntries(statusCounts.map((s) => [s._id, s.count])),
  });
});
