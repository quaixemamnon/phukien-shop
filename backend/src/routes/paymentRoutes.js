const router = require('express').Router();
const c = require('../controllers/paymentController');
const { enabledPaymentMethods } = require('../services/orderService');
const { protect } = require('../middlewares/auth');

// Danh sách phương thức thanh toán đang bật (giao diện dùng để hiển thị lựa chọn)
router.get('/methods', (req, res) => res.json(enabledPaymentMethods()));

router.post('/momo-ipn', c.momoIpn);
router.get('/momo-return', c.momoReturn);

// Cổng MoMo mô phỏng (chỉ hoạt động khi MOMO_MODE=mock)
router.get('/momo-mock/:txnRef', protect, c.momoMockInfo);
router.post('/momo-mock/complete', protect, c.momoMockComplete);

module.exports = router;
