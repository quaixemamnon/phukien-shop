// Lưu danh sách sản phẩm đã xem gần đây trong trình duyệt (localStorage), tối đa 8 sản phẩm
const KEY = 'recentlyViewed';
const MAX = 8;

export function getRecentlyViewed() {
  try {
    const ids = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(ids) ? ids.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function addRecentlyViewed(productId) {
  if (!productId) return;
  const ids = [productId, ...getRecentlyViewed().filter((id) => id !== productId)].slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    // trình duyệt chặn lưu trữ: bỏ qua
  }
}

export function clearRecentlyViewed() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // bỏ qua
  }
}
