// Tạo ảnh minh họa (SVG) cho sản phẩm mẫu và danh mục: node src/scripts/generateImages.js
// Ảnh được lưu vào frontend/public/images, dùng chung cho seed.js
const fs = require('fs');
const path = require('path');
const PRODUCTS = require('../data/sampleProducts');

const OUT = path.join(__dirname, '..', '..', '..', 'frontend', 'public', 'images');

const shade = (hex, amt) => {
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => Math.max(0, Math.min(255, v + amt));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => c(v).toString(16).padStart(2, '0')).join('')}`;
};

// ===== Hình vẽ từng loại sản phẩm (khung 600x600, tâm 300,300) =====
const DRAW = {
  headphones: (b, a) => `
    <path d="M150 330 C150 150 450 150 450 330" fill="none" stroke="${shade(b, 25)}" stroke-width="34" stroke-linecap="round"/>
    <path d="M150 330 C150 150 450 150 450 330" fill="none" stroke="${b}" stroke-width="20" stroke-linecap="round"/>
    <rect x="105" y="290" width="100" height="160" rx="46" fill="${b}"/>
    <rect x="395" y="290" width="100" height="160" rx="46" fill="${b}"/>
    <rect x="160" y="305" width="34" height="130" rx="17" fill="${a}"/>
    <rect x="406" y="305" width="34" height="130" rx="17" fill="${a}"/>
    <rect x="118" y="300" width="22" height="50" rx="11" fill="#ffffff" opacity=".18"/>`,
  earbuds: (b, a) => `
    <rect x="170" y="290" width="260" height="170" rx="80" fill="${b}"/>
    <path d="M170 360 H430" stroke="${shade(b, -35)}" stroke-width="5"/>
    <circle cx="300" cy="410" r="7" fill="${a}"/>
    <g transform="translate(165 110) rotate(28)"><rect x="28" y="40" width="26" height="110" rx="13" fill="${shade(b, 10)}" stroke="${shade(b, -30)}" stroke-width="3"/><circle cx="40" cy="40" r="44" fill="${shade(b, 10)}" stroke="${shade(b, -30)}" stroke-width="3"/><circle cx="40" cy="40" r="18" fill="${a}"/></g>
    <g transform="translate(355 110) rotate(-28)"><rect x="26" y="40" width="26" height="110" rx="13" fill="${shade(b, 10)}" stroke="${shade(b, -30)}" stroke-width="3"/><circle cx="40" cy="40" r="44" fill="${shade(b, 10)}" stroke="${shade(b, -30)}" stroke-width="3"/><circle cx="40" cy="40" r="18" fill="${a}"/></g>`,
  charger: (b, a) => `
    <rect x="250" y="120" width="24" height="70" rx="6" fill="#9aa5ae"/><rect x="326" y="120" width="24" height="70" rx="6" fill="#9aa5ae"/>
    <rect x="175" y="175" width="250" height="280" rx="48" fill="${b}"/>
    <rect x="190" y="190" width="40" height="250" rx="20" fill="#ffffff" opacity=".12"/>
    <rect x="262" y="250" width="76" height="28" rx="14" fill="${shade(b, -45)}"/><rect x="274" y="259" width="52" height="10" rx="5" fill="${a}"/>
    <rect x="262" y="300" width="76" height="28" rx="14" fill="${shade(b, -45)}"/><rect x="274" y="309" width="52" height="10" rx="5" fill="${a}"/>
    <rect x="270" y="350" width="60" height="32" rx="5" fill="${shade(b, -45)}"/><rect x="280" y="360" width="40" height="12" rx="2" fill="${a}"/>`,
  cable: (b, a) => `
    <path d="M150 190 C150 90 330 90 330 190 C330 290 150 290 150 390 C150 490 330 490 330 390 C330 330 400 300 450 330" fill="none" stroke="${shade(b, -20)}" stroke-width="30" stroke-linecap="round"/>
    <path d="M150 190 C150 90 330 90 330 190 C330 290 150 290 150 390 C150 490 330 490 330 390 C330 330 400 300 450 330" fill="none" stroke="${b}" stroke-width="20" stroke-linecap="round"/>
    <g transform="translate(150 190) rotate(180)"><rect x="-26" y="0" width="52" height="80" rx="14" fill="${shade(b, -30)}"/><rect x="-16" y="76" width="32" height="34" rx="8" fill="#b9c2c9"/><rect x="-26" y="10" width="52" height="10" fill="${a}"/></g>
    <g transform="translate(450 330) rotate(-60)"><rect x="-26" y="0" width="52" height="80" rx="14" fill="${shade(b, -30)}"/><rect x="-14" y="76" width="28" height="34" rx="12" fill="#b9c2c9"/><rect x="-26" y="10" width="52" height="10" fill="${a}"/></g>`,
  powerbank: (b, a) => `
    <rect x="195" y="105" width="210" height="380" rx="40" fill="${b}"/>
    <rect x="210" y="120" width="36" height="350" rx="18" fill="#ffffff" opacity=".12"/>
    <circle cx="268" cy="410" r="9" fill="${a}"/><circle cx="292" cy="410" r="9" fill="${a}"/><circle cx="316" cy="410" r="9" fill="${a}"/><circle cx="340" cy="410" r="9" fill="${shade(b, 40)}"/>
    <rect x="262" y="140" width="76" height="22" rx="11" fill="${shade(b, -45)}"/>
    <path d="M308 230 L278 300 H304 L292 360 L332 280 H306 Z" fill="${a}"/>`,
  phonecase: (b, a) => `
    <rect x="190" y="90" width="220" height="420" rx="44" fill="${b}" opacity=".55" stroke="${shade(b, -30)}" stroke-width="8"/>
    <rect x="212" y="112" width="176" height="376" rx="32" fill="#ffffff" opacity=".35"/>
    <rect x="222" y="122" width="96" height="96" rx="26" fill="${shade(b, -40)}"/>
    <circle cx="250" cy="150" r="17" fill="#1f2b35"/><circle cx="290" cy="150" r="17" fill="#1f2b35"/><circle cx="250" cy="190" r="17" fill="#1f2b35"/><circle cx="290" cy="190" r="7" fill="${a}"/>
    <rect x="410" y="200" width="8" height="60" rx="4" fill="${shade(b, -30)}"/>`,
  mouse: (b, a) => `
    <path d="M300 110 C390 110 420 190 420 300 C420 420 370 480 300 480 C230 480 180 420 180 300 C180 190 210 110 300 110 Z" fill="${b}"/>
    <path d="M300 110 V250 M180 250 C230 262 370 262 420 250" stroke="${shade(b, -40)}" stroke-width="5" fill="none"/>
    <rect x="288" y="150" width="24" height="56" rx="12" fill="${a}"/>
    <path d="M205 300 C205 220 225 160 260 135" stroke="#ffffff" stroke-width="14" opacity=".15" fill="none" stroke-linecap="round"/>`,
  keyboard: (b, a) => {
    let keys = '';
    for (let r = 0; r < 4; r++) for (let c = 0; c < 10; c++) {
      keys += `<circle cx="${148 + c * 34}" cy="${245 + r * 36}" r="13" fill="${c === 0 && r === 0 ? a : shade(b, -40)}"/>`;
    }
    return `<rect x="110" y="205" width="380" height="200" rx="36" fill="${b}"/>${keys}<rect x="215" y="389" width="170" height="10" rx="5" fill="${shade(b, -40)}"/>`;
  },
};

function productSvg({ type, body, accent, bg, brand, label }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
  <defs><radialGradient id="g" cx="50%" cy="40%" r="75%"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="${bg}"/></radialGradient></defs>
  <rect width="600" height="600" fill="url(#g)"/>
  <ellipse cx="300" cy="515" rx="170" ry="18" fill="#000" opacity=".08"/>
  ${DRAW[type](body, accent)}
  <text x="40" y="70" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="700" fill="#1f3b57" letter-spacing="3">${brand.toUpperCase()}</text>
  ${label ? `<rect x="40" y="520" width="${label.length * 15 + 36}" height="44" rx="22" fill="#1f3b57"/><text x="58" y="550" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" fill="#fff">${label}</text>` : ''}
