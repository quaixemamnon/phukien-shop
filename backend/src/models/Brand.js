const mongoose = require('mongoose');
const { slugify } = require('../utils/helpers');

const brandSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Vui lòng nhập tên thương hiệu'], unique: true, trim: true },
    slug: { type: String, unique: true },
    logo: String,
    description: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

brandSchema.pre('validate', function setSlug(next) {
  if (this.isModified('name') || !this.slug) this.slug = slugify(this.name);
  next();
});

module.exports = mongoose.model('Brand', brandSchema);
