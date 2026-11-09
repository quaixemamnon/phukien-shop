const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema({
  fullName: { type: String, required: [true, 'Vui lòng nhập tên người nhận'], trim: true },
  phone: { type: String, required: [true, 'Vui lòng nhập số điện thoại'], match: [/^0\d{9}$/, 'Số điện thoại không hợp lệ'] },
  province: { type: String, required: [true, 'Vui lòng nhập tỉnh/thành phố'], trim: true },
  district: { type: String, required: [true, 'Vui lòng nhập quận/huyện'], trim: true },
  ward: { type: String, required: [true, 'Vui lòng nhập phường/xã'], trim: true },
  street: { type: String, required: [true, 'Vui lòng nhập số nhà, tên đường'], trim: true },
  isDefault: { type: Boolean, default: false },
});

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Vui lòng nhập họ tên'],
      trim: true,
      minlength: [2, 'Họ tên tối thiểu 2 ký tự'],
      maxlength: [50, 'Họ tên tối đa 50 ký tự'],
    },
    email: {
      type: String,
      required: [true, 'Vui lòng nhập email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ'],
    },
    password: { type: String, required: [true, 'Vui lòng nhập mật khẩu'], minlength: [6, 'Mật khẩu tối thiểu 6 ký tự'], select: false },
    phone: { type: String, match: [/^0\d{9}$/, 'Số điện thoại không hợp lệ'] },
    avatar: String,
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    addresses: [addressSchema],
    isActive: { type: Boolean, default: true },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = function matchPassword(plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
