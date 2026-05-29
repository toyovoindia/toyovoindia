import { BrowserRouter as Router, Routes, Route, useLocation, Navigate, Link } from 'react-router-dom'
import React, { useEffect, Suspense } from 'react'
import { VisionHeader } from './components/layout/VisionHeader'
import { Footer }       from './components/layout/Footer'
import { HomePage }     from './pages/HomePage'
import { AboutPage }    from './pages/AboutPage'
import { ContactPage }  from './pages/ContactPage'
import { ProductDetailPage } from './pages/ProductDetailPage'
import { ReturnPolicy } from './pages/ReturnPolicy'
import { ShippingPolicy } from './pages/ShippingPolicy'
import { TermsConditions } from './pages/TermsConditions'
import { PrivacyPolicy } from './pages/PrivacyPolicy'
import { FAQPage } from './pages/FAQPage'
import { WishlistPage } from './pages/WishlistPage'
import { SearchPage } from './pages/SearchPage'
import { CollectionPage } from './pages/CollectionPage'
import { LoginPage } from './pages/LoginPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { RegisterPage } from './pages/RegisterPage'
import { AccountPage } from './pages/AccountPage'
import { CartPage } from './pages/CartPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { OrderSuccessPage } from './pages/OrderSuccessPage'
import { ComparePage } from './pages/ComparePage'
import { AllCategoriesPage } from './pages/AllCategoriesPage'
import { AuthProvider } from './context/AuthContext'
import { MobileBottomBar } from './components/layout/MobileBottomBar'
import { AsideSidebar } from './components/layout/AsideSidebar'
import { useAuth } from './context/AuthContext'
import { FirebaseTokenManager } from './components/FirebaseTokenManager'
import { getStorefrontSettings } from './services/siteApi'

// Helper component to scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

import { CartProvider } from './context/CartContext'
import { PaymentProvider } from './context/PaymentContext'
import { ToastProvider } from './context/ToastContext'

// Lazy load admin module
const AdminLayout = React.lazy(() => import('./admin/AdminLayout').then(m => ({ default: m.AdminLayout })))
const AdminDashboard = React.lazy(() => import('./admin/pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })))
const AdminUsers = React.lazy(() => import('./admin/pages/AdminUsers').then(m => ({ default: m.AdminUsers })))
const AdminUserDetail = React.lazy(() => import('./admin/pages/AdminUserDetail').then(m => ({ default: m.AdminUserDetail })))
const AdminProducts = React.lazy(() => import('./admin/pages/AdminProducts').then(m => ({ default: m.AdminProducts })))
const AdminProductDetail = React.lazy(() => import('./admin/pages/AdminProductDetail').then(m => ({ default: m.AdminProductDetail })))
const AdminCategories = React.lazy(() => import('./admin/pages/AdminCategories').then(m => ({ default: m.AdminCategories })))
const AdminCoupons = React.lazy(() => import('./admin/pages/AdminCoupons').then(m => ({ default: m.AdminCoupons })))
const AdminContent = React.lazy(() => import('./admin/pages/AdminContent').then(m => ({ default: m.AdminContent })))
const AdminOrders = React.lazy(() => import('./admin/pages/AdminOrders').then(m => ({ default: m.AdminOrders })))
const AdminOrderDetail = React.lazy(() => import('./admin/pages/AdminOrderDetail').then(m => ({ default: m.AdminOrderDetail })))
const AdminTransactions = React.lazy(() => import('./admin/pages/AdminTransactions').then(m => ({ default: m.AdminTransactions })))
const AdminFinance = React.lazy(() => import('./admin/pages/AdminFinance').then(m => ({ default: m.AdminFinance })))
const AdminSettings = React.lazy(() => import('./admin/pages/AdminSettings').then(m => ({ default: m.AdminSettings })))
const AdminNotifications = React.lazy(() => import('./admin/pages/AdminNotifications').then(m => ({ default: m.AdminNotifications })))
const AdminPublicActivity = React.lazy(() => import('./admin/pages/AdminPublicActivity').then(m => ({ default: m.AdminPublicActivity })))
const AdminMessages = React.lazy(() => import('./admin/pages/AdminMessages').then(m => ({ default: m.AdminMessages })))
const AdminShipping = React.lazy(() => import('./admin/pages/AdminShipping').then(m => ({ default: m.AdminShipping })))
const AdminTransactionDetail = React.lazy(() => import('./admin/pages/AdminTransactionDetail').then(m => ({ default: m.AdminTransactionDetail })))
const AdminReports = React.lazy(() => import('./admin/pages/AdminReports').then(m => ({ default: m.AdminReports })))
const AdminSystemLogs = React.lazy(() => import('./admin/pages/AdminSystemLogs').then(m => ({ default: m.AdminSystemLogs })))
const AdminPages = React.lazy(() => import('./admin/pages/AdminPages').then(m => ({ default: m.AdminPages })))
const AdminReviews = React.lazy(() => import('./admin/pages/AdminReviews').then(m => ({ default: m.AdminReviews })))
const AdminSubscribers = React.lazy(() => import('./admin/pages/AdminSubscribers').then(m => ({ default: m.AdminSubscribers })))
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })))

const AdminFallback = () => (
  <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#FDF4E6]">
    <div className="w-12 h-12 border-4 border-white border-t-[#6651A4] rounded-full animate-spin shadow-md mb-4"></div>
    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest animate-pulse">Loading Workspace...</p>
  </div>
)

