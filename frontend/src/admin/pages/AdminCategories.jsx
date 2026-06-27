import { useEffect, useMemo, useState } from 'react'
import { Archive, Check, Eye, EyeOff, GripVertical, Plus, Search, Tags, X, ChevronDown } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { createAdminCategory, deleteAdminCategory, getAdminCategories, toggleAdminCategoryNavbar, updateAdminCategory, uploadAdminMedia } from '../../services/adminCatalogApi'
import { ConfirmationModal } from '../components/ConfirmationModal'

export function AdminCategories() {
  const { success, error: showError } = useToast()
  const [search, setSearch] = useState('')
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploadingBannerFor, setUploadingBannerFor] = useState('')
  
  const [showAddModal, setShowAddModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    parentCategory: '',
    description: '',
    showInNavbar: false,
    showInAllCategories: true
  })
  const [bannerFile, setBannerFile] = useState(null)

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({ show: false, category: null })
  const [formErrors, setFormErrors] = useState({})

  const loadCategories = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getAdminCategories()
      setCategories(data)
    } catch (err) {
      setError(err.message || 'Categories could not be loaded')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const tree = useMemo(() => {
    const byId = new Map(categories.map(category => [category.id, { ...category, children: [] }]))
    const roots = []
    byId.forEach(category => {
      const parentId = category.parentCategory?._id || category.parentCategory
      if (parentId && byId.has(parentId)) byId.get(parentId).children.push(category)
      else roots.push(category)
    })
    return roots
  }, [categories])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return tree
    return tree.filter(category => (
      category.name.toLowerCase().includes(term) ||
      category.children.some(child => child.name.toLowerCase().includes(term))
    ))
  }, [tree, search])

  const navbarCount = categories.filter(category => category.showInNavbar && !category.parentCategory && category.isActive).length

  const toggleNavbar = async (category) => {
    if (!category.showInNavbar && navbarCount >= 7) {
      showError('Navbar can show only 7 categories.')
      return
    }

    const nextValue = !category.showInNavbar
    setCategories(prev => prev.map(item => item.id === category.id ? { ...item, showInNavbar: nextValue } : item))
    try {
      await toggleAdminCategoryNavbar(category.id, nextValue)
      success(`${category.name} navbar visibility updated.`)
    } catch (err) {
      setCategories(prev => prev.map(item => item.id === category.id ? { ...item, showInNavbar: category.showInNavbar } : item))
      showError(err.message || 'Navbar update failed')
    }
  }

  const handleArchive = (category) => {
    setConfirmModal({ show: true, category })
  }

  const confirmArchive = async () => {
    const { category } = confirmModal
    setConfirmModal({ show: false, category: null })

    try {
      const archived = await deleteAdminCategory(category.id)
      setCategories(prev => prev.map(item => item.id === category.id ? archived : item))
      success(`${category.name} archived.`)
    } catch (err) {
      showError(err.message || 'Category archive failed')
    }
  }

  const handleBannerUpload = async (category, file) => {
    if (!file) return
    setUploadingBannerFor(category.id)
    try {
      const uploaded = await uploadAdminMedia(file, 'categories')
      const updated = await updateAdminCategory(category.id, {
        bannerImage: {
          url: uploaded.url,
          publicId: uploaded.publicId,
          alt: category.name,
        },
      })
      setCategories((prev) => prev.map((item) => item.id === category.id ? updated : item))
      success(`${category.name} banner updated.`)
    } catch (err) {
      showError(err.message || 'Category banner upload failed')
    } finally {
      setUploadingBannerFor('')
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    const errors = {}
    const trimmedName = formData.name.trim()
    if (!trimmedName) {
      errors.name = 'Category name is required.'
    } else if (!/^[a-zA-Z\s]+$/.test(trimmedName)) {
      errors.name = 'Category name must contain alphabets only.'
    }
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }
    setFormErrors({})
    setIsSubmitting(true)
    try {
      let payload = { ...formData }
      if (!payload.parentCategory) delete payload.parentCategory
      
      if (bannerFile) {
        const uploaded = await uploadAdminMedia(bannerFile, 'categories')
        payload.bannerImage = {
          url: uploaded.url,
          publicId: uploaded.publicId,
          alt: payload.name,
        }
      }
      
      const newCat = await createAdminCategory(payload)
      setCategories(prev => [...prev, newCat])
      success('Category created successfully!')
      setShowAddModal(false)
      setFormData({
        name: '',
        parentCategory: '',
        description: '',
        showInNavbar: false,
        showInAllCategories: true
      })
      setBannerFile(null)
      setFormErrors({})
    } catch (err) {
      showError(err.message || 'Failed to create category')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="shell space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-4xl font-grandstander font-bold text-gray-800">Categories</h1>
          <p className="text-gray-500 font-medium text-[12px] md:text-sm mt-1">Control storefront collections, mega menu, and all-categories navigation.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="h-11 px-6 bg-[#6651A4] text-white rounded-xl font-bold uppercase tracking-widest text-[10px] md:text-[11px] shadow-lg hover:bg-[#5a4892] transition-all w-full md:w-max flex items-center justify-center gap-2"
        >
          <Plus size={16} /> New Category
        </button>
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowAddModal(false); setFormErrors({}) }} />
          <div className="min-h-full flex items-center justify-center p-4 pointer-events-none">
            <div className="relative bg-[#FDF4E6] w-full max-w-xl rounded-[32px] shadow-2xl overflow-hidden border border-white/20 pointer-events-auto my-8">
            <div className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-grandstander font-bold text-gray-800">Add Category</h2>
                <button onClick={() => { setShowAddModal(false); setFormErrors({}) }} className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors shadow-sm">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Category Name</label>
                  <input 
                    required
                    type="text"
                    value={formData.name}
                    onChange={e => {
                      const val = e.target.value.replace(/[^A-Za-z\s]/g, '')
                      setFormData({...formData, name: val})
                      if (formErrors.name) setFormErrors(prev => ({ ...prev, name: '' }))
                    }}
                    placeholder="Enter category name..."
                    className={`w-full h-12 px-4 bg-white rounded-xl border focus:outline-none text-sm font-medium transition-all ${
                      formErrors.name ? 'border-red-400 focus:border-red-400' : 'border-black/5 focus:border-[#6651A4]/30'
                    }`}
                  />
                  {formErrors.name && <p className="text-red-500 text-[11px] font-semibold ml-1 mt-1">{formErrors.name}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Parent Category (Optional)</label>
                  <div className="relative">
                    <select 
                      value={formData.parentCategory}
                      onChange={e => setFormData({...formData, parentCategory: e.target.value})}
                      className="w-full h-12 px-4 bg-white rounded-xl border border-black/5 focus:border-[#6651A4]/30 outline-none text-sm font-medium transition-all appearance-none"
                    >
                      <option value="">No Parent (Top Level)</option>
                      {categories.filter(c => !c.parentCategory && c.isActive).map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Description</label>
                  <textarea 
                    rows={3}
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="Briefly describe this category..."
                    className="w-full p-4 bg-white rounded-xl border border-black/5 focus:border-[#6651A4]/30 outline-none text-sm font-medium transition-all resize-none"
                  />
                </div>

                <div className="flex items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox"
                      checked={formData.showInNavbar}
                      onChange={e => setFormData({...formData, showInNavbar: e.target.checked})}
                      className="w-4 h-4 rounded border-gray-300 text-[#6651A4] focus:ring-[#6651A4]"
                    />
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider group-hover:text-gray-700">Navbar</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox"
                      checked={formData.showInAllCategories}
                      onChange={e => setFormData({...formData, showInAllCategories: e.target.checked})}
                      className="w-4 h-4 rounded border-gray-300 text-[#6651A4] focus:ring-[#6651A4]"
                    />
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider group-hover:text-gray-700">All Categories</span>
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Banner Image (Optional)</label>
                  <div className="flex items-center gap-4">
                    <label className="h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-500 flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-100 transition-colors">
                      <span className="text-sm font-bold">{bannerFile ? 'Change Banner' : 'Upload Banner'}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={e => setBannerFile(e.target.files?.[0])}
                      />
                    </label>
                    {bannerFile && <span className="text-xs font-medium text-[#6651A4] truncate">{bannerFile.name}</span>}
                  </div>
                </div>

                <button 
                  disabled={isSubmitting}
                  className="w-full h-14 mt-4 bg-[#6651A4] text-white rounded-2xl font-bold uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-[#6651A4]/20 hover:bg-[#5a4892] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isSubmitting ? 'Creating...' : 'Create Category'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    )}

      {/* Confirmation Modal */}
      <ConfirmationModal 
        isOpen={confirmModal.show}
        onClose={() => setConfirmModal({ show: false, category: null })}
        onConfirm={confirmArchive}
        title="Archive Category?"
        message={`Are you sure you want to archive "${confirmModal.category?.name}"? This will hide it from the storefront.`}
        confirmText="Archive"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          ['Total Categories', categories.filter(category => category.isActive).length],
          ['Navbar Slots Used', `${navbarCount}/7`],
          ['Subcategories', categories.filter(category => category.parentCategory && category.isActive).length],
        ].map(([label, value]) => (
          <div key={label} className="bg-white rounded-[24px] p-5 border border-black/[0.03] shadow-sm">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
            <p className="text-3xl font-grandstander font-bold text-[#6651A4] mt-2">{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white p-4 rounded-[24px] shadow-sm border border-black/[0.03]">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search categories or subcategories..."
            className="w-full h-12 pl-12 pr-4 bg-[#FDF4E6]/50 rounded-xl outline-none border border-transparent focus:border-[#F1641E]/30 font-medium text-[13px] transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-[32px] shadow-sm border border-black/[0.03] overflow-hidden">
        <div className="divide-y divide-gray-50">
          {loading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="p-6 animate-pulse">
                <div className="h-14 bg-gray-100 rounded-2xl" />
              </div>
            ))
          ) : error ? (
            <div className="p-10 text-center">
              <p className="text-[#E8312A] font-bold text-sm">{error}</p>
              <button onClick={loadCategories} className="mt-4 h-10 px-5 bg-[#6651A4] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest">Retry</button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-gray-400 font-bold uppercase tracking-widest text-[11px]">No categories found</div>
          ) : filtered.map((category) => (
            <div key={category.id} className="p-4 md:p-6 hover:bg-[#FDF4E6]/40 transition-colors">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <button className="mt-1 text-gray-300 hover:text-[#6651A4]"><GripVertical size={18} /></button>
                  <div className="w-11 h-11 rounded-2xl bg-[#FAEAD3] text-[#F1641E] flex items-center justify-center shrink-0"><Tags size={18} /></div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-[14px] md:text-[16px] font-bold text-gray-800">{category.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${category.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>{category.status}</span>
                    </div>
                    <p className="text-[11px] text-gray-400 font-mono mt-1">/{category.slug}</p>
                    {category.children.filter(child => child.isActive).length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {category.children.filter(child => child.isActive).slice().sort((a, b) => a.name.localeCompare(b.name)).map(child => (
                          <div key={child.id} className="group/child flex items-center gap-2 px-3 py-1 bg-[#FDF4E6] border border-dashed border-black/5 rounded-full transition-all hover:border-[#E8312A]/30">
                            <span className="text-[10px] font-bold text-gray-500">{child.name}</span>
                            <button 
                              onClick={() => handleArchive(child)}
                              className="w-4 h-4 rounded-full bg-white flex items-center justify-center text-gray-400 hover:text-red-500 hover:shadow-sm opacity-0 group-hover/child:opacity-100 transition-all"
                              title={`Archive ${child.name}`}
                            >
                              <X size={10} strokeWidth={3} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      {category.bannerImage?.url && (
                        <img src={category.bannerImage.url} alt={category.bannerImage.alt || category.name} className="w-16 h-16 rounded-2xl object-cover border border-black/[0.03]" />
                      )}
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#6651A4] cursor-pointer hover:underline">
                        {uploadingBannerFor === category.id ? 'Uploading...' : 'Upload Banner'}
                        <input type="file" accept="image/*" className="hidden" onChange={(event) => handleBannerUpload(category, event.target.files?.[0])} />
                      </label>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between lg:justify-end gap-3">
                  <button
                    disabled={!category.isActive}
                    onClick={() => toggleNavbar(category)}
                    className={`h-10 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all disabled:opacity-40 ${category.showInNavbar ? 'bg-[#6651A4] text-white' : 'bg-[#FDF4E6] text-gray-400 hover:text-[#6651A4]'}`}
                  >
                    {category.showInNavbar ? <Eye size={14} /> : <EyeOff size={14} />}
                    Navbar
                  </button>
                  <button
                    disabled={!category.isActive}
                    onClick={() => handleArchive(category)}
                    className="h-10 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 bg-red-50 text-[#E8312A] hover:bg-[#E8312A] hover:text-white transition-all disabled:opacity-40"
                  >
                    <Archive size={14} /> Archive
                  </button>
                  <span className="hidden md:flex w-10 h-10 rounded-xl bg-green-50 text-green-600 items-center justify-center"><Check size={16} /></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
