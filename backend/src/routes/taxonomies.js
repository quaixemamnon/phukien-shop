const Category = require('../models/Category');
const Brand = require('../models/Brand');
const makeTaxonomyController = require('../controllers/taxonomyController');

const categoryCtrl = makeTaxonomyController(Category, {
  field: 'category',
  label: 'danh mục',
  fields: ['name', 'description', 'image', 'parent', 'isActive'],
});

const brandCtrl = makeTaxonomyController(Brand, {
  field: 'brand',
  label: 'thương hiệu',
  fields: ['name', 'description', 'logo', 'isActive'],
});

module.exports = { categoryCtrl, brandCtrl };
