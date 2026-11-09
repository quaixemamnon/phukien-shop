// Tạo dữ liệu mẫu:
//   node src/seed.js               XÓA toàn bộ dữ liệu cũ rồi tạo dữ liệu mẫu
//   node src/seed.js --images-only Chỉ gắn ảnh mẫu cho sản phẩm/danh mục đang có (theo SKU, tên danh mục), không xóa gì
//   Thêm --svg vào 2 lệnh trên để dùng ảnh minh họa SVG thay cho ảnh Unsplash
//   node src/seed.js --sample-activity Thêm khách hàng mẫu, đơn đã giao và đánh giá mẫu vào database đang có (không xóa gì)
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Category = require('./models/Category');
const Brand = require('./models/Brand');
const Product = require('./models/Product');
const Cart = require('./models/Cart');
const Order = require('./models/Order');
const Review = require('./models/Review');
const PRODUCTS = require('./data/sampleProducts');
const ACTIVITY = require('./data/sampleActivity');
const { slugify } = require('./utils/helpers');

// Mặc định dùng ảnh thật từ Unsplash (cần Internet).
// Thêm cờ --svg để dùng ảnh minh họa vẽ sẵn trong frontend/public/images (chạy được khi không có mạng)
const USE_SVG = process.argv.includes('--svg');
const svgImages = (sku) => [1, 2].map((i) => `/images/products/${sku.toLowerCase()}-${i}.svg`);
const productImages = (sku) => {
  const p = PRODUCTS.find((x) => x.sku === sku);
  return !USE_SVG && p && p.photos.length ? p.photos : svgImages(sku);
};
const categoryImage = (name) => (!USE_SVG && PRODUCTS.categoryPhoto(name)) || `/images/categories/${slugify(name)}.svg`;
const brandLogo = (name) => `https://placehold.co/200x80/ffffff/1f3b57?text=${encodeURIComponent(name)}`;

const CATEGORIES = ['Tai nghe', 'Củ sạc', 'Cáp sạc', 'Sạc dự phòng', 'Ốp lưng', 'Chuột & Bàn phím'];
const BRANDS = ['Anker', 'Baseus', 'Ugreen', 'Sony', 'Logitech', 'Xiaomi'];

async function imagesOnly() {
  let n = 0;
  for (const p of PRODUCTS) {
    const r = await Product.updateOne({ sku: p.sku }, { images: productImages(p.sku) });
    n += r.modifiedCount;
  }
  for (const name of CATEGORIES) await Category.updateOne({ name }, { image: categoryImage(name) });
  console.log(`Đã gắn ảnh mẫu cho ${n} sản phẩm và các danh mục`);
}

async function fullSeed() {
  console.log('Đang xóa dữ liệu cũ...');
  await Promise.all([User, Category, Brand, Product, Cart, Order, Review].map((M) => M.deleteMany({})));

  await User.create({
    fullName: 'Quản trị viên',
    email: process.env.SEED_ADMIN_EMAIL || 'admin@phukien.vn',
    password: process.env.SEED_ADMIN_PASSWORD || 'Admin@123',
    role: 'admin',
  });

  const cats = {};
  for (const name of CATEGORIES) cats[name] = await Category.create({ name, image: categoryImage(name) });
  const brands = {};
  for (const name of BRANDS) brands[name] = await Brand.create({ name, logo: brandLogo(name) });

  for (const p of PRODUCTS) {
    await Product.create({
      name: p.name,
      sku: p.sku,
      price: p.price,
      salePrice: p.salePrice,
      stock: p.stock,
      category: cats[p.category]._id,
      brand: brands[p.brand]._id,
      images: productImages(p.sku),
      description: `${p.name} chính hãng ${p.brand}, bảo hành theo tiêu chuẩn nhà sản xuất. Sản phẩm phù hợp sử dụng hằng ngày cho điện thoại, máy tính bảng và laptop.`,
      specifications: p.specs.map(([key, value]) => ({ key, value })),
      warrantyMonths: 12,
    });
  }

  await seedSampleActivity();

  console.log('Đã tạo dữ liệu mẫu:');
  console.log(`  Admin:      ${process.env.SEED_ADMIN_EMAIL || 'admin@phukien.vn'} / (SEED_ADMIN_PASSWORD trong .env)`);
  console.log(`  Khách hàng: ${ACTIVITY.CUSTOMERS.map((c) => c.email).join(', ')} / ${ACTIVITY.PASSWORD}`);
}

