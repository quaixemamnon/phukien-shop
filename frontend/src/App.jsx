import { Routes, Route, Outlet } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import { RequireAuth, RequireRole } from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';

import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import PaymentResult from './pages/PaymentResult';
import MomoSandbox from './pages/MomoSandbox';
import MyOrders from './pages/MyOrders';
import OrderDetail from './pages/OrderDetail';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

import Dashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/AdminProducts';
import ProductForm from './pages/admin/ProductForm';
import AdminCategories from './pages/admin/AdminCategories';
import AdminBrands from './pages/admin/AdminBrands';
import AdminOrders from './pages/admin/AdminOrders';
import AdminOrderDetail from './pages/admin/AdminOrderDetail';
import AdminUsers from './pages/admin/AdminUsers';
import AdminReviews from './pages/admin/AdminReviews';
import AdminStats from './pages/admin/AdminStats';

function MainLayout() {
  return (
    <>
      <Header />
      <main className="container page">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:slug" element={<ProductDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route element={<RequireAuth />}>
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/payment/momo-return" element={<PaymentResult gateway="momo" />} />
          <Route path="/payment/momo-sandbox" element={<MomoSandbox />} />
          <Route path="/orders" element={<MyOrders />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Trang quản trị: nhân viên và quản trị viên; Người dùng, Thống kê chỉ quản trị viên */}
      <Route path="/admin" element={<RequireRole roles={['admin', 'staff']} />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="products/new" element={<ProductForm />} />
          <Route path="products/:id/edit" element={<ProductForm />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="brands" element={<AdminBrands />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="orders/:id" element={<AdminOrderDetail />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route element={<RequireRole roles={['admin']} />}>
            <Route path="users" element={<AdminUsers />} />
            <Route path="stats" element={<AdminStats />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
