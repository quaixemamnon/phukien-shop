const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { ApiError, asyncHandler } = require('../utils/helpers');

const PRODUCT_FIELDS = 'name slug images price salePrice finalPrice stock isActive';

async function loadCart(userId) {
  let cart = await Cart.findOne({ user: userId }).populate('items.product', PRODUCT_FIELDS);
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
}

// Chuẩn hóa dữ liệu giỏ hàng trả về cho giao diện
function formatCart(cart) {
  const items = cart.items
    .filter((i) => i.product)
    .map((i) => {
      const p = i.product;
      const available = p.isActive && p.stock > 0;
      return {
        product: p,
        quantity: i.quantity,
        price: p.finalPrice,
        lineTotal: p.finalPrice * i.quantity,
        available,
        overStock: i.quantity > p.stock,
      };
    });
  const valid = items.filter((i) => i.available && !i.overStock);
  return {
    items,
    subtotal: valid.reduce((s, i) => s + i.lineTotal, 0),
    count: items.reduce((s, i) => s + i.quantity, 0),
    canCheckout: items.length > 0 && valid.length === items.length,
  };
}

const respond = async (res, userId, status = 200) => res.status(status).json(formatCart(await loadCart(userId)));

// GET /api/cart
exports.getCart = asyncHandler(async (req, res) => respond(res, req.user._id));

// POST /api/cart/items { productId, quantity }
exports.addItem = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  const quantity = Math.max(1, parseInt(req.body.quantity, 10) || 1);
  const product = await Product.findById(productId);
  if (!product || !product.isActive) throw new ApiError(404, 'Sản phẩm không tồn tại hoặc đã ngừng bán');

  const cart = await Cart.findOne({ user: req.user._id }) || new Cart({ user: req.user._id, items: [] });
  const item = cart.items.find((i) => String(i.product) === String(productId));
  const newQty = (item ? item.quantity : 0) + quantity;
  if (newQty > product.stock) {
    throw new ApiError(400, product.stock === 0 ? 'Sản phẩm đã hết hàng' : `Chỉ còn ${product.stock} sản phẩm trong kho`);
  }
  if (item) item.quantity = newQty;
  else cart.items.push({ product: productId, quantity });
  await cart.save();
  await respond(res, req.user._id);
});

// PUT /api/cart/items/:productId { quantity }
exports.updateItem = asyncHandler(async (req, res) => {
  const quantity = parseInt(req.body.quantity, 10);
  if (!quantity || quantity < 1) throw new ApiError(400, 'Số lượng phải lớn hơn 0');
  const product = await Product.findById(req.params.productId);
  if (!product) throw new ApiError(404, 'Sản phẩm không tồn tại');
  if (quantity > product.stock) throw new ApiError(400, `Chỉ còn ${product.stock} sản phẩm trong kho`);

  const cart = await Cart.findOne({ user: req.user._id });
  const item = cart && cart.items.find((i) => String(i.product) === req.params.productId);
  if (!item) throw new ApiError(404, 'Sản phẩm không có trong giỏ hàng');
  item.quantity = quantity;
  await cart.save();
  await respond(res, req.user._id);
});

// DELETE /api/cart/items/:productId
exports.removeItem = asyncHandler(async (req, res) => {
  await Cart.updateOne({ user: req.user._id }, { $pull: { items: { product: req.params.productId } } });
  await respond(res, req.user._id);
});

// DELETE /api/cart
exports.clear = asyncHandler(async (req, res) => {
  await Cart.updateOne({ user: req.user._id }, { $set: { items: [] } });
  await respond(res, req.user._id);
});
