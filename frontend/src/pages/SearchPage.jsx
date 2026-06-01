import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ShoppingCart, Heart, Repeat, LayoutGrid } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { getProducts } from '../services/catalogApi'

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const [searchTerm, setSearchTerm] = useState(query)
  const [filteredProducts, setFilteredProducts] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    window.scrollTo(0, 0)
    setSearchTerm(query)

    let isMounted = true
    const loadResults = async () => {
      if (!query) {
        setFilteredProducts([])
        return
      }

      setIsLoading(true)
      setError('')
      try {
        const payload = await getProducts({ search: query, limit: 24, sort: 'relevance' })
        if (isMounted) setFilteredProducts(payload.products)
      } catch (err) {
        if (!isMounted) return
        setFilteredProducts([])
        setError(err.message || 'Search failed')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadResults()
    return () => {
      isMounted = false
    }
  }, [query])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      setSearchParams({ q: searchTerm })
    }
  }

  return (
    <div className="bg-[#FDF4E6] min-h-screen py-24 font-roboto">
      <div className="shell">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-grandstander font-bold text-[#333] mb-8 tracking-tighter">
            {query ? `Search Results for "${query}"` : 'Search Our Toys'}
          </h1>
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative group">
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for dolls, puzzles, vehicles..." 
              className="w-full h-16 bg-[#F9EAD3] border-[1.6px] border-dashed border-[#333]/20 rounded-full px-10 pr-20 text-[16px] outline-none focus:border-[#E84949] transition-all shadow-sm placeholder-[#666]"
            />
            <button type="submit" className="absolute right-2 top-2 bottom-2 w-12 bg-[#E84949] text-white rounded-full flex items-center justify-center hover:bg-[#333] transition-all">
              <Search size={20} />
            </button>
          </form>
        </div>

        {query && isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="aspect-square rounded-[24px] bg-[#F9EAD3] border-[1.6px] border-dashed border-[#333]/10 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-[32px] border-[1.6px] border-dashed border-[#E84949]/30 bg-[#F9EAD3] p-10 text-center text-[#E84949] font-bold">
            {error}
          </div>
        ) : query && filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
            {filteredProducts.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group relative flex flex-col"
              >
                <Link to={`/product/${p.slug || p.id}`} className="dashed-card relative overflow-hidden flex items-center justify-center bg-white shadow-sm hover:shadow-xl transition-all duration-300 p-2 aspect-square mb-4">
                  <div className="absolute top-3 -right-12 z-40 flex flex-col gap-2 group-hover:right-3 transition-all duration-500 ease-out opacity-0 group-hover:opacity-100">
                    <button className="h-9 w-9 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#E84949] hover:text-white transition-colors border border-transparent hover:border-[#E84949]"><ShoppingCart size={15} /></button>
                    <button className="h-9 w-9 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#E84949] hover:text-white transition-colors border border-transparent hover:border-[#E84949]"><Heart size={15} /></button>
                    <button className="h-9 w-9 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#E84949] hover:text-white transition-colors border border-transparent hover:border-[#E84949]"><Repeat size={15} /></button>
                  </div>
                  <img src={p.img} alt={p.name} className="w-full h-full object-cover rounded-[10px] transition-transform duration-1000 group-hover:scale-110" />
                </Link>

                <div className="text-center">
                  <Link to={`/product/${p.slug || p.id}`}>
                    <h3 className="font-grandstander text-[14px] md:text-[17px] font-bold text-[#333] group-hover:text-[#E84949] transition-colors leading-tight tracking-tight capitalize">{p.name}</h3>
                  </Link>
                  <div className="flex items-center justify-center gap-3 mt-1">
                    {p.oldPrice && p.oldPrice > (p.price || 0) && (
                      <span className="text-[12px] text-gray-600 line-through font-bold">₹{p.oldPrice.toFixed(2)}</span>
                    )}
                    <span className="text-[15px] font-bold text-[#FF4E50] font-grandstander tracking-tight">₹{(p.price || 0).toFixed(2)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : query ? (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center p-16 md:p-24 bg-[#F9EAD3] rounded-[48px] border-[1.6px] border-dashed border-[#333333]/15 shadow-xl text-center"
            >
                <div className="w-24 h-24 rounded-full bg-white/20 border-[1.6px] border-dashed border-[#333]/30 flex items-center justify-center text-[#666] mb-10">
                    <Search size={40} />
                </div>
                <h2 className="text-3xl md:text-4xl font-grandstander font-bold text-[#333] mb-6 tracking-tighter">No results found</h2>
                <p className="max-w-xl mx-auto font-roboto text-[16px] md:text-[18px] text-[#333] leading-relaxed mb-12">
                    We couldn't find anything matching your search. Try using different keywords or explore our most popular categories!
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                    {['Dolls', 'Toys', 'Puzzles', 'Vehicles'].map(cat => (
                    <Link 
                        key={cat} 
                        to={`/collections/${cat.toLowerCase()}`} 
                        className="px-8 py-3 bg-white/30 border border-dashed border-[#333]/20 rounded-full font-bold text-[12px] tracking-widest text-[#333] hover:bg-[#E84949] hover:text-white transition-all uppercase"
                    >
                        {cat}
                    </Link>
                    ))}
                </div>
            </motion.div>
        ) : (
            <div className="text-center py-20 text-[#666]">
                <p className="text-[18px] font-bold uppercase tracking-[0.2em] opacity-40">Type to search for something amazing...</p>
            </div>
        )}
      </div>
    </div>
  )
}
