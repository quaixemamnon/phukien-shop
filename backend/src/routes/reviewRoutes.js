const router = require('express').Router();
const c = require('../controllers/reviewController');
const { protect } = require('../middlewares/auth');

router.use(protect);
router.post('/', c.createReview);
router.get('/order/:orderId', c.getMyReviewsByOrder);

module.exports = router;
