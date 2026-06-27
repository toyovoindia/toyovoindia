import { useState, useEffect, Suspense, useRef } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutDashboard, Users, Package, ShoppingCart, 
  Settings, LogOut, Menu, X, Bell, Search, 
  ChevronRight, CircleUser, Wallet, Tags, Percent, Megaphone, MessageSquare, Truck, Activity, FileText, Star
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { getAdminUnreadCount, getAdminNotifications } from '../services/notificationAdminApi'
import { requestFirebaseToken } from '../utils/firebase'
import { saveFcmToken } from '../services/notificationApi'
import { apiRequest } from '../services/api'
import { getMessaging, onMessage } from 'firebase/messaging'

// --- Skeleton Component for Seamless Loading ---
function AdminContentSkeleton() {
  return (
    <div className="shell space-y-8 animate-pulse">
      <div className="flex justify-between items-end">
        <div className="space-y-3">
          <div className="h-10 w-64 bg-gray-200 rounded-2xl" />
          <div className="h-4 w-48 bg-gray-100 rounded-xl" />
        </div>
        <div className="h-12 w-40 bg-gray-200 rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 bg-white rounded-[24px] border border-black/[0.03]" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 h-96 bg-white rounded-[32px] border border-black/[0.03]" />
        <div className="lg:col-span-1 h-96 bg-white rounded-[32px] border border-black/[0.03]" />
      </div>
    </div>
  )
}

