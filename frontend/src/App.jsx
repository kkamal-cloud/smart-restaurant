import { useEffect } from 'react'
import { Routes,Route,useLocation,useNavigate,Navigate} from 'react-router-dom'

import api from './api'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

// Customer Components
import Home from './pages/customer/Home'
import Menu from './pages/customer/Menu'
import FoodDetails from './pages/customer/FoodDetails'
import Cart from './pages/customer/Cart'
import Checkout from './pages/customer/Checkout'
import Orders from './pages/customer/Orders'
import OrderDetails from './pages/customer/OrderDetails'
import Bill from './pages/customer/Bill'
import ScanTable from './pages/customer/ScanTable'
import SessionEnded from './pages/customer/SessionEnded'
import PaymentSuccess from './pages/customer/PaymentSuccess'

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

// Context
import { CartProvider } from './context/CartContext'

// Authentication
import ProtectedRoute from './components/ProtectedRoute'


function App() {
  const location = useLocation()
  const navigate = useNavigate()

  /*
   * ============================================================
   * CUSTOMER SESSION CHECK
   * ============================================================
   *
   * Customer pages require:
   *  - sessionId
   *  - joinToken
   *
   * Admin / Kitchen pages are NOT affected by this check.
   */
  useEffect(() => {
    const isCustomerRoute =
      !location.pathname.startsWith('/admin') &&
      !location.pathname.startsWith('/kitchen') &&
      location.pathname !== '/' &&
      location.pathname !== '/login' &&
      location.pathname !== '/session-ended' &&
      location.pathname !== '/payment-success' &&
      !location.pathname.startsWith('/qr/') &&
      !location.pathname.startsWith('/scan/')

    const sessionId = localStorage.getItem('sessionId')
    const joinToken = localStorage.getItem('joinToken')

    if (!isCustomerRoute) {
      return
    }

    // No active customer session
    if (!sessionId || !joinToken) {
      localStorage.removeItem('sessionId')
      localStorage.removeItem('joinToken')
      localStorage.removeItem('customer')
      localStorage.removeItem('smartserve_cart')

      navigate('/session-ended')
      return
    }

    // Verify customer session with backend
    api
      .get(`/sessions/${sessionId}`)
      .then((response) => {
        const session = response.data?.data

        if (!session || session.status !== 'active') {
          localStorage.removeItem('sessionId')
          localStorage.removeItem('joinToken')
          localStorage.removeItem('customer')
          localStorage.removeItem('smartserve_cart')

          navigate('/session-ended')
        }
      })
      .catch((err) => {
        if (
          err.response?.status === 401 ||
          err.response?.status === 404 ||
          err.response?.status === 400
        ) {
          localStorage.removeItem('sessionId')
          localStorage.removeItem('joinToken')
          localStorage.removeItem('customer')
          localStorage.removeItem('smartserve_cart')

          navigate('/session-ended')
        }
      })
  }, [location.pathname, navigate])


  /*
   * ============================================================
   * STAFF ROUTE CHECK
   * ============================================================
   *
   * Navbar and Footer should NOT appear on:
   *
   *  /admin/*
   *  /kitchen/*
   *  /
   *  /login
   */
  const isStaffRoute =
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/kitchen') ||
    location.pathname === '/' ||
    location.pathname === '/login'


  return (
    <CartProvider>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh'
        }}
      >

        {/* Customer Navbar */}
        {!isStaffRoute && <Navbar />}


        <main style={{ flex: 1 }}>

          <Routes>

            {/* ==================================================
                ROOT
                ================================================== */}

            {/* Existing root login */}
            <Route path="/" element={<AdminLogin />} />

            {/* Legacy login */}
            <Route path="/login" element={<Navigate to="/" replace />} />


            {/* ==================================================
                CUSTOMER ROUTES
                ================================================== */}

            <Route
              path="/home"
              element={<Home />}
            />

            <Route
              path="/menu"
              element={<Menu />}
            />

            <Route
              path="/menu/:id"
              element={<FoodDetails />}
            />

            <Route
              path="/cart"
              element={<Cart />}
            />

            <Route
              path="/checkout"
              element={<Checkout />}
            />

            <Route
              path="/orders"
              element={<Orders />}
            />

            <Route
              path="/orders/:id"
              element={<OrderDetails />}
            />

            <Route
              path="/bill/:id"
              element={<Bill />}
            />

            {/* QR Scan */}
            <Route
              path="/qr/:token"
              element={<ScanTable />}
            />

            {/* Alternative QR Scan */}
            <Route
              path="/scan/:token"
              element={<ScanTable />}
            />

            {/* Session ended */}
            <Route
              path="/session-ended"
              element={<SessionEnded />}
            />

            {/* Payment success */}
            <Route
              path="/payment-success"
              element={<PaymentSuccess />}
            />


            {/* ==================================================
                ADMIN LOGIN
                ================================================== */}

            {/* 
              /admin
              /admin/login

              Both open Admin Login page.
            */}

            <Route
              path="/admin"
              element={<AdminLogin />}
            />

            <Route
              path="/admin/login"
              element={<AdminLogin />}
            />


            {/* ==================================================
                ADMIN PROTECTED ROUTES
                ================================================== */}

            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout />
                </ProtectedRoute>
              }
            >

              {/* Dashboard */}
              <Route
                path="dashboard"
                element={<Dashboard />}
              />

              {/* Menu Management */}
              <Route
                path="menu"
                element={<MenuManagement />}
              />

              {/* Category Management */}
              <Route
                path="categories"
                element={<CategoryManagement />}
              />

              {/* Table Management */}
              <Route
                path="tables"
                element={<TableManagement />}
              />

              {/* Order Management */}
              <Route
                path="orders"
                element={<OrderManagement />}
              />

              {/* Billing */}
              <Route
                path="billing"
                element={<Billing />}
              />

              {/* Stock Management */}
              <Route
                path="stock"
                element={<StockManagement />}
              />

              {/* Reports */}
              <Route
                path="reports"
                element={<Reports />}
              />

            </Route>

            <Route
              path="/kitchen/login"
              element={<AdminLogin />}
            />


            {/* ==================================================
                KITCHEN DASHBOARD
                ================================================== */}

            <Route
              path="/kitchen"
              element={
                <ProtectedRoute requiredRole="kitchen">
                  <KitchenDashboard />
                </ProtectedRoute>
              }
            />


            {/* ==================================================
                UNKNOWN ROUTE
                ================================================== */}

            <Route
              path="*"
              element={<Navigate to="/" replace />}
            />

          </Routes>

        </main>


        {/* Customer Footer */}
        {!isStaffRoute && <Footer />}

      </div>

    </CartProvider>
  )
}

export default App