import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronLeft, 
  Save, 
  Trash2, 
  Upload, 
  Image as ImageIcon, 
  X, 
  Plus, 
  Box, 
  Tag, 
  Layout, 
  AlertCircle,
  Eye,
  Settings
} from 'lucide-react'
import { 
  getAdminProduct, 
  createAdminProduct, 
  updateAdminProduct, 
  deleteAdminProduct,
  getAdminCategories,
  uploadAdminMedia
} from '../../services/adminCatalogApi'
import { useToast } from '../../context/ToastContext'

const emptyProduct = {
  _id: '',
  name: '',
  brand: '',
  price: '',
  oldPrice: '',
  stock: '',
  category: '',
  status: 'draft',
  description: '',
  ageGroup: '',
  gender: 'Unisex',
  material: '',
  color: [],
  size: [],
  isFeatured: false,
  isTrending: false,
  isNewArrival: false,
  isBestSeller: false,
  images: [],
  sku: '',
}

export function AdminProductDetail() {
  const { id } = useParams()
  const isNew = id === 'new'
  const navigate = useNavigate()
  const { success, error } = useToast()

  const [isLoading, setIsLoading] = useState(!isNew)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [isEditing, setIsEditing] = useState(isNew)
  const [categories, setCategories] = useState([])
  const [imageUrl, setImageUrl] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [product, setProduct] = useState(emptyProduct)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [newColor, setNewColor] = useState('')
  const [newSize, setNewSize] = useState('')
  const [formErrors, setFormErrors] = useState({})
  const fileInputRef = useRef(null)

  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      try {
        const [cats, prodData] = await Promise.all([
          getAdminCategories(),
          !isNew ? getAdminProduct(id) : Promise.resolve(null)
        ])

        if (!isMounted) return
        setCategories(cats)

        if (prodData) {
          const data = prodData
          setProduct({
            ...data,
            category: data.categoryId || data.category?._id || data.category || '',
            price: String(data.price ?? ''),
            oldPrice: data.oldPrice ? String(data.oldPrice) : '',
            stock: String(data.stock ?? ''),
            images: data.images || [],
            brand: data.brand || '',
            sku: data.sku || '',
            ageGroup: data.ageGroup || '',
            gender: data.gender || 'Unisex',
            material: data.material || '',
            color: data.color || [],
            size: data.size || [],
            isFeatured: !!data.isFeatured,
            isTrending: !!data.isTrending,
            isNewArrival: !!data.isNewArrival,
            isBestSeller: !!data.isBestSeller,
          })
        }
      } catch (err) {
        if (isMounted) setLoadError(err.message || 'Product could not be loaded')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadData()
    return () => { isMounted = false }
  }, [id, isNew])

  const handleSave = async () => {
    const errors = {}
    if (!product.name.trim()) {
      errors.name = 'Toy name is required.'
    } else if (!/[A-Za-z]/.test(product.name)) {
      errors.name = 'Toy name must contain at least one letter (cannot be purely numeric).'
    }
    if (!product.category) errors.category = 'Please select a category.'

    const currentPrice = Number(product.price || 0)
    const currentOldPrice = product.oldPrice !== '' ? Number(product.oldPrice) : null
    const currentStock = Number(product.stock || 0)

    if (product.price === '' || currentPrice <= 0) errors.price = 'Selling Price must be greater than 0.'
    if (currentOldPrice !== null && currentOldPrice <= 0) errors.oldPrice = 'MRP cannot be 0 or negative.'
    if (currentStock < 0) errors.stock = 'Stock cannot be negative.'

    if (currentOldPrice !== null && currentPrice > currentOldPrice) {
      errors.price = 'Selling Price cannot be greater than MRP / Old Price.'
    }

    if (product.brand && product.brand.trim() !== '') {
      if (!/[A-Za-z]/.test(product.brand)) {
        errors.brand = 'Brand name must contain at least one letter (cannot be purely numeric).'
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setFormErrors({})
    setIsSaving(true)
    try {
      const payload = {
        name: product.name.trim(),
        description: product.description || '',
        category: product.category,
        brand: product.brand || '',
        sku: product.sku ? product.sku.trim().toUpperCase() : undefined,
        price: Number(product.price || 0),
        ...(product.oldPrice !== '' && { oldPrice: Number(product.oldPrice) }),
        stock: Number(product.stock || 0),
        status: product.status,
        ageGroup: product.ageGroup || '',
        gender: product.gender || 'Unisex',
        material: product.material || '',
        color: newColor.trim() && !(product.color || []).includes(newColor.trim()) ? [...(product.color || []), newColor.trim()] : product.color || [],
        size: newSize.trim() && !(product.size || []).includes(newSize.trim()) ? [...(product.size || []), newSize.trim()] : product.size || [],
        isFeatured: product.isFeatured,
        isTrending: product.isTrending,
        isNewArrival: product.isNewArrival,
        isBestSeller: product.isBestSeller,
        images: product.images.map((image, index) => ({
          url: image.url || image,
          alt: image.alt || product.name,
          sortOrder: index,
        })),
        thumbnail: product.images[0]?.url ? { url: product.images[0].url, alt: product.name } : undefined,
      }

      if (isNew) {
        await createAdminProduct(payload)
        success('Toy launched successfully! 🚀')
      } else {
        await updateAdminProduct(id, payload)
        success('Toy updated successfully! ✨')
      }
      navigate('/admin/products')
    } catch (err) {
      error(err.message || 'Failed to save toy')
    } finally {
      setIsSaving(false)
    }
  }

  const confirmDelete = async () => {
    try {
      await deleteAdminProduct(id)
      success('Toy archived and hidden from shop.')
      navigate('/admin/products')
    } catch (err) {
      error(err.message || 'Failed to delete toy')
    }
  }

  const addImageUrl = () => {
    if (!imageUrl.trim()) return
    setProduct(prev => ({
      ...prev,
      images: [...prev.images, { url: imageUrl.trim(), alt: product.name }]
    }))
    setImageUrl('')
  }

  const removeImage = (index) => {
    setProduct(prev => ({
      ...prev,
      images: prev.images.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  const addTag = (field, value, setValue) => {
    const tag = value.trim()
    if (!tag) return
    if (!product[field].includes(tag)) {
      setProduct(prev => ({ ...prev, [field]: [...prev[field], tag] }))
    }
    setValue('')
  }

  const removeTag = (field, tag) => {
    setProduct(prev => ({ ...prev, [field]: prev[field].filter(t => t !== tag) }))
  }

  const handleImageFileSelect = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      const data = await uploadAdminMedia(file)
      setProduct(prev => ({
        ...prev,
        images: [...prev.images, { url: data.url, publicId: data.publicId, alt: product.name }]
      }))
      success('Snapshot uploaded! 📸')
    } catch (err) {
      error('Failed to upload snapshot')
    } finally {
      setUploadingImage(false)
    }
  }

  if (isLoading) return <div className="p-8 text-center font-grandstander text-gray-500">Loading toy details...</div>
  if (loadError) return (
    <div className="p-8 text-center space-y-4">
      <AlertCircle className="mx-auto text-red-500" size={48} />
      <p className="text-red-500 font-bold">{loadError}</p>
      <button onClick={() => navigate('/admin/products')} className="text-[#6651A4] font-bold underline">Go back to collection</button>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#FDF4E6] p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/admin/products')}
              className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-gray-400 hover:text-[#6651A4] transition-colors shadow-sm border border-black/[0.03]"
            >
              <ChevronLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-grandstander font-black text-gray-800">
                {isNew ? 'Launch New Toy' : 'Edit Toy Details'}
              </h1>
              <p className="text-gray-500 font-medium text-sm">Fill in the magic to bring this toy to life.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {!isNew && (
              <button 
                onClick={() => setShowConfirmDelete(true)}
                className="h-12 px-6 rounded-2xl bg-white text-red-500 font-bold flex items-center gap-2 hover:bg-red-50 transition-colors shadow-sm border border-red-100"
              >
                <Trash2 size={18} />
                <span className="hidden sm:inline">Archive</span>
              </button>
            )}
            {isEditing ? (
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="h-12 px-8 rounded-2xl bg-[#6651A4] text-white font-black flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-[#6651A4]/20 disabled:opacity-60"
              >
                <Save size={18} />
                <span>{isSaving ? 'Launching...' : isNew ? 'Launch Toy' : 'Commit Changes'}</span>
              </button>
            ) : (
              <button 
                onClick={() => setIsEditing(true)}
                className="h-12 px-8 rounded-2xl bg-[#6651A4] text-white font-black flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-[#6651A4]/20"
              >
                <Settings size={18} />
                <span>Enter Edit Mode</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left - Visuals */}
          <div className="space-y-8">
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-[32px] p-6 shadow-sm border border-black/[0.03] space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-grandstander font-bold text-gray-800">Toy Snapshots</h3>
                <span className="text-xs font-bold text-gray-400">{(product.images || []).length} added</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {(product.images || []).map((img, idx) => (
                  <div key={idx} className="aspect-square rounded-2xl bg-gray-50 relative group overflow-hidden border border-gray-100">
                    {img && (img.url || typeof img === 'string') ? (
                      <img src={img.url || img} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold text-[10px] uppercase tracking-widest bg-gray-50">No Image</div>
                    )}
                    {isEditing && (
                      <button 
                        onClick={() => removeImage(idx)}
                        className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
                {isEditing && product.images.length < 8 && (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-[#6651A4]/30 hover:text-[#6651A4] transition-all bg-gray-50/50"
                  >
                    <Plus size={24} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Add Snapshot</span>
                  </button>
                )}
              </div>

              {isEditing && (
                <div className="space-y-3 pt-4 border-t border-gray-50">
                  <input type="file" ref={fileInputRef} onChange={handleImageFileSelect} className="hidden" accept="image/*" />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="w-full h-12 bg-[#6651A4] text-white rounded-2xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest disabled:opacity-60"
                  >
                    <Plus size={18} />
                    <span>{uploadingImage ? 'Uploading...' : 'Upload Image'}</span>
                  </button>
                  <input
                    value={imageUrl}
                    onChange={(event) => setImageUrl(event.target.value)}
                    placeholder="Or paste an image URL"
                    className="w-full h-12 px-4 bg-[#FDF4E6]/50 rounded-2xl outline-none border border-transparent focus:border-[#6651A4]/30 text-[12px] font-medium"
                  />
                  <button onClick={addImageUrl} className="w-full h-12 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center text-gray-400 hover:bg-[#FDF4E6]/50 hover:border-[#6651A4]/30 transition-all gap-2">
                    <Plus size={18} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Add Snapshot</span>
                  </button>
                </div>
              )}
            </motion.div>
          </div>

          {/* Center/Right - Form */}
          <div className="lg:col-span-2 space-y-8">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-[32px] p-8 shadow-sm border border-black/[0.03] space-y-8">
              <h3 className="text-xl font-grandstander font-bold text-gray-800">Toy Specifications</h3>
              
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Toy Name</label>
                  <input 
                    disabled={!isEditing}
                    type="text" 
                    value={product.name} 
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^A-Za-z0-9\s\-_]/g, '')
                      setProduct({...product, name: val})
                      if(formErrors.name) setFormErrors({...formErrors, name: null})
                    }}
                    placeholder="e.g. Playbox The Builder"
                    className={`w-full h-14 px-5 bg-[#FDF4E6]/50 rounded-2xl outline-none border focus:border-[#6651A4]/30 font-bold text-gray-700 transition-all disabled:opacity-60 ${formErrors.name ? 'border-red-400' : 'border-transparent'}`}
                  />
                  {formErrors.name && <p className="text-red-500 text-[11px] font-bold">{formErrors.name}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Category</label>
                    <select 
                      disabled={!isEditing}
                      value={product.category}
                      onChange={(e) => {
                        setProduct({...product, category: e.target.value})
                        if(formErrors.category) setFormErrors({...formErrors, category: null})
                      }}
                      className={`w-full h-14 px-5 bg-[#FDF4E6]/50 rounded-2xl outline-none border focus:border-[#6651A4]/30 font-bold text-gray-700 transition-all appearance-none disabled:opacity-60 ${formErrors.category ? 'border-red-400' : 'border-transparent'}`}
                    >
                      <option value="">Select Category</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                    {formErrors.category && <p className="text-red-500 text-[11px] font-bold">{formErrors.category}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Inventory Status</label>
                    <select 
                      disabled={!isEditing}
                      value={product.status}
                      onChange={(e) => setProduct({...product, status: e.target.value})}
                      className="w-full h-14 px-5 bg-[#FDF4E6]/50 rounded-2xl outline-none border border-transparent focus:border-[#6651A4]/30 font-bold text-gray-700 transition-all appearance-none disabled:opacity-60"
                    >
                      <option value="active">Active</option>
                      <option value="draft">Draft</option>
                      <option value="inactive">Inactive</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Selling Price (₹)</label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">₹</span>
                      <input 
                        disabled={!isEditing}
                        type="number" 
                        value={product.price} 
                        onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault() }}
                        onChange={(e) => {
                          const val = e.target.value
                          if (val === '' || Number(val) >= 0) {
                            setProduct({...product, price: val})
                          }
                          if(formErrors.price) setFormErrors({...formErrors, price: null})
                        }}
                        className={`w-full h-14 pl-12 pr-5 bg-[#FDF4E6]/50 rounded-2xl outline-none border focus:border-[#6651A4]/30 font-grandstander font-bold text-xl text-gray-700 transition-all disabled:opacity-60 ${formErrors.price ? 'border-red-400' : 'border-transparent'}`}
                      />
                    </div>
                    {formErrors.price && <p className="text-red-500 text-[11px] font-bold">{formErrors.price}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">MRP / Old Price (₹)</label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">₹</span>
                      <input 
                        disabled={!isEditing}
                        type="number" 
                        value={product.oldPrice} 
                        onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault() }}
                        onChange={(e) => {
                          const val = e.target.value
                          if (val === '' || Number(val) >= 0) {
                            setProduct({...product, oldPrice: val})
                          }
                          if(formErrors.oldPrice) setFormErrors({...formErrors, oldPrice: null})
                        }}
                        className={`w-full h-14 pl-12 pr-5 bg-[#FDF4E6]/50 rounded-2xl outline-none border focus:border-[#6651A4]/30 font-grandstander font-bold text-xl text-gray-600 transition-all disabled:opacity-60 ${formErrors.oldPrice ? 'border-red-400' : 'border-transparent'}`}
                      />
                    </div>
                    {formErrors.oldPrice && <p className="text-red-500 text-[11px] font-bold">{formErrors.oldPrice}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Units in Storage</label>
                    <div className="relative">
                      <Box size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        disabled={!isEditing}
                        type="number" 
                        value={product.stock} 
                        onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault() }}
                        onChange={(e) => {
                          const val = e.target.value
                          if (val === '' || Number(val) >= 0) {
                            setProduct({...product, stock: val})
                          }
                          if(formErrors.stock) setFormErrors({...formErrors, stock: null})
                        }}
                        className={`w-full h-14 pl-12 pr-5 bg-[#FDF4E6]/50 rounded-2xl outline-none border focus:border-[#6651A4]/30 font-bold text-gray-700 transition-all disabled:opacity-60 ${formErrors.stock ? 'border-red-400' : 'border-transparent'}`}
                      />
                    </div>
                    {formErrors.stock && <p className="text-red-500 text-[11px] font-bold">{formErrors.stock}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Description</label>
                  <textarea 
                    disabled={!isEditing}
                    value={product.description} 
                    onChange={(e) => setProduct({...product, description: e.target.value})}
                    rows={4}
                    className="w-full p-5 bg-[#FDF4E6]/50 rounded-2xl outline-none border border-transparent focus:border-[#6651A4]/30 font-medium text-gray-700 transition-all resize-none disabled:opacity-60"
                    placeholder="Describe the joy this toy brings..."
                  />
                </div>

                <div className="pt-4 border-t border-gray-50 space-y-8">
                  <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-[#6651A4]/60">Advanced Details</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Brand</label>
                      <input 
                        disabled={!isEditing}
                        type="text" 
                        value={product.brand} 
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^A-Za-z0-9\s\-_]/g, '')
                          setProduct({...product, brand: val})
                          if (formErrors.brand) setFormErrors({...formErrors, brand: null})
                        }}
                        placeholder="e.g. Babyhug"
                        className={`w-full h-14 px-5 bg-[#FDF4E6]/50 rounded-2xl outline-none border focus:border-[#6651A4]/30 font-bold text-gray-700 transition-all disabled:opacity-60 ${formErrors.brand ? 'border-red-400' : 'border-transparent'}`}
                      />
                      {formErrors.brand && <p className="text-red-500 text-[11px] font-bold px-2">{formErrors.brand}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">SKU Number</label>
                      <input 
                        disabled={!isEditing}
                        type="text" 
                        value={product.sku || ''} 
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^A-Za-z0-9\-_]/g, '')
                          setProduct({...product, sku: val})
                        }}
                        placeholder="e.g. TOY-WD-CAR-01"
                        className="w-full h-14 px-5 bg-[#FDF4E6]/50 rounded-2xl outline-none border border-transparent focus:border-[#6651A4]/30 font-bold text-[#6651A4] transition-all disabled:opacity-60"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Age Group</label>
                      <input 
                        disabled={!isEditing}
                        type="text" value={product.ageGroup} onChange={(e) => setProduct({...product, ageGroup: e.target.value})}
                        placeholder="e.g. 3 Years+"
                        className="w-full h-14 px-5 bg-[#FDF4E6]/50 rounded-2xl outline-none border border-transparent focus:border-[#6651A4]/30 font-bold text-gray-700 transition-all disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Gender Focus</label>
                      <select 
                        disabled={!isEditing}
                        value={product.gender}
                        onChange={(e) => setProduct({...product, gender: e.target.value})}
                        className="w-full h-14 px-5 bg-[#FDF4E6]/50 rounded-2xl outline-none border border-transparent focus:border-[#6651A4]/30 font-bold text-gray-700 transition-all appearance-none disabled:opacity-60"
                      >
                        <option value="Boy">Boy</option>
                        <option value="Girl">Girl</option>
                        <option value="Unisex">Unisex</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Material</label>
                      <input 
                        disabled={!isEditing}
                        type="text" value={product.material} 
                        onChange={(e) => setProduct({...product, material: e.target.value.replace(/[^A-Za-z\s]/g, '')})}
                        placeholder="e.g. Wood, Plastic"
                        className="w-full h-14 px-5 bg-[#FDF4E6]/50 rounded-2xl outline-none border border-transparent focus:border-[#6651A4]/30 font-bold text-gray-700 transition-all disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Available Colors</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {(product.color || []).map(c => (
                          <span key={c} className="px-3 py-1.5 bg-[#6651A4]/10 text-[#6651A4] rounded-lg text-[11px] font-bold flex items-center gap-2">
                            {c} {isEditing && <X size={12} className="cursor-pointer" onClick={() => removeTag('color', c)}/>}
                          </span>
                        ))}
                      </div>
                      {isEditing && (
                        <div className="flex gap-2">
                          <select 
                            value={newColor} 
                            onChange={(e) => setNewColor(e.target.value)}
                            className="flex-1 h-12 px-4 bg-[#FDF4E6]/50 rounded-xl outline-none text-xs font-bold appearance-none cursor-pointer border border-transparent focus:border-[#6651A4]/30"
                          >
                            <option value="">Select color...</option>
                            {['Red', 'Blue', 'Green', 'Yellow', 'Black', 'White', 'Pink', 'Orange', 'Purple', 'Multicolor'].map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                          <button onClick={() => addTag('color', newColor, setNewColor)} className="w-12 h-12 bg-[#6651A4] text-white rounded-xl flex items-center justify-center shrink-0 hover:opacity-90"><Plus size={18}/></button>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Available Sizes</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {(product.size || []).map(s => (
                          <span key={s} className="px-3 py-1.5 bg-[#F1641E]/10 text-[#F1641E] rounded-lg text-[11px] font-bold flex items-center gap-2">
                            {s} {isEditing && <X size={12} className="cursor-pointer hover:text-red-500" onClick={() => removeTag('size', s)}/>}
                          </span>
                        ))}
                      </div>
                      {isEditing && (
                        <div className="flex gap-2">
                          <select 
                            value={newSize} 
                            onChange={(e) => setNewSize(e.target.value)}
                            className="flex-1 h-12 px-4 bg-[#FDF4E6]/50 rounded-xl outline-none text-xs font-bold appearance-none cursor-pointer border border-transparent focus:border-[#F1641E]/30"
                          >
                            <option value="">Select size...</option>
                            {['Small', 'Medium', 'Large', 'XL', 'XXL', 'Free Size'].map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          <button onClick={() => addTag('size', newSize, setNewSize)} className="w-12 h-12 bg-[#F1641E] text-white rounded-xl flex items-center justify-center shrink-0 hover:opacity-90"><Plus size={18}/></button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#FAEAD3] rounded-[32px] p-8 shadow-sm border border-[#F1641E]/10 space-y-8">
              <div>
                <h3 className="text-xl font-grandstander font-bold text-gray-800">Visibility & Status</h3>
                <p className="text-[11px] text-gray-500 font-medium mt-1">Control how this toy appears on the storefront.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[12px] font-bold text-gray-700">Public Live</p>
                    <p className="text-[10px] text-gray-500">Visible to all users</p>
                  </div>
                  <button
                    disabled={!isEditing}
                    onClick={() => setProduct(prev => ({ ...prev, status: prev.status === 'active' ? 'draft' : 'active' }))}
                    className={`w-12 h-7 rounded-full transition-all flex items-center p-1 ${product.status === 'active' ? 'bg-green-500 justify-end' : 'bg-gray-300 justify-start'}`}
                  >
                    <div className="w-5 h-5 bg-white rounded-full shadow-sm" />
                  </button>
                </div>

                {[
                  { id: 'isFeatured', label: 'Featured Toy', sub: 'Shows in home sliders' },
                  { id: 'isTrending', label: 'Trending Now', sub: 'Popularity badge' },
                  { id: 'isNewArrival', label: 'New Arrival', sub: 'Just launched tag' },
                  { id: 'isBestSeller', label: 'Best Seller', sub: 'Highest sales badge' }
                ].map(badge => (
                  <div key={badge.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-[12px] font-bold text-gray-700">{badge.label}</p>
                      <p className="text-[10px] text-gray-500">{badge.sub}</p>
                    </div>
                    <button
                      disabled={!isEditing}
                      onClick={() => setProduct(prev => ({ ...prev, [badge.id]: !prev[badge.id] }))}
                      className={`w-12 h-7 rounded-full transition-all flex items-center p-1 ${product[badge.id] ? 'bg-[#6651A4] justify-end' : 'bg-gray-300 justify-start'}`}
                    >
                      <div className="w-5 h-5 bg-white rounded-full shadow-sm" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      <ConfirmationModal 
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={confirmDelete}
        title="Archive Toy?"
        message={`Are you sure you want to archive "${product.name}"? This will hide it from the storefront.`}
        confirmText="Archive"
      />
    </div>
  )
}

function ConfirmationModal({ isOpen, onClose, onConfirm, title, message, confirmText }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl">
        <h3 className="text-2xl font-grandstander font-black text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-500 font-medium mb-8 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 h-12 rounded-2xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-colors">Cancel</button>
          <button onClick={onConfirm} className="flex-1 h-12 rounded-2xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20">{confirmText}</button>
        </div>
      </motion.div>
    </div>
  )
}