export function AdminLayout() {
  const { logout } = useAuth()
  const { success, info } = useToast()
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1280)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1280)
  const location = useLocation()
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, action: null, message: '', title: '' })
  const lastNotifIdRef = useRef(null)
  const searchRef = useRef(null)

  // Global Search State
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Debounced search effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true)
      try {
        const payload = await apiRequest(`/admin/search?q=${encodeURIComponent(searchQuery)}`)
        setSearchResults(payload.data || [])
      } catch (err) {
        console.error('Search failed:', err)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 400) // 400ms debounce

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery])

  // Handle click outside search to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch unread count & check for new notifications
  useEffect(() => {
    let isInitial = true;
    const fetchCount = async () => {
      try {
        const payload = await getAdminNotifications({ limit: 1 })
        const latestNotif = payload?.data?.[0]
        
        if (latestNotif) {
          if (!isInitial && lastNotifIdRef.current && lastNotifIdRef.current !== latestNotif._id) {
             // New notification!
             if (latestNotif.title?.toLowerCase().includes('order') || latestNotif.type === 'order') {
                 success(`New Order: ${latestNotif.message}`)
                 try {
                     const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3')
                     audio.play()
                 } catch (e) {}
             } else {
                 info(`Alert: ${latestNotif.title}`)
             }
          }
          lastNotifIdRef.current = latestNotif._id
        }
        isInitial = false;

        const count = payload?.meta?.unread || 0;
        setUnreadCount(count)
      } catch (err) {
        console.error('Failed to fetch notifications')
      }
    }
    fetchCount()
    // Poll every 15 seconds for responsiveness
    const interval = setInterval(fetchCount, 15000)
    
    // Listen for custom event to update instantly
    const handleUpdate = () => fetchCount()
    window.addEventListener('adminNotificationsRead', handleUpdate)

    // Set up FCM Push Notifications
    const setupFCM = async () => {
      try {
        const token = await requestFirebaseToken()
        if (token) await saveFcmToken(token, 'web')
        
        // Listen for foreground FCM messages
        import('../utils/firebase').then(({ requestFirebaseToken }) => {
          import('firebase/messaging').then(({ getMessaging, onMessage }) => {
            const messaging = getMessaging();
            if (messaging) {
              onMessage(messaging, (payload) => {
                const title = payload.notification?.title || payload.data?.title || 'Notification';
                const body = payload.notification?.body || payload.data?.body || '';
                if (title.toLowerCase().includes('order') || payload.data?.type?.includes('order')) {
                  success(`${title}: ${body}`);
                  try {
                    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3')
                    audio.play()
                  } catch (e) {}
                } else {
                  info(`${title}: ${body}`);
                }
                fetchCount();
              });
            }
          })
        })
      } catch (err) {
        console.warn('FCM setup failed:', err)
      }
    }
    setupFCM()

    return () => {
      clearInterval(interval)
      window.removeEventListener('adminNotificationsRead', handleUpdate)
    }
  }, [success, info])

  // Handle window resize for responsiveness
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1280
      setIsMobile(mobile)
      if (!mobile) {
        setMobileMenuOpen(false)
        setSidebarOpen(true)
      } else {
        setSidebarOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/admin/users', label: 'Users Hub', icon: <Users size={20} /> },
    { path: '/admin/products', label: 'Toy Catalog', icon: <Package size={20} /> },
    { path: '/admin/categories', label: 'Categories', icon: <Tags size={20} /> },
    { path: '/admin/coupons', label: 'Coupons', icon: <Percent size={20} /> },
    { path: '/admin/orders', label: 'Order Command', icon: <ShoppingCart size={20} /> },
    { path: '/admin/finance', label: 'Financial Hub', icon: <Wallet size={20} /> },
    { path: '/admin/content', label: 'Storefront', icon: <Megaphone size={20} /> },
    // { path: '/admin/public-activity', label: 'Live Popups', icon: <Activity size={20} /> },
    { path: '/admin/reviews', label: 'Reviews', icon: <Star size={20} /> },
    { path: '/admin/messages', label: 'Messages', icon: <MessageSquare size={20} /> },
    { path: '/admin/subscribers', label: 'Newsletter', icon: <Megaphone size={20} /> },
    { path: '/admin/shipping', label: 'Shipping', icon: <Truck size={20} /> },
    { path: '/admin/legal-pages', label: 'Legal Pages', icon: <FileText size={20} /> },
    { path: '/admin/settings', label: 'Settings', icon: <Settings size={20} /> },
  ]

  return (
    <div className="min-h-screen bg-[#FDF4E6] text-[#222222] font-roboto flex overflow-hidden relative">
      
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {(mobileMenuOpen || (isMobile && sidebarOpen)) && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#222222]/60 z-[100] xl:hidden backdrop-blur-md"
            onClick={() => {
              setMobileMenuOpen(false)
              setSidebarOpen(false)
            }}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ 
          width: sidebarOpen ? 280 : 0,
          x: (isMobile && !sidebarOpen) ? -280 : 0,
          display: (isMobile && !sidebarOpen) ? 'none' : 'flex'
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
        className={`fixed xl:relative z-[101] h-screen bg-white border-r border-black/[0.05] flex flex-col shrink-0 shadow-2xl xl:shadow-none overflow-hidden`}
      >
        <div className="h-20 flex items-center justify-between px-6 border-b border-black/[0.05] shrink-0">
          <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
            <div className="w-14 h-14 flex items-center justify-center shrink-0">
               <img src="/favicon.webp" alt="Toyovo Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-grandstander font-bold text-[22px] md:text-[26px] text-[#6651A4] tracking-tight -ml-1.5">Toyovo<span className="text-[#F1641E]">Admin</span></span>
          </div>
          <button className="xl:hidden p-2.5 bg-gray-50 text-gray-400 hover:text-[#E8312A] rounded-xl transition-colors" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar py-6 px-4 space-y-2 overflow-x-hidden">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-4 whitespace-nowrap">Core Modules</p>
          
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (isMobile) setSidebarOpen(false)
                }}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-[16px] transition-all group relative overflow-hidden ${
                  isActive ? 'bg-[#6651A4] text-white shadow-md' : 'text-gray-500 hover:bg-[#FAEAD3]/50 hover:text-[#222222]'
                }`}
              >
                {isActive && (
                  <motion.div layoutId="activeNav" className="absolute left-0 top-0 bottom-0 w-1 bg-[#F1641E]" />
                )}
                <span className={`shrink-0 ${isActive ? 'text-[#F1641E]' : 'text-gray-400 group-hover:text-[#6651A4]'}`}>
                  {item.icon}
                </span>
                <span className="font-bold text-[13px] tracking-wide whitespace-nowrap">
                  {item.label}
                </span>
              </NavLink>
            )
          })}
        </div>

        <div className="p-4 border-t border-black/[0.05] shrink-0 bg-gray-50/50">
          <button 
            onClick={() => {
              setConfirmModal({
                isOpen: true,
                title: 'Confirm Logout',
                message: 'Are you sure you want to log out of the admin panel?',
                action: async () => {
                  setConfirmModal({ isOpen: false, action: null, message: '', title: '' })
                  await logout()
                  navigate('/admin/login')
                }
              })
            }}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-[16px] text-gray-500 hover:bg-red-50 hover:text-[#E8312A] transition-all group overflow-hidden"
          >
            <LogOut size={20} className="text-gray-400 group-hover:text-[#E8312A] shrink-0" />
            <span className="font-bold text-[13px] tracking-wide whitespace-nowrap">Logout</span>
          </button>
        </div>
      </motion.aside>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[2000000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
             <motion.div initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.95, opacity:0}} className="bg-white max-w-sm w-full rounded-3xl overflow-hidden shadow-2xl p-6">
                 <h3 className="text-xl font-bold font-grandstander text-gray-800 mb-2">{confirmModal.title}</h3>
                 <p className="text-sm text-gray-500 mb-6">{confirmModal.message}</p>
                 <div className="flex gap-3">
                    <button onClick={() => setConfirmModal({ isOpen: false, action: null, message: '', title: '' })} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl text-[12px] uppercase tracking-wider hover:bg-gray-200 transition-colors">Cancel</button>
                    <button onClick={confirmModal.action} className="flex-1 py-3 bg-[#E8312A] text-white font-bold rounded-xl text-[12px] uppercase tracking-wider hover:bg-[#b9211c] transition-colors">Logout</button>
                 </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden min-w-0 w-full">
        {/* Top Header */}
        <header className="h-20 bg-white/90 backdrop-blur-md border-b border-black/[0.05] flex items-center justify-between px-4 md:px-8 shrink-0 z-50 sticky top-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="xl:hidden p-2.5 bg-[#FAEAD3]/50 rounded-xl text-gray-600 hover:bg-[#FAEAD3] transition-colors"
            >
              <Menu size={20} />
            </button>
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden xl:flex p-2.5 bg-[#FAEAD3]/50 rounded-xl text-gray-600 hover:bg-[#FAEAD3] transition-colors"
            >
              <Menu size={20} />
            </button>
            
            {/* Global Search - Hidden on small mobile */}
            <div className="hidden sm:flex relative z-[100]" ref={searchRef}>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchQuery.trim()) navigate(`/admin/products?search=${encodeURIComponent(searchQuery.trim())}`);
                  setShowSuggestions(false);
                }}
                className="flex items-center bg-[#FDF4E6] rounded-full px-4 py-2.5 w-48 md:w-64 lg:w-96 border border-transparent focus-within:border-[#6651A4]/30 focus-within:bg-white transition-all shadow-sm relative"
              >
                <Search size={16} className="text-gray-400" />
                <input 
                  type="text" 
                  name="search"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => {
                    if (searchQuery.trim()) setShowSuggestions(true);
                  }}
                  placeholder="Search orders, users, toys..." 
                  className="bg-transparent border-none outline-none ml-2 w-full text-[12px] font-medium text-gray-700 placeholder:text-gray-400"
                  autoComplete="off"
                />
                {isSearching && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[#F1641E] border-t-transparent rounded-full animate-spin" />
                )}
              </form>

              {/* Suggestions Dropdown */}
              <AnimatePresence>
                {showSuggestions && searchQuery.trim() && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[24px] shadow-2xl border border-black/[0.05] overflow-hidden max-h-[400px] flex flex-col"
                  >
                    {searchResults.length > 0 ? (
                      <div className="overflow-y-auto custom-scrollbar p-2">
                        {searchResults.map((res, idx) => (
                          <div 
                            key={`${res.type}-${res.id}-${idx}`}
                            onClick={() => {
                              navigate(res.url);
                              setShowSuggestions(false);
                              setSearchQuery('');
                            }}
                            className="flex items-center gap-4 p-3 hover:bg-[#FDF4E6]/50 rounded-2xl cursor-pointer transition-colors group"
                          >
                            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                              {res.type === 'product' && res.image ? (
                                <img src={res.image.url || res.image} className="w-full h-full object-cover" alt="" />
                              ) : res.type === 'user' && res.avatar ? (
                                <img src={res.avatar} className="w-full h-full object-cover" alt="" />
                              ) : (
                                <Search size={16} className="text-gray-400 group-hover:text-[#F1641E] transition-colors" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-bold text-gray-800 truncate leading-tight">{res.title}</p>
                              <p className="text-[11px] text-gray-500 truncate mt-0.5">{res.subtitle}</p>
                            </div>
                            <div className="px-2 py-1 bg-gray-50 rounded-md shrink-0">
                              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{res.type}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : !isSearching ? (
                      <div className="p-8 text-center text-gray-500 text-sm">
                        No results found for "{searchQuery}"
                      </div>
                    ) : null}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-5">
            {/* TEST PUSH NOTIFICATION BUTTON */}
            <button
              onClick={() => {
                success(`New Order: You received a new order from Test Customer!`)
                try {
                  const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3')
                  audio.play()
                } catch (e) {}
              }}
              className="text-[10px] font-bold uppercase tracking-widest bg-[#6651A4]/10 text-[#6651A4] px-3 py-1.5 rounded-lg hover:bg-[#6651A4]/20 transition-all border border-[#6651A4]/20"
            >
              Test Alert
            </button>

            <button 
              onClick={() => navigate('/admin/notifications')}
              className="relative p-2.5 text-gray-400 hover:text-[#6651A4] transition-colors bg-[#FAEAD3]/30 hover:bg-[#FAEAD3] rounded-full"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2.5 w-4 h-4 bg-[#E8312A] rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-sm ring-2 ring-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            
            <div className="h-8 w-[1px] bg-gray-200 hidden sm:block" />
            
            <div 
              onClick={() => navigate('/admin/settings')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="text-right hidden md:block">
                <p className="text-[12px] font-bold text-gray-800 leading-tight">Admin User</p>
                <p className="text-[9px] font-bold text-[#F1641E] uppercase tracking-widest">Super Admin</p>
              </div>
              <div className="w-9 h-9 md:w-10 md:h-10 bg-[#FAEAD3] rounded-full flex items-center justify-center text-[#6651A4] border-2 border-white shadow-sm group-hover:scale-105 transition-transform">
                <CircleUser size={22} />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Viewport with Internal Suspense */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-6 lg:p-8 relative w-full overflow-x-hidden">
          <Suspense fallback={<AdminContentSkeleton />}>
            <div className="w-full h-full">
              <Outlet />
            </div>
          </Suspense>
        </div>
      </main>
    </div>
  )
}
