import { useEffect, useState } from 'react'
import { Plus, Route, Truck, Save } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { createAdminShippingMethod, getAdminShippingMethods, updateAdminShippingMethod } from '../../services/shippingApi'

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
  const { success, error: showError } = useToast()
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState('')
  const [methods, setMethods] = useState([])
  const [newMethod, setNewMethod] = useState(defaultForm)

  useEffect(() => {
    let isMounted = true

    const loadMethods = async () => {
      try {
        const data = await getAdminShippingMethods()
        if (!isMounted) return
        setMethods(data)
      } catch (error) {
        if (isMounted) showError(error.message || 'Shipping methods could not be loaded')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadMethods()
    return () => {
      isMounted = false
    }
  }, [showError])

  const handleCreate = async () => {
    try {
      const created = await createAdminShippingMethod({
        ...newMethod,
        code: newMethod.code.trim().toLowerCase(),
        sortOrder: Number(newMethod.sortOrder),
        minDays: Number(newMethod.minDays),
        maxDays: Number(newMethod.maxDays),
        charge: Number(newMethod.charge),
      })
      setMethods((prev) => [...prev, created].sort((a, b) => a.sortOrder - b.sortOrder))
      setNewMethod(defaultForm)
      success('Shipping method created.')
    } catch (error) {
      showError(error.message || 'Shipping method could not be created')
    }
  }

  const handleUpdate = async (method) => {
    setSavingId(method.id)
    try {
      const updated = await updateAdminShippingMethod(method.id, {
        name: method.name,
        code: method.code,
        minDays: Number(method.minDays),
        maxDays: Number(method.maxDays),
        charge: Number(method.charge),
        rule: method.rule,
        status: method.status,
        sortOrder: Number(method.sortOrder),
      })
      setMethods((prev) => prev.map((item) => (item.id === method.id ? updated : item)).sort((a, b) => a.sortOrder - b.sortOrder))
      success('Shipping method updated.')
    } catch (error) {
      showError(error.message || 'Shipping method could not be updated')
    } finally {
      setSavingId('')
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
        <h2 className="text-lg font-grandstander font-bold text-gray-800 flex items-center gap-2"><Plus size={18} /> New Rate</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input value={newMethod.name} onChange={(e) => setNewMethod((prev) => ({ ...prev, name: e.target.value }))} placeholder="Method name" className="h-11 px-4 rounded-xl bg-[#FDF4E6]/60 outline-none" />
          <input value={newMethod.code} onChange={(e) => setNewMethod((prev) => ({ ...prev, code: e.target.value }))} placeholder="Code" className="h-11 px-4 rounded-xl bg-[#FDF4E6]/60 outline-none" />
          <input 
            type="number" 
            value={newMethod.minDays} 
            onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault() }}
            onChange={(e) => {
              const val = e.target.value
              if (val === '' || Number(val) >= 0) {
                setNewMethod((prev) => ({ ...prev, minDays: val }))
              }
            }} 
            placeholder="Min days" 
            className="h-11 px-4 rounded-xl bg-[#FDF4E6]/60 outline-none" 
          />
          <input 
            type="number" 
            value={newMethod.maxDays} 
            onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault() }}
            onChange={(e) => {
              const val = e.target.value
              if (val === '' || Number(val) >= 0) {
                setNewMethod((prev) => ({ ...prev, maxDays: val }))
              }
            }} 
            placeholder="Max days" 
            className="h-11 px-4 rounded-xl bg-[#FDF4E6]/60 outline-none" 
          />
          <input 
            type="number" 
            value={newMethod.charge} 
            onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault() }}
            onChange={(e) => {
              const val = e.target.value
              if (val === '' || Number(val) >= 0) {
                setNewMethod((prev) => ({ ...prev, charge: val }))
              }
            }} 
            placeholder="Charge" 
            className="h-11 px-4 rounded-xl bg-[#FDF4E6]/60 outline-none" 
          />
          <input value={newMethod.rule} onChange={(e) => setNewMethod((prev) => ({ ...prev, rule: e.target.value }))} placeholder="Rule" className="h-11 px-4 rounded-xl bg-[#FDF4E6]/60 outline-none" />
          <input 
            type="number" 
            value={newMethod.sortOrder} 
            onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault() }}
            onChange={(e) => {
              const val = e.target.value
              if (val === '' || Number(val) >= 0) {
                setNewMethod((prev) => ({ ...prev, sortOrder: val }))
              }
            }} 
            placeholder="Sort order" 
            className="h-11 px-4 rounded-xl bg-[#FDF4E6]/60 outline-none" 
          />
          <button onClick={handleCreate} className="h-11 px-6 bg-[#6651A4] text-white rounded-xl font-bold uppercase tracking-widest text-[11px] shadow-lg hover:bg-[#5a4892] transition-all w-full flex items-center justify-center gap-2">
            <Plus size={16} /> New Rate
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {loading ? (
          <div className="bg-white rounded-[32px] p-6 border border-black/[0.03] shadow-sm text-[12px] font-bold text-gray-400 uppercase tracking-widest">Loading shipping methods...</div>
        ) : methods.map((method) => (
          <div key={method.id} className="bg-white rounded-[32px] p-6 border border-black/[0.03] shadow-sm hover:shadow-xl transition-all space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FAEAD3] text-[#F1641E] flex items-center justify-center"><Truck size={22} /></div>
              <select value={method.status} onChange={(e) => setMethods((prev) => prev.map((item) => item.id === method.id ? { ...item, status: e.target.value } : item))} className="px-3 py-1 rounded-full bg-green-50 text-green-600 text-[9px] font-bold uppercase tracking-widest outline-none">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <input value={method.name} onChange={(e) => setMethods((prev) => prev.map((item) => item.id === method.id ? { ...item, name: e.target.value } : item))} className="w-full text-xl font-grandstander font-bold text-gray-800 outline-none" />
            <input value={method.rule} onChange={(e) => setMethods((prev) => prev.map((item) => item.id === method.id ? { ...item, rule: e.target.value } : item))} className="w-full text-[12px] text-gray-500 outline-none" />
            <div className="grid grid-cols-2 gap-3">
              <input 
                type="number" 
                value={method.minDays} 
                onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault() }}
                onChange={(e) => {
                  const val = e.target.value
                  if (val === '' || Number(val) >= 0) {
                    setMethods((prev) => prev.map((item) => item.id === method.id ? { ...item, minDays: val } : item))
                  }
                }} 
                className="h-11 px-4 rounded-xl bg-[#FDF4E6]/60 outline-none" 
              />
              <input 
                type="number" 
                value={method.maxDays} 
                onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault() }}
                onChange={(e) => {
                  const val = e.target.value
                  if (val === '' || Number(val) >= 0) {
                    setMethods((prev) => prev.map((item) => item.id === method.id ? { ...item, maxDays: val } : item))
                  }
                }} 
                className="h-11 px-4 rounded-xl bg-[#FDF4E6]/60 outline-none" 
              />
              <input 
                type="number" 
                value={method.charge} 
                onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault() }}
                onChange={(e) => {
                  const val = e.target.value
                  if (val === '' || Number(val) >= 0) {
                    setMethods((prev) => prev.map((item) => item.id === method.id ? { ...item, charge: val } : item))
                  }
                }} 
                className="h-11 px-4 rounded-xl bg-[#FDF4E6]/60 outline-none" 
              />
              <input 
                type="number" 
                value={method.sortOrder} 
                onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault() }}
                onChange={(e) => {
                  const val = e.target.value
                  if (val === '' || Number(val) >= 0) {
                    setMethods((prev) => prev.map((item) => item.id === method.id ? { ...item, sortOrder: val } : item))
                  }
                }} 
                className="h-11 px-4 rounded-xl bg-[#FDF4E6]/60 outline-none" 
              />
            </div>
            <div className="pt-5 border-t border-gray-100 flex items-center justify-between gap-4">
              <span className="flex items-center gap-1 text-[11px] font-bold text-gray-400 uppercase tracking-widest"><Route size={13} /> {method.etaLabel}</span>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-grandstander font-bold text-[#E8312A]">{method.chargeLabel}</span>
                <button onClick={() => handleUpdate(method)} disabled={savingId === method.id} className="h-10 px-4 bg-[#333] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 disabled:opacity-60">
                  <Save size={14} /> {savingId === method.id ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
