class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Bọc controller async để lỗi được chuyển tới errorHandler
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// "Củ sạc Anker 65W" -> "cu-sac-anker-65w"
const slugify = (str) =>
  String(str || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const pick = (obj, keys) =>
  keys.reduce((out, k) => {
    if (obj[k] !== undefined) out[k] = obj[k];
    return out;
  }, {});

const paginate = (query, defLimit = 12, maxLimit = 50) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defLimit));
  return { page, limit, skip: (page - 1) * limit };
};

const clientUrl = () => (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim();

module.exports = { ApiError, asyncHandler, slugify, escapeRegex, pick, paginate, clientUrl };
