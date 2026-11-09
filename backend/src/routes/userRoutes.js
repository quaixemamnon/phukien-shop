const router = require('express').Router();
const c = require('../controllers/userController');
const { protect } = require('../middlewares/auth');

router.use(protect);
router.get('/me', c.getMe);
router.put('/me', c.updateMe);
router.put('/me/password', c.changePassword);
router.post('/me/addresses', c.addAddress);
router.put('/me/addresses/:addressId', c.updateAddress);
router.delete('/me/addresses/:addressId', c.deleteAddress);

module.exports = router;
