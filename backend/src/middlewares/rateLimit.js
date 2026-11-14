// Giới hạn số lần gọi API trong một khoảng thời gian (lưu trong bộ nhớ server).
// Dùng cho đăng nhập / quên mật khẩu để chống dò mật khẩu tự động.
const { ApiError } = require('../utils/helpers');

function rateLimit({ windowMs, max, keyFn, message }) {
  const hits = new Map(); // key -> { count, resetAt }

  // Dọn các mục đã hết hạn để không tốn bộ nhớ
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
  }, windowMs).unref();

  return (req, res, next) => {
    const key = keyFn(req);
    const now = Date.now();
    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;
    if (entry.count > max) {
      const minutes = Math.ceil((entry.resetAt - now) / 60000);
      return next(new ApiError(429, `${message} Vui lòng thử lại sau ${minutes} phút.`));
    }
    next();
  };
}

const byIpAndEmail = (req) => `${req.ip}|${String(req.body?.email || '').toLowerCase().trim()}`;

// Tối đa 10 lần đăng nhập / 15 phút cho mỗi IP + email
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, keyFn: byIpAndEmail, message: 'Bạn đã đăng nhập sai quá nhiều lần.' });
// Tối đa 5 yêu cầu quên mật khẩu / 15 phút cho mỗi IP
const forgotLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, keyFn: (req) => req.ip, message: 'Bạn đã gửi quá nhiều yêu cầu.' });

module.exports = { rateLimit, loginLimiter, forgotLimiter };
