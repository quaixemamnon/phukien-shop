const router = require('express').Router();
const c = require('../controllers/authController');
const { protect } = require('../middlewares/auth');

router.post('/register', c.register);
router.post('/login', c.login);
router.get('/me', protect, c.me);
router.post('/forgot-password', c.forgotPassword);
router.post('/reset-password/:token', c.resetPassword);

module.exports = router;
