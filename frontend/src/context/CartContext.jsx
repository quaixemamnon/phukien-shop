import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errMsg } from '../api';
import { useAuth } from './AuthContext';

const EMPTY = { items: [], subtotal: 0, count: 0, canCheckout: false };
const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false); // đã tải giỏ hàng ít nhất 1 lần
  const userId = user?._id;
  const isBackoffice = user?.role === 'admin' || user?.role === 'staff'; // tài khoản nội bộ không có giỏ hàng

  const fetchCart = useCallback(async () => {
    if (!userId || isBackoffice) {
      setCart(EMPTY);
      setLoaded(true);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get('/cart');
      setCart(data);
    } catch {
      setCart(EMPTY);
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [userId, isBackoffice]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (productId, quantity = 1) => {
    if (!user) {
      toast('Vui lòng đăng nhập để thêm vào giỏ hàng');
      navigate('/login', { state: { from: window.location.pathname } });
      return false;
    }
    if (isBackoffice) {
      toast.error('Tài khoản nhân viên/quản trị không dùng để mua hàng');
      return false;
    }
    try {
      const { data } = await api.post('/cart/items', { productId, quantity });
      setCart(data);
      toast.success('Đã thêm vào giỏ hàng');
      return true;
    } catch (e) {
      toast.error(errMsg(e));
      return false;
    }
  };

  const updateQty = async (productId, quantity) => {
    try {
      const { data } = await api.put(`/cart/items/${productId}`, { quantity });
      setCart(data);
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const removeItem = async (productId) => {
    try {
      const { data } = await api.delete(`/cart/items/${productId}`);
      setCart(data);
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  return (
    <CartContext.Provider value={{ cart, loading, loaded, fetchCart, addToCart, updateQty, removeItem }}>{children}</CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
