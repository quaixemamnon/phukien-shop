const Product = require('../models/Product');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const Review = require('../models/Review');
const { ApiError, asyncHandler, escapeRegex, paginate } = require('../utils/helpers');

const SORTS = {
  newest: { createdAt: -1 },
  price_asc: { finalPrice: 1 },
  price_desc: { finalPrice: -1 },
  best_selling: { sold: -1 },
  rating: { averageRating: -1 },
};

// GET /api/products?keyword=&category=&brand=&minPrice=&maxPrice=&sort=&page=&limit=
exports.getProducts = asyncHandler(async (req, res) => {
  const { keyword, category, brand, minPrice, maxPrice, sort } = req.query;
  const { page, limit, skip } = paginate(req.query, 12, 48);
  const filter = { isActive: true };

  if (keyword) filter.name = { $regex: escapeRegex(keyword.trim()), $options: 'i' };

  if (category) {
    const cat = await Category.findOne({ slug: category, isActive: true });
    if (!cat) return res.json({ items: [], total: 0, page, pages: 0 });
    const children = await Category.find({ parent: cat._id }).select('_id');
    filter.category = { $in: [cat._id, ...children.map((c) => c._id)] };
  }

  if (brand) {
    const brands = await Brand.find({ slug: { $in: String(brand).split(',') } }).select('_id');
    filter.brand = { $in: brands.map((b) => b._id) };
  }

  if (minPrice || maxPrice) {
    filter.finalPrice = {};
    if (minPrice) filter.finalPrice.$gte = Number(minPrice);
    if (maxPrice) filter.finalPrice.$lte = Number(maxPrice);
  }

  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort(SORTS[sort] || SORTS.newest)
      .skip(skip)
      .limit(limit)
      .populate('category', 'name slug')
      .populate('brand', 'name slug'),
    Product.countDocuments(filter),
  ]);
  res.json({ items, total, page, pages: Math.ceil(total / limit) });
});

// GET /api/products/home - dữ liệu cho trang chủ
exports.getHomeData = asyncHandler(async (req, res) => {
  const base = { isActive: true };
  const [newest, bestSelling, onSale, categories] = await Promise.all([
    Product.find(base).sort({ createdAt: -1 }).limit(8),
    Product.find(base).sort({ sold: -1 }).limit(8),
    Product.find({ ...base, salePrice: { $ne: null } }).sort({ updatedAt: -1 }).limit(8),
    Category.find({ isActive: true, parent: null }).sort({ name: 1 }),
  ]);
  res.json({ newest, bestSelling, onSale, categories });
});

// GET /api/products/:slug
exports.getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true })
    .populate('category', 'name slug')
    .populate('brand', 'name slug');
  if (!product) throw new ApiError(404, 'Không tìm thấy sản phẩm');

  const related = await Product.find({ category: product.category._id, _id: { $ne: product._id }, isActive: true }).limit(4);
  res.json({ product, related });
});

// GET /api/products/:id/reviews
exports.getProductReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ product: req.params.id, isHidden: false })
    .populate('user', 'fullName')
    .sort({ createdAt: -1 })
    .limit(50);
  res.json(reviews);
});
