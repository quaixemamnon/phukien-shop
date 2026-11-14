const router = require('express').Router();
const a = require('../controllers/adminController');
const r = require('../controllers/reviewController');
const { getOrderById } = require('../controllers/orderController');
const { categoryCtrl, brandCtrl } = require('./taxonomies');
const { protect, isAdmin, isStaff } = require('../middlewares/auth');

// Mọi API quản trị đều cần đăng nhập với vai trò nhân viên hoặc quản trị viên.
// Các chức năng chỉ quản trị viên được dùng có thêm isAdmin.
router.use(protect, isStaff);

// Tổng quan (nhân viên không thấy số liệu doanh thu)
router.get('/stats/overview', a.overview);

// Sản phẩm
router.get('/products', a.listProducts);
router.post('/products', a.createProduct);
router.get('/products/:id', a.getProduct);
router.put('/products/:id', a.updateProduct);
router.patch('/products/:id/visibility', a.toggleProduct);
router.delete('/products/:id', a.deleteProduct);

// Danh mục & thương hiệu
router.get('/categories', categoryCtrl.listAdmin);
router.post('/categories', categoryCtrl.create);
router.put('/categories/:id', categoryCtrl.update);
router.delete('/categories/:id', categoryCtrl.remove);
router.get('/brands', brandCtrl.listAdmin);
router.post('/brands', brandCtrl.create);
router.put('/brands/:id', brandCtrl.update);
router.delete('/brands/:id', brandCtrl.remove);

// Đơn hàng
router.get('/orders', a.listOrders);
router.get('/orders/:id', getOrderById);
router.patch('/orders/:id/status', a.updateOrderStatus);
router.patch('/orders/:id/refund', isAdmin, a.markRefunded);

// Đánh giá
router.get('/reviews', r.adminList);
router.patch('/reviews/:id/visibility', r.toggleVisibility);

// ===== Chỉ quản trị viên =====
router.get('/users', isAdmin, a.listUsers);
router.get('/users/:id', isAdmin, a.getUser);
router.patch('/users/:id/status', isAdmin, a.toggleUserStatus);
router.patch('/users/:id/role', isAdmin, a.changeUserRole);
router.get('/stats/revenue', isAdmin, a.revenue);

module.exports = router;
