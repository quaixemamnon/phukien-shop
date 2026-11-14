const Order = require('../models/Order');
const Cart = require('../models/Cart');
const service = require('../services/orderService');
const { ApiError, asyncHandler } = require('../utils/helpers');

const SHIPPING_FEE = 30000;
const FREE_SHIP_FROM = 500000;
const ADDRESS_KEYS = ['fullName', 'phone', 'street', 'ward', 'district', 'province'];

const newOrderCode = () => {
  const d = new Date(Date.now() + 7 * 3600 * 1000); // giờ Việt Nam
  const p = (n) => String(n).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `DH${String(d.getUTCFullYear()).slice(2)}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}${rand}${Date.now().toString().slice(-2)}`;
};

// POST /api/orders { addressId | shippingAddress, paymentMethod, note }
exports.createOrder = asyncHandler(async (req, res) => {
  const { addressId, shippingAddress, paymentMethod = 'COD', note } = req.body;
  if (!service.enabledPaymentMethods().includes(paymentMethod)) throw new ApiError(400, 'Phương thức thanh toán không hợp lệ hoặc chưa được bật');

  // Địa chỉ giao hàng: chọn từ sổ địa chỉ hoặc nhập mới
  let address = addressId ? req.user.addresses.id(addressId) : shippingAddress;
  if (!address) throw new ApiError(400, 'Vui lòng chọn hoặc nhập địa chỉ giao hàng');
  address = Object.fromEntries(ADDRESS_KEYS.map((k) => [k, String(address[k] || '').trim()]));
  if (ADDRESS_KEYS.some((k) => !address[k])) throw new ApiError(400, 'Vui lòng nhập đầy đủ thông tin giao hàng');
  if (!/^0\d{9}$/.test(address.phone)) throw new ApiError(400, 'Số điện thoại người nhận không hợp lệ');

  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  if (!cart || cart.items.length === 0) throw new ApiError(400, 'Giỏ hàng đang trống');

  const items = cart.items.map((i) => {
    const p = i.product;
    if (!p || !p.isActive) throw new ApiError(400, 'Có sản phẩm trong giỏ đã ngừng bán, vui lòng xóa khỏi giỏ hàng');
    if (i.quantity > p.stock) throw new ApiError(400, `Sản phẩm "${p.name}" chỉ còn ${p.stock} trong kho`);
    return { product: p._id, name: p.name, image: p.images[0], price: p.finalPrice, quantity: i.quantity };
  });

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shippingFee = subtotal >= FREE_SHIP_FROM ? 0 : SHIPPING_FEE;

  const order = new Order({
    orderCode: newOrderCode(),
    user: req.user._id,
    items,
    shippingAddress: address,
    subtotal,
    shippingFee,
    totalAmount: subtotal + shippingFee,
    paymentMethod,
    note,
    statusHistory: [{ status: 'pending', note: 'Khách hàng đặt hàng', updatedBy: req.user._id }],
  });

  await order.validate();
  // Giữ hàng ngay khi đặt (cả COD và MoMo) để không bán vượt số lượng tồn.
  // Đơn MoMo không thanh toán trong 30 phút sẽ tự hủy và hoàn lại kho.
  const ok = await service.deductStock(order.items);
  if (!ok) throw new ApiError(400, 'Một số sản phẩm vừa hết hàng, vui lòng kiểm tra lại giỏ hàng');
  order.stockDeducted = true;
  await order.save();

  let paymentUrl = null;
  if (paymentMethod === 'MOMO') {
    try {
      paymentUrl = await service.createPaymentUrl(order);
    } catch (err) {
      // Không tạo được giao dịch -> trả hàng về kho, xóa đơn vừa tạo, giỏ hàng vẫn giữ nguyên để khách đặt lại
      await service.restoreStock(order.items);
      await order.deleteOne();
      throw err;
    }
  }
  await service.clearCart(req.user._id);
  if (paymentMethod === 'COD') await service.sendOrderEmail(order, 'Đặt hàng thành công');
  res.status(201).json({ order, paymentUrl });
});

// GET /api/orders/my?status=
exports.getMyOrders = asyncHandler(async (req, res) => {
  const filter = { user: req.user._id };
  if (req.query.status) filter.orderStatus = req.query.status;
  res.json(await Order.find(filter).sort({ createdAt: -1 }));
});

// GET /api/orders/:id (chủ đơn hoặc admin)
exports.getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'fullName email phone');
  const isOwner = order && order.user && String(order.user._id) === String(req.user._id);
  const isStaff = ['admin', 'staff'].includes(req.user.role);
  if (!order || (!isOwner && !isStaff)) throw new ApiError(404, 'Không tìm thấy đơn hàng');
  res.json(order);
});

// PATCH /api/orders/:id/cancel { reason }
exports.cancelMyOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) throw new ApiError(404, 'Không tìm thấy đơn hàng');
  if (order.orderStatus !== 'pending') throw new ApiError(400, 'Chỉ có thể hủy đơn hàng đang chờ xác nhận');
  const reason = String(req.body.reason || '').trim().slice(0, 200);
  await service.cancelOrder(order, reason ? `Khách hàng hủy: ${reason}` : 'Khách hàng hủy đơn', req.user._id);
  res.json({ message: 'Đã hủy đơn hàng', order });
});

// POST /api/orders/:id/pay - thanh toán lại đơn online chưa thanh toán
exports.retryPayment = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) throw new ApiError(404, 'Không tìm thấy đơn hàng');
  if (order.paymentMethod === 'COD') throw new ApiError(400, 'Đơn hàng thanh toán khi nhận hàng');
  if (order.paymentStatus === 'paid') throw new ApiError(400, 'Đơn hàng đã được thanh toán');
  const expired = Date.now() - order.createdAt.getTime() > service.PAYMENT_TIMEOUT_MIN * 60 * 1000;
  if (order.orderStatus !== 'pending' || expired) throw new ApiError(400, 'Đơn hàng đã hết hạn thanh toán');
  const paymentUrl = await service.createPaymentUrl(order, req);
  res.json({ paymentUrl });
});
