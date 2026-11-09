// Tạo dữ liệu mẫu:
//   node src/seed.js               XÓA toàn bộ dữ liệu cũ rồi tạo dữ liệu mẫu
//   node src/seed.js --images-only Chỉ gắn ảnh mẫu cho sản phẩm/danh mục đang có (theo SKU, tên danh mục), không xóa gì
//   Thêm --svg vào 2 lệnh trên để dùng ảnh minh họa SVG thay cho ảnh Unsplash
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

  await User.create([
    {
      fullName: 'Quản trị viên',
      email: process.env.SEED_ADMIN_EMAIL || 'admin@phukien.vn',
      password: process.env.SEED_ADMIN_PASSWORD || 'Admin@123',
      role: 'admin',
    },
    {
      fullName: 'Nguyễn Văn An',
      email: 'khachhang@phukien.vn',
      password: 'Khach@123',
      phone: '0912345678',
      addresses: [
        { fullName: 'Nguyễn Văn An', phone: '0912345678', province: 'TP. Hồ Chí Minh', district: 'Quận 10', ward: 'Phường 12', street: '268 Lý Thường Kiệt', isDefault: true },
      ],
    },
  ]);

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

  console.log('Đã tạo dữ liệu mẫu:');
  console.log(`  Admin:      ${process.env.SEED_ADMIN_EMAIL || 'admin@phukien.vn'} / (SEED_ADMIN_PASSWORD trong .env)`);
  console.log('  Khách hàng: khachhang@phukien.vn / Khach@123');
}

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  if (process.argv.includes('--images-only')) await imagesOnly();
  else await fullSeed();
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
