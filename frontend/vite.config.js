import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Cho phép mở qua link Cloudflare Tunnel (chia sẻ bản chạy trên máy cho người khác xem tạm)
    allowedHosts: ['.trycloudflare.com'],
    // Khi chạy dev, chuyển các request /api và /uploads sang backend
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
      '/uploads': { target: 'http://localhost:5000', changeOrigin: true },
    },
  },
});
