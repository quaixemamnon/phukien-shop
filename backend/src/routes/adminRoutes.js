const router = require('express').Router();
const a = require('../controllers/adminController');
const r = require('../controllers/reviewController');
const { getOrderById } = require('../controllers/orderController');
const { categoryCtrl, brandCtrl } = require('./taxonomies');
const { protect, isAdmin } = require('../middlewares/auth');

router.use(protect, isAdmin);

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

// Người dùng
router.get('/users', a.listUsers);
router.get('/users/:id', a.getUser);
router.patch('/users/:id/status', a.toggleUserStatus);
router.patch('/users/:id/role', a.changeUserRole);

// Đánh giá
router.get('/reviews', r.adminList);
router.patch('/reviews/:id/visibility', r.toggleVisibility);

// Thống kê
router.get('/stats/overview', a.overview);
router.get('/stats/revenue', a.revenue);

module.exports = router;