</svg>`;
}

const CATEGORY_ICON = {
  'tai-nghe': ['headphones', '#26323c', '#3aa0d8'],
  'cu-sac': ['charger', '#f2f4f6', '#0a6a94'],
  'cap-sac': ['cable', '#2f3a44', '#3aa0d8'],
  'sac-du-phong': ['powerbank', '#3c4a57', '#40c48a'],
  'op-lung': ['phonecase', '#9fd3ea', '#0a6a94'],
  'chuot-ban-phim': ['mouse', '#4a5560', '#3aa0d8'],
};

function main() {
  fs.mkdirSync(path.join(OUT, 'products'), { recursive: true });
  fs.mkdirSync(path.join(OUT, 'categories'), { recursive: true });
  for (const p of PRODUCTS) {
    const base = p.sku.toLowerCase();
    fs.writeFileSync(path.join(OUT, 'products', `${base}-1.svg`), productSvg({ ...p.look, brand: p.brand, label: p.look.label }));
    fs.writeFileSync(path.join(OUT, 'products', `${base}-2.svg`), productSvg({ ...p.look, bg: p.look.bg2 || '#e8edf1', brand: p.brand, label: '' }));
  }
  for (const [slug, [type, body, accent]] of Object.entries(CATEGORY_ICON)) {
    fs.writeFileSync(path.join(OUT, 'categories', `${slug}.svg`), productSvg({ type, body, accent, bg: '#dfeaf1', brand: '', label: '' }));
  }
  console.log(`Đã tạo ${PRODUCTS.length * 2} ảnh sản phẩm và ${Object.keys(CATEGORY_ICON).length} ảnh danh mục tại ${OUT}`);
}

if (require.main === module) main();
module.exports = { productSvg };
