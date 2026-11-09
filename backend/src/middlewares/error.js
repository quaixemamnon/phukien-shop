const multer = require('multer');
const { ApiError } = require('../utils/helpers');

const notFound = (req, res, next) => next(new ApiError(404, `Không tìm thấy đường dẫn ${req.originalUrl}`));

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message || 'Lỗi máy chủ';

  if (err.name === 'CastError') {
    status = 400;
    message = 'ID không hợp lệ';
  } else if (err.code === 11000) {
    status = 409;
    message = `Giá trị ${Object.keys(err.keyValue || {}).join(', ')} đã tồn tại`;
  } else if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join('. ');
  } else if (err instanceof multer.MulterError) {
    status = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'Ảnh tối đa 5MB' : err.message;
  }

  if (status >= 500) console.error(err);
  res.status(status).json({ message });
};

module.exports = { notFound, errorHandler };
