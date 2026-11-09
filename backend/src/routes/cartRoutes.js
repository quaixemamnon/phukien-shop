const router = require('express').Router();
const c = require('../controllers/cartController');
const { protect } = require('../middlewares/auth');

router.use(protect);
router.get('/', c.getCart);
router.delete('/', c.clear);
router.post('/items', c.addItem);
router.put('/items/:productId', c.updateItem);
router.delete('/items/:productId', c.removeItem);

module.exports = router;
