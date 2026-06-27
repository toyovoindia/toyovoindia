import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, MoreVertical, ShoppingBag, Eye, Calendar, MapPin, CreditCard, ChevronLeft, ChevronRight, Printer, XCircle } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { getAdminOrders, updateAdminOrderStatus } from '../../services/orderApi'
import { printOrderInvoice } from '../../utils/invoice'

const getAllowedStatusOptions = (status) => {
  switch (status) {
    case 'pending':
      return ['pending', 'processing', 'shipped', 'cancelled']
    case 'processing':
      return ['processing', 'shipped', 'cancelled']
    case 'shipped':
      return ['shipped', 'delivered', 'cancelled']
    case 'delivered':
      return ['delivered']
    case 'cancelled':
      return ['cancelled']
    default:
      return ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
  }
}

export function AdminOrders() {
  const navigate = useNavigate()
  const { success, error: showError } = useToast()
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [orders, setOrders] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 })
  const [menuOpenOrderId, setMenuOpenOrderId] = useState(null)

  useEffect(() => {
    const handleClick = () => setMenuOpenOrderId(null)
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [])

  useEffect(() => {
    let isMounted = true
    const loadOrders = async () => {
      setLoading(true)
      try {
        const { orders: data, meta: responseMeta } = await getAdminOrders({
          page: currentPage,
          limit: itemsPerPage,
          search,
          status: statusFilter === 'All' ? '' : statusFilter.toLowerCase(),
        })
        if (!isMounted) return
        setOrders(data)
        setMeta(responseMeta)
      } catch (err) {
        if (isMounted) {
          setOrders([])
          showError(err.message || 'Orders could not be loaded')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadOrders()
    return () => {
      isMounted = false
    }
  }, [currentPage, itemsPerPage, search, showError, statusFilter])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter])

  const handleCancelOrder = async (order) => {
    try {
      const updatedOrder = await updateAdminOrderStatus(order.id, { status: 'cancelled' })
      setOrders((prev) => prev.map((item) => item.id === order.id ? { ...item, ...updatedOrder } : item))
      success(`Order ${order.orderNumber} has been cancelled.`);
      setMenuOpenOrderId(null);
    } catch (err) {
      showError(err.message || 'Failed to cancel order')
    }
  }

  const totalPages = meta.totalPages || 1

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-yellow-50 text-yellow-600 border-yellow-100'
      case 'processing': return 'bg-blue-50 text-blue-600 border-blue-100'
      case 'shipped': return 'bg-purple-50 text-[#6651A4] border-purple-100'
      case 'delivered': return 'bg-green-50 text-green-600 border-green-100'
      case 'cancelled': return 'bg-red-50 text-red-600 border-red-100'
      default: return 'bg-gray-50 text-gray-600 border-gray-100'
    }
  }

  return (
    <div className="shell space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-grandstander font-bold text-gray-800">Order Command</h1>
          <p className="text-gray-500 font-medium text-sm mt-1">Track and manage fulfillment workflows.</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-[24px] shadow-sm border border-black/[0.03] flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" placeholder="Search by Order ID or Customer..." 
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 pl-12 pr-4 bg-[#FDF4E6]/50 rounded-xl outline-none border border-transparent focus:border-[#6651A4]/30 font-medium text-[13px] transition-all"
          />
        </div>
        
        <div className="relative shrink-0 w-full md:w-60">
          <Filter size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <select 
            value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full h-12 pl-10 pr-8 bg-[#FDF4E6]/50 rounded-xl outline-none border border-transparent focus:border-[#6651A4]/30 text-[10px] md:text-[11px] font-bold text-gray-600 uppercase tracking-widest appearance-none cursor-pointer transition-all"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Processing">Processing</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <motion.div layout className="bg-white rounded-[32px] shadow-sm border border-black/[0.03] overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#FAEAD3]/30 border-b border-black/[0.03]">
                <th className="py-5 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Order Info</th>
                <th className="py-5 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customer & Destination</th>
                <th className="py-5 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Payment</th>
                <th className="py-5 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Status</th>
                <th className="py-5 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0">
                    <td className="py-4 px-6"><div className="space-y-2"><div className="h-4 w-20 bg-gray-100 rounded animate-pulse"/><div className="h-3 w-24 bg-gray-100 rounded animate-pulse"/></div></td>
                    <td className="py-4 px-6"><div className="space-y-2"><div className="h-4 w-32 bg-gray-100 rounded animate-pulse"/><div className="h-3 w-24 bg-gray-100 rounded animate-pulse"/></div></td>
                    <td className="py-4 px-6"><div className="space-y-2"><div className="h-4 w-16 bg-gray-100 rounded animate-pulse"/><div className="h-3 w-20 bg-gray-100 rounded animate-pulse"/></div></td>
                    <td className="py-4 px-6"><div className="h-6 w-24 bg-gray-100 rounded-full mx-auto animate-pulse"/></td>
                    <td className="py-4 px-6"><div className="h-8 w-8 bg-gray-100 rounded-lg ml-auto animate-pulse"/></td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-20 text-center">
                    <ShoppingBag size={48} className="mx-auto text-gray-200 mb-4" />
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[11px]">No Orders Found</p>
                  </td>
                </tr>
              ) : (
                orders.map((order, i) => (
                  <motion.tr 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                    key={order.id} 
                    className="border-b border-gray-50 last:border-0 hover:bg-[#FDF4E6]/50 transition-colors group"
                  >
                    <td className="py-4 px-6">
                      <p 
                        onClick={() => navigate(`/admin/orders/${order.id}`)}
                        className="text-[14px] font-bold text-[#6651A4] font-mono cursor-pointer hover:underline" 
                        title={order.orderNumber || order.id}
                      >
                        #{ (order.orderNumber || order.id || '').toString().slice(-8).toUpperCase() }
                      </p>
                      <p className="text-[11px] text-gray-400 font-medium flex items-center gap-1 mt-1"><Calendar size={10}/> {order.date}</p>
                      <p className="text-[10px] text-gray-400 font-medium mt-1">ETA: {order.deliveryDate || '-'}</p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-[13px] font-bold text-gray-800">{order.customerName}</p>
                      <p className="text-[11px] text-gray-400 font-medium flex items-center gap-1 mt-1"><MapPin size={10}/> {order.destination}</p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-[15px] font-bold font-grandstander text-gray-800">₹{order.total.toFixed(2)} <span className="text-[10px] text-gray-400 font-sans ml-1">({order.itemsCount} items)</span></p>
                      <p className={`text-[10px] font-bold flex items-center gap-1 mt-1 ${order.paymentStatus === 'refunded' ? 'text-red-500' : 'text-green-500'}`}><CreditCard size={10}/> {order.paymentStatusLabel} ({order.paymentMethodLabel})</p>
                      {order.returnRequest?.status !== 'none' && (
                        <p className="text-[10px] font-bold text-[#6651A4] mt-1">Return: {order.returnRequest.statusLabel}</p>
                      )}
                      {order.trackingNumber && (
                        <p className="text-[10px] text-gray-400 font-medium mt-1">Tracking: {order.trackingNumber}</p>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <select 
                        value={order.status}
                        onChange={async (e) => {
                          e.stopPropagation();
                          const newStatus = e.target.value;
                          try {
                            const updatedOrder = await updateAdminOrderStatus(order.id, { status: newStatus })
                            setOrders((prev) => prev.map((item) => item.id === order.id ? { ...item, ...updatedOrder } : item))
                            success(`Order ${order.orderNumber} moved to ${updatedOrder.statusLabel}.`);
                          } catch (err) {
                            showError(err.message || 'Order status update failed')
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border appearance-none outline-none cursor-pointer hover:shadow-md transition-all ${getStatusColor(order.status)}`}
                      >
                        {getAllowedStatusOptions(order.status).map((value) => (
                          <option key={value} value={value}>
                            {value.charAt(0).toUpperCase() + value.slice(1)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td 
                      className="py-4 px-6 text-right relative"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/orders/${order.id}`);
                          }}
                          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-[#6651A4] bg-white border border-gray-100 hover:border-[#6651A4]/30 hover:bg-[#FAEAD3] rounded-lg transition-all shadow-sm"
                          title="View Order"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenOrderId(menuOpenOrderId === order.id ? null : order.id)
                          }}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all shadow-sm ${menuOpenOrderId === order.id ? 'bg-[#6651A4] text-white' : 'text-gray-400 hover:text-[#6651A4] bg-white border border-gray-100 hover:border-[#6651A4]/30 hover:bg-[#FAEAD3]'}`}
                          title="Actions"
                        >
                          <MoreVertical size={14} />
                        </button>
                      </div>

                      <AnimatePresence>
                        {menuOpenOrderId === order.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            className="absolute right-6 top-[60%] z-[200] w-48 bg-white rounded-2xl shadow-xl border border-black/[0.05] py-2 overflow-hidden text-left"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <button
                              onClick={() => {
                                setMenuOpenOrderId(null);
                                printOrderInvoice(order);
                              }}
                              className="w-full px-5 py-3 text-left text-[12px] font-bold text-gray-600 hover:bg-[#FDF4E6]/50 hover:text-[#6651A4] flex items-center gap-3 transition-colors"
                            >
                              <Printer size={14} className="text-gray-500" /> Print Invoice
                            </button>
                            {order.status !== 'cancelled' && order.status !== 'delivered' && (
                              <button
                                onClick={() => handleCancelOrder(order)}
                                className="w-full px-5 py-3 text-left text-[12px] font-bold text-red-500 hover:bg-red-50 flex items-center gap-3 transition-colors"
                              >
                                <XCircle size={14} /> Cancel Order
                              </button>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {!loading && orders.length > 0 && (
          <div className="p-4 border-t border-black/[0.03] flex items-center justify-between bg-[#FAEAD3]/10">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Showing {(currentPage-1)*itemsPerPage + 1} to {Math.min(currentPage*itemsPerPage, meta.total || orders.length)} of {meta.total || orders.length}
            </p>
            <div className="flex gap-2">
              <button 
                disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-[#6651A4] hover:text-white hover:border-[#6651A4] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-500 disabled:hover:border-gray-200 transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                disabled={currentPage === (meta.totalPages || 1)} onClick={() => setCurrentPage(prev => prev + 1)}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-[#6651A4] hover:text-white hover:border-[#6651A4] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-500 disabled:hover:border-gray-200 transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </motion.div>

    </div>
  )
}
