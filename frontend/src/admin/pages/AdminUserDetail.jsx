import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ChevronLeft, Mail, Shield,
  MapPin, ShoppingBag, Clock, Edit2,
  Ban, Save, X, RefreshCcw, Landmark
} from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { createAdminUser, getAdminUser, updateAdminUser, updateAdminUserStatus } from '../../services/adminUserApi'

const emptyUser = {
  id: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  role: 'customer',
  status: 'Active',
  password: '',
  joinedDate: '',
}

export function AdminUserDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { success, error: showError } = useToast()
  const isNew = id === 'new'
  const [loading, setLoading] = useState(!isNew)
  const [isEditing, setIsEditing] = useState(isNew)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState(emptyUser)
  const [loadError, setLoadError] = useState('')
  const [formErrors, setFormErrors] = useState({})
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, nextStatus: '' })

  useEffect(() => {
    if (isNew) {
      setUser(emptyUser)
      setFormErrors({})
      setLoading(false)
      return
    }

    let isMounted = true
    const loadUser = async () => {
      setLoading(true)
      setLoadError('')
      setFormErrors({})
      try {
        const data = await getAdminUser(id)
        if (!isMounted) return
        setUser({
          ...data,
          phone: data.phone ? data.phone.replace('+91', '') : '',
          password: '',
        })
      } catch (err) {
        if (isMounted) setLoadError(err.message || 'User could not be loaded')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadUser()
    return () => {
      isMounted = false
    }
  }, [id, isNew])

  const handleSave = async () => {
    const errors = {}

    // First Name validation
    if (!user.firstName || !user.firstName.trim()) {
      errors.firstName = 'First name is required'
    } else if (!/^[a-zA-Z\s]+$/.test(user.firstName.trim())) {
      errors.firstName = 'First name must contain only alphabets'
    }

    // Last Name validation
    if (!user.lastName || !user.lastName.trim()) {
      errors.lastName = 'Last name is required'
    } else if (!/^[a-zA-Z\s]+$/.test(user.lastName.trim())) {
      errors.lastName = 'Last name must contain only alphabets'
    }

    // Email validation
    if (!user.email || !user.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email.trim())) {
      errors.email = 'Please enter a valid email address'
    }

    // Password validation for new users
    if (isNew) {
      if (!user.password || !user.password.trim()) {
        errors.password = 'Password is required'
      } else if (user.password.length < 8) {
        errors.password = 'Password must be at least 8 characters long'
      }
    }

    // Phone validation
    if (!user.phone || !user.phone.trim()) {
      errors.phone = 'Phone number is required'
    } else if (!/^[6-9]\d{9}$/.test(user.phone.trim())) {
      errors.phone = 'Phone number must be exactly 10 digits and start with 6-9'
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setFormErrors({})
    setSaving(true)
    try {
      const payload = {
        firstName: user.firstName.trim(),
        lastName: user.lastName.trim(),
        email: user.email.trim(),
        phone: user.phone?.trim() ? `+91${user.phone.trim()}` : undefined,
        role: user.role,
        status: isNew ? 'Active' : user.status,
        ...(isNew && { password: user.password }),
      }

      const savedUser = isNew
        ? await createAdminUser(payload)
        : await updateAdminUser(id, payload)

      success(isNew ? 'Explorer created successfully.' : 'Explorer updated successfully.')
      setUser((prev) => ({ ...prev, ...savedUser, password: '' }))
      setIsEditing(false)

      if (isNew) {
        navigate(`/admin/users/${savedUser.id}`, { replace: true })
      }
    } catch (err) {
      const msg = err.message || 'Save failed'
      showError(msg)

      const lower = msg.toLowerCase()
      const newErrors = {}
      if (lower.includes('first name') || lower.includes('firstname')) {
        newErrors.firstName = msg
      }
      if (lower.includes('last name') || lower.includes('lastname')) {
        newErrors.lastName = msg
      }
      if (lower.includes('email')) {
        newErrors.email = msg
      }
      if (lower.includes('phone') || lower.includes('mobile')) {
        newErrors.phone = msg
      }
      if (lower.includes('password')) {
        newErrors.password = msg
      }
      if (Object.keys(newErrors).length > 0) {
        setFormErrors(newErrors)
      }
    } finally {
      setSaving(false)
    }
  }

  const executeSuspend = async () => {
    try {
      const updatedUser = await updateAdminUserStatus(user.id, confirmModal.nextStatus)
      setUser((prev) => ({ ...prev, ...updatedUser }))
      success(`${updatedUser.name} marked as ${confirmModal.nextStatus}.`)
      setConfirmModal({ isOpen: false, nextStatus: '' })
    } catch (err) {
      showError(err.message || 'Status update failed')
      setConfirmModal({ isOpen: false, nextStatus: '' })
    }
  }

  const handleSuspend = () => {
    setConfirmModal({
      isOpen: true,
      nextStatus: user.status === 'Banned' ? 'Active' : 'Banned'
    })
  }

  if (loading) {
    return (
      <div className="shell flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-[#6651A4] rounded-full animate-spin" />
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest animate-pulse">Loading Explorer Profile...</p>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="shell flex items-center justify-center h-[60vh]">
        <div className="bg-white rounded-[32px] p-10 text-center border border-black/[0.03] shadow-sm">
          <p className="text-[#E8312A] font-bold text-sm">{loadError}</p>
          <button onClick={() => navigate('/admin/users')} className="mt-5 h-10 px-6 bg-[#6651A4] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest">
            Back to Users
          </button>
        </div>
      </div>
    )
  }

  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim()
  const savedAddresses = user.addresses || []
  const recentOrders = user.recentOrders || []

  return (
    <div className="shell space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-black/[0.05] pb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-400 hover:text-[#6651A4] hover:bg-[#FAEAD3] shadow-sm transition-all">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-grandstander font-bold text-gray-800 flex items-center gap-3">
              {isNew ? 'New Explorer' : 'Explorer Profile'}
              {!isNew && (
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${user.status === 'Active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                  {user.status}
                </span>
              )}
            </h1>
            <p className="text-gray-500 font-medium text-sm font-mono mt-1">{isNew ? 'Pending Record' : user.id}</p>
          </div>
        </div>

        <div className="flex gap-3">
          {isEditing ? (
            <>
              {!isNew && (
                <button onClick={() => { setIsEditing(false); setFormErrors({}); }} className="h-10 px-4 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-sm hover:bg-gray-50 flex items-center gap-2 transition-all">
                  <X size={14} /> Cancel
                </button>
              )}
              <button onClick={handleSave} disabled={saving} className="h-10 px-6 bg-[#6651A4] text-white rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-lg hover:bg-[#5a4892] flex items-center gap-2 transition-all disabled:opacity-60">
                <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => { setIsEditing(true); setFormErrors({}); }} className="h-10 px-6 bg-white border border-[#6651A4]/20 text-[#6651A4] rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-sm hover:bg-[#FAEAD3] flex items-center gap-2 transition-all">
                <Edit2 size={14} /> Edit Identity
              </button>
              <button onClick={handleSuspend} className="h-10 px-4 bg-red-50 text-[#E8312A] rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-sm hover:bg-[#E8312A] hover:text-white transition-all flex items-center gap-2">
                <Ban size={14} /> {user.status === 'Banned' ? 'Restore' : 'Suspend'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[32px] p-8 shadow-sm border border-black/[0.03] text-center">
            <div className="w-24 h-24 bg-[#FAEAD3] rounded-full flex items-center justify-center border-4 border-white shadow-md text-4xl font-bold font-grandstander text-[#6651A4] mx-auto mb-4">
              {(fullName || 'U').charAt(0)}
            </div>
            <h2 className="text-2xl font-grandstander font-bold text-gray-800">{fullName || 'New Explorer'}</h2>
            <p className="text-gray-400 font-medium text-sm mt-1">{user.email || 'No email yet'}</p>
            <div className="mt-6 flex justify-center gap-2">
              <span className="px-3 py-1 bg-[#6651A4]/5 text-[#6651A4] rounded-full text-[9px] font-bold uppercase tracking-widest border border-[#6651A4]/10">{user.role}</span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#6651A4] rounded-[32px] p-8 text-white relative overflow-hidden shadow-xl">
            <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-white/60 text-[10px] font-bold uppercase tracking-widest mb-2">
                <Landmark size={14} /> Account Access
              </div>
              <h3 className="text-4xl font-grandstander font-bold mb-6">{user.role}</h3>
              <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
                <div>
                  <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest">Status</p>
                  <p className="text-lg font-bold font-grandstander">{user.status}</p>
                </div>
                <div>
                  <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest">Joined</p>
                  <p className="text-lg font-bold font-grandstander">{user.joinedDate || '-'}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-[32px] p-8 shadow-sm border border-black/[0.03]">
            <h3 className="text-xl font-grandstander font-bold text-gray-800 mb-6">Identity & Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <p className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2"><Mail size={14} /> Explorer Email</p>
                  {isEditing ? (
                    <div className="space-y-1">
                      <input
                        type="email"
                        autoComplete="new-password"
                        value={user.email}
                        onChange={(event) => setUser({ ...user, email: event.target.value })}
                        className={`w-full text-sm font-bold text-gray-700 bg-[#FDF4E6]/50 rounded-lg p-3 outline-none border-2 transition-all ${
                          formErrors.email ? 'border-red-500 text-red-600' : 'border-transparent focus:border-[#6651A4]/30'
                        }`}
                      />
                      {formErrors.email && <p className="text-red-500 text-xs px-1">{formErrors.email}</p>}
                    </div>
                  ) : (
                    <p className="text-[14px] font-bold text-gray-700">{user.email}</p>
                  )}
                </div>
                <div>
                  <p className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2"><Clock size={14} /> Explorer Since</p>
                  <p className="text-[14px] font-bold text-gray-700">{user.joinedDate || '-'}</p>
                </div>
                {isNew && (
                  <div>
                    <p className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Temporary Password</p>
                    <div className="space-y-1">
                      <input
                        type="password"
                        autoComplete="new-password"
                        value={user.password}
                        onChange={(event) => setUser({ ...user, password: event.target.value })}
                        className={`w-full text-sm font-bold text-gray-700 bg-[#FDF4E6]/50 rounded-lg p-3 outline-none border-2 transition-all ${
                          formErrors.password ? 'border-red-500 text-red-600' : 'border-transparent focus:border-[#6651A4]/30'
                        }`}
                      />
                      {formErrors.password && <p className="text-red-500 text-xs px-1">{formErrors.password}</p>}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">First Name</p>
                    <div className="space-y-1">
                      <input
                        disabled={!isEditing}
                        type="text"
                        value={user.firstName}
                        onChange={(event) => {
                          const clean = event.target.value.replace(/[^a-zA-Z\s]/g, '')
                          setUser({ ...user, firstName: clean })
                        }}
                        className={`w-full text-sm font-bold text-gray-700 bg-[#FDF4E6]/50 rounded-lg p-3 outline-none border-2 transition-all disabled:opacity-70 ${
                          formErrors.firstName ? 'border-red-500 text-red-600' : 'border-transparent focus:border-[#6651A4]/30'
                        }`}
                      />
                      {formErrors.firstName && <p className="text-red-500 text-xs px-1">{formErrors.firstName}</p>}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Last Name</p>
                    <div className="space-y-1">
                      <input
                        disabled={!isEditing}
                        type="text"
                        value={user.lastName}
                        onChange={(event) => {
                          const clean = event.target.value.replace(/[^a-zA-Z\s]/g, '')
                          setUser({ ...user, lastName: clean })
                        }}
                        className={`w-full text-sm font-bold text-gray-700 bg-[#FDF4E6]/50 rounded-lg p-3 outline-none border-2 transition-all disabled:opacity-70 ${
                          formErrors.lastName ? 'border-red-500 text-red-600' : 'border-transparent focus:border-[#6651A4]/30'
                        }`}
                      />
                      {formErrors.lastName && <p className="text-red-500 text-xs px-1">{formErrors.lastName}</p>}
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Phone</p>
                  <div className="space-y-1">
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500">+91</span>
                      <input
                        disabled={!isEditing}
                        type="text"
                        value={user.phone || ''}
                        onChange={(event) => {
                          const clean = event.target.value.replace(/[^0-9]/g, '').slice(0, 10)
                          setUser({ ...user, phone: clean })
                        }}
                        className={`w-full text-sm font-bold text-gray-700 bg-[#FDF4E6]/50 rounded-lg py-3 pr-3 pl-12 outline-none border-2 transition-all disabled:opacity-70 ${
                          formErrors.phone ? 'border-red-500 text-red-600' : 'border-transparent focus:border-[#6651A4]/30'
                        }`}
                      />
                    </div>
                    {formErrors.phone && <p className="text-red-500 text-xs px-1">{formErrors.phone}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Role</p>
                    <select
                      disabled={!isEditing}
                      value={user.role}
                      onChange={(event) => setUser({ ...user, role: event.target.value })}
                      className="w-full text-sm font-bold text-gray-700 bg-[#FDF4E6]/50 rounded-lg p-3 outline-none border border-transparent focus:border-[#6651A4]/30 disabled:opacity-70"
                    >
                      <option value="customer">customer</option>
                      <option value="admin">admin</option>
                    </select>
                  </div>
                  {!isNew && (
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Status</p>
                    <select
                      disabled={!isEditing}
                      value={user.status}
                      onChange={(event) => setUser({ ...user, status: event.target.value })}
                      className="w-full text-sm font-bold text-gray-700 bg-[#FDF4E6]/50 rounded-lg p-3 outline-none border border-transparent focus:border-[#6651A4]/30 disabled:opacity-70"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Banned">Banned</option>
                    </select>
                  </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-[32px] p-8 shadow-sm border border-black/[0.03]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-grandstander font-bold text-gray-800">Saved Bases</h3>
                <MapPin size={18} className="text-gray-300" />
              </div>
              <div className="p-6 rounded-2xl border border-dashed border-black/[0.05] bg-[#FDF4E6]/30 text-center">
                {savedAddresses.length === 0 ? (
                  <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">No saved addresses</p>
                ) : (
                  <div className="space-y-3 text-left">
                    {savedAddresses.slice(0, 3).map((address) => (
                      <div key={address.id} className="rounded-xl bg-white/70 p-3">
                        <p className="text-[12px] font-bold text-gray-700">{address.firstName} {address.lastName}</p>
                        <p className="text-[11px] text-gray-500">{address.address}</p>
                        <p className="text-[10px] text-gray-400">{address.city === 'Other' ? address.district : address.city}, {address.state}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-[32px] p-8 shadow-sm border border-black/[0.03]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-grandstander font-bold text-gray-800">Recent Hauls</h3>
                <ShoppingBag size={18} className="text-gray-300" />
              </div>
              <div className="p-6 rounded-2xl border border-dashed border-black/[0.05] bg-[#FDF4E6]/30 text-center">
                {recentOrders.length === 0 ? (
                  <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">No order history</p>
                ) : (
                  <div className="space-y-3 text-left">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="rounded-xl bg-white/70 p-3">
                        <p className="text-[12px] font-bold text-gray-700">{order.orderNumber}</p>
                        <p className="text-[11px] text-gray-500">Rs {Number(order.total || 0).toFixed(2)}</p>
                        <p className="text-[10px] text-gray-400 uppercase">{order.status}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setConfirmModal({ isOpen: false, nextStatus: '' })}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl border border-black/[0.05]"
          >
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Ban size={24} className="text-[#E8312A]" />
            </div>
            <h2 className="text-2xl font-grandstander font-bold text-gray-800 text-center mb-2">
              Confirm {confirmModal.nextStatus === 'Active' ? 'Restore' : 'Suspend'}
            </h2>
            <p className="text-[13px] text-gray-500 text-center font-medium mb-8">
              Are you sure you want to {confirmModal.nextStatus === 'Active' ? 'restore' : 'suspend'} access for <strong className="text-gray-800">{fullName || user.email}</strong>?
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setConfirmModal({ isOpen: false, nextStatus: '' })}
                className="flex-1 h-12 bg-gray-50 text-gray-600 rounded-xl font-bold uppercase tracking-widest text-[11px] hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeSuspend}
                className="flex-1 h-12 bg-[#E8312A] text-white rounded-xl font-bold uppercase tracking-widest text-[11px] hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30"
              >
                Yes, {confirmModal.nextStatus === 'Active' ? 'Restore' : 'Suspend'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
