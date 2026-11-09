const router = require('express').Router();
const c = require('../controllers/productController');

router.get('/', c.getProducts);
router.get('/home', c.getHomeData);
router.get('/:id/reviews', c.getProductReviews);
router.get('/:slug', c.getProductBySlug);

module.exports = router;
