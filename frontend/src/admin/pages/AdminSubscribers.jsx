import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Mail, Trash2, UserCheck, UserX, Calendar, Download } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { getAllSubscribers, deleteSubscriber } from '../../services/newsletterApi'

export function AdminSubscribers() {
  const { success, error: showError } = useToast()
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [subscribers, setSubscribers] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSubscribers()
  }, [])

  const fetchSubscribers = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await getAllSubscribers()
      setSubscribers(response.data || [])
    } catch (err) {
      setError(err.message || 'Subscribers could not be loaded')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this subscriber?')) return

    try {
      await deleteSubscriber(id)
      setSubscribers(prev => prev.filter(s => s._id !== id))
      success('Subscriber removed successfully')
    } catch (err) {
      showError(err.message || 'Failed to delete subscriber')
    }
  }

  const filteredSubscribers = subscribers.filter(s => {
    const cleanSearch = search.trim().toLowerCase()
    return !cleanSearch || s.email.toLowerCase().includes(cleanSearch)
  })

  const downloadCSV = () => {
    const headers = ['Email', 'Subscribed Date', 'Status']
    const rows = filteredSubscribers.map(s => [
      `"${s.email.replace(/"/g, '""')}"`,
      `"${new Date(s.subscribedAt).toLocaleString().replace(/"/g, '""')}"`,
      `"${s.status.replace(/"/g, '""')}"`
    ])

    const csvContent = headers.map(h => `"${h}"`).join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n")

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `toyovo_subscribers_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="shell space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-4xl font-grandstander font-bold text-gray-800">Newsletter Family</h1>
          <p className="text-gray-500 font-medium text-[12px] md:text-sm mt-1">Manage your newsletter subscribers and community.</p>
        </div>
        <button
          onClick={downloadCSV}
          disabled={filteredSubscribers.length === 0}
          className="h-11 px-6 bg-[#6651A4] text-white rounded-xl font-bold uppercase tracking-widest text-[10px] md:text-[11px] shadow-lg hover:bg-[#5a4694] transition-all w-full md:w-max flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      <div className="bg-white p-4 rounded-[24px] shadow-sm border border-black/[0.03] space-y-4">
        <div className="relative w-full">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by email..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full h-12 pl-12 pr-4 bg-[#FDF4E6]/50 rounded-xl outline-none border border-transparent focus:border-[#6651A4]/30 font-medium text-[13px] transition-all"
          />
        </div>
      </div>

      <motion.div layout className="bg-white rounded-[32px] shadow-sm border border-black/[0.03] overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#FAEAD3]/30 border-b border-black/[0.03]">
                <th className="py-5 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Subscriber Email</th>
                <th className="py-5 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Status</th>
                <th className="py-5 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Subscribed Date</th>
                <th className="py-5 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, index) => (
                  <tr key={index} className="border-b border-gray-50 last:border-0">
                    <td className="py-4 px-6"><div className="flex items-center gap-4"><div className="w-10 h-10 bg-gray-100 rounded-full animate-pulse" /><div className="h-4 w-48 bg-gray-100 rounded animate-pulse" /></div></td>
                    <td className="py-4 px-6"><div className="h-6 w-20 bg-gray-100 rounded-full mx-auto animate-pulse" /></td>
                    <td className="py-4 px-6"><div className="h-4 w-24 bg-gray-100 rounded ml-auto animate-pulse" /></td>
                    <td className="py-4 px-6"><div className="h-8 w-8 bg-gray-100 rounded-lg ml-auto animate-pulse" /></td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan="4" className="py-20 text-center">
                    <p className="text-[#E8312A] font-bold text-sm">{error}</p>
                  </td>
                </tr>
              ) : filteredSubscribers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-20 text-center">
                    <Mail size={48} className="mx-auto text-gray-200 mb-4" />
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[11px]">No Subscribers Found</p>
                  </td>
                </tr>
              ) : (
                filteredSubscribers.map((sub, index) => (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    key={sub._id}
                    className="border-b border-gray-50 last:border-0 hover:bg-[#FDF4E6]/50 transition-colors group"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#E84949]/10 text-[#E84949] rounded-full flex items-center justify-center font-grandstander font-bold text-lg group-hover:scale-110 transition-transform border border-[#E84949]/20">
                          {sub.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-[14px] font-bold text-gray-800">{sub.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest
                        ${sub.status === 'active' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}
                      >
                        {sub.status === 'active' ? <UserCheck size={10} /> : <UserX size={10} />}
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <p className="text-[13px] font-bold text-gray-600 flex items-center justify-end gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        {new Date(sub.subscribedAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                      </p>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleDelete(sub._id)}
                        className="p-2.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
