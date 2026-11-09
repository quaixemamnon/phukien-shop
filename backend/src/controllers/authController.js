const crypto = require('crypto');
const User = require('../models/User');
const { signToken } = require('../middlewares/auth');
const sendEmail = require('../utils/sendEmail');
const { ApiError, asyncHandler, clientUrl } = require('../utils/helpers');

// POST /api/auth/register
exports.register = asyncHandler(async (req, res) => {
  const { fullName, email, phone, password } = req.body;
  if (!fullName || !email || !password) throw new ApiError(400, 'Vui lòng nhập đầy đủ họ tên, email và mật khẩu');
  if (await User.exists({ email: String(email).toLowerCase().trim() })) throw new ApiError(409, 'Email đã được sử dụng');

  await User.create({ fullName, email, phone: phone || undefined, password, role: 'customer' });
  res.status(201).json({ message: 'Đăng ký thành công, vui lòng đăng nhập' });
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Vui lòng nhập email và mật khẩu');

  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password');
  if (!user || !(await user.matchPassword(password))) throw new ApiError(401, 'Email hoặc mật khẩu không đúng');
  if (!user.isActive) throw new ApiError(403, 'Tài khoản của bạn đã bị khóa');

  res.json({ token: signToken(user), user });
});

// GET /api/auth/me
exports.me = asyncHandler(async (req, res) => {
  res.json(req.user);
});

// POST /api/auth/forgot-password
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, 'Vui lòng nhập email');
  const user = await User.findOne({ email: String(email).toLowerCase().trim() });

  if (user) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    const link = `${clientUrl()}/reset-password/${rawToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Đặt lại mật khẩu',
      html: `<p>Xin chào ${user.fullName},</p><p>Nhấn vào liên kết sau để đặt lại mật khẩu (hiệu lực 15 phút):</p><p><a href="${link}">${link}</a></p>`,
    });
  }
  // Luôn trả về cùng một thông báo để không lộ email nào đã đăng ký
  res.json({ message: 'Nếu email tồn tại trong hệ thống, liên kết đặt lại mật khẩu đã được gửi tới email của bạn' });
});

// POST /api/auth/reset-password/:token
exports.resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) throw new ApiError(400, 'Mật khẩu tối thiểu 6 ký tự');

  const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({ resetPasswordToken: hashed, resetPasswordExpires: { $gt: new Date() } }).select(
    '+resetPasswordToken +resetPasswordExpires'
  );
  if (!user) throw new ApiError(400, 'Liên kết không hợp lệ hoặc đã hết hạn');

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  res.json({ message: 'Đặt lại mật khẩu thành công, vui lòng đăng nhập' });
});
