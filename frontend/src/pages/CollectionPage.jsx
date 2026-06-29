import { useState, useEffect } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, SlidersHorizontal, ChevronLeft, ChevronDown, Check, X, ChevronRight } from 'lucide-react'
import { categoryData } from '../data/navigationData'
import { ProductCard } from '../components/ui/ProductCard'
import { getCategoryTree, getProducts, getProductFilters } from '../services/catalogApi'

const SkeletonCard = () => (
  <div className="bg-transparent rounded-[30px] p-2 animate-pulse">
    <div className="aspect-square bg-[#333]/5 rounded-[30px] mb-4 border-[1.5px] border-dashed border-black/5"></div>
    <div className="px-4 pb-4 space-y-3 text-center">
      <div className="h-4 bg-[#333]/5 rounded w-2/3 mx-auto"></div>
      <div className="h-6 bg-[#333]/5 rounded w-full mx-auto"></div>
    </div>
  </div>
)

const FilterSection = ({ title, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-black/5 py-4">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex items-center justify-between text-[13px] font-black uppercase tracking-widest text-[#444] hover:text-[#E84949] transition-colors"
      >
        <span>{title}</span>
        <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? '' : '-rotate-90 opacity-40'}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-2 mt-4">
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function CollectionPage() {
  const { category: categoryParam, subcategory } = useParams()
  const location = useLocation()
  const queryParams = new URLSearchParams(location.search)
  const categoryQuery = queryParams.get('category')
  const category = categoryParam || categoryQuery
  const [innerSearch, setInnerSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 })
  const [categoryMeta, setCategoryMeta] = useState(null)
  const [error, setError] = useState('')
  const [sortBy, setSortBy] = useState('relevance')
  const [currentPage, setCurrentPage] = useState(1)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [gridCols, setGridCols] = useState(3)
  const itemsPerPage = 12

  const [dynamicFilters, setDynamicFilters] = useState({
    brands: [],
    genders: [],
    ages: [],
    materials: [],
    colors: [],
    sizes: []
  })

  useEffect(() => {
    let isMounted = true
    const loadFilters = async () => {
      try {
        const filtersData = await getProductFilters()
        if (isMounted && filtersData) {
          setDynamicFilters(filtersData)
        }
      } catch (err) {
        // ignore
      }
    }
    loadFilters()
    return () => { isMounted = false }
  }, [])

  const [filters, setFilters] = useState({
    availability: [],
    price: [0, 5000],
    brand: [],
    age: [],
    gender: [],
    material: [],
    size: [],
    color: [],
    discount: [],
    type: []
  })

  const getCategoryDataBySlug = (slug) => {
    if (!slug) return null;
    const normalized = slug.toLowerCase().replaceAll('-', ' ');
    const entries = Object.entries(categoryData);
    
    // Try direct match
    let match = entries.find(([k]) => k.toLowerCase() === normalized);
    if (match) return match[1];

    // Try ampersand vs "and"
    const withAmp = normalized.replaceAll(' and ', ' & ');
    match = entries.find(([k]) => k.toLowerCase() === withAmp);
    if (match) return match[1];

    return null;
  };

  const currentCatData = getCategoryDataBySlug(category) || categoryData['Musical Toys'];
  const displayTitle = categoryMeta?.name || (subcategory || category || 'Collection').replaceAll('-', ' ')
  const bannerImg = categoryMeta?.bannerImage?.url || currentCatData?.banner || 'https://images.pexels.com/photos/6743167/pexels-photo-6743167.jpeg'
  const processedProducts = products
  const totalPages = meta.totalPages || 1
  const paginatedProducts = products

  useEffect(() => {
    let isMounted = true

    const loadCategoryMeta = async () => {
      try {
        const tree = await getCategoryTree()
        const allCategories = tree.flatMap(item => [item, ...(item.children || [])])
        const activeSlug = subcategory || category
        const matched = allCategories.find(item => item.slug === activeSlug)
        if (isMounted) setCategoryMeta(matched || null)
      } catch (err) {
        if (isMounted) setCategoryMeta(null)
      }
    }

    loadCategoryMeta()
    return () => {
      isMounted = false
    }
  }, [category, subcategory])

  useEffect(() => {
    let isMounted = true

    const loadProducts = async () => {
      setIsLoading(true)
      setError('')
      try {
        const payload = await getProducts({
          category,
          subcategory,
          page: currentPage,
          limit: itemsPerPage,
          sort: sortBy,
          search: innerSearch.trim(),
          brand: filters.brand.join(','),
          gender: filters.gender.join(','),
          ageGroup: filters.age.join(','),
          material: filters.material.join(','),
          color: filters.color.join(','),
          size: filters.size.join(','),
          availability: filters.availability.join(','),
          discount: filters.discount.join(','),
          minPrice: filters.price[0],
          maxPrice: filters.price[1],
        })

        if (!isMounted) return
        setProducts(payload.products)
        setMeta(payload.meta)
      } catch (err) {
        if (!isMounted) return
        setProducts([])
        setMeta({ total: 0, totalPages: 1 })
        setError(err.message || 'Products could not be loaded')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    const timer = setTimeout(loadProducts, 250)
    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [category, subcategory, currentPage, sortBy, innerSearch, filters])

  useEffect(() => {
    if (isFilterOpen) {
      const scrollY = window.scrollY
      document.documentElement.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      document.body.style.overflow = 'hidden'
    } else {
      const scrollY = document.body.style.top
      document.documentElement.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
      window.scrollTo(0, parseInt(scrollY || '0') * -1)
    }

    return () => {
      document.documentElement.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
    }
  }, [isFilterOpen])

  useEffect(() => {
    setCurrentPage(1)
    if (!isFilterOpen) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [category, subcategory, innerSearch, sortBy, filters, isFilterOpen, location.search])

  const toggleFilter = (key, value) => {
    setFilters(prev => {
      if (key === 'availability') {
        return {
          ...prev,
          [key]: prev[key].includes(value) ? [] : [value]
        }
      }
      return {
        ...prev,
        [key]: prev[key].includes(value) ? prev[key].filter(v => v !== value) : [...prev[key], value]
      }
    })
    setCurrentPage(1)
  }

  const getVisiblePages = () => {
    const pages = []
    let range = 2 
    if (window.innerWidth < 768) range = 1 
    else if (window.innerWidth < 1024) range = 2 
    else range = 3 

    const start = Math.max(1, currentPage - range)
    const end = Math.min(totalPages, currentPage + range)
    for (let i = start; i <= end; i++) pages.push(i)
    return pages
  }

  const FilterContent = () => (
    <div className="space-y-1">
      {[
        { id: 'availability', title: 'availability', items: ['in stock', 'out of stock'] },
        { id: 'brand', title: 'brands', items: dynamicFilters.brands.length > 0 ? dynamicFilters.brands : ['Toyovo'] },
        { id: 'gender', title: 'gender', items: dynamicFilters.genders.length > 0 ? dynamicFilters.genders : ['Boy', 'Girl', 'Unisex'] },
        { id: 'age', title: 'age', items: dynamicFilters.ages.length > 0 ? dynamicFilters.ages : ['0-10 Years', '0-24 Months', '2 Years+', '3 Years+', '5 Years+'] },
        { id: 'size', title: 'size', items: dynamicFilters.sizes.length > 0 ? dynamicFilters.sizes : ['Small', 'Medium', 'Large', 'XL', 'XXL', 'Free Size'] },
        { id: 'color', title: 'colors', items: dynamicFilters.colors.length > 0 ? dynamicFilters.colors : ['Red', 'Blue', 'Pink', 'Yellow', 'Multicolor', 'Green', 'Orange'] },
        { id: 'material', title: 'material', items: dynamicFilters.materials.length > 0 ? dynamicFilters.materials : ['Child-Safe Premium', 'Wood', 'Plastic', 'Soft Fabric'] },
        { id: 'discount', title: 'discounts', items: ['10% OFF', '20% OFF', '30% OFF', '50% OFF'] }
      ].map(f => (
        <FilterSection key={f.id} title={f.title} defaultOpen={false}>
          <div className="space-y-2">
            {f.items.map(v => (
              <label key={v} className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-4 h-4 rounded-md border-2 transition-all flex items-center justify-center ${filters[f.id].includes(v) ? 'bg-[#E84949] border-[#E84949]' : 'border-black/10'}`}>
                  {filters[f.id].includes(v) && <Check size={10} className="text-white" />}
                  <input type="checkbox" className="sr-only" checked={filters[f.id].includes(v)} onChange={() => toggleFilter(f.id, v)} />
                </div>
                <span className="text-[12px] font-bold text-[#444] lowercase">{v}</span>
              </label>
            ))}
          </div>
        </FilterSection>
      ))}
      <div className="pt-6 space-y-3">
        <button onClick={() => setFilters({ availability: [], price: [0, 5000], brand: [], age: [], gender: [], material: [], size: [], color: [], discount: [], type: [] })} className="w-full h-12 bg-white border-[1.5px] border-dashed border-black/10 text-[#444] rounded-xl text-[11px] font-black uppercase tracking-widest hover:border-[#E84949] hover:text-[#E84949] transition-all">
          Remove All
        </button>
        <button onClick={() => setIsFilterOpen(false)} className="w-full h-12 bg-[#E84949] text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">
          Apply
        </button>
      </div>
    </div>
  )

  return (
    <div className="bg-[#FDF4E6] min-h-screen font-grandstander overflow-x-hidden">
      {/* Hero Section */}
      <div className="shell relative h-[350px] md:h-[450px] overflow-hidden flex items-center justify-center rounded-[30px] md:rounded-[50px] mt-6">
        <img src={bannerImg} alt={displayTitle} className="absolute inset-0 w-full h-full object-cover brightness-[0.5] scale-105" />
        <div className="relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
             <p className="text-[#E84949] text-[10px] md:text-[12px] font-black uppercase tracking-[0.5em] mb-4">Premium {category?.replaceAll('-', ' ')} Collection</p>
             <h1 className="text-4xl md:text-7xl font-black text-white tracking-tighter uppercase">{displayTitle}</h1>
          </motion.div>
        </div>
      </div>

      <div className="shell pb-12">
        {/* Breadcrumbs & Search */}
        <div className="py-6 md:py-12 space-y-4 md:space-y-8">
          <nav className="flex items-center gap-2 text-[10px] md:text-[11px] font-black uppercase tracking-widest text-[#444]/30 overflow-hidden whitespace-nowrap">
            <Link to="/" className="hover:text-[#E84949]">Home</Link>
            <ChevronRight size={10} />
            <Link to={`/collections/${category}`} className="hover:text-[#E84949]">{category?.replaceAll('-', ' ')}</Link>
            {subcategory && (
              <>
                <ChevronRight size={10} />
                <span className="text-[#444]">{subcategory?.replaceAll('-', ' ')}</span>
              </>
            )}
          </nav>

          <div className="max-w-2xl mx-auto relative group">
            <input 
              type="text"
              value={innerSearch}
              onChange={(e) => setInnerSearch(e.target.value)}
              placeholder="Search in this collection..."
              className="w-full h-14 md:h-16 bg-white/50 border-2 border-dashed border-black/10 rounded-[25px] px-8 pl-14 text-[14px] md:text-[16px] font-bold outline-none focus:border-[#E84949] focus:bg-white transition-all shadow-sm"
            />
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-black/20 group-focus-within:text-[#E84949] transition-colors" size={24} />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-2 items-start">
          <aside className="hidden lg:block w-72 xl:w-80 shrink-0 sticky top-28">
            <div className="border-[1.5px] border-dashed border-black/10 rounded-[35px] p-8">
               <h3 className="text-[14px] font-black uppercase tracking-widest text-[#444] mb-6 flex items-center gap-2">
                 <SlidersHorizontal size={16} className="text-[#E84949]" /> Filter:
               </h3>
               <FilterContent />
            </div>
          </aside>

          <main className="flex-1 w-full space-y-6 overflow-hidden">
            {/* Refined Toolbar */}
            <div className="bg-[#F9EAD3] border-[1.5px] border-dashed border-black/10 rounded-[25px] p-3 md:p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button onClick={() => setIsFilterOpen(true)} className="lg:hidden p-2.5 rounded-xl bg-[#FDF4E6] border border-dashed border-black/5 shadow-sm transition-all active:scale-95"><SlidersHorizontal size={16} className="text-[#444]"/></button>
                
                {/* Desktop Grid Toggles - Softened Style */}
                <div className="hidden lg:flex items-center gap-2">
                  <button onClick={() => setGridCols(3)} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 ${gridCols === 3 ? 'bg-[#E84949] text-white shadow-lg' : 'bg-[#333] text-white/30 hover:text-white hover:bg-[#222]'}`}>
                    <div className="flex gap-[2px]">
                      <div className="w-[3px] h-4 bg-current rounded-full"/>
                      <div className="w-[3px] h-4 bg-current rounded-full"/>
                      <div className="w-[3px] h-4 bg-current rounded-full"/>
                    </div>
                  </button>
                  <button onClick={() => setGridCols(2)} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 ${gridCols === 2 ? 'bg-[#E84949] text-white shadow-lg' : 'bg-[#333] text-white/30 hover:text-white hover:bg-[#222]'}`}>
                    <div className="flex gap-[2px]">
                      <div className="w-[3px] h-4 bg-current rounded-full"/>
                      <div className="w-[3px] h-4 bg-current rounded-full"/>
                    </div>
                  </button>
                  <button onClick={() => setGridCols(1)} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 ${gridCols === 1 ? 'bg-[#E84949] text-white shadow-lg' : 'bg-[#333] text-white/30 hover:text-white hover:bg-[#222]'}`}>
                    <div className="flex flex-col gap-[3px]">
                      <div className="w-4 h-[2px] bg-current rounded-full"/>
                      <div className="w-4 h-[2px] bg-current rounded-full"/>
                    </div>
                  </button>
                </div>
              </div>

              {/* Centered Sort By - More compact on mobile */}
              <div className="flex-1 flex justify-center">
                <div className="bg-[#FDF4E6] px-3 md:px-6 py-2 md:py-3 rounded-xl border border-dashed border-black/5 flex items-center gap-2 md:gap-3 shadow-sm">
                   <span className="hidden sm:inline text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-[#444]/60">Sort:</span>
                   <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-transparent text-[11px] md:text-[12px] font-black outline-none cursor-pointer text-[#444] min-w-[100px] md:min-w-[140px]">
                      <option value="relevance">Featured</option>
                      <option value="best-selling">Best selling</option>
                      <option value="alpha-asc">A-Z</option>
                      <option value="alpha-desc">Z-A</option>
                      <option value="price-asc">Low to high</option>
                      <option value="price-desc">High to low</option>
                      <option value="newest">Newest</option>
                   </select>
                </div>
              </div>

              {/* Right Aligned Count - More compact on mobile */}
              <div className="bg-[#FDF4E6] px-3 md:px-6 py-2 md:py-3 rounded-xl border border-dashed border-black/5 text-[10px] md:text-[12px] font-black text-[#444] whitespace-nowrap shadow-sm">
                {meta.total || processedProducts.length} <span className="hidden sm:inline">products</span><span className="sm:hidden">pcs</span>
              </div>
            </div>

            {/* Product Grid */}
            {error && (
              <div className="rounded-[24px] border-[1.5px] border-dashed border-[#E84949]/30 bg-[#F9EAD3] p-8 text-center text-[13px] font-bold text-[#E84949]">
                {error}
              </div>
            )}

            {!error && (
              <div className={`grid gap-6 md:gap-8 ${
                gridCols === 3 ? 'grid-cols-2 xl:grid-cols-3' : 
                gridCols === 2 ? 'grid-cols-2' : 
                'grid-cols-1'
              }`}>
                <AnimatePresence mode="popLayout">
                  {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
                  ) : paginatedProducts.length > 0 ? (
                    paginatedProducts.map((p, i) => (
                      <ProductCard key={p.id} p={p} i={i} isGridOne={gridCols === 1} />
                    ))
                  ) : (
                    <div className="col-span-full rounded-[30px] border-[1.5px] border-dashed border-black/10 bg-[#F9EAD3] p-12 text-center">
                      <h3 className="text-2xl font-black uppercase text-[#444]">No products found</h3>
                      <p className="mt-3 text-[13px] font-bold text-[#444]/60">
                        We could not find any live products for {displayTitle}.
                      </p>
                      <p className="mt-2 text-[12px] font-medium text-[#444]/50">Try changing filters, search terms, or check another category.</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Pagination (Refined Responsive) */}
            {!isLoading && totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-12">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="w-12 h-12 rounded-2xl border-2 border-dashed border-black/10 flex items-center justify-center text-[#444] disabled:opacity-10 hover:border-[#E84949] transition-all">
                  <ChevronLeft size={20} />
                </button>
                <div className="flex items-center gap-2">
                  {getVisiblePages().map(page => (
                    <button key={page} onClick={() => setCurrentPage(page)} className={`w-12 h-12 rounded-2xl font-black text-[14px] transition-all ${currentPage === page ? 'bg-[#E84949] text-white shadow-lg scale-110' : 'bg-transparent border-2 border-dashed border-black/10 text-[#444] hover:border-[#E84949]'}`}>
                      {page}
                    </button>
                  ))}
                </div>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="w-12 h-12 rounded-2xl border-2 border-dashed border-black/10 flex items-center justify-center text-[#444] disabled:opacity-10 hover:border-[#E84949] transition-all">
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isFilterOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsFilterOpen(false)} className="fixed inset-0 bg-black/40 z-[2000] backdrop-blur-sm" />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed inset-y-0 left-0 w-[85%] max-w-[340px] bg-[#FDF4E6] z-[2100] p-6 overflow-y-auto custom-scrollbar shadow-2xl flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-[#444] uppercase tracking-tight">Filters</h3>
                <button onClick={() => setIsFilterOpen(false)} className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center"><X size={20}/></button>
              </div>
              <div className="flex-1">
                <FilterContent />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
