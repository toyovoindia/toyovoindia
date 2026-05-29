import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { 
  Bell, ShoppingBag, Package, Users, 
  Wallet, AlertCircle, CheckCircle, Search, ChevronRight, Clock,
  RefreshCw, Shield, CreditCard
} from 'lucide-react'
import { getAdminNotifications, markAdminNotificationsRead } from '../../services/notificationAdminApi'
import { useToast } from '../../context/ToastContext'

const CATEGORY_ICONS = {
  Order: { icon: <ShoppingBag size={18} />, color: 'bg-blue-500' },
  Payment: { icon: <CreditCard size={18} />, color: 'bg-green-500' },
  Return: { icon: <RefreshCw size={18} />, color: 'bg-[#F1641E]' },
  Auth: { icon: <Users size={18} />, color: 'bg-[#6651A4]' },
  Security: { icon: <Shield size={18} />, color: 'bg-red-600' },
  System: { icon: <AlertCircle size={18} />, color: 'bg-gray-500' },
  General: { icon: <Bell size={18} />, color: 'bg-purple-500' }
}

export function AdminNotifications() {
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { success, error: showError } = useToast()
  const navigate = useNavigate()

  const fetchNotifications = async (p = 1, f = filter) => {
    setLoading(true)
    try {
      const res = await getAdminNotifications({ 
        page: p, 
        unreadOnly: f === 'Unread'
      })
      setNotifications(res.data)
      setUnreadCount(res.meta.unread)
      setTotalPages(res.meta.totalPages)
    } catch (err) {
      showError('Failed to fetch alerts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications(1, filter)
  }, [filter])

  const handleMarkAllRead = async () => {
    try {
      await markAdminNotificationsRead()
      success('All alerts marked as read')
      fetchNotifications(page, filter)
      window.dispatchEvent(new Event('adminNotificationsRead'))
    } catch (err) {
      showError('Failed to update alerts')
    }
  }

  const handleNotificationClick = async (notif) => {
    if (!notif.readByAdmin) {
      try {
        await markAdminNotificationsRead([notif._id])
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, readByAdmin: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))
        window.dispatchEvent(new Event('adminNotificationsRead'))
      } catch (err) {
        showError('Failed to mark read')
      }
    }
    if (notif.adminActionUrl) {
      navigate(notif.adminActionUrl)
    }
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = Math.floor((now - date) / 1000)

    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`
    return date.toLocaleDateString()
  }

  const categories = ['All', 'Unread', 'Order', 'Payment', 'Return', 'Auth', 'Security']

  return (
    <div className="shell space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-grandstander font-bold text-gray-800 flex items-center gap-4">
            Alert Center
            <span className="px-3 py-1 bg-[#F1641E] text-white rounded-full text-[12px] font-bold shadow-sm">
              {unreadCount} New
            </span>
          </h1>
          <p className="text-gray-500 font-medium text-sm mt-1">Real-time pulse of all Toyovo India operations.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="h-11 px-6 bg-white border border-[#6651A4]/20 text-[#6651A4] rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-sm hover:bg-[#FAEAD3] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle size={16} /> Mark All Read
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[32px] shadow-sm border border-black/[0.03] overflow-hidden">
        {/* Filters Bar */}
        <div className="p-6 border-b border-black/[0.03] flex flex-col md:flex-row gap-6 justify-between items-center bg-[#FAEAD3]/10">
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 md:pb-0 w-full md:w-auto">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shrink-0 ${
                  filter === cat 
                  ? 'bg-[#6651A4] text-white shadow-md' 
                  : 'text-gray-500 hover:bg-white hover:text-gray-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-64">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search alerts..." className="w-full h-10 pl-11 pr-4 bg-white rounded-xl outline-none border border-transparent focus:border-[#6651A4]/30 text-[12px] font-medium" />
          </div>
        </div>

        {/* Notifications List */}
        <div className="divide-y divide-gray-50 min-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-[#6651A4] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {notifications.length > 0 ? (
                notifications
                  .filter(n => filter === 'All' || filter === 'Unread' || n.category === filter)
                  .map((n) => {
                    const iconConfig = CATEGORY_ICONS[n.category] || CATEGORY_ICONS.General
                    return (
                      <motion.div
                        layout
                        key={n._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        onClick={() => handleNotificationClick(n)}
                        className={`p-6 flex items-start justify-between group transition-all cursor-pointer ${!n.readByAdmin ? 'bg-[#FDF4E6]/50' : 'hover:bg-gray-50'}`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${iconConfig.color} shrink-0`}>
                            {iconConfig.icon}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <h3 className={`text-[15px] font-bold ${!n.readByAdmin ? 'text-gray-900' : 'text-gray-600'}`}>{n.title}</h3>
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-400 rounded-md text-[9px] font-bold uppercase tracking-widest">{n.category}</span>
                            </div>
                            <p className="text-[13px] text-gray-500 leading-relaxed max-w-2xl">{n.body}</p>
                            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest pt-1">
                              <Clock size={12} /> {formatTime(n.createdAt)}
                              {n.userId && <span className="ml-2">· {n.userId.firstName} {n.userId.lastName}</span>}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 text-gray-400 hover:text-[#6651A4] hover:bg-white rounded-lg transition-all shadow-sm">
                            <ChevronRight size={18} />
                          </button>
                        </div>
                      </motion.div>
                    )
                  })
              ) : (
                <div className="py-20 text-center">
                  <Bell size={48} className="mx-auto text-gray-100 mb-4" />
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-[11px]">No alerts found</p>
                </div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-6 border-t border-black/[0.03] flex justify-center gap-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setPage(i + 1)
                  fetchNotifications(i + 1)
                }}
                className={`w-10 h-10 rounded-xl font-bold text-[12px] transition-all ${
                  page === i + 1 ? 'bg-[#6651A4] text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
