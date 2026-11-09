const mongoose = require('mongoose');
const { slugify } = require('../utils/helpers');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Vui lòng nhập tên sản phẩm'], trim: true },
    slug: { type: String, unique: true },
    sku: { type: String, required: [true, 'Vui lòng nhập mã SKU'], unique: true, trim: true, uppercase: true },
    description: { type: String, default: '' },
    price: { type: Number, required: [true, 'Vui lòng nhập giá'], min: [0, 'Giá không được âm'] },
    salePrice: {
      type: Number,
      min: [0, 'Giá khuyến mãi không được âm'],
      default: null,
      validate: {
        validator(v) {
          return v == null || v <= this.price;
        },
        message: 'Giá khuyến mãi phải nhỏ hơn hoặc bằng giá bán',
      },
    },
    // Giá bán thực tế (= salePrice nếu có, ngược lại = price). Dùng để lọc và sắp xếp theo giá
    finalPrice: { type: Number, default: 0 },
    stock: { type: Number, default: 0, min: [0, 'Tồn kho không được âm'] },
    sold: { type: Number, default: 0 },
    images: {
      type: [String],
      validate: { validator: (v) => Array.isArray(v) && v.length > 0, message: 'Cần ít nhất 1 ảnh sản phẩm' },
    },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: [true, 'Vui lòng chọn danh mục'] },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: [true, 'Vui lòng chọn thương hiệu'] },
    specifications: [{ key: String, value: String, _id: false }],
    warrantyMonths: { type: Number, default: 0, min: 0 },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, brand: 1, finalPrice: 1 });

productSchema.pre('validate', function beforeValidate(next) {
  if (this.isModified('name') || this.isModified('sku') || !this.slug) {
    this.slug = `${slugify(this.name)}-${slugify(this.sku)}`;
  }
  if (this.salePrice === '' || this.salePrice === 0) this.salePrice = null;
  this.finalPrice = this.salePrice != null && this.salePrice < this.price ? this.salePrice : this.price;
  next();
});

module.exports = mongoose.model('Product', productSchema);
