import { useEffect, useMemo, useRef, useState } from 'react'
import { Calendar, Plus, Search, TicketPercent, ToggleLeft, ToggleRight, X, Edit2 } from 'lucide-react'
import { createAdminCoupon, getAdminCoupons, updateAdminCouponStatus, deleteAdminCoupon, updateAdminCoupon } from '../../services/couponApi'
import { getAdminCategories } from '../../services/adminCatalogApi'

const emptyForm = {
  code: '',
  title: '',
  description: '',
  type: 'percentage',
  scope: 'storewide',
  value: '',
  applicableCategories: [],
  startsAt: '',
  expiresAt: '',
}

const formatCouponValue = (coupon) => {
  if (coupon.type === 'shipping') return 'Free'
  if (coupon.type === 'percentage') return `${coupon.value}%`
  return `₹${coupon.value}`
}

export function AdminCoupons() {
  const [search, setSearch] = useState('')
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState(emptyForm)
  const [categories, setCategories] = useState([])
  const [isSaving, setIsSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, title: '', error: '' })
  const formRef = useRef(null)

  // Custom Inline State
  const [formErrors, setFormErrors] = useState({})
  const [createSuccessMsg, setCreateSuccessMsg] = useState('')
  const [updateSuccessId, setUpdateSuccessId] = useState('') // key: coupon.id
  const [updateErrorId, setUpdateErrorId] = useState('')     // key: coupon.id
  const [editingCouponId, setEditingCouponId] = useState(null)

  const loadCoupons = async () => {
    setLoading(true)
    setError('')
    try {
      const [{ coupons: couponData }, categoryData] = await Promise.all([
        getAdminCoupons({ search }),
        getAdminCategories(),
      ])
      setCoupons(couponData)
      setCategories(categoryData.filter((category) => category.isActive && !category.parentCategory))
    } catch (err) {
      setError(err.message || 'Coupons could not be loaded')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCoupons()
    }, 250)

    return () => clearTimeout(timer)
  }, [search])

  const filtered = useMemo(() => coupons, [coupons])

  const toggleStatus = async (coupon, nextStatus) => {
    setUpdateSuccessId('')
    setUpdateErrorId('')
    try {
      const updated = await updateAdminCouponStatus(coupon.id, nextStatus)
      setCoupons((prev) => prev.map((item) => item.id === coupon.id ? updated : item))
      setUpdateSuccessId(coupon.id)
      setTimeout(() => setUpdateSuccessId(''), 3000)
    } catch (err) {
      setUpdateErrorId(coupon.id)
      setTimeout(() => setUpdateErrorId(''), 3000)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.id) return
    try {
      await deleteAdminCoupon(deleteConfirm.id)
      setCoupons((prev) => prev.filter((c) => c.id !== deleteConfirm.id))
      setDeleteConfirm({ show: false, id: null, title: '', error: '' })
    } catch (err) {
      setDeleteConfirm((prev) => ({ ...prev, error: err.message || 'Failed to delete coupon' }))
    }
  }

  const resetForm = () => {
    setFormData(emptyForm)
    setEditingCouponId(null)
    setShowForm(false)
  }

  const startEdit = (coupon) => {
    const formatLocalDatetime = (isoString) => {
      if (!isoString) return '';
      const date = new Date(isoString);
      const pad = (n) => n.toString().padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };

    setFormData({
      code: coupon.code || '',
      title: coupon.title || '',
      description: coupon.description || '',
      type: coupon.type || 'percentage',
      scope: coupon.scope === 'shipping' ? 'shipping' : (coupon.scope || 'storewide'),
      value: coupon.value !== undefined ? String(coupon.value) : '',
      minOrderValue: coupon.minOrderValue !== undefined ? String(coupon.minOrderValue) : '',
      maxDiscountAmount: coupon.maxDiscountAmount !== undefined ? String(coupon.maxDiscountAmount) : '',
      applicableCategories: coupon.applicableCategories ? coupon.applicableCategories.map(c => c.id || c) : [],
      startsAt: formatLocalDatetime(coupon.startsAt),
      expiresAt: formatLocalDatetime(coupon.expiresAt),
    })
    setEditingCouponId(coupon.id)
    setShowForm(true)
    // Scroll the form into view after React renders it
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormErrors({})
    setCreateSuccessMsg('')

    const errors = {}
    if (!formData.code.trim()) {
      errors.code = 'Code is required.'
    }
    if (!formData.title.trim()) {
      errors.title = 'Title is required.'
    }
    
    const val = Number(formData.value || 0)
    const minOrderVal = Number(formData.minOrderValue || 0)
    
    if (isNaN(val) || val < 0) {
      errors.value = 'Value cannot be negative.'
    }
    if (isNaN(minOrderVal) || minOrderVal < 0) {
      errors.minOrderValue = 'Min Order Value cannot be negative.'
    }

    if (formData.maxDiscountAmount !== '' && (isNaN(Number(formData.maxDiscountAmount)) || Number(formData.maxDiscountAmount) < 0)) {
      errors.maxDiscountAmount = 'Max Discount cannot be negative.'
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setIsSaving(true)
    try {
      const startsAt = formData.startsAt ? new Date(formData.startsAt).toISOString() : null
      const expiresAt = formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null
      const couponPayload = {
        code: formData.code.trim(),
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: formData.type,
        scope: formData.scope === 'shipping' ? 'shipping' : formData.scope,
        value: val,
        minOrderValue: minOrderVal,
        maxDiscountAmount: formData.maxDiscountAmount !== '' ? Number(formData.maxDiscountAmount) : null,
        applicableCategories: formData.scope === 'category' ? formData.applicableCategories : [],
        startsAt,
        expiresAt,
      }

      if (editingCouponId) {
        const updated = await updateAdminCoupon(editingCouponId, couponPayload)
        setCoupons((prev) => prev.map((item) => item.id === editingCouponId ? updated : item))
        setCreateSuccessMsg('Coupon updated successfully!')
        setTimeout(() => setCreateSuccessMsg(''), 4000)
        resetForm()
      } else {
        const created = await createAdminCoupon(couponPayload)
        setCoupons((prev) => [created, ...prev])
        setCreateSuccessMsg('Coupon created successfully!')
        setTimeout(() => setCreateSuccessMsg(''), 4000)
        resetForm()
      }
    } catch (err) {
      setFormErrors({ general: err.message || 'Coupon saving failed' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="shell space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-4xl font-grandstander font-bold text-gray-800">Coupons</h1>
          <p className="text-gray-500 font-medium text-[12px] md:text-sm mt-1">Create controlled discounts for checkout, categories, and shipping.</p>
        </div>
        <button onClick={() => setShowForm((prev) => !prev)} className="h-11 px-6 bg-[#6651A4] text-white rounded-xl font-bold uppercase tracking-widest text-[10px] md:text-[11px] shadow-lg hover:bg-[#5a4892] transition-all w-full md:w-max flex items-center justify-center gap-2">
          {showForm ? <X size={16} /> : <Plus size={16} />} {showForm ? 'Close' : 'New Coupon'}
        </button>
      </div>

      {showForm && (
        <form ref={formRef} onSubmit={handleSubmit} className="bg-white rounded-[32px] p-6 md:p-8 border border-black/[0.03] shadow-sm space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Coupon Code</label>
              <input value={formData.code} onChange={(event) => setFormData({ ...formData, code: event.target.value.toUpperCase() })} placeholder="e.g. SUMMER20" className="h-12 px-4 bg-[#FDF4E6]/50 rounded-xl outline-none border border-transparent focus:border-[#6651A4]/30 font-bold text-[13px]" required />
              {formErrors.code && <span className="text-red-500 text-[10px] font-bold px-1">{formErrors.code}</span>}
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Campaign Title</label>
              <input value={formData.title} onChange={(event) => setFormData({ ...formData, title: event.target.value })} placeholder="e.g. Summer Special Sale" className="h-12 px-4 bg-[#FDF4E6]/50 rounded-xl outline-none border border-transparent focus:border-[#6651A4]/30 font-medium text-[13px]" required />
              {formErrors.title && <span className="text-red-500 text-[10px] font-bold px-1">{formErrors.title}</span>}
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Discount Type</label>
              <select value={formData.type} onChange={(event) => setFormData({ ...formData, type: event.target.value })} className="h-12 px-4 bg-[#FDF4E6]/50 rounded-xl outline-none border border-transparent focus:border-[#6651A4]/30 font-bold text-[13px]">
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
                <option value="shipping">Free Shipping</option>
              </select>
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Applicable Scope</label>
              <select value={formData.scope} onChange={(event) => setFormData({ ...formData, scope: event.target.value, applicableCategories: [] })} className="h-12 px-4 bg-[#FDF4E6]/50 rounded-xl outline-none border border-transparent focus:border-[#6651A4]/30 font-bold text-[13px]">
                <option value="storewide">Entire Store</option>
                <option value="category">Specific Categories</option>
                <option value="shipping">Shipping Only</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Internal Description / Notes</label>
            <textarea value={formData.description} onChange={(event) => setFormData({ ...formData, description: event.target.value })} placeholder="Write any internal notes or details about this coupon..." className="w-full min-h-[110px] p-4 bg-[#FDF4E6]/50 rounded-xl outline-none border border-transparent focus:border-[#6651A4]/30 font-medium text-[13px] resize-none" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Discount Amount</label>
              <input 
                type="number" 
                min="0" 
                step="0.01" 
                value={formData.value} 
                onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault() }}
                onChange={(event) => {
                  const val = event.target.value
                  if (val === '' || Number(val) >= 0) {
                    setFormData({ ...formData, value: val })
                  }
                }} 
                placeholder={formData.type === 'percentage' ? 'e.g. 10 (%)' : 'e.g. 100 (₹)'} 
                className="h-12 px-4 bg-[#FDF4E6]/50 rounded-xl outline-none border border-transparent focus:border-[#6651A4]/30 font-bold text-[13px]" 
                required 
              />
              {formErrors.value && <span className="text-red-500 text-[10px] font-bold px-1">{formErrors.value}</span>}
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Min Order Value (Optional)</label>
              <input 
                type="number" 
                min="0" 
                step="0.01" 
                value={formData.minOrderValue} 
                onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault() }}
                onChange={(event) => {
                  const val = event.target.value
                  if (val === '' || Number(val) >= 0) {
                    setFormData({ ...formData, minOrderValue: val })
                  }
                }} 
                placeholder="e.g. 500" 
                className="h-12 px-4 bg-[#FDF4E6]/50 rounded-xl outline-none border border-transparent focus:border-[#6651A4]/30 font-bold text-[13px]" 
              />
              {formErrors.minOrderValue && <span className="text-red-500 text-[10px] font-bold px-1">{formErrors.minOrderValue}</span>}
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Max Cap (Optional)</label>
              <input 
                type="number" 
                min="0" 
                step="0.01" 
                value={formData.maxDiscountAmount} 
                onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault() }}
                onChange={(event) => {
                  const val = event.target.value
                  if (val === '' || Number(val) >= 0) {
                    setFormData({ ...formData, maxDiscountAmount: val })
                  }
                }} 
                placeholder="e.g. 1000" 
                className="h-12 px-4 bg-[#FDF4E6]/50 rounded-xl outline-none border border-transparent focus:border-[#6651A4]/30 font-bold text-[13px]" 
              />
              {formErrors.maxDiscountAmount && <span className="text-red-500 text-[10px] font-bold px-1">{formErrors.maxDiscountAmount}</span>}
            </div>
            <div className="flex flex-col space-y-1 col-span-1 md:col-span-2 xl:col-span-1">
               <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Start Date & Time (Optional)</label>
               <input 
                 type="datetime-local" 
                 value={formData.startsAt} 
                 onChange={(event) => setFormData({ ...formData, startsAt: event.target.value })} 
                 className="w-full h-12 px-4 bg-[#FDF4E6]/50 rounded-xl outline-none border border-transparent focus:border-[#6651A4]/30 font-bold text-[11px]" 
                 title="Start Date & Time"
               />
            </div>
            <div className="flex flex-col space-y-1 col-span-1 md:col-span-2 xl:col-span-1">
               <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Expiry Date & Time (Optional)</label>
               <input 
                 type="datetime-local" 
                 value={formData.expiresAt} 
                 onChange={(event) => setFormData({ ...formData, expiresAt: event.target.value })} 
                 className="w-full h-12 px-4 bg-[#FDF4E6]/50 rounded-xl outline-none border border-transparent focus:border-[#6651A4]/30 font-bold text-[11px]" 
                 title="Expiry Date & Time"
               />
            </div>
          </div>

           {formData.scope === 'category' && (
             <div className="flex flex-col space-y-1">
               <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Select Applicable Categories (Hold Ctrl/Cmd to select multiple)</label>
               <select multiple value={formData.applicableCategories} onChange={(event) => setFormData({ ...formData, applicableCategories: Array.from(event.target.selectedOptions, (option) => option.value) })} className="w-full min-h-[140px] p-4 bg-[#FDF4E6]/50 rounded-xl outline-none border border-transparent focus:border-[#6651A4]/30 font-medium text-[13px]">
                 {categories.map((category) => (
                   <option key={category.id} value={category.id}>{category.name}</option>
                 ))}
               </select>
             </div>
           )}

           <div className="flex items-center justify-end gap-3">
             {createSuccessMsg && <span className="text-green-600 text-[11px] font-bold">{createSuccessMsg}</span>}
             {formErrors.general && <span className="text-red-500 text-[11px] font-bold">{formErrors.general}</span>}
             <button disabled={isSaving} className="h-11 px-6 bg-[#6651A4] text-white rounded-xl font-bold uppercase tracking-widest text-[10px] md:text-[11px] shadow-lg hover:bg-[#5a4892] transition-all disabled:opacity-60">
               {isSaving ? 'Saving...' : editingCouponId ? 'Save Changes' : 'Create Coupon'}
             </button>
           </div>
        </form>
      )}

      <div className="bg-white p-4 rounded-[24px] shadow-sm border border-black/[0.03]">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search coupon code..." className="w-full h-12 pl-12 pr-4 bg-[#FDF4E6]/50 rounded-xl outline-none border border-transparent focus:border-[#F1641E]/30 font-medium text-[13px] transition-all" />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-white rounded-[32px] p-6 border border-black/[0.03] shadow-sm animate-pulse">
              <div className="h-40 bg-[#FDF4E6]/70 rounded-2xl" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-white rounded-[32px] p-10 border border-black/[0.03] shadow-sm text-center">
          <p className="text-[#E8312A] font-bold text-sm">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {filtered.map((coupon) => (
            <div key={coupon.id} className="bg-white rounded-[32px] p-6 border border-black/[0.03] shadow-sm hover:shadow-xl transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-[#FAEAD3] text-[#F1641E] flex items-center justify-center shrink-0"><TicketPercent size={22} /></div>
                  <div className="flex flex-col">
                    {updateSuccessId === coupon.id && <span className="text-green-600 text-[10px] font-bold">Saved!</span>}
                    {updateErrorId === coupon.id && <span className="text-red-500 text-[10px] font-bold">Failed</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => startEdit(coupon)}
                    className="h-9 w-9 rounded-lg bg-gray-50 border border-gray-200 hover:border-[#6651A4] hover:text-[#6651A4] text-gray-500 flex items-center justify-center transition-all"
                    title="Edit Coupon"
                  >
                    <Edit2 size={13} />
                  </button>
                  <select 
                    value={coupon.status}
                    onChange={async (e) => {
                      const val = e.target.value;
                      if (val === 'delete') {
                        setDeleteConfirm({ show: true, id: coupon.id, title: coupon.code });
                      } else {
                        try {
                          const updated = await updateAdminCouponStatus(coupon.id, val);
                          setCoupons((prev) => prev.map((item) => item.id === coupon.id ? updated : item));
                          setUpdateSuccessId(coupon.id);
                          setTimeout(() => setUpdateSuccessId(''), 3000);
                        } catch (err) {
                          setUpdateErrorId(coupon.id);
                          setTimeout(() => setUpdateErrorId(''), 3000);
                        }
                      }
                    }}
                    className={`h-9 px-3 text-[11px] font-black rounded-lg border outline-none cursor-pointer transition-all ${
                      coupon.status === 'active' 
                        ? 'bg-green-50 border-green-200 text-green-700 focus:border-green-400' 
                        : 'bg-gray-50 border-gray-200 text-gray-700 focus:border-gray-400'
                    }`}
                  >
                    <option value="active" className="text-green-700 font-bold bg-white">Active</option>
                    <option value="paused" className="text-gray-700 font-bold bg-white">Inactive</option>
                    <option value="delete" className="text-red-600 font-bold bg-white">🗑 Delete</option>
                  </select>
                </div>
              </div>
              <div className="mt-6">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{coupon.type} Discount</p>
                <h3 className="text-2xl font-grandstander font-bold text-gray-800 mt-1">{coupon.code}</h3>
                <p className="text-[12px] text-gray-500 font-medium mt-1">{coupon.title}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-6">
                <div className="bg-[#FDF4E6]/70 rounded-2xl p-3">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Value</p>
                  <p className="text-lg font-grandstander font-bold text-[#E8312A]">{formatCouponValue(coupon)}</p>
                </div>
                <div className="bg-[#FDF4E6]/70 rounded-2xl p-3">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Minimum</p>
                  <p className="text-lg font-grandstander font-bold text-gray-700">₹{coupon.minOrderValue || 0}</p>
                </div>
              </div>
              <div className="mt-5 pt-5 border-t border-gray-100 flex items-center justify-between text-[11px] font-bold text-gray-400">
                <span>{coupon.usedCount || 0} used</span>
                <span className="flex items-center gap-1"><Calendar size={12} /> {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : 'No expiry'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-[#333]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full border border-black/[0.03] shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-grandstander font-bold text-gray-800">Are you sure?</h3>
              <p className="text-gray-500 text-sm font-medium">Do you really want to delete coupon ({deleteConfirm.title})? This action cannot be undone.</p>
              {deleteConfirm.error && <p className="text-red-500 text-xs font-bold">{deleteConfirm.error}</p>}
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteConfirm({ show: false, id: null, title: '' })} 
                className="flex-1 h-12 bg-gray-100 text-gray-700 rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmDelete} 
                className="flex-1 h-12 bg-red-500 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
