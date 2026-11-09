// Dữ liệu sản phẩm mẫu, dùng cho seed.js và scripts/generateImages.js
// look: thông số để vẽ ảnh minh họa (type = loại hình vẽ, body/accent = màu thân/điểm nhấn, bg = màu nền, label = nhãn nhỏ)

// Ảnh thật từ Unsplash (Unsplash License: được dùng miễn phí, kể cả thương mại, không bắt buộc ghi nguồn).
// Ảnh minh họa đúng loại sản phẩm, không phải ảnh chính xác của từng mẫu. Danh sách nguồn: xem IMAGE_CREDITS.md
const unsplash = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&h=800&q=80`;
const P = {
  headphones: ['1505740420928-5e560c06d30e', '1618366712010-f4ae9c647dcb'],
  earbudsBlack: ['1606220588913-b3aacb4d2f46', '1590658268037-6bf12165a8df'],
  earbudsLight: ['1590658268037-6bf12165a8df', '1606220588913-b3aacb4d2f46'],
  charger1: ['1627886107121-b7daaede3974', '1586254116951-5263e2cdb44c'],
  charger2: ['1586254116951-5263e2cdb44c', '1725304382197-663ae3864750'],
  charger3: ['1725304382197-663ae3864750', '1627886107121-b7daaede3974'],
  cableC: ['1573868388390-2739872961e6', '1595756630452-736bc8ef3693'],
  cableLightning: ['1492107376256-4026437926cd', '1619459072761-496c0812331b'],
  cableColor: ['1572721546624-05bf65ad7679', '1595756630452-736bc8ef3693'],
  powerbankDark: ['1566554738544-d962991c3fee', '1760708825913-65a50b3dc39b'],
  powerbankLight: ['1760708825913-65a50b3dc39b', '1566554738544-d962991c3fee'],
  phonecase: ['1535157412991-2ef801c1748b', '1623393884989-cb3663e431c5'],
  mouse: ['1527864550417-7fd91fc51a46'],
  keyboard: ['1585314614250-d213876625e1', '1561112078-7d24e04c3407'],
};
const PHOTOS_BY_SKU = {
  'SONY-WH1000XM5': P.headphones,
  'SONY-WFC700N': P.earbudsLight,
  'ANK-A3939': P.earbudsBlack,
  'BAS-E3': P.earbudsLight,
  'ANK-A2667': P.charger3,
  'UGR-15326': P.charger1,
  'BAS-GAN5-100': P.charger2,
  'UGR-70427': P.cableC,
  'ANK-A8832': P.cableLightning,
  'BAS-CAFULE-2M': P.cableColor,
  'ANK-A1334': P.powerbankDark,
  'XMI-PB2022': P.powerbankLight,
  'BAS-MAG-10K': P.powerbankLight,
  'UGR-IP15-CLR': P.phonecase,
  'LOG-M331': P.mouse,
  'LOG-K380': P.keyboard,
};
const CATEGORY_PHOTOS = {
  'Tai nghe': '1505740420928-5e560c06d30e',
  'Củ sạc': '1627886107121-b7daaede3974',
  'Cáp sạc': '1572721546624-05bf65ad7679',
  'Sạc dự phòng': '1566554738544-d962991c3fee',
  'Ốp lưng': '1535157412991-2ef801c1748b',
  'Chuột & Bàn phím': '1527864550417-7fd91fc51a46',
};

const PRODUCTS = [
  { name: 'Tai nghe Sony WH-1000XM5', sku: 'SONY-WH1000XM5', category: 'Tai nghe', brand: 'Sony', price: 8490000, salePrice: 7690000, stock: 15,
    specs: [['Kiểu', 'Chụp tai'], ['Chống ồn', 'ANC'], ['Pin', '30 giờ']], look: { type: 'headphones', body: '#2b2f33', accent: '#8a9199', bg: '#d9dee3', label: 'ANC' } },
  { name: 'Tai nghe Sony WF-C700N', sku: 'SONY-WFC700N', category: 'Tai nghe', brand: 'Sony', price: 2490000, salePrice: null, stock: 30,
    specs: [['Kiểu', 'True Wireless'], ['Pin', '15 giờ (kèm hộp)']], look: { type: 'earbuds', body: '#b8c9b2', accent: '#5f7359', bg: '#e3ebe0', label: 'ANC' } },
  { name: 'Tai nghe Anker Soundcore Life P3', sku: 'ANK-A3939', category: 'Tai nghe', brand: 'Anker', price: 1590000, salePrice: 1290000, stock: 40,
    specs: [['Kiểu', 'True Wireless'], ['Chống ồn', 'ANC']], look: { type: 'earbuds', body: '#1f2a33', accent: '#3aa0d8', bg: '#d6e6f0', label: 'ANC' } },
  { name: 'Tai nghe Baseus Bowie E3', sku: 'BAS-E3', category: 'Tai nghe', brand: 'Baseus', price: 490000, salePrice: 390000, stock: 60,
    specs: [['Bluetooth', '5.0'], ['Pin', '25 giờ']], look: { type: 'earbuds', body: '#f4f5f7', accent: '#9aa5ae', bg: '#e6eaee', label: 'BT 5.0' } },
  { name: 'Củ sạc nhanh Anker 735 Nano II 65W', sku: 'ANK-A2667', category: 'Củ sạc', brand: 'Anker', price: 990000, salePrice: 850000, stock: 120,
    specs: [['Công suất', '65W'], ['Cổng', '2 USB-C, 1 USB-A'], ['Công nghệ', 'GaN II']], look: { type: 'charger', body: '#2a3640', accent: '#3aa0d8', bg: '#d6e6f0', label: '65W' } },
  { name: 'Củ sạc Ugreen Nexode 30W', sku: 'UGR-15326', category: 'Củ sạc', brand: 'Ugreen', price: 390000, salePrice: null, stock: 80,
    specs: [['Công suất', '30W'], ['Cổng', '1 USB-C']], look: { type: 'charger', body: '#f4f5f7', accent: '#2fa36b', bg: '#e1efe7', label: '30W' } },
  { name: 'Củ sạc Baseus GaN5 Pro 100W', sku: 'BAS-GAN5-100', category: 'Củ sạc', brand: 'Baseus', price: 1190000, salePrice: 990000, stock: 25,
    specs: [['Công suất', '100W'], ['Cổng', '2 USB-C, 1 USB-A']], look: { type: 'charger', body: '#3a3f45', accent: '#e07a1f', bg: '#f1e4d6', label: '100W' } },
  { name: 'Cáp Ugreen USB-C to USB-C 100W 1m', sku: 'UGR-70427', category: 'Cáp sạc', brand: 'Ugreen', price: 190000, salePrice: 150000, stock: 200,
    specs: [['Chiều dài', '1m'], ['Công suất', '100W']], look: { type: 'cable', body: '#4a5560', accent: '#2fa36b', bg: '#e1efe7', label: '100W' } },
  { name: 'Cáp Anker PowerLine III USB-C to Lightning', sku: 'ANK-A8832', category: 'Cáp sạc', brand: 'Anker', price: 350000, salePrice: null, stock: 150,
    specs: [['Chiều dài', '0.9m'], ['Chứng nhận', 'MFi']], look: { type: 'cable', body: '#f4f5f7', accent: '#3aa0d8', bg: '#d6e6f0', label: 'MFi' } },
  { name: 'Cáp Baseus Cafule USB-A to USB-C 2m', sku: 'BAS-CAFULE-2M', category: 'Cáp sạc', brand: 'Baseus', price: 120000, salePrice: 99000, stock: 300,
    specs: [['Chiều dài', '2m'], ['Dòng', '3A']], look: { type: 'cable', body: '#c0392b', accent: '#2b2f33', bg: '#f3dedb', label: '2m' } },
  { name: 'Sạc dự phòng Anker 323 10000mAh', sku: 'ANK-A1334', category: 'Sạc dự phòng', brand: 'Anker', price: 590000, salePrice: 490000, stock: 70,
    specs: [['Dung lượng', '10000mAh'], ['Công suất', '12W']], look: { type: 'powerbank', body: '#2a3640', accent: '#3aa0d8', bg: '#d6e6f0', label: '10000mAh' } },
  { name: 'Sạc dự phòng Xiaomi 20000mAh 22.5W', sku: 'XMI-PB2022', category: 'Sạc dự phòng', brand: 'Xiaomi', price: 650000, salePrice: null, stock: 50,
    specs: [['Dung lượng', '20000mAh'], ['Công suất', '22.5W']], look: { type: 'powerbank', body: '#eef0f2', accent: '#e07a1f', bg: '#f1e4d6', label: '20000mAh' } },
  { name: 'Sạc dự phòng Baseus Magnetic 10000mAh', sku: 'BAS-MAG-10K', category: 'Sạc dự phòng', brand: 'Baseus', price: 890000, salePrice: 750000, stock: 35,
    specs: [['Dung lượng', '10000mAh'], ['Sạc không dây', 'MagSafe 15W']], look: { type: 'powerbank', body: '#7d8ea0', accent: '#ffffff', bg: '#e1e7ee', label: 'MagSafe' } },
  { name: 'Ốp lưng Ugreen iPhone 15 trong suốt', sku: 'UGR-IP15-CLR', category: 'Ốp lưng', brand: 'Ugreen', price: 250000, salePrice: 190000, stock: 100,
    specs: [['Tương thích', 'iPhone 15'], ['Chất liệu', 'TPU']], look: { type: 'phonecase', body: '#9fd3ea', accent: '#0a6a94', bg: '#e0eff6', label: 'iPhone 15' } },
  { name: 'Chuột không dây Logitech M331 Silent', sku: 'LOG-M331', category: 'Chuột & Bàn phím', brand: 'Logitech', price: 390000, salePrice: 330000, stock: 90,
    specs: [['Kết nối', 'USB Receiver'], ['DPI', '1000']], look: { type: 'mouse', body: '#3a434c', accent: '#3aa0d8', bg: '#dde4ea', label: 'Silent' } },
  { name: 'Bàn phím Logitech K380 Bluetooth', sku: 'LOG-K380', category: 'Chuột & Bàn phím', brand: 'Logitech', price: 790000, salePrice: 690000, stock: 45,
    specs: [['Kết nối', 'Bluetooth'], ['Đa thiết bị', '3 thiết bị']], look: { type: 'keyboard', body: '#e9d4d9', accent: '#c45b75', bg: '#f4e6e9', label: 'Bluetooth' } },
];

PRODUCTS.forEach((p) => {
  p.photos = (PHOTOS_BY_SKU[p.sku] || []).map(unsplash);
});

module.exports = PRODUCTS;
module.exports.categoryPhoto = (name) => (CATEGORY_PHOTOS[name] ? unsplash(CATEGORY_PHOTOS[name]) : null);
module.exports.UNSPLASH_IDS = [...new Set(Object.values(P).flat())];
