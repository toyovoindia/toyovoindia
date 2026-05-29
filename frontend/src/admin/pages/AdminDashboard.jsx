import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Users, DollarSign, Package, ShoppingCart, ArrowUpRight, ArrowDownRight, Activity, ChevronDown } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { getAdminOrders, getAdminRevenueStats } from '../../services/orderApi'
import { getAdminDashboardStats } from '../../services/siteApi'

const formatCurrencyShort = (val) => {
  if (val >= 10000000) return (val / 10000000).toFixed(1).replace('.0', '') + ' Cr'
  if (val >= 100000) return (val / 100000).toFixed(1).replace('.0', '') + ' L'
  if (val >= 1000) return (val / 1000).toFixed(0) + ' k'
  return val
}

const buildRevenueSeries = (stats) => {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  const currentYear = new Date().getFullYear()
  
  const series = months.map((monthName, index) => {
    const monthNum = index + 1
    const monthData = stats.find(s => Number(s.month) === monthNum && Number(s.year) === currentYear)
    const amount = monthData ? Number(monthData.revenue || 0) : 0
    
    return {
      key: monthName,
      amount,
      label: monthName
    }
  })

  const maxDataVal = Math.max(...series.map(s => s.amount), 1000)
  // Give 20% headroom for a professional look
  const chartMax = Math.ceil((maxDataVal * 1.2) / 1000) * 1000

  return {
    chartMax,
    series: series.map(s => ({
      ...s,
      height: chartMax > 0 ? (s.amount / chartMax) * 100 : 0
    }))
  }
}

