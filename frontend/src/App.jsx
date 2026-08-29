import { useEffect } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import api from './api'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/customer/Home'
import Menu from './pages/customer/Menu'
import FoodDetails from './pages/customer/FoodDetails'
import Cart from './pages/customer/Cart'
import Checkout from './pages/customer/Checkout'
import Orders from './pages/customer/Orders'
import OrderDetails from './pages/customer/OrderDetails'
import Bill from './pages/customer/Bill'
import ScanTable from './pages/customer/ScanTable'

// Admin Components
import AdminLogin from './pages/admin/Login'
import AdminLayout from './components/admin/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import MenuManagement from './pages/admin/MenuManagement'
import CategoryManagement from './pages/admin/CategoryManagement'
import TableManagement from './pages/admin/TableManagement'
import OrderManagement from './pages/admin/OrderManagement'
import Billing from './pages/admin/Billing'
import StockManagement from './pages/admin/StockManagement'
import Reports from './pages/admin/Reports'

// Kitchen Components
import KitchenDashboard from './pages/kitchen/KitchenDashboard'

import { CartProvider } from './context/CartContext'

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const isCustomerRoute = 
      !location.pathname.startsWith('/admin') && 
      !location.pathname.startsWith('/kitchen') && 
      location.pathname !== '/';
      
    const sessionId = localStorage.getItem('sessionId');
    const joinToken = localStorage.getItem('joinToken');

    if (isCustomerRoute && sessionId && joinToken) {
      api.get(`/sessions/${sessionId}`)
        .then(response => {
          const session = response.data?.data;
          if (session && session.status !== 'active') {
            localStorage.removeItem('sessionId');
            localStorage.removeItem('joinToken');
            localStorage.removeItem('customer');
            localStorage.removeItem('smartserve_cart');
            alert('Your dining session has ended. Please scan the QR code to start a new session.');
            navigate('/');
          }
        })
        .catch(err => {
          if (err.response?.status === 401 || err.response?.status === 404) {
            localStorage.removeItem('sessionId');
            localStorage.removeItem('joinToken');
            localStorage.removeItem('customer');
            localStorage.removeItem('smartserve_cart');
            alert('Your dining session has ended. Please scan the QR code to start a new session.');
            navigate('/');
          }
        });
    }
  }, [location.pathname, navigate]);

  // Check if current path is an admin or kitchen route
  const isStaffRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/kitchen');

  return (
    <CartProvider>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Hide customer Navbar if on a staff route */}
        {!isStaffRoute && <Navbar />}
      
      <main style={{ flex: 1 }}>
        <Routes>
          {/* Customer Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/menu/:id" element={<FoodDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:id" element={<OrderDetails />} />
          <Route path="/bill/:id" element={<Bill />} />
          <Route path="/scan/:token" element={<ScanTable />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          
          {/* Admin Protected Layout Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="menu" element={<MenuManagement />} />
            <Route path="categories" element={<CategoryManagement />} />
            <Route path="tables" element={<TableManagement />} />
            <Route path="orders" element={<OrderManagement />} />
            <Route path="billing" element={<Billing />} />
            <Route path="stock" element={<StockManagement />} />
            <Route path="reports" element={<Reports />} />
          </Route>
          
          {/* Kitchen Route */}
          <Route path="/kitchen" element={<KitchenDashboard />} />
        </Routes>
      </main>

        {/* Hide customer Footer if on a staff route */}
        {!isStaffRoute && <Footer />}
      </div>
    </CartProvider>
  )
}

export default App
