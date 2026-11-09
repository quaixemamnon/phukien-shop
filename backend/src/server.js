require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middlewares/error');
const { startOrderJobs } = require('./jobs/orderJobs');

const app = express();
app.set('trust proxy', 1); // chạy sau proxy của Render/Cloudflare: lấy đúng IP và giao thức https

const allowedOrigins = (process.env.CLIENT_URL || '').split(',').map((s) => s.trim()).filter(Boolean);
app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// Ảnh tải lên khi không dùng Cloudinary
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/brands', require('./routes/brandRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Khi triển khai 1 dịch vụ (Render): backend phục vụ luôn giao diện React đã build (frontend/dist)
const distDir = path.join(__dirname, '..', '..', 'frontend', 'dist');
if (fs.existsSync(path.join(distDir, 'index.html'))) {
  app.use(express.static(distDir, { index: false, maxAge: '1h' }));
  app.get(/^\/(?!api\/|uploads\/).*/, (req, res) => res.sendFile(path.join(distDir, 'index.html')));
  console.log('Đang phục vụ giao diện từ frontend/dist');
}

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
connectDB().then(async () => {
  if (process.env.AUTO_SEED === 'true') {
    try {
      await require('./seed').seedIfEmpty();
    } catch (err) {
      console.error('Tự tạo dữ liệu mẫu thất bại:', err.message);
    }
  }
  app.listen(PORT, () => console.log(`Server đang chạy tại cổng ${PORT}`));
  startOrderJobs();
});