// Khách hàng mẫu + đơn hàng đã giao + đánh giá mẫu (để trang sản phẩm, trang thống kê có dữ liệu khi demo)
async function seedSampleActivity() {
  const DAY = 24 * 3600 * 1000;
  const users = [];
  for (const c of ACTIVITY.CUSTOMERS) {
    let u = await User.findOne({ email: c.email });
    if (!u) {
      u = await User.create({ fullName: c.fullName, email: c.email, phone: c.phone, password: ACTIVITY.PASSWORD, addresses: [{ ...c.address, isDefault: true }] });
    }
    users.push(u);
  }
  if (await Review.exists({ user: { $in: users.map((u) => u._id) } })) {
    console.log('Khách hàng mẫu đã có đánh giá, bỏ qua tạo đơn/đánh giá mẫu');
    return;
  }

  const orders = [];
  for (const [i, o] of ACTIVITY.ORDERS.entries()) {
    const user = users[o.customer];
    const products = await Product.find({ sku: { $in: o.skus } });
    if (!products.length) continue;
    const items = products.map((p) => ({ product: p._id, name: p.name, image: p.images[0], price: p.finalPrice, quantity: 1 }));
    const subtotal = items.reduce((s, it) => s + it.price, 0);
    const shippingFee = subtotal >= 500000 ? 0 : 30000;
    const created = new Date(Date.now() - o.daysAgo * DAY);
    const at = (h) => new Date(created.getTime() + h * 3600 * 1000);
    const a = ACTIVITY.CUSTOMERS[o.customer].address;
    const order = await Order.create({
      orderCode: `DH${created.toISOString().slice(2, 10).replace(/-/g, '')}${String(9000 + i)}`,
      user: user._id,
      items,
      shippingAddress: { fullName: a.fullName, phone: a.phone, street: a.street, ward: a.ward, district: a.district, province: a.province },
      subtotal,
      shippingFee,
      totalAmount: subtotal + shippingFee,
      paymentMethod: o.paymentMethod,
      paymentStatus: 'paid',
      paymentInfo: { paidAt: o.paymentMethod === 'COD' ? at(72) : at(0.1), transactionId: o.paymentMethod === 'COD' ? undefined : String(14600000 + i) },
      orderStatus: 'delivered',
      statusHistory: [
        { status: 'pending', note: 'Khách hàng đặt hàng', updatedAt: at(0) },
        { status: 'confirmed', note: 'Đã xác nhận', updatedAt: at(2) },
        { status: 'shipping', note: 'Đang giao', updatedAt: at(20) },
        { status: 'delivered', note: 'Đã giao', updatedAt: at(72) },
      ],
      stockDeducted: true,
      deliveredAt: at(72),
    });
    // Đặt lại ngày tạo đơn về quá khứ (timestamps của Mongoose luôn ghi thời điểm hiện tại)
    await Order.collection.updateOne({ _id: order._id }, { $set: { createdAt: created, updatedAt: at(72) } });
    for (const it of items) await Product.updateOne({ _id: it.product }, { $inc: { stock: -1, sold: 1 } });
    orders[i] = { order, deliveredAt: at(72) };
  }

  const touched = new Set();
  for (const r of ACTIVITY.REVIEWS) {
    const o = orders[r.order];
    const product = o && (await Product.findOne({ sku: r.sku }));
    if (!product) continue;
    const review = await Review.create({ product: product._id, user: o.order.user, order: o.order._id, rating: r.rating, comment: r.comment });
    const when = new Date(o.deliveredAt.getTime() + 2 * DAY);
    await Review.collection.updateOne({ _id: review._id }, { $set: { createdAt: when, updatedAt: when } });
    touched.add(String(product._id));
  }
  for (const id of touched) await Review.recalcProduct(id);
  console.log(`Đã tạo ${orders.filter(Boolean).length} đơn đã giao và ${ACTIVITY.REVIEWS.length} đánh giá mẫu`);
}

// Dùng khi triển khai: server tự tạo dữ liệu mẫu nếu database còn trống (AUTO_SEED=true)
async function seedIfEmpty() {
  if ((await Product.estimatedDocumentCount()) > 0 || (await User.estimatedDocumentCount()) > 0) return false;
  console.log('Database trống, đang tạo dữ liệu mẫu...');
  // Trên máy chủ thật không dùng mật khẩu admin mặc định (đã công khai trong README)
  if (process.env.NODE_ENV === 'production' && !process.env.SEED_ADMIN_PASSWORD) {
    process.env.SEED_ADMIN_PASSWORD = require('crypto').randomBytes(6).toString('base64url');
    console.log(`Chưa đặt SEED_ADMIN_PASSWORD, mật khẩu admin được tạo ngẫu nhiên: ${process.env.SEED_ADMIN_PASSWORD}`);
  }
  await fullSeed();
  return true;
}

module.exports = { seedIfEmpty };

if (require.main === module) {
  (async () => {
    await mongoose.connect(process.env.MONGO_URI);
    if (process.argv.includes('--images-only')) await imagesOnly();
    else if (process.argv.includes('--sample-activity')) await seedSampleActivity();
    else await fullSeed();
    await mongoose.disconnect();
  })().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
