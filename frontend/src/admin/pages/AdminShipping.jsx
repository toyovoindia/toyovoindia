import { useEffect, useState } from 'react'
import { Plus, Route, Truck, Save } from 'lucide-react'

import { createAdminShippingMethod, getAdminShippingMethods, updateAdminShippingMethod, deleteAdminShippingMethod } from '../../services/shippingApi'

const defaultForm = {
  name: '',
  code: '',
  minDays: 0,
  maxDays: 0,
  charge: 0,
  rule: '',
  status: 'active',
  sortOrder: 0,
}

export function AdminShipping() {
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState('')
  const [methods, setMethods] = useState([])
  const [newMethod, setNewMethod] = useState(defaultForm)
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, title: '', error: '' })

  // Custom Inline State
  const [createErrors, setCreateErrors] = useState({})
  const [editErrors, setEditErrors] = useState({}) // { [methodId]: { minDays: '', maxDays: '', ... } }
  const [createSuccessMsg, setCreateSuccessMsg] = useState('')
  const [saveSuccessId, setSaveSuccessId] = useState('')
  const [generalError, setGeneralError] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadMethods = async () => {
      try {
        const data = await getAdminShippingMethods()
        if (!isMounted) return
        setMethods(data)
      } catch (error) {
        if (isMounted) setGeneralError(error.message || 'Shipping methods could not be loaded')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadMethods()
    return () => {
      isMounted = false
    }
  }, [])

  const handleCreate = async () => {
    setCreateErrors({})
    setCreateSuccessMsg('')
    setGeneralError('')

    const errors = {}
    if (!newMethod.name.trim()) {
      errors.name = 'Method name is required.'
    }
    if (!newMethod.code.trim()) {
      errors.code = 'Code is required.'
    }

    const minD = Number(newMethod.minDays);
    const maxD = Number(newMethod.maxDays);
    const order = Number(newMethod.sortOrder);
    const chg = Number(newMethod.charge);

    if (isNaN(minD) || minD < 0) {
      errors.minDays = 'Must be >= 0.'
    }
    if (isNaN(maxD) || maxD < 0) {
      errors.maxDays = 'Must be >= 0.'
    }
    if (isNaN(chg) || chg < 0) {
      errors.charge = 'Must be >= 0.'
    }
    if (isNaN(order) || order < 0) {
      errors.sortOrder = 'Must be >= 0.'
    }

    if (!errors.minDays && !errors.maxDays && minD > maxD) {
      errors.minDays = 'Min days must be <= Max days.'
      errors.maxDays = 'Max days must be >= Min days.'
    }

    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors)
      return
    }

    try {
      const created = await createAdminShippingMethod({
        ...newMethod,
        code: newMethod.code.trim().toLowerCase(),
        sortOrder: order,
        minDays: minD,
        maxDays: maxD,
        charge: chg,
      })
      setMethods((prev) => [...prev, created].sort((a, b) => a.sortOrder - b.sortOrder))
      setNewMethod(defaultForm)
      setCreateSuccessMsg('Shipping method created successfully!')
      setTimeout(() => setCreateSuccessMsg(''), 4000)
    } catch (error) {
      setGeneralError(error.message || 'Shipping method could not be created')
    }
  }

  const handleUpdate = async (method) => {
    setEditErrors((prev) => ({ ...prev, [method.id]: {} }))
    setSaveSuccessId('')

    const errors = {}
    if (!method.name.trim()) {
      errors.name = 'Method name is required.'
    }

    const minD = Number(method.minDays);
    const maxD = Number(method.maxDays);
    const order = Number(method.sortOrder);
    const chg = Number(method.charge);

    if (isNaN(minD) || minD < 0) {
      errors.minDays = 'Must be >= 0.'
    }
    if (isNaN(maxD) || maxD < 0) {
      errors.maxDays = 'Must be >= 0.'
    }
    if (isNaN(chg) || chg < 0) {
      errors.charge = 'Must be >= 0.'
    }
    if (isNaN(order) || order < 0) {
      errors.sortOrder = 'Must be >= 0.'
    }

    if (!errors.minDays && !errors.maxDays && minD > maxD) {
      errors.minDays = 'Min days must be <= Max days.'
      errors.maxDays = 'Max days must be >= Min days.'
    }

    if (Object.keys(errors).length > 0) {
      setEditErrors((prev) => ({ ...prev, [method.id]: errors }))
      return
    }

    setSavingId(method.id)
    try {
      const updated = await updateAdminShippingMethod(method.id, {
        name: method.name,
        code: method.code,
        minDays: minD,
        maxDays: maxD,
        charge: chg,
        rule: method.rule,
        status: method.status,
        sortOrder: order,
      })
      setMethods((prev) => prev.map((item) => (item.id === method.id ? updated : item)).sort((a, b) => a.sortOrder - b.sortOrder))
      setSaveSuccessId(method.id)
      setTimeout(() => setSaveSuccessId(''), 3000)
    } catch (error) {
      setEditErrors((prev) => ({ ...prev, [method.id]: { general: error.message || 'Update failed' } }))
    } finally {
      setSavingId('')
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.id) return
    try {
      await deleteAdminShippingMethod(deleteConfirm.id)
      setMethods((prev) => prev.filter((item) => item.id !== deleteConfirm.id))
      setDeleteConfirm({ show: false, id: null, title: '', error: '' })
    } catch (error) {
      setDeleteConfirm((prev) => ({ ...prev, error: error.message || 'Shipping method could not be deleted' }))
    }
  }

  return (
    <div className="shell space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-4xl font-grandstander font-bold text-gray-800">Shipping</h1>
          <p className="text-gray-500 font-medium text-[12px] md:text-sm mt-1">Manage delivery methods and checkout shipping logic.</p>
        </div>
      </div>

      <div className="bg-white rounded-[32px] p-6 border border-black/[0.03] shadow-sm space-y-4">
        <h2 className="text-lg font-grandstander font-bold text-gray-800 flex items-center gap-2"><Plus size={18} /> New Shipping</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Method Name</label>
            <input value={newMethod.name} onChange={(e) => setNewMethod((prev) => ({ ...prev, name: e.target.value }))} placeholder="e.g. Standard Shipping" className="h-11 px-4 rounded-xl bg-[#FDF4E6]/60 outline-none font-medium text-sm" />
            {createErrors.name && <span className="text-red-500 text-[10px] font-bold px-1">{createErrors.name}</span>}
          </div>
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Code</label>
            <input value={newMethod.code} onChange={(e) => setNewMethod((prev) => ({ ...prev, code: e.target.value }))} placeholder="e.g. standard" className="h-11 px-4 rounded-xl bg-[#FDF4E6]/60 outline-none font-medium text-sm" />
            {createErrors.code && <span className="text-red-500 text-[10px] font-bold px-1">{createErrors.code}</span>}
          </div>
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Min Days</label>
            <input 
              type="number" 
              value={newMethod.minDays} 
              onFocus={() => { if (newMethod.minDays === 0 || newMethod.minDays === '0') setNewMethod(prev => ({ ...prev, minDays: '' })) }}
              onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault() }}
              onChange={(e) => {
                const val = e.target.value
                if (val === '' || Number(val) >= 0) {
                  setNewMethod((prev) => ({ ...prev, minDays: val }))
                }
              }} 
              placeholder="e.g. 3" 
              className="h-11 px-4 rounded-xl bg-[#FDF4E6]/60 outline-none font-medium text-sm" 
            />
            {createErrors.minDays && <span className="text-red-500 text-[10px] font-bold px-1">{createErrors.minDays}</span>}
          </div>
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Max Days</label>
            <input 
              type="number" 
              value={newMethod.maxDays} 
              onFocus={() => { if (newMethod.maxDays === 0 || newMethod.maxDays === '0') setNewMethod(prev => ({ ...prev, maxDays: '' })) }}
              onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault() }}
              onChange={(e) => {
                const val = e.target.value
                if (val === '' || Number(val) >= 0) {
                  setNewMethod((prev) => ({ ...prev, maxDays: val }))
                }
              }} 
              placeholder="e.g. 5" 
              className="h-11 px-4 rounded-xl bg-[#FDF4E6]/60 outline-none font-medium text-sm" 
            />
            {createErrors.maxDays && <span className="text-red-500 text-[10px] font-bold px-1">{createErrors.maxDays}</span>}
          </div>
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Charge (₹)</label>
            <input 
              type="number" 
              value={newMethod.charge} 
              onFocus={() => { if (newMethod.charge === 0 || newMethod.charge === '0') setNewMethod(prev => ({ ...prev, charge: '' })) }}
              onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault() }}
              onChange={(e) => {
                const val = e.target.value
                if (val === '' || Number(val) >= 0) {
                  setNewMethod((prev) => ({ ...prev, charge: val }))
                }
              }} 
              placeholder="e.g. 15" 
              className="h-11 px-4 rounded-xl bg-[#FDF4E6]/60 outline-none font-medium text-sm" 
            />
            {createErrors.charge && <span className="text-red-500 text-[10px] font-bold px-1">{createErrors.charge}</span>}
          </div>
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Description / Rule</label>
            <input value={newMethod.rule} onChange={(e) => setNewMethod((prev) => ({ ...prev, rule: e.target.value }))} placeholder="e.g. Default India-wide shipping" className="h-11 px-4 rounded-xl bg-[#FDF4E6]/60 outline-none font-medium text-sm" />
          </div>
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Sort Order</label>
            <input 
              type="number" 
              value={newMethod.sortOrder} 
              onFocus={() => { if (newMethod.sortOrder === 0 || newMethod.sortOrder === '0') setNewMethod(prev => ({ ...prev, sortOrder: '' })) }}
              onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault() }}
              onChange={(e) => {
                const val = e.target.value
                if (val === '' || Number(val) >= 0) {
                  setNewMethod((prev) => ({ ...prev, sortOrder: val }))
                }
              }} 
              placeholder="e.g. 1" 
              className="h-11 px-4 rounded-xl bg-[#FDF4E6]/60 outline-none font-medium text-sm" 
            />
            {createErrors.sortOrder && <span className="text-red-500 text-[10px] font-bold px-1">{createErrors.sortOrder}</span>}
          </div>
          <div className="flex flex-col justify-end">
            <button onClick={handleCreate} className="h-11 px-6 bg-[#6651A4] text-white rounded-xl font-bold uppercase tracking-widest text-[11px] shadow-lg hover:bg-[#5a4892] transition-all w-full flex items-center justify-center gap-2">
              <Plus size={16} /> New Shipping
            </button>
            {createSuccessMsg && <span className="text-green-600 text-[10px] font-bold text-center mt-1">{createSuccessMsg}</span>}
            {generalError && <span className="text-red-500 text-[10px] font-bold text-center mt-1">{generalError}</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {loading ? (
          <div className="bg-white rounded-[32px] p-6 border border-black/[0.03] shadow-sm text-[12px] font-bold text-gray-400 uppercase tracking-widest">Loading shipping methods...</div>
        ) : methods.map((method) => (
          <div key={method.id} className="bg-white rounded-[32px] p-6 border border-black/[0.03] shadow-sm hover:shadow-xl transition-all space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FAEAD3] text-[#F1641E] flex items-center justify-center shrink-0"><Truck size={22} /></div>
              <select 
                value={method.status}
                onChange={async (e) => {
                  const val = e.target.value;
                  if (val === 'delete') {
                    setDeleteConfirm({ show: true, id: method.id, title: method.name });
                  } else {
                    setMethods((prev) => prev.map((item) => item.id === method.id ? { ...item, status: val } : item));
                  }
                }}
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest outline-none border cursor-pointer transition-all ${
                  method.status === 'active' 
                    ? 'bg-green-50 text-green-600 border-green-200 focus:border-green-400' 
                    : 'bg-red-50 text-red-600 border-red-200 focus:border-red-400'
                }`}
              >
                <option value="active" className="text-green-600 bg-white font-bold">Active</option>
                <option value="inactive" className="text-red-600 bg-white font-bold">Inactive</option>
                <option value="delete" className="text-red-600 bg-white font-bold">🗑 Delete</option>
              </select>
            </div>
            
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Method Name</label>
              <input value={method.name} onChange={(e) => setMethods((prev) => prev.map((item) => item.id === method.id ? { ...item, name: e.target.value } : item))} className="w-full text-xl font-grandstander font-bold text-gray-800 bg-[#FDF4E6]/20 px-2 py-1 rounded-lg border border-transparent focus:border-[#6651A4]/30 outline-none" />
              {editErrors[method.id]?.name && <span className="text-red-500 text-[10px] font-bold px-1">{editErrors[method.id].name}</span>}
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Description / Rule</label>
              <input value={method.rule} onChange={(e) => setMethods((prev) => prev.map((item) => item.id === method.id ? { ...item, rule: e.target.value } : item))} className="w-full text-sm text-gray-600 bg-[#FDF4E6]/20 px-2 py-1 rounded-lg border border-transparent focus:border-[#6651A4]/30 outline-none" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Min Days</label>
                <input 
                  type="number" 
                  value={method.minDays} 
                  onFocus={() => { if (method.minDays === 0 || method.minDays === '0') setMethods((prev) => prev.map((item) => item.id === method.id ? { ...item, minDays: '' } : item)) }}
                  onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault() }}
                  onChange={(e) => {
                    const val = e.target.value
                    if (val === '' || Number(val) >= 0) {
                      setMethods((prev) => prev.map((item) => item.id === method.id ? { ...item, minDays: val } : item))
                    }
                  }} 
                  className="h-11 px-4 rounded-xl bg-[#FDF4E6]/60 outline-none font-medium text-sm text-gray-700" 
                />
                {editErrors[method.id]?.minDays && <span className="text-red-500 text-[10px] font-bold px-1">{editErrors[method.id].minDays}</span>}
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Max Days</label>
                <input 
                  type="number" 
                  value={method.maxDays} 
                  onFocus={() => { if (method.maxDays === 0 || method.maxDays === '0') setMethods((prev) => prev.map((item) => item.id === method.id ? { ...item, maxDays: '' } : item)) }}
                  onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault() }}
                  onChange={(e) => {
                    const val = e.target.value
                    if (val === '' || Number(val) >= 0) {
                      setMethods((prev) => prev.map((item) => item.id === method.id ? { ...item, maxDays: val } : item))
                    }
                  }} 
                  className="h-11 px-4 rounded-xl bg-[#FDF4E6]/60 outline-none font-medium text-sm text-gray-700" 
                />
                {editErrors[method.id]?.maxDays && <span className="text-red-500 text-[10px] font-bold px-1">{editErrors[method.id].maxDays}</span>}
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Charge (₹)</label>
                <input 
                  type="number" 
                  value={method.charge} 
                  onFocus={() => { if (method.charge === 0 || method.charge === '0') setMethods((prev) => prev.map((item) => item.id === method.id ? { ...item, charge: '' } : item)) }}
                  onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault() }}
                  onChange={(e) => {
                    const val = e.target.value
                    if (val === '' || Number(val) >= 0) {
                      setMethods((prev) => prev.map((item) => item.id === method.id ? { ...item, charge: val } : item))
                    }
                  }} 
                  className="h-11 px-4 rounded-xl bg-[#FDF4E6]/60 outline-none font-medium text-sm text-gray-700" 
                />
                {editErrors[method.id]?.charge && <span className="text-red-500 text-[10px] font-bold px-1">{editErrors[method.id].charge}</span>}
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Sort Order</label>
                <input 
                  type="number" 
                  value={method.sortOrder} 
                  onFocus={() => { if (method.sortOrder === 0 || method.sortOrder === '0') setMethods((prev) => prev.map((item) => item.id === method.id ? { ...item, sortOrder: '' } : item)) }}
                  onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault() }}
                  onChange={(e) => {
                    const val = e.target.value
                    if (val === '' || Number(val) >= 0) {
                      setMethods((prev) => prev.map((item) => item.id === method.id ? { ...item, sortOrder: val } : item))
                    }
                  }} 
                  className="h-11 px-4 rounded-xl bg-[#FDF4E6]/60 outline-none font-medium text-sm text-gray-700" 
                />
                {editErrors[method.id]?.sortOrder && <span className="text-red-500 text-[10px] font-bold px-1">{editErrors[method.id].sortOrder}</span>}
              </div>
            </div>
            <div className="pt-5 border-t border-gray-100 flex items-center justify-between gap-4">
              <span className="flex items-center gap-1 text-[11px] font-bold text-gray-400 uppercase tracking-widest"><Route size={13} /> {method.etaLabel}</span>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-grandstander font-bold text-[#E8312A]">{method.chargeLabel}</span>
                <div className="flex items-center gap-2">
                  {saveSuccessId === method.id && <span className="text-green-600 text-[10px] font-bold">Saved!</span>}
                  {editErrors[method.id]?.general && <span className="text-red-500 text-[10px] font-bold">{editErrors[method.id].general}</span>}
                  <button onClick={() => handleUpdate(method)} disabled={savingId === method.id} className="h-10 px-4 bg-[#333] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 disabled:opacity-60">
                    <Save size={14} /> {savingId === method.id ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

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
              <p className="text-gray-500 text-sm font-medium">Do you really want to delete shipping method ({deleteConfirm.title})? This action cannot be undone.</p>
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