const AdminAccessDenied = () => (
  <div className="min-h-screen bg-[#FDF4E6] flex items-center justify-center px-6">
    <div className="max-w-lg w-full bg-white rounded-[32px] p-10 shadow-sm border border-black/[0.03] text-center">
      <h1 className="text-3xl font-grandstander font-bold text-gray-800">Admin access required</h1>
      <p className="mt-3 text-sm font-medium text-gray-500">This workspace is reserved for admin and super admin accounts.</p>
      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <Link to="/" className="h-12 px-6 rounded-xl bg-[#333] text-white text-[11px] font-bold uppercase tracking-widest flex items-center justify-center">
          Back to Store
        </Link>
        <Link to="/account" className="h-12 px-6 rounded-xl bg-[#6651A4] text-white text-[11px] font-bold uppercase tracking-widest flex items-center justify-center">
          Go to Account
        </Link>
      </div>
    </div>
  </div>
)

function AdminRouteGate({ children }) {
  const location = useLocation()
  const { user, authLoading, isAdmin } = useAuth()

  if (authLoading) {
    return <AdminFallback />
  }

  if (!user) {
    const next = `${location.pathname}${location.search}`
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />
  }

  if (!isAdmin) {
    return <AdminAccessDenied />
  }

  return children
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <PaymentProvider>
            <Router>
              <AppContent />
            </Router>
          </PaymentProvider>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  )
}

function AppContent() {
  const location = useLocation()
  const isCheckout = location.pathname === '/checkout'
  const isAdmin = location.pathname.startsWith('/admin')
  const isAuthPage = ['/login', '/register', '/forgot-password'].includes(location.pathname)
  const hideLayouts = isCheckout || isAdmin || isAuthPage

  const { user } = useAuth()
  const isSiteAdmin = ['admin', 'super_admin'].includes(user?.role)
  const [maintenanceMode, setMaintenanceMode] = React.useState(false)

  React.useEffect(() => {
    getStorefrontSettings()
      .then((data) => {
        setMaintenanceMode(Boolean(data.maintenanceMode))
      })
      .catch(console.error)
  }, [location.pathname]) // re-check occasionally on navigation

  // If we are entirely inside admin, we don't need the flex-col bg-[#FDF4E6] wrapper of the user site,
  // but it's okay because AdminLayout fills the screen anyway. Let's just conditionally render components.

  if (maintenanceMode && !isSiteAdmin && !isAdmin && !isAuthPage) {
    return (
      <div className="min-h-screen bg-[#FDF4E6] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-6 border border-[#F1641E]/20">
          <svg className="w-10 h-10 text-[#F1641E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-4xl md:text-5xl font-grandstander font-bold text-gray-800 mb-4">We'll be back soon!</h1>
        <p className="text-gray-500 font-medium max-w-md mx-auto text-sm md:text-base leading-relaxed">
          Toyovo India is currently undergoing scheduled maintenance to improve your shopping experience. Please check back shortly.
        </p>
      </div>
    )
  }

  if (isAdmin) {
    return (
      <>
        <ScrollToTop />
        <FirebaseTokenManager />
        <Suspense fallback={<AdminFallback />}>
          <AdminRouteGate>
            <Routes>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="users/:id" element={<AdminUserDetail />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="products/:id" element={<AdminProductDetail />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="coupons" element={<AdminCoupons />} />
                <Route path="content" element={<AdminContent />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="orders/:id" element={<AdminOrderDetail />} />
                <Route path="finance" element={<AdminFinance />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="notifications" element={<AdminNotifications />} />
                <Route path="public-activity" element={<AdminPublicActivity />} />
                <Route path="messages" element={<AdminMessages />} />
                <Route path="shipping" element={<AdminShipping />} />
                <Route path="transactions" element={<AdminTransactions />} />
                <Route path="transactions/:id" element={<AdminTransactionDetail />} />
                <Route path="reports" element={<AdminReports />} />
                <Route path="system-logs" element={<AdminSystemLogs />} />
                <Route path="legal-pages" element={<AdminPages />} />
                <Route path="reviews" element={<AdminReviews />} />
                <Route path="subscribers" element={<AdminSubscribers />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </AdminRouteGate>
        </Suspense>
      </>
    )
  }

  return (
    <>
      <ScrollToTop />
      <FirebaseTokenManager />
      <div className="min-h-screen flex flex-col bg-[#FDF4E6] overflow-x-hidden relative">
        {!hideLayouts && <VisionHeader />}
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/product/:title" element={<ProductDetailPage />} />
            
            {/* Legal & Informational Pages */}
            <Route path="/pages/return-exchange" element={<ReturnPolicy />} />
            <Route path="/pages/shipping-policy" element={<ShippingPolicy />} />
            <Route path="/pages/terms-conditions" element={<TermsConditions />} />
            <Route path="/pages/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/pages/faq" element={<FAQPage />} />
            
            {/* Utility Pages */}
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/search" element={<SearchPage />} />
            
            {/* Collection / Category Pages */}
            <Route path="/shop" element={<CollectionPage />} />
            <Route path="/collections/:category/:subcategory?" element={<CollectionPage />} />

            {/* Auth Pages */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/account/:tab" element={<AccountPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-success" element={<OrderSuccessPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/all-categories" element={<AllCategoriesPage />} />

            {/* Fallback to 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        {!hideLayouts && <Footer />}
        {!hideLayouts && <MobileBottomBar />}
        {!hideLayouts && <AsideSidebar />}
      </div>
    </>
  )
}
