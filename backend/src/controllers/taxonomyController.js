// Controller dùng chung cho Danh mục (Category) và Thương hiệu (Brand)
const Product = require('../models/Product');
const { ApiError, asyncHandler, pick } = require('../utils/helpers');

module.exports = function makeTaxonomyController(Model, { field, label, fields }) {
  return {
    // Public: chỉ lấy mục đang hiển thị
    listPublic: asyncHandler(async (req, res) => {
      res.json(await Model.find({ isActive: true }).sort({ name: 1 }));
    }),

    // Admin: lấy tất cả kèm số sản phẩm
    listAdmin: asyncHandler(async (req, res) => {
      const [items, counts] = await Promise.all([
        Model.find().sort({ name: 1 }).lean(),
        Product.aggregate([{ $group: { _id: `$${field}`, count: { $sum: 1 } } }]),
      ]);
      const map = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));
      res.json(items.map((i) => ({ ...i, productCount: map[String(i._id)] || 0 })));
    }),

    create: asyncHandler(async (req, res) => {
      const data = pick(req.body, fields);
      if (data.parent === '') data.parent = null;
      const item = await Model.create(data);
      res.status(201).json(item);
    }),

    update: asyncHandler(async (req, res) => {
      const item = await Model.findById(req.params.id);
      if (!item) throw new ApiError(404, `Không tìm thấy ${label}`);
      const data = pick(req.body, fields);
      if (data.parent === '') data.parent = null;
      if (data.parent && String(data.parent) === String(item._id)) throw new ApiError(400, 'Danh mục cha không hợp lệ');
      item.set(data);
      await item.save();
      res.json(item);
    }),

    remove: asyncHandler(async (req, res) => {
      const item = await Model.findById(req.params.id);
      if (!item) throw new ApiError(404, `Không tìm thấy ${label}`);
      if (await Product.exists({ [field]: item._id })) {
        throw new ApiError(400, `Không thể xóa vì vẫn còn sản phẩm thuộc ${label} này. Hãy ẩn hoặc chuyển sản phẩm sang ${label} khác trước`);
      }
      if (field === 'category' && (await Model.exists({ parent: item._id }))) {
        throw new ApiError(400, 'Không thể xóa vì danh mục này còn danh mục con');
      }
      await item.deleteOne();
      res.json({ message: `Đã xóa ${label}` });
    }),
  };
};
