const router = require('express').Router();
const { brandCtrl } = require('./taxonomies');

router.get('/', brandCtrl.listPublic);

module.exports = router;
