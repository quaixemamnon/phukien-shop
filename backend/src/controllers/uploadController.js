const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cloudinary = require('cloudinary').v2;
const { ApiError, asyncHandler } = require('../utils/helpers');

const useCloudinary = Boolean(process.env.CLOUDINARY_CLOUD_NAME);
if (useCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const uploadDir = path.join(__dirname, '..', '..', 'uploads');

function toCloudinary(file) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: 'phukien-shop' }, (err, result) => (err ? reject(err) : resolve(result.secure_url)))
      .end(file.buffer);
  });
}

async function toLocal(file, req) {
  await fs.promises.mkdir(uploadDir, { recursive: true });
  const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
  const name = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`;
  await fs.promises.writeFile(path.join(uploadDir, name), file.buffer);
  const base = process.env.SERVER_URL || `${req.protocol}://${req.get('host')}`;
  return `${base}/uploads/${name}`;
}

// POST /api/upload (form-data: images[])
exports.uploadImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) throw new ApiError(400, 'Vui lòng chọn ảnh');
  const urls = [];
  for (const f of req.files) urls.push(useCloudinary ? await toCloudinary(f) : await toLocal(f, req));
  res.status(201).json({ urls });
});
