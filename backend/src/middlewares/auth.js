const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ApiError, asyncHandler } = require('../utils/helpers');

// Bắt buộc đăng nhập
const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new ApiError(401, 'Vui lòng đăng nhập');

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new ApiError(401, 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
  }

  const user = await User.findById(decoded.id);
  if (!user) throw new ApiError(401, 'Tài khoản không tồn tại');
  if (!user.isActive) throw new ApiError(403, 'Tài khoản đã bị khóa');
  req.user = user;
  next();
});

// Chỉ cho phép các vai trò được liệt kê
const allowRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) return next(new ApiError(403, 'Bạn không có quyền truy cập chức năng này'));
  next();
};

const isAdmin = allowRoles('admin'); // chỉ quản trị viên
const isStaff = allowRoles('admin', 'staff'); // nhân viên hoặc quản trị viên

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || '7d' });

module.exports = { protect, allowRoles, isAdmin, isStaff, signToken };
