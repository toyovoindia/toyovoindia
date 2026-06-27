import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, MoreVertical, Shield, UserX, Mail, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { getAdminUsers, updateAdminUserStatus } from '../../services/adminUserApi'

export function AdminUsers() {
  const navigate = useNavigate()
  const { success, error: showError } = useToast()
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('recent')
  const [currentPage, setCurrentPage] = useState(1)
  const [menuOpenUserId, setMenuOpenUserId] = useState(null)
  const [users, setUsers] = useState([])
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 })
  const [error, setError] = useState('')
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, user: null, nextStatus: '' })
  const itemsPerPage = 10

  useEffect(() => {
    const handleClick = () => setMenuOpenUserId(null)
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [])

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError('')

    const timer = setTimeout(async () => {
      try {
        const payload = await getAdminUsers({
          search: search.trim(),
          status: statusFilter,
          sort: sortBy,
          page: currentPage,
          limit: itemsPerPage,
        })

        if (!isMounted) return
        setUsers(payload.users)
        setMeta(payload.meta)
      } catch (err) {
        if (!isMounted) return
        setUsers([])
        setMeta({ total: 0, totalPages: 1 })
        setError(err.message || 'Users could not be loaded')
      } finally {
        if (isMounted) setLoading(false)
      }
    }, 250)

    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [search, statusFilter, sortBy, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter, sortBy])

  const handleStatusChange = async (user, status) => {
    try {
      const updated = await updateAdminUserStatus(user.id, status)
      setUsers((prev) => prev.map((item) => (item.id === user.id ? updated : item)))
      success(`${updated.name} marked as ${status}.`)
    } catch (err) {
      showError(err.message || 'Status update failed')
    }
  }

  return (
    <div className="shell space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-4xl font-grandstander font-bold text-gray-800">Explorer Directory</h1>
          <p className="text-gray-500 font-medium text-[12px] md:text-sm mt-1">Manage user identities and access levels.</p>
        </div>
        <button
          onClick={() => navigate('/admin/users/new')}
          className="h-11 px-6 bg-[#E8312A] text-white rounded-xl font-bold uppercase tracking-widest text-[10px] md:text-[11px] shadow-lg hover:bg-red-700 transition-all w-full md:w-max"
        >
          + Add Explorer
        </button>
      </div>

      <div className="bg-white p-4 rounded-[24px] shadow-sm border border-black/[0.03] space-y-4">
        <div className="relative w-full">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full h-12 pl-12 pr-4 bg-[#FDF4E6]/50 rounded-xl outline-none border border-transparent focus:border-[#6651A4]/30 font-medium text-[13px] transition-all"
          />
        </div>

        <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-1">
          <div className="relative shrink-0 min-w-[120px]">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full h-11 pl-9 pr-6 bg-[#FDF4E6]/50 rounded-xl outline-none border border-transparent focus:border-[#6651A4]/30 text-[10px] font-bold text-gray-600 uppercase tracking-widest appearance-none cursor-pointer transition-all"
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Banned">Banned</option>
            </select>
          </div>

          <div className="relative shrink-0 min-w-[140px]">
            <ArrowUpDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="w-full h-11 pl-9 pr-6 bg-[#FDF4E6]/50 rounded-xl outline-none border border-transparent focus:border-[#6651A4]/30 text-[10px] font-bold text-gray-600 uppercase tracking-widest appearance-none cursor-pointer transition-all"
            >
              <option value="recent">Recently Joined</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name (A-Z)</option>
              <option value="email">Email (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      <motion.div layout className="bg-white rounded-[32px] shadow-sm border border-black/[0.03] overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#FAEAD3]/30 border-b border-black/[0.03]">
                <th className="py-5 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Explorer</th>
                <th className="py-5 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Role</th>
                <th className="py-5 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Status</th>
                <th className="py-5 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Joined</th>
                <th className="py-5 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, index) => (
                  <tr key={index} className="border-b border-gray-50 last:border-0">
                    <td className="py-4 px-6"><div className="flex items-center gap-4"><div className="w-10 h-10 bg-gray-100 rounded-full animate-pulse" /><div className="space-y-2"><div className="h-4 w-32 bg-gray-100 rounded animate-pulse" /><div className="h-3 w-24 bg-gray-100 rounded animate-pulse" /></div></div></td>
                    <td className="py-4 px-6"><div className="h-6 w-20 bg-gray-100 rounded-full mx-auto animate-pulse" /></td>
                    <td className="py-4 px-6"><div className="h-6 w-20 bg-gray-100 rounded-full mx-auto animate-pulse" /></td>
                    <td className="py-4 px-6"><div className="h-4 w-20 bg-gray-100 rounded ml-auto animate-pulse" /></td>
                    <td className="py-4 px-6"><div className="h-8 w-8 bg-gray-100 rounded-lg ml-auto animate-pulse" /></td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan="5" className="py-20 text-center">
                    <p className="text-[#E8312A] font-bold text-sm">{error}</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-20 text-center">
                    <UserX size={48} className="mx-auto text-gray-200 mb-4" />
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[11px]">No Explorers Found</p>
                  </td>
                </tr>
              ) : (
                users.map((user, index) => (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    key={user.id}
                    className="border-b border-gray-50 last:border-0 hover:bg-[#FDF4E6]/50 transition-colors group relative"
                  >
                    <td className="py-4 px-6" onClick={() => navigate(`/admin/users/${user.id}`)}>
                      <div className="flex items-center gap-4 cursor-pointer">
                        <div className="w-10 h-10 bg-[#6651A4]/10 text-[#6651A4] rounded-full flex items-center justify-center font-grandstander font-bold text-lg group-hover:scale-110 transition-transform border border-[#6651A4]/20">
                          {user.name.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="text-[14px] font-bold text-gray-800">{user.name || 'Unnamed User'}</p>
                          <p className="text-[11px] text-gray-400 font-medium flex items-center gap-1"><Mail size={10} /> {user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest bg-[#6651A4]/5 text-[#6651A4] border border-[#6651A4]/10">
                        {user.role}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest
                        ${user.status === 'Active' ? 'bg-green-50 text-green-600 border border-green-100' :
                        user.status === 'Inactive' ? 'bg-gray-50 text-gray-500 border border-gray-200' : 'bg-red-50 text-red-600 border border-red-100'}`}
                      >
                        {user.status === 'Active' && <Shield size={10} />}
                        {user.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <p className="text-[13px] font-bold text-gray-600">{user.joinedDate || '-'}</p>
                    </td>
                    <td className="py-4 px-6 text-right relative">
                      <button
                        onClick={(event) => {
                          event.stopPropagation()
                          setMenuOpenUserId(menuOpenUserId === user.id ? null : user.id)
                        }}
                        className={`p-2 rounded-lg transition-all ml-auto block ${menuOpenUserId === user.id ? 'bg-[#6651A4] text-white shadow-md' : 'text-gray-400 hover:text-[#6651A4] hover:bg-[#FAEAD3]'}`}
                      >
                        <MoreVertical size={16} />
                      </button>

                      <AnimatePresence>
                        {menuOpenUserId === user.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            className="absolute right-6 top-[60%] z-[200] w-48 bg-white rounded-2xl shadow-xl border border-black/[0.05] py-2 overflow-hidden"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <button
                              onClick={() => navigate(`/admin/users/${user.id}`)}
                              className="w-full px-5 py-3 text-left text-[12px] font-bold text-gray-600 hover:bg-[#FDF4E6]/50 hover:text-[#6651A4] flex items-center gap-3 transition-colors"
                            >
                              <Shield size={14} className="text-[#6651A4]" /> View Profile
                            </button>
                            <button
                              onClick={() => {
                                setConfirmModal({
                                  isOpen: true,
                                  user,
                                  nextStatus: user.status === 'Banned' ? 'Active' : 'Banned'
                                });
                                setMenuOpenUserId(null);
                              }}
                              className="w-full px-5 py-3 text-left text-[12px] font-bold text-red-500 hover:bg-red-50 flex items-center gap-3 transition-colors"
                            >
                              <UserX size={14} /> {user.status === 'Banned' ? 'Restore User' : 'Suspend User'}
                            </button>
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

        {!loading && !error && users.length > 0 && (
          <div className="p-4 border-t border-black/[0.03] flex items-center justify-between bg-[#FAEAD3]/10">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, meta.total)} of {meta.total}
            </p>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-[#6651A4] hover:text-white hover:border-[#6651A4] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-500 disabled:hover:border-gray-200 transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={currentPage === (meta.totalPages || 1)}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-[#6651A4] hover:text-white hover:border-[#6651A4] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-500 disabled:hover:border-gray-200 transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmModal({ isOpen: false, user: null, nextStatus: '' })}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl border border-black/[0.05]"
            >
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <UserX size={24} className="text-[#E8312A]" />
              </div>
              <h2 className="text-2xl font-grandstander font-bold text-gray-800 text-center mb-2">
                Confirm {confirmModal.nextStatus === 'Active' ? 'Restore' : 'Suspend'}
              </h2>
              <p className="text-[13px] text-gray-500 text-center font-medium mb-8">
                Are you sure you want to {confirmModal.nextStatus === 'Active' ? 'restore' : 'suspend'} access for <strong className="text-gray-800">{confirmModal.user?.name || confirmModal.user?.email}</strong>?
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setConfirmModal({ isOpen: false, user: null, nextStatus: '' })}
                  className="flex-1 h-12 bg-gray-50 text-gray-600 rounded-xl font-bold uppercase tracking-widest text-[11px] hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleStatusChange(confirmModal.user, confirmModal.nextStatus)
                    setConfirmModal({ isOpen: false, user: null, nextStatus: '' })
                  }}
                  className="flex-1 h-12 bg-[#E8312A] text-white rounded-xl font-bold uppercase tracking-widest text-[11px] hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30"
                >
                  Yes, {confirmModal.nextStatus === 'Active' ? 'Restore' : 'Suspend'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
