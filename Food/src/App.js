import './App.css';
import './index.css';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Header from './Components/Header';
import Fotter from './Components/Fotter';
import Home from './Pages/Home';
import Food from './Pages/Food';
import Cart from './Pages/Cart';
import Wishlist from './Pages/Wishlist';
import Checkout from './Pages/Checkout';
import SignUp from './Pages/Signup';
import Login from './Pages/Login';
import Contact from './Pages/Contact';
import OrderTracking from './Pages/OrderTracking';
import Error from './Pages/Error';

import AdminLayout from './Admin/AdminLayout';
import AdminDashboard from './Admin/AdminDashboard';
import AdminOrders from './Admin/AdminOrders';
import AdminProducts from './Admin/AdminProducts';
import AdminCategories from './Admin/AdminCategories';
import AdminUsers from './Admin/AdminUsers';
import AdminContacts from './Admin/AdminContacts';
import AdminSettings from './Admin/AdminSettings';

import { AuthProvider } from './Contex/AuthContext';

function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <>
      {!isAdminRoute && <Header />}
      <Routes>
        {/* Customer Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/food" element={<Food />} />
        <Route path="/wish" element={<Wishlist />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/orders/:id" element={<OrderTracking />} />
        <Route path="/orders" element={<OrderTracking />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="contacts" element={<AdminContacts />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<Error />} />
      </Routes>
      {!isAdminRoute && <Fotter />}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
