import { useEffect, useMemo, useState } from 'react'
import { Calendar, Plus, Search, TicketPercent, ToggleLeft, ToggleRight, X } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { createAdminCoupon, getAdminCoupons, updateAdminCouponStatus } from '../../services/couponApi'
import { getAdminCategories } from '../../services/adminCatalogApi'

const emptyForm = {
  code: '',
  title: '',
  description: '',
  type: 'percentage',
  scope: 'storewide',
  value: '',
  minOrderValue: '',
  maxDiscountAmount: '',
  applicableCategories: [],
  expiresAt: '',
}

const formatCouponValue = (coupon) => {
  if (coupon.type === 'shipping') return 'Free'
  if (coupon.type === 'percentage') return `${coupon.value}%`
  return `₹${coupon.value}`
}

export function AdminCoupons() {
  const { success, error: showError } = useToast()
  const [search, setSearch] = useState('')
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState(emptyForm)
  const [categories, setCategories] = useState([])
  const [isSaving, setIsSaving] = useState(false)

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

  const toggleStatus = async (coupon) => {
    const nextStatus = coupon.status === 'active' ? 'paused' : 'active'
    try {
      const updated = await updateAdminCouponStatus(coupon.id, nextStatus)
      setCoupons((prev) => prev.map((item) => item.id === coupon.id ? updated : item))
      success(`${updated.code} marked as ${nextStatus}.`)
    } catch (err) {
      showError(err.message || 'Coupon status update failed')
    }
  }

  const resetForm = () => {
    setFormData(emptyForm)
    setShowForm(false)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSaving(true)
    try {
      const created = await createAdminCoupon({
        code: formData.code.trim(),
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: formData.type,
        scope: formData.scope === 'shipping' ? 'shipping' : formData.scope,
        value: Number(formData.value || 0),
        minOrderValue: Number(formData.minOrderValue || 0),
        ...(formData.maxDiscountAmount !== '' && { maxDiscountAmount: Number(formData.maxDiscountAmount) }),
        ...(formData.scope === 'category' && { applicableCategories: formData.applicableCategories }),
        ...(formData.expiresAt && { expiresAt: new Date(formData.expiresAt).toISOString() }),
      })
      setCoupons((prev) => [created, ...prev])
      success(`${created.code} created successfully.`)
      resetForm()
    } catch (err) {
      showError(err.message || 'Coupon creation failed')
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
        <form onSubmit={handleSubmit} className="bg-white rounded-[32px] p-6 md:p-8 border border-black/[0.03] shadow-sm space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <input value={formData.code} onChange={(event) => setFormData({ ...formData, code: event.target.value.toUpperCase() })} placeholder="Coupon Code" className="h-12 px-4 bg-[#FDF4E6]/50 rounded-xl outline-none border border-transparent focus:border-[#6651A4]/30 font-bold text-[13px]" required />
            <input value={formData.title} onChange={(event) => setFormData({ ...formData, title: event.target.value })} placeholder="Coupon Title" className="h-12 px-4 bg-[#FDF4E6]/50 rounded-xl outline-none border border-transparent focus:border-[#6651A4]/30 font-medium text-[13px]" required />
            <select value={formData.type} onChange={(event) => setFormData({ ...formData, type: event.target.value })} className="h-12 px-4 bg-[#FDF4E6]/50 rounded-xl outline-none border border-transparent focus:border-[#6651A4]/30 font-bold text-[13px]">
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed</option>
              <option value="shipping">Shipping</option>
            </select>
            <select value={formData.scope} onChange={(event) => setFormData({ ...formData, scope: event.target.value, applicableCategories: [] })} className="h-12 px-4 bg-[#FDF4E6]/50 rounded-xl outline-none border border-transparent focus:border-[#6651A4]/30 font-bold text-[13px]">
              <option value="storewide">Storewide</option>
              <option value="category">Category</option>
              <option value="shipping">Shipping</option>
            </select>
          </div>

          <textarea value={formData.description} onChange={(event) => setFormData({ ...formData, description: event.target.value })} placeholder="Optional internal description" className="w-full min-h-[110px] p-4 bg-[#FDF4E6]/50 rounded-xl outline-none border border-transparent focus:border-[#6651A4]/30 font-medium text-[13px] resize-none" />

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
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
              placeholder={formData.type === 'percentage' ? 'Discount %' : 'Discount value'} 
              className="h-12 px-4 bg-[#FDF4E6]/50 rounded-xl outline-none border border-transparent focus:border-[#6651A4]/30 font-bold text-[13px]" 
              required 
            />
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
              placeholder="Minimum order value" 
              className="h-12 px-4 bg-[#FDF4E6]/50 rounded-xl outline-none border border-transparent focus:border-[#6651A4]/30 font-bold text-[13px]" 
            />
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
              placeholder="Max discount cap" 
              className="h-12 px-4 bg-[#FDF4E6]/50 rounded-xl outline-none border border-transparent focus:border-[#6651A4]/30 font-bold text-[13px]" 
            />
            <input type="datetime-local" value={formData.expiresAt} onChange={(event) => setFormData({ ...formData, expiresAt: event.target.value })} className="h-12 px-4 bg-[#FDF4E6]/50 rounded-xl outline-none border border-transparent focus:border-[#6651A4]/30 font-bold text-[13px]" />
          </div>

          {formData.scope === 'category' && (
            <select multiple value={formData.applicableCategories} onChange={(event) => setFormData({ ...formData, applicableCategories: Array.from(event.target.selectedOptions, (option) => option.value) })} className="w-full min-h-[140px] p-4 bg-[#FDF4E6]/50 rounded-xl outline-none border border-transparent focus:border-[#6651A4]/30 font-medium text-[13px]">
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          )}

          <div className="flex justify-end">
            <button disabled={isSaving} className="h-11 px-6 bg-[#6651A4] text-white rounded-xl font-bold uppercase tracking-widest text-[10px] md:text-[11px] shadow-lg hover:bg-[#5a4892] transition-all disabled:opacity-60">
              {isSaving ? 'Saving...' : 'Create Coupon'}
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
                <div className="w-12 h-12 rounded-2xl bg-[#FAEAD3] text-[#F1641E] flex items-center justify-center shrink-0"><TicketPercent size={22} /></div>
                <button onClick={() => toggleStatus(coupon)} className={coupon.status === 'active' ? 'text-green-500' : 'text-gray-300'}>
                  {coupon.status === 'active' ? <ToggleRight size={30} /> : <ToggleLeft size={30} />}
                </button>
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
    </div>
  )
}
