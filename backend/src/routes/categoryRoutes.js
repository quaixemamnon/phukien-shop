const router = require('express').Router();
const { categoryCtrl } = require('./taxonomies');

router.get('/', categoryCtrl.listPublic);

module.exports = router;
