import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { Search, Filter, PackageOpen, Plus, Tag, ChevronLeft, ChevronRight, Edit2, Trash2 } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { deleteAdminProduct, getAdminCategories, getAdminProducts } from '../../services/adminCatalogApi'
import { ConfirmationModal } from '../components/ConfirmationModal'

export function AdminProducts() {
  const navigate = useNavigate()
  const location = useLocation()
  const { success, error: showError } = useToast()
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(() => new URLSearchParams(location.search).get('search') || '')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categories, setCategories] = useState([])
  const [meta, setMeta] = useState({ totalPages: 1, total: 0 })
  const [error, setError] = useState('')
  
  const [productToArchive, setProductToArchive] = useState(null)
  
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  const [products, setProducts] = useState([])

  useEffect(() => {
    let isMounted = true
    const loadCategories = async () => {
      try {
        const data = await getAdminCategories()
        if (isMounted) setCategories(data.filter(category => category.isActive && !category.parentCategory))
      } catch (err) {
        console.warn('Admin categories unavailable:', err.message)
      }
    }
    loadCategories()
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError('')
    const timer = setTimeout(async () => {
      try {
        const payload = await getAdminProducts({
          page: currentPage,
          limit: itemsPerPage,
          search: search.trim(),
          category: categoryFilter,
          status: statusFilter,
        })
        if (!isMounted) return
        setProducts(payload.products)
        setMeta(payload.meta)
      } catch (err) {
        if (!isMounted) return
        setProducts([])
        setMeta({ totalPages: 1, total: 0 })
        setError(err.message || 'Products could not be loaded')
      } finally {
        if (isMounted) setLoading(false)
      }
    }, 250)

    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [search, categoryFilter, statusFilter, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, categoryFilter, statusFilter])

  const totalPages = meta.totalPages || 1
  const currentProducts = products

  const getProductStatus = (product) => {
    if (product.status !== 'active') return product.status || 'draft'
    if (product.stock <= 0) return 'out of stock'
    if (product.stock <= (product.lowStockThreshold || 10)) return 'low stock'
    return 'active'
  }

  const handleDelete = (product) => {
    setProductToArchive(product)
  }

  const confirmDelete = async () => {
    if (!productToArchive) return
    const product = productToArchive
    setProductToArchive(null)

    try {
      await deleteAdminProduct(product._id)
      setProducts(prev => prev.filter(item => item._id !== product._id))
      success(`${product.name} deleted.`)
    } catch (err) {
      showError(err.message || 'Product deletion failed')
    }
  }

  return (
    <div className="shell space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-4xl font-grandstander font-bold text-gray-800">Toy Catalog</h1>
          <p className="text-gray-500 font-medium text-[12px] md:text-sm mt-1">Manage inventory, prices, and visibility.</p>
        </div>
        <button 
          onClick={() => navigate('/admin/products/new')}
          className="h-11 px-6 bg-[#6651A4] text-white rounded-xl font-bold uppercase tracking-widest text-[10px] md:text-[11px] shadow-lg hover:bg-[#5a4892] transition-all w-full md:w-max flex items-center justify-center gap-2"
        >
          <Plus size={16} /> Add New Toy
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-[24px] shadow-sm border border-black/[0.03] space-y-4">
        <div className="relative w-full">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" placeholder="Search toys..." 
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 pl-12 pr-4 bg-[#FDF4E6]/50 rounded-xl outline-none border border-transparent focus:border-[#F1641E]/30 font-medium text-[13px] transition-all"
          />
        </div>
        
        <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-1">
          <div className="relative shrink-0 min-w-[140px]">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select 
              value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full h-11 pl-9 pr-6 bg-[#FDF4E6]/50 rounded-xl outline-none border border-transparent focus:border-[#F1641E]/30 text-[10px] font-bold text-gray-600 uppercase tracking-widest appearance-none cursor-pointer transition-all"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.slug}>{category.name}</option>
              ))}
            </select>
          </div>

          <div className="relative shrink-0 min-w-[140px]">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select 
              value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-11 pl-9 pr-6 bg-[#FDF4E6]/50 rounded-xl outline-none border border-transparent focus:border-[#F1641E]/30 text-[10px] font-bold text-gray-600 uppercase tracking-widest appearance-none cursor-pointer transition-all"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid View */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-[32px] border border-black/[0.03] animate-pulse">
              <div className="w-full aspect-square bg-gray-100 rounded-[24px] mb-4" />
              <div className="h-4 w-3/4 bg-gray-100 rounded mb-2" />
              <div className="h-6 w-1/3 bg-gray-100 rounded mb-4" />
              <div className="flex justify-between items-center border-t border-gray-50 pt-4">
                <div className="h-4 w-16 bg-gray-100 rounded" />
                <div className="h-4 w-20 bg-gray-100 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-white rounded-[32px] py-20 text-center border border-black/[0.03]">
          <PackageOpen size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-[#E8312A] font-bold text-sm">{error}</p>
        </div>
      ) : currentProducts.length === 0 ? (
        <div className="bg-white rounded-[32px] py-32 text-center border border-black/[0.03]">
          <PackageOpen size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-400 font-bold uppercase tracking-widest text-[11px]">No Toys Found in Inventory</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {currentProducts.map((product, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              key={product._id || product.id} 
              onClick={() => navigate(`/admin/products/${product._id}`)}
              className="bg-white p-4 rounded-[32px] border border-black/[0.03] shadow-sm hover:shadow-xl transition-all group cursor-pointer"
            >
              <div className="relative w-full aspect-square bg-[#FDF4E6] rounded-[24px] mb-4 overflow-hidden">
                {product.img ? (
                  <img src={product.img} alt={product.name} className="w-full h-full object-cover mix-blend-multiply group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold text-[10px] uppercase tracking-widest bg-gray-50">No Image</div>
                )}
                
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest text-gray-600 shadow-sm flex items-center gap-1">
                  <Tag size={10} /> {product.categoryName || product.category}
                </div>



                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate(`/admin/products/${product._id}`);
                    }}
                    className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#6651A4] hover:bg-[#6651A4] hover:text-white transition-all shadow-lg active:scale-95"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete(product);
                    }}
                    className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#E8312A] hover:bg-[#E8312A] hover:text-white transition-all shadow-lg active:scale-95"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="px-2 mt-2">
                <h3 className="text-[14px] font-bold text-gray-800 line-clamp-1 mb-1">{product.name}</h3>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-2xl font-grandstander font-bold text-[#F1641E]">₹{Number(product.price || 0).toFixed(0)}</p>
                  <span className="text-[9px] font-mono font-bold text-[#6651A4] bg-[#6651A4]/10 px-2 py-1 rounded-md max-w-[40%] truncate">
                    SKU: {product.sku || (product._id || product.id || '').slice(-6).toUpperCase()}
                  </span>
                </div>
                
                <div className="flex justify-between items-center border-t border-gray-100 pt-4">
                  <span className="text-[11px] font-bold text-gray-500">Stock: {product.stock}</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest
                    ${getProductStatus(product) === 'active' ? 'bg-green-50 text-green-600' : 
                      getProductStatus(product) === 'low stock' ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'}`}
                  >
                    {getProductStatus(product)}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && products.length > 0 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button 
            disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}
            className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-[#6651A4] hover:text-white hover:border-[#6651A4] disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-gray-500 disabled:hover:border-gray-200 transition-all shadow-sm"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Page</span>
            <select
              value={currentPage}
              onChange={(e) => setCurrentPage(Number(e.target.value))}
              className="h-10 px-3 bg-white rounded-xl border border-gray-200 text-[11px] font-bold text-[#6651A4] outline-none focus:border-[#6651A4] transition-all cursor-pointer"
            >
              {[...Array(totalPages)].map((_, idx) => (
                <option key={idx + 1} value={idx + 1}>{idx + 1}</option>
              ))}
            </select>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">of {totalPages}</span>
          </div>
          <button 
            disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}
            className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-[#6651A4] hover:text-white hover:border-[#6651A4] disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-gray-500 disabled:hover:border-gray-200 transition-all shadow-sm"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal 
        isOpen={!!productToArchive}
        onClose={() => setProductToArchive(null)}
        onConfirm={confirmDelete}
        title="Delete Toy?"
        message={`Are you sure you want to delete "${productToArchive?.name}"?`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  )
}
