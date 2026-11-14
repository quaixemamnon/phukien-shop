const router = require('express').Router();
const multer = require('multer');
const { uploadImages } = require('../controllers/uploadController');
const { protect, isStaff } = require('../middlewares/auth');
const { ApiError } = require('../utils/helpers');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    file.mimetype.startsWith('image/') ? cb(null, true) : cb(new ApiError(400, 'Chỉ cho phép tải lên file ảnh')),
});

router.post('/', protect, isStaff, upload.array('images', 8), uploadImages);

module.exports = router;
