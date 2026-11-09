const User = require('../models/User');
const { ApiError, asyncHandler, pick } = require('../utils/helpers');

// GET /api/users/me
exports.getMe = asyncHandler(async (req, res) => {
  res.json(req.user);
});

// PUT /api/users/me
exports.updateMe = asyncHandler(async (req, res) => {
  const data = pick(req.body, ['fullName', 'phone']);
  if (data.phone === '') data.phone = undefined;
  Object.assign(req.user, data);
  await req.user.save();
  res.json({ message: 'Cập nhật thông tin thành công', user: req.user });
});

// PUT /api/users/me/password
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) throw new ApiError(400, 'Vui lòng nhập mật khẩu cũ và mật khẩu mới');
  if (newPassword.length < 6) throw new ApiError(400, 'Mật khẩu mới tối thiểu 6 ký tự');

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword))) throw new ApiError(400, 'Mật khẩu cũ không đúng');
  user.password = newPassword;
  await user.save();
  res.json({ message: 'Đổi mật khẩu thành công' });
});

const ADDRESS_FIELDS = ['fullName', 'phone', 'province', 'district', 'ward', 'street', 'isDefault'];

function applyDefault(user, address) {
  if (address.isDefault || user.addresses.length === 1) {
    user.addresses.forEach((a) => {
      a.isDefault = a._id.equals(address._id);
    });
  }
}

// POST /api/users/me/addresses
exports.addAddress = asyncHandler(async (req, res) => {
  const user = req.user;
  user.addresses.push(pick(req.body, ADDRESS_FIELDS));
  const added = user.addresses[user.addresses.length - 1];
  applyDefault(user, added);
  await user.save();
  res.status(201).json({ message: 'Đã thêm địa chỉ', addresses: user.addresses });
});

// PUT /api/users/me/addresses/:addressId
exports.updateAddress = asyncHandler(async (req, res) => {
  const user = req.user;
  const address = user.addresses.id(req.params.addressId);
  if (!address) throw new ApiError(404, 'Không tìm thấy địa chỉ');
  Object.assign(address, pick(req.body, ADDRESS_FIELDS));
  applyDefault(user, address);
  await user.save();
  res.json({ message: 'Đã cập nhật địa chỉ', addresses: user.addresses });
});

// DELETE /api/users/me/addresses/:addressId
exports.deleteAddress = asyncHandler(async (req, res) => {
  const user = req.user;
  const address = user.addresses.id(req.params.addressId);
  if (!address) throw new ApiError(404, 'Không tìm thấy địa chỉ');
  const wasDefault = address.isDefault;
  address.deleteOne();
  if (wasDefault && user.addresses.length) user.addresses[0].isDefault = true;
  await user.save();
  res.json({ message: 'Đã xóa địa chỉ', addresses: user.addresses });
});
