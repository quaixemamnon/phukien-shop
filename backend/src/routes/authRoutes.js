const router = require('express').Router();
const c = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const { loginLimiter, forgotLimiter } = require('../middlewares/rateLimit');

router.post('/register', c.register);
router.post('/login', loginLimiter, c.login);
router.get('/me', protect, c.me);
router.post('/forgot-password', forgotLimiter, c.forgotPassword);
router.post('/reset-password/:token', c.resetPassword);

module.exports = router;
