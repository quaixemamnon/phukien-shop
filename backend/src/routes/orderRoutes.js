const router = require('express').Router();
const c = require('../controllers/orderController');
const { protect } = require('../middlewares/auth');

router.use(protect);
router.post('/', c.createOrder);
router.get('/my', c.getMyOrders);
router.get('/:id', c.getOrderById);
router.patch('/:id/cancel', c.cancelMyOrder);
router.post('/:id/pay', c.retryPayment);

module.exports = router;