export function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [dashboardData, setDashboardData] = useState({
    categoryBreakdown: [],
    wishlistTrends: [],
    lowStockProducts: [],
    totalProducts: 0
  })
  const [monthlyStats, setMonthlyStats] = useState([])
  const [selectedMonth, setSelectedMonth] = useState('')
  const [revenueTimeframe, setRevenueTimeframe] = useState('monthly')
  const [chartData, setChartData] = useState([])
  const [timeframe, setTimeframe] = useState('month')
  const navigate = useNavigate()
  const { error: showError } = useToast()

  useEffect(() => {
    let isMounted = true

    const loadDashboard = async () => {
      setLoading(true)
      try {
        const [
          dashboardStats, 
          { orders: recentOrdersData }, 
          chartRes
        ] = await Promise.all([
          getAdminDashboardStats(),
          getAdminOrders({ limit: 5 }),
          getAdminRevenueStats('monthly')
        ])

        if (!isMounted) return
        
        const totalRevenue = chartRes.reduce((sum, m) => sum + m.revenue, 0)
        const paidOrdersCount = chartRes.reduce((sum, m) => sum + m.orderCount, 0)

        setDashboardData({
          categoryBreakdown: dashboardStats.categoryBreakdown || [],
          wishlistTrends: dashboardStats.wishlistTrends || [],
          lowStockProducts: dashboardStats.lowStockProducts || [],
          totalProducts: dashboardStats.totalProducts || 0
        })
        
        // Setup 12 Months Data for both Dropdown and Chart
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
        const currentYear = new Date().getFullYear()
        const currentMonth = new Date().getMonth() // 0-11
        
        const fullYearStats = months.map((m, i) => {
          const data = chartRes.find(s => s.month === (i + 1) && s.year === currentYear)
          return {
            label: `${m} ${currentYear}`,
            revenue: data ? data.revenue : 0,
            orderCount: data ? data.orderCount : 0,
            month: i + 1,
            year: currentYear
          }
        }).filter((_, i) => i <= currentMonth) // Only show months up to now

        setMonthlyStats(fullYearStats)
        setChartData(chartRes)
        
        if (fullYearStats.length > 0) {
          // Default to current month
          const currentLabel = `${months[currentMonth]} ${currentYear}`
          setSelectedMonth(currentLabel)
        }

        setStats([
          { title: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, trend: `${paidOrdersCount} paid`, isUp: true, icon: <DollarSign size={24} />, color: 'bg-green-500', route: '/admin/finance' },
          { title: 'Active Explorers', value: (dashboardStats.totalUsers || 0).toLocaleString('en-IN'), trend: 'live users', isUp: true, icon: <Users size={24} />, color: 'bg-[#6651A4]', route: '/admin/users' },
          { title: 'Total Orders', value: (dashboardStats.totalOrders || 0).toLocaleString('en-IN'), trend: `${recentOrdersData.filter((order) => order.status === 'processing').length} processing recently`, isUp: true, icon: <ShoppingCart size={24} />, color: 'bg-[#F1641E]', route: '/admin/orders' },
          { title: 'Products in Catalog', value: (dashboardStats.totalProducts || 0).toLocaleString('en-IN'), trend: 'live catalog', isUp: true, icon: <Package size={24} />, color: 'bg-[#E8312A]', route: '/admin/products' },
        ])
        setRecentOrders(
          recentOrdersData.slice(0, 4).map((order) => ({
            id: `#${order.orderNumber}`,
            user: order.customerName || 'Customer',
            amount: `₹${order.total.toFixed(2)}`,
            status: order.statusLabel,
            orderId: order.id,
          }))
        )
      } catch (err) {
        if (isMounted) {
          setStats([])
          setRecentOrders([])
          setDashboardData({ categoryBreakdown: [], wishlistTrends: [], lowStockProducts: [] })
          showError(err.message || 'Dashboard data could not be loaded')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadDashboard()
    return () => {
      isMounted = false
    }
  }, [showError])

  const { categoryBreakdown, wishlistTrends, lowStockProducts, totalProducts } = dashboardData
  const systemHealth = { lowStockProducts }
  
  const revenueSeriesData = useMemo(() => buildRevenueSeries(chartData), [chartData])
  const { chartMax, series: revenueSeries } = revenueSeriesData

  return (
    <div className="shell space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-grandstander font-bold text-gray-800">Command Center</h1>
          <p className="text-gray-500 font-medium text-sm mt-1">Here&apos;s what&apos;s happening in Toyovo today.</p>
        </div>
        <button onClick={() => navigate('/admin/reports')} className="h-11 px-6 bg-[#6651A4] text-white rounded-xl font-bold uppercase tracking-widest text-[11px] shadow-lg hover:bg-[#5a4892] hover:-translate-y-0.5 transition-all w-max flex items-center gap-2">
          <Activity size={16} /> Generate Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          [1, 2, 3, 4].map((idx) => (
            <div key={idx} className="bg-white p-6 rounded-[24px] shadow-sm border border-black/[0.03] animate-pulse">
              <div className="flex justify-between items-start mb-4">
                <div className="h-4 w-24 bg-gray-100 rounded"></div>
                <div className="w-12 h-12 bg-gray-100 rounded-2xl"></div>
              </div>
              <div className="space-y-3">
                <div className="h-8 w-32 bg-gray-100 rounded"></div>
                <div className="h-3 w-40 bg-gray-50 rounded"></div>
              </div>
            </div>
          ))
        ) : (
          stats.map((stat, idx) => (
            <motion.div key={idx} onClick={() => navigate(stat.route)} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="bg-white p-6 rounded-[24px] shadow-sm hover:shadow-xl transition-all border border-black/[0.03] group relative overflow-hidden cursor-pointer">
              <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-700 ${stat.color}`} />
              <div className="flex justify-between items-start mb-4 relative z-10">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{stat.title}</p>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md ${stat.color}`}>{stat.icon}</div>
              </div>
              <div className="relative z-10">
                <h3 className="text-3xl font-grandstander font-bold text-gray-800">{stat.value}</h3>
                <div className="flex items-center gap-1 mt-2">
                  <span className={`flex items-center text-[11px] font-bold ${stat.isUp ? 'text-green-500' : 'text-red-500'}`}>
                    {stat.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} {stat.trend}
                  </span>
                  <span className="text-[11px] text-gray-400 font-medium ml-1">vs last period</span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
      
      {/* Monthly Revenue Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-[32px] p-8 shadow-sm border border-black/[0.03]">
        {loading ? (
          <div className="animate-pulse space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="h-6 w-48 bg-gray-100 rounded"></div>
                <div className="h-4 w-32 bg-gray-100 rounded"></div>
              </div>
              <div className="h-12 w-52 bg-gray-100 rounded-2xl"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="h-32 bg-gray-50 rounded-[24px]"></div>
              <div className="h-32 bg-gray-50 rounded-[24px]"></div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-1">
                <h2 className="text-xl font-grandstander font-bold text-gray-800">Gross Revenue Analytics</h2>
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">Live performance metrics across timeframes</p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Selection Dropdown */}
                <div className="relative group min-w-[220px] w-full sm:w-auto">
                  <select 
                    value={selectedMonth} 
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full h-12 pl-4 pr-10 bg-[#FDF4E6]/50 rounded-2xl outline-none border border-transparent focus:border-[#6651A4]/30 font-bold text-[13px] appearance-none cursor-pointer transition-all"
                  >
                    {monthlyStats.map(m => (
                      <option key={m.label} value={m.label}>{m.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-[#6651A4] transition-colors" />
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="p-8 bg-[#6651A4]/5 rounded-[24px] border border-[#6651A4]/10 relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-[#6651A4]/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Gross Revenue</p>
                <h3 className="text-4xl font-grandstander font-bold text-[#6651A4]">
                  ₹{monthlyStats.find(m => m.label === selectedMonth)?.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
                </h3>
              </div>
              
              <div className="p-8 bg-[#F1641E]/5 rounded-[24px] border border-[#F1641E]/10 relative overflow-hidden group">
                 <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-[#F1641E]/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Successful Orders</p>
                 <h3 className="text-4xl font-grandstander font-bold text-[#F1641E]">
                  {monthlyStats.find(m => m.label === selectedMonth)?.orderCount || 0} Orders
                </h3>
              </div>
            </div>
          </>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-[32px] p-8 shadow-sm border border-black/[0.03]">
          <div className="flex flex-col items-center mb-10">
            <h2 className="text-3xl font-bold text-[#E8312A] tracking-tight uppercase">Revenue Overview</h2>
            <p className="text-[12px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-2">Annual Performance Analytics</p>
          </div>
          
          <div className="relative h-80 flex gap-6 px-4">
            {/* Y-Axis Labels */}
            <div className="flex flex-col justify-between text-[11px] font-bold text-gray-500 w-14 pb-8">
              {[1, 0.8, 0.6, 0.4, 0.2, 0].map(p => (
                <span key={p} className="text-right">
                  {formatCurrencyShort(chartMax * p)}
                </span>
              ))}
            </div>

            {/* Chart Area */}
            <div className="flex-1 relative flex items-end justify-between gap-2 border-l-2 border-b-2 border-gray-800 pb-2">
              {/* Grid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-2">
                {[0, 1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="w-full border-t border-dotted border-gray-200" />
                ))}
              </div>

              {/* Monthly Bars */}
              {revenueSeries.map((entry) => (
                <div key={entry.key} className="flex-1 flex flex-col items-center gap-4 group relative z-10 h-full justify-end">
                  <div className="relative w-full flex items-end justify-center h-full">
                    <motion.div 
                      initial={{ height: 0 }} 
                      animate={{ height: `${Math.max(entry.height, 1)}%` }} 
                      transition={{ duration: 1, delay: 0.2 }} 
                      className="w-full max-w-[32px] bg-[#4CAF50] group-hover:bg-[#6651A4] transition-colors relative shadow-sm rounded-t-sm"
                    >
                      {entry.amount > 0 && (
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 whitespace-nowrap shadow-xl z-20">
                          ₹{entry.amount.toLocaleString('en-IN')}
                        </div>
                      )}
                    </motion.div>
                  </div>
                  <span className="absolute -bottom-8 text-[10px] font-bold text-gray-800 uppercase tracking-tighter">{entry.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="h-10" /> {/* Spacer for labels */}
        </motion.div>

        <div className="space-y-6 md:space-y-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white rounded-[24px] md:rounded-[32px] p-6 md:p-8 shadow-sm border border-black/[0.03]">
            <h2 className="text-lg md:text-xl font-grandstander font-bold text-gray-800 mb-6 md:mb-8">Toy Categories</h2>
            <div className="flex flex-col sm:flex-row items-center gap-6 md:gap-12">
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 flex items-center justify-center shrink-0 mx-auto">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="50%" cy="50%" r="40%" fill="transparent" stroke="#f3f4f6" strokeWidth="12" />
                  <motion.circle cx="50%" cy="50%" r="40%" fill="transparent" stroke="#6651A4" strokeWidth="12" strokeDasharray="251" initial={{ strokeDashoffset: 251 }} animate={{ strokeDashoffset: 251 * 0.4 }} transition={{ duration: 1.5, ease: 'easeInOut' }} strokeLinecap="round" />
                </svg>
                <div className="absolute text-center">
                  <p className="text-xl md:text-3xl font-grandstander font-bold text-gray-800">{totalProducts}</p>
                  <p className="text-[7px] md:text-[9px] font-bold text-gray-400 uppercase tracking-widest">Total Toys</p>
                </div>
              </div>
              <div className="flex-1 space-y-4 w-full">
                {categoryBreakdown.map((item) => (
                  <div key={item.label} className="space-y-1.5">
                    <div className="flex justify-between text-[9px] md:text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-gray-500">{item.label}</span>
                      <span className="text-gray-800">{item.count}</span>
                    </div>
                    <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: item.percent }} className={`h-full ${item.color} rounded-full`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="bg-white rounded-[24px] md:rounded-[32px] p-6 md:p-8 shadow-sm border border-black/[0.03]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg md:text-xl font-grandstander font-bold text-gray-800">Wishlist Trends</h3>
              <span className="px-2 py-0.5 bg-purple-50 text-[#6651A4] rounded-full text-[8px] md:text-[9px] font-bold uppercase tracking-widest whitespace-nowrap">Top Favorites</span>
            </div>
            <div className="space-y-3">
              {wishlistTrends.length === 0 ? (
                <div className="p-4 bg-[#FDF4E6]/30 rounded-xl text-[11px] font-bold text-gray-400 uppercase tracking-widest">No wishlist data yet</div>
              ) : wishlistTrends.map((item) => (
                <div key={item.name} className="flex items-center justify-between p-3 md:p-4 bg-[#FDF4E6]/30 rounded-xl md:rounded-2xl border border-black/[0.01]">
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] md:text-[13px] font-bold text-gray-800 truncate">{item.name}</p>
                    <p className="text-[9px] md:text-[10px] text-gray-400 font-medium truncate">{item.count} saved</p>
                  </div>
                  <span className="text-[10px] md:text-[11px] font-bold text-green-500 shrink-0 ml-2">{item.count}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="lg:col-span-2 bg-white rounded-[24px] md:rounded-[32px] p-5 md:p-8 shadow-sm border border-black/[0.03] overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg md:text-xl font-grandstander font-bold text-gray-800">Recent Ledger</h2>
            <button onClick={() => navigate('/admin/transactions')} className="text-[9px] md:text-[11px] font-bold text-[#F1641E] uppercase tracking-widest hover:underline whitespace-nowrap">View All</button>
          </div>
          <div className="overflow-x-auto custom-scrollbar -mx-2 px-2">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-3 px-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest">ID</th>
                  <th className="py-3 px-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Explorer</th>
                  <th className="py-3 px-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest text-right">Amount</th>
                  <th className="py-3 px-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <tr key={i} className="animate-pulse border-b border-gray-50 last:border-0">
                      <td className="py-3 px-2"><div className="h-3 w-12 bg-gray-100 rounded"></div></td>
                      <td className="py-3 px-2"><div className="h-3 w-24 bg-gray-100 rounded"></div></td>
                      <td className="py-3 px-2"><div className="h-3 w-16 bg-gray-100 rounded ml-auto"></div></td>
                      <td className="py-3 px-2"><div className="h-5 w-16 bg-gray-100 rounded-full mx-auto"></div></td>
                    </tr>
                  ))
                ) : recentOrders.length === 0 ? (
                  <tr><td colSpan="4" className="py-10 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">No live orders found</td></tr>
                ) : recentOrders.map((order, i) => (
                  <tr key={i} onClick={() => navigate(`/admin/orders/${order.orderId}`)} className="border-b border-gray-50 last:border-0 hover:bg-[#FDF4E6]/50 transition-colors cursor-pointer group">
                    <td className="py-4 px-2 font-mono text-[11px] md:text-[13px] font-bold text-[#6651A4]">{order.id}</td>
                    <td className="py-4 px-2 text-[11px] md:text-[13px] font-bold text-gray-700">{order.user}</td>
                    <td className="py-4 px-2 text-[12px] md:text-[14px] font-bold font-grandstander text-gray-800 text-right">{order.amount}</td>
                    <td className="py-4 px-2 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8px] md:text-[9px] font-bold uppercase tracking-widest ${order.status === 'Pending' ? 'bg-yellow-50 text-yellow-600' : order.status === 'Shipped' ? 'bg-blue-50 text-blue-600' : order.status === 'Delivered' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{order.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="bg-[#6651A4] rounded-[32px] p-8 text-white relative overflow-hidden shadow-xl flex flex-col h-full min-h-[400px]">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-[#F1641E]/20 rounded-full blur-2xl" />
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-grandstander font-bold">Stock Alerts</h2>
              <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-widest">{systemHealth.lowStockProducts.length} Items</span>
            </div>
            <p className="text-white/60 text-sm mb-6">Products requiring inventory attention.</p>
            
            <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-[150px] max-h-[300px]">
              {systemHealth.lowStockProducts.length === 0 ? (
                <div className="p-4 bg-white/10 rounded-xl text-[11px] font-bold text-white/40 uppercase tracking-widest text-center">Inventory is healthy</div>
              ) : systemHealth.lowStockProducts.slice(0, 5).map(product => {
                 const stock = Number(product.stock || 0)
                 const isOut = stock === 0
                 return (
                   <div key={product._id || product.id} onClick={() => navigate(`/admin/products/${product._id || product.id}`)} className="p-3 bg-white/10 rounded-xl border border-white/5 hover:bg-white/20 transition-colors cursor-pointer flex justify-between items-center group">
                     <div className="min-w-0 pr-4">
                       <p className="text-[12px] font-bold text-white truncate">{product.name || product.title}</p>
                       <p className="text-[10px] text-white/50 font-medium truncate mt-0.5">SKU: {product.sku || 'N/A'}</p>
                     </div>
                     <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest shrink-0 ${isOut ? 'bg-red-500/20 text-red-200' : 'bg-yellow-500/20 text-yellow-200'}`}>
                       {isOut ? 'Out of Stock' : `${stock} Left`}
                     </span>
                   </div>
                 )
              })}
            </div>
            
            <div className="pt-6 mt-auto border-t border-white/10">
              <button onClick={() => navigate('/admin/products')} className="w-full h-12 bg-white text-[#6651A4] rounded-xl font-bold uppercase tracking-widest text-[11px] hover:bg-[#FAEAD3] transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2">
                Manage Inventory <ArrowUpRight size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
