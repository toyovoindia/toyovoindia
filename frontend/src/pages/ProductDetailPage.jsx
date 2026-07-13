import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Star, Heart, Share2, Eye, ShoppingCart, Search, Repeat, Plus, Minus, CheckCircle, X, ChevronRight, Share, ZoomIn, Layers } from 'lucide-react'


const productImages = [
  "https://images.unsplash.com/photo-1532330393533-443990a51d10?auto=format&fit=crop&q=80&w=800"
]

import { ProductCard } from '../components/ui/ProductCard'
import { getProductBySlug, getProducts } from '../services/catalogApi'
import { ReviewSection } from '../components/sections/ReviewSection'

const FAQItem = ({ question, answer, isOpen, onToggle }) => (
  <div className="border-b border-[#E5E5E5] py-6">
    <button onClick={onToggle} className="w-full flex justify-between items-center text-left group">
      <span className="font-grandstander font-bold text-[16px] md:text-[18px] text-[#333333] group-hover:text-[#E84949] transition-colors leading-tight tracking-tight">{question}</span>
      <div className={`w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center transition-all shrink-0 ${isOpen ? 'bg-[#E84949] border-[#E84949] text-white' : 'text-gray-400'}`}>
        {isOpen ? <Minus size={12} /> : <Plus size={12} />}
      </div>
    </button>
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
          <p className="pt-5 text-[14px] leading-relaxed text-[#666666] font-roboto italic">{answer}</p>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
)

const ZoomOverlay = ({ src, onClose }) => {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const containerRef = useRef(null)
  const imageRef = useRef(null)
  
  const stateRef = useRef({
    initialDistance: 0,
    initialScale: 1,
    isPanning: false,
    startPan: { x: 0, y: 0 },
    lastTap: 0
  })

  useEffect(() => {
    const preventDefault = (e) => {
      if (e.touches && e.touches.length > 1) {
        e.preventDefault()
      }
    }
    document.addEventListener('touchmove', preventDefault, { passive: false })
    return () => {
      document.removeEventListener('touchmove', preventDefault)
    }
  }, [])

  const handleWheel = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const zoomFactor = 0.15
    const direction = e.deltaY < 0 ? 1 : -1
    const newScale = Math.min(Math.max(1, scale + direction * zoomFactor), 4)
    setScale(newScale)
    if (newScale === 1) {
      setPosition({ x: 0, y: 0 })
    }
  }

  const handleDoubleTap = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (scale > 1) {
      setScale(1)
      setPosition({ x: 0, y: 0 })
    } else {
      setScale(2.5)
      setPosition({ x: 0, y: 0 })
    }
  }

  const handleTouchStart = (e) => {
    e.stopPropagation()
    const now = Date.now()
    if (now - stateRef.current.lastTap < 300) {
      handleDoubleTap(e)
      stateRef.current.lastTap = 0
      return
    }
    stateRef.current.lastTap = now

    if (e.touches.length === 2) {
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const dist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY)
      stateRef.current.initialDistance = dist
      stateRef.current.initialScale = scale
    } else if (e.touches.length === 1 && scale > 1) {
      stateRef.current.isPanning = true
      stateRef.current.startPan = {
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      }
    }
  }

  const handleTouchMove = (e) => {
    e.stopPropagation()
    if (e.touches.length === 2 && stateRef.current.initialDistance > 0) {
      e.preventDefault()
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const dist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY)
      const ratio = dist / stateRef.current.initialDistance
      const newScale = Math.min(Math.max(1, stateRef.current.initialScale * ratio), 4)
      setScale(newScale)
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 })
      }
    } else if (e.touches.length === 1 && stateRef.current.isPanning && scale > 1) {
      e.preventDefault()
      const x = e.touches[0].clientX - stateRef.current.startPan.x
      const y = e.touches[0].clientY - stateRef.current.startPan.y
      const maxDeltaX = (scale - 1) * window.innerWidth / 2
      const maxDeltaY = (scale - 1) * window.innerHeight / 2
      setPosition({
        x: Math.min(Math.max(x, -maxDeltaX), maxDeltaX),
        y: Math.min(Math.max(y, -maxDeltaY), maxDeltaY)
      })
    }
  }

  const handleTouchEnd = (e) => {
    e.stopPropagation()
    stateRef.current.initialDistance = 0
    stateRef.current.isPanning = false
  }

  const handleMouseDown = (e) => {
    if (scale <= 1) return
    e.preventDefault()
    e.stopPropagation()
    stateRef.current.isPanning = true
    stateRef.current.startPan = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    }
  }

  const handleMouseMove = (e) => {
    if (!stateRef.current.isPanning || scale <= 1) return
    e.preventDefault()
    e.stopPropagation()
    const x = e.clientX - stateRef.current.startPan.x
    const y = e.clientY - stateRef.current.startPan.y
    const maxDeltaX = (scale - 1) * window.innerWidth / 2
    const maxDeltaY = (scale - 1) * window.innerHeight / 2
    setPosition({
      x: Math.min(Math.max(x, -maxDeltaX), maxDeltaX),
      y: Math.min(Math.max(y, -maxDeltaY), maxDeltaY)
    })
  }

  const handleMouseUp = () => {
    stateRef.current.isPanning = false
  }

  const handleReset = (e) => {
    if (scale > 1) {
      setScale(1)
      setPosition({ x: 0, y: 0 })
    } else {
      onClose()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4 touch-none select-none"
      onClick={handleReset}
      onWheel={handleWheel}
    >
      <button 
        onClick={(e) => { e.stopPropagation(); onClose(); }} 
        className="absolute top-6 left-6 text-white p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors z-[10000] shadow-lg pointer-events-auto"
      >
        <X size={24} />
      </button>

      <div 
        ref={containerRef}
        className="w-full h-full flex items-center justify-center overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img 
          ref={imageRef}
          src={src} 
          alt="Zoomed" 
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: stateRef.current.isPanning ? 'none' : 'transform 0.15s ease-out',
            touchAction: 'none'
          }}
          className="max-w-full max-h-[90vh] object-contain cursor-grab active:cursor-grabbing pointer-events-none"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </motion.div>
  )
}

export function ProductDetailPage() {
  const { title } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { addToCart, wishlist, toggleWishlist, compare, toggleCompare, cartItems } = useCart()
  const { success, error: showError } = useToast()
  const { user } = useAuth()
  
  const [showBuyNowModal, setShowBuyNowModal] = useState(false)
  const [selectedImg, setSelectedImg] = useState(0)
  const [quantity, setQuantity] = useState(1)
  
  const queryParams = new URLSearchParams(location.search)
  const [activeTab, setActiveTab] = useState(queryParams.get('tab') || 'description')

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get('tab')
    if (tab) {
      setActiveTab(tab)
    }
  }, [location.search])

  const [openFAQ, setOpenFAQ] = useState(null)
  const [showSticky, setShowSticky] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [selectedSize, setSelectedSize] = useState('Small')
  const [selectedColor, setSelectedColor] = useState('Red')
  const [isZoomed, setIsZoomed] = useState(false)
  const [showStoreInfo, setShowStoreInfo] = useState(false)
  const [productState, setProductState] = useState(null)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [isLoadingProduct, setIsLoadingProduct] = useState(true)
  const [productError, setProductError] = useState('')
  const [showShareDropdown, setShowShareDropdown] = useState(false)
  const [activeViewers, setActiveViewers] = useState(21)

  useEffect(() => {
    if (productState) {
      const views = productState.views || 0
      const base = views > 0 ? Math.max(3, (views % 28) + 5) : Math.floor(Math.random() * 15) + 10
      setActiveViewers(base)
      
      const interval = setInterval(() => {
        setActiveViewers(prev => {
          const delta = Math.floor(Math.random() * 5) - 2
          return Math.max(2, prev + delta)
        })
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [productState?.views])

  useEffect(() => {
    let isMounted = true
    setShowToast(false)
    setIsLoadingProduct(true)
    setProductError('')
    setSelectedImg(0)

    const loadProduct = async () => {
      try {
        const data = await getProductBySlug(title)
        if (!isMounted) return
        setProductState(data)

        const relatedPayload = await getProducts({
          category: data.category,
          limit: 8,
          sort: 'best-selling',
        })
        if (isMounted) {
          setRelatedProducts(relatedPayload.products.filter(item => item.id !== data.id))
        }
      } catch (err) {
        if (!isMounted) return
        setProductState(null)
        setRelatedProducts([])
        setProductError(err.message || 'Product could not be loaded')
      } finally {
        if (isMounted) setIsLoadingProduct(false)
      }
    }

    loadProduct()
    const handleScroll = () => setShowSticky(window.scrollY > 600)
    window.addEventListener('scroll', handleScroll)
    return () => {
      isMounted = false
      window.removeEventListener('scroll', handleScroll)
    }
  }, [title])

  useEffect(() => {
    if (showStoreInfo) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      const savedScrollY = document.body.style.top;
      if (savedScrollY) {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, parseInt(savedScrollY || '0') * -1);
      }
    }
    return () => {
      if (showStoreInfo) {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
      }
    }
  }, [showStoreInfo])

  const fallbackProduct = {
    id: title?.toLowerCase() || 'product-08',
    title: title?.replaceAll('-', ' ') || "KidsKraze Creations",
    name: title?.replaceAll('-', ' ') || "KidsKraze Creations",
    price: 89.00,
    oldPrice: 129.00,
    img: productImages[0] || 'https://images.unsplash.com/photo-1532330393533-443990a51d10?auto=format&fit=crop&q=80&w=800',
    sku: "Product-08",
    category: "Toys",
    stock: 15
  }
  const product = productState || fallbackProduct
  const currentStock = typeof product.stock === 'number' ? product.stock : 15
  const galleryImages = productState?.images?.length
    ? productState.images.map(image => image.url).filter(Boolean)
    : [productState?.thumbnail?.url || product.img || productImages[0]]

  const handleReviewsChange = (reviewsList) => {
    if (!reviewsList) return
    const approvedReviews = reviewsList.filter(r => r.status === 'approved')
    const totalCount = approvedReviews.length
    const avgRating = totalCount > 0 
      ? (approvedReviews.reduce((acc, r) => acc + r.rating, 0) / totalCount).toFixed(1)
      : 0

    setProductState(prev => {
      if (!prev) return prev
      if (prev.reviewCount === totalCount && Number(prev.ratingAverage) === Number(avgRating)) return prev
      return {
        ...prev,
        reviewCount: totalCount,
        ratingAverage: Number(avgRating)
      }
    })
  }

  const isWishlisted = wishlist.some(item => item.id === product.id)

  const handleAddToCart = () => {
    const stockAvailable = currentStock
    if (stockAvailable <= 0) {
      showError('This product is out of stock.')
      return
    }
    if (quantity > stockAvailable) {
      showError(`Cannot add more than ${stockAvailable} units to cart.`)
      return
    }
    const existing = cartItems?.find(item => item.id === product.id)
    const currentQty = existing ? existing.qty : 0
    if (currentQty + quantity > stockAvailable) {
      showError(`You already have ${currentQty} units in your cart. Cannot add ${quantity} more (Stock limit: ${stockAvailable}).`)
      return
    }

    const added = addToCart(product, quantity)
    if (added) {
      success(`${product.title || product.name} added to cart!`)
      navigate('/cart')
    }
  }

  const handleBuyNow = () => {
    const stockAvailable = currentStock
    if (stockAvailable <= 0) {
      showError('This product is out of stock.')
      return
    }
    if (quantity > stockAvailable) {
      showError(`Cannot buy more than ${stockAvailable} units.`)
      return
    }
    if (cartItems && cartItems.length > 0) {
      setShowBuyNowModal(true)
    } else {
      sessionStorage.setItem('TOYOVOINDIA_buyNowItem', JSON.stringify({ ...product, qty: quantity }))
      success(`Proceeding to checkout with ${product.title || product.name}...`)
      navigate('/checkout')
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title || product.name,
          text: 'Check out this amazing toy!',
          url: window.location.href,
        })
      } catch (err) {
        if (err.name !== 'AbortError') {
          setShowShareDropdown(prev => !prev)
        }
      }
    } else {
      setShowShareDropdown(prev => !prev)
    }
  }

  const handleCompare = () => {
    if (!user) {
      navigate('/login')
      return
    }
    const isCompared = compare?.some(item => item.id === product.id)
    toggleCompare(product)
    success(isCompared ? `${product.title || product.name} removed from comparison.` : `${product.title || product.name} added to comparison!`)
    navigate('/compare')
  }

  const fallbackRelated = [
    { id: 1, name: 'Planet Toy Explorer', price: 126, img: productImages[0], hoverImg: productImages[0] },
    { id: 2, name: 'WildHarvests Maker Toy', price: 150, img: productImages[0], hoverImg: productImages[0] },
    { id: 3, name: 'Rainbow Stacker Set', price: 85, img: productImages[0], hoverImg: productImages[0] },
    { id: 4, name: 'JoyfulJamboree Juniors', price: 89, img: productImages[0], hoverImg: productImages[0] },
  ]
  const related = relatedProducts.length ? relatedProducts : fallbackRelated

  const recentlyViewed = [
    { id: 5, name: 'TinyTinker Toys', price: 60, img: productImages[0], hoverImg: productImages[0] },
    { id: 6, name: 'Baby Activity Mat', price: 130, img: productImages[0], hoverImg: productImages[0] },
  ]

  if (isLoadingProduct && !productState) {
    return (
      <div className="bg-[#FDF4E6] min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-4xl rounded-[36px] border-[1.5px] border-dashed border-black/10 bg-[#F9EAD3] p-8 md:p-12 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="aspect-square rounded-[28px] bg-black/5" />
            <div className="space-y-5">
              <div className="h-5 rounded bg-black/5 w-1/3" />
              <div className="h-12 rounded bg-black/5 w-3/4" />
              <div className="h-8 rounded bg-black/5 w-1/2" />
              <div className="h-28 rounded bg-black/5 w-full" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (productError && !productState) {
    return (
      <div className="bg-[#FDF4E6] min-h-screen flex items-center justify-center px-6 text-center">
        <div className="max-w-xl rounded-[36px] border-[1.5px] border-dashed border-[#E84949]/30 bg-[#F9EAD3] p-10">
          <h1 className="text-3xl font-black uppercase text-[#444]">Product not found</h1>
          <p className="mt-4 text-[14px] font-bold text-[#444]/60">{productError}</p>
          <Link to="/all-categories" className="mt-8 inline-flex h-12 items-center rounded-xl bg-[#E84949] px-8 text-[12px] font-black uppercase tracking-widest text-white">
            Browse Products
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#FDF4E6] pb-8 overflow-x-hidden">
      {/* Full Screen Zoom Overlay with Pinch/Wheel Zoom */}
      <AnimatePresence>
        {isZoomed && (
          <ZoomOverlay
            src={galleryImages[selectedImg]}
            onClose={() => setIsZoomed(false)}
          />
        )}
      </AnimatePresence>

      {/* Sales Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="fixed bottom-6 left-4 md:left-6 z-100 bg-[#F9EAD3] rounded-2xl shadow-xl p-4 flex items-center gap-4 border border-dashed border-[#333]/20 min-w-70 sm:min-w-[320px]"
          >
            <button onClick={() => setShowToast(false)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"><X size={14} /></button>
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-white shrink-0 border-[1.2px] border-dashed border-[#333]/30">
              <img src={galleryImages[1] || galleryImages[0]} alt="" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-[11px] text-[#666666]">Ishaan Purchased ! - From Bangalore</p>
              <h4 className="text-[13px] font-bold text-[#333333] my-0.5 font-grandstander tracking-tight">KidsKraze Creations</h4>
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="text-gray-400">5 minute ago</span>
                <span className="flex items-center gap-1 text-green-600 font-bold"><CheckCircle size={10} /> Verified</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Add-to-Cart Bar */}
      <AnimatePresence>
        {showSticky && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 w-full z-[1000] bg-[#F9EAD3] border-t-[1.6px] border-dashed border-[#333333]/10 py-3 shadow-2xl"
          >
            <div className="shell flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="hidden sm:block w-12 h-12 rounded-lg border-[1.2px] border-dashed border-[#333]/30 overflow-hidden bg-[#FDF4E6]">
                  <img src={product.thumbnail?.url || product.images?.[0]?.url || product.img || 'https://images.unsplash.com/photo-1532330393533-443990a51d10?auto=format&fit=crop&q=80&w=800'} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-[#333333] hidden lg:block font-grandstander tracking-tight">{product.title || product.name}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[#E84949] font-bold text-[18px]">₹{Number(product.price || 0).toFixed(2)}</span>
                    {product.oldPrice && <span className="text-[12px] text-gray-600 line-through font-bold">₹{Number(product.oldPrice).toFixed(2)}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {currentStock <= 0 ? (
                  <button disabled className="h-10 px-6 bg-gray-400 text-white text-[12px] font-bold rounded-full cursor-not-allowed uppercase tracking-widest">OUT OF STOCK</button>
                ) : (
                  <>
                    <div className="flex items-center h-10 bg-[#FDF4E6] border border-[#333]/20 rounded-full px-2">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 text-[#666] hover:text-[#E84949]"><Minus size={14} /></button>
                      <span className="w-6 text-center font-bold text-[13px] text-[#333]">{quantity}</span>
                      <button 
                        onClick={() => {
                          if (quantity + 1 <= currentStock) {
                            setQuantity(quantity + 1)
                          } else {
                            showError(`Only ${currentStock} units left in stock.`)
                          }
                        }} 
                        className="w-8 text-[#666] hover:text-[#E84949]"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <button onClick={handleAddToCart} className="h-10 px-6 sm:px-10 bg-[#E84949] text-white text-[12px] font-bold rounded-full hover:scale-105 transition-all tracking-widest uppercase">ADD TO CART</button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-6 sm:pt-10">
        <div className="shell ">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-[11px] md:text-[12px] text-[#666] mb-8 tracking-widest font-bold">
            <Link to="/" className="hover:text-[#E84949] transition-colors">Home</Link>
            <span className="text-gray-300">/</span>
            <span className="text-[#333] capitalize">{product.title || product.name}</span>
          </nav>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 xl:gap-12 items-stretch relative">
            {/* Gallery Section*/}
            <div className="md:col-span-7 relative">
              {/* Desktop/Tablet 2-Column Grid */}
              <div className="hidden md:block absolute inset-0 overflow-y-auto [&::-webkit-scrollbar]:w-[4px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full pr-3 pb-4">
                <div className="grid grid-cols-2 gap-4">
                  {galleryImages.map((img, i) => (
                    <div 
                      key={i} 
                      onClick={() => { setSelectedImg(i); setIsZoomed(true); }}
                      className="aspect-square rounded-2xl overflow-hidden bg-[#FDF4E6] relative group cursor-zoom-in"
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedImg(i); setIsZoomed(true); }}
                        className="absolute top-4 left-4 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ZoomIn size={14} className="text-[#333]" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile Slider */}
              <div className="md:hidden flex flex-col gap-4">
                <div 
                  id="mobile-gallery-top"
                  className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
                  onScroll={(e) => {
                    const index = Math.round(e.target.scrollLeft / e.target.offsetWidth);
                    if(index !== selectedImg) setSelectedImg(index);
                  }}
                  style={{ scrollBehavior: 'smooth' }}
                >
                  {galleryImages.map((img, i) => (
                    <div 
                      key={i} 
                      onClick={() => { setSelectedImg(i); setIsZoomed(true); }}
                      className="w-full shrink-0 snap-center relative aspect-square rounded-2xl overflow-hidden bg-[#FDF4E6] cursor-zoom-in"
                    >
                       <img src={img} alt="" className="w-full h-full object-cover" />
                       <button onClick={(e) => { e.stopPropagation(); setIsZoomed(true); }} className="absolute top-4 left-4 w-8 h-8 rounded-full flex items-center justify-center shadow-sm">
                          <ZoomIn size={14} className="text-[#333]" />
                       </button>
                    </div>
                  ))}
                </div>
                {/* Mobile Thumbnails with borders and arrows */}
                <div className="relative border border-dashed border-[#E5E5E5] p-2 rounded-xl">
                  <button 
                    disabled={selectedImg === 0}
                    onClick={() => {
                      const newIdx = Math.max(0, selectedImg - 1);
                      setSelectedImg(newIdx);
                      const topGallery = document.getElementById('mobile-gallery-top');
                      if(topGallery) topGallery.scrollLeft = topGallery.offsetWidth * newIdx;
                    }} 
                    className={`absolute left-0 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-sm z-10 shadow-sm transition-colors ${selectedImg === 0 ? 'bg-[#E5E5E5] text-white' : 'bg-[#E84949] text-white'}`}
                  >
                    <ChevronRight size={14} className="rotate-180" />
                  </button>
                  
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide px-6">
                    {galleryImages.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setSelectedImg(i);
                          const topGallery = document.getElementById('mobile-gallery-top');
                          if(topGallery) topGallery.scrollLeft = topGallery.offsetWidth * i;
                        }}
                        className={`w-16 h-16 rounded-lg overflow-hidden border transition-all shrink-0 ${selectedImg === i ? 'border-[#333] p-[1px]' : 'border-transparent opacity-60'}`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover rounded-md" />
                      </button>
                    ))}
                  </div>

                  <button 
                    disabled={selectedImg === galleryImages.length - 1}
                    onClick={() => {
                      const newIdx = Math.min(galleryImages.length - 1, selectedImg + 1);
                      setSelectedImg(newIdx);
                      const topGallery = document.getElementById('mobile-gallery-top');
                      if(topGallery) topGallery.scrollLeft = topGallery.offsetWidth * newIdx;
                    }} 
                    className={`absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-sm z-10 shadow-sm transition-colors ${selectedImg === galleryImages.length - 1 ? 'bg-[#E5E5E5] text-white' : 'bg-[#E84949] text-white'}`}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>

            <div className="md:col-span-5 flex flex-col gap-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] md:text-[11px] font-black tracking-[0.2em] text-[#666] uppercase">{product.category || 'Toys'}</p>
                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                  <p className={`text-[10px] md:text-[11px] font-black tracking-[0.2em] uppercase ${
                    currentStock <= 0 ? 'text-red-600' : currentStock <= (product.lowStockThreshold || 10) ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {currentStock <= 0 
                      ? 'Out of Stock' 
                      : currentStock <= (product.lowStockThreshold || 10) 
                        ? `Low Stock (${currentStock} left)` 
                        : `In Stock (${currentStock} available)`}
                  </p>
                </div>
                
                <h1 className="font-grandstander font-black text-[#333] text-[28px] md:text-[36px] xl:text-[42px] leading-tight tracking-tight">{product.title || product.name}</h1>

                <div className="flex items-center gap-4 py-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={14} className={s <= Math.round(product.ratingAverage || 0) ? 'fill-[#E84949] text-[#E84949]' : 'text-gray-300'} />
                    ))}
                  </div>
                  <button 
                    onClick={() => {
                      setActiveTab('reviews');
                      document.getElementById('tabs-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-[12px] font-bold text-[#666] hover:text-[#E84949] transition-colors underline underline-offset-4"
                  >
                    ({product.reviewCount || 0} Customer Reviews)
                  </button>
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <div className="flex items-baseline gap-3">
                    <span className="text-2xl md:text-3xl font-black text-[#E84949] tracking-tight">₹{Number(product.price || 0).toFixed(2)}</span>
                    {product.oldPrice && (
                      <span className="text-lg text-gray-600 line-through font-bold tracking-tight">₹{Number(product.oldPrice).toFixed(2)}</span>
                    )}
                  </div>
                  {product.oldPrice && product.oldPrice > product.price && (
                    <span className="bg-[#E84949] text-white text-[10px] font-black px-3 py-1 rounded-full shadow-sm uppercase tracking-widest">Sale</span>
                  )}
                </div>

                <div className="space-y-4 py-5 border-y border-dashed border-gray-300">
                  <div className="flex items-center gap-3 text-[14px] text-[#333]">
                    <Eye size={18} className="text-[#666]" />
                    <span><strong>{activeViewers} people</strong> are viewing this right now</span>
                  </div>
                  <div className="flex items-center gap-3 text-[14px] text-[#333]">
                    <div className="w-4.5 h-4.5 rounded-full border border-[#333] flex items-center justify-center text-[10px]"><X size={10} /></div>
                    <span>Sold <strong>{Math.max(product.soldCount || 0, 0)} Product</strong> In last 24 Hours</span>
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={() => { 
                        if (!user) {
                          navigate('/login');
                          return;
                        }
                        const isCurrentlyWishlisted = wishlist.some(item => item.id === product.id);
                        toggleWishlist(product); 
                        success(isCurrentlyWishlisted ? `${product.title || product.name} removed from wishlist.` : `${product.title || product.name} added to wishlist!`);
                      }}
                      className={`w-9 h-9 rounded flex items-center justify-center hover:scale-110 transition-transform bg-[#E84949] text-white`}
                      title="Add to Wishlist"
                    >
                      <Heart size={16} fill={isWishlisted ? 'white' : 'none'} />
                    </button>
                    <button onClick={handleCompare} className="w-9 h-9 rounded bg-[#E84949] text-white flex items-center justify-center hover:scale-110 transition-transform" title="Compare"><Layers size={16} /></button>
                    
                    <div className="relative">
                      <button 
                        onClick={handleShare} 
                        className="w-9 h-9 rounded bg-[#E84949] text-white flex items-center justify-center hover:scale-110 transition-transform" 
                        title="Share Product"
                      >
                        <Share2 size={16} />
                      </button>
                      
                      {showShareDropdown && (
                        <>
                          <div className="fixed inset-0 z-[90]" onClick={() => setShowShareDropdown(false)} />
                          <div className="absolute left-0 mt-2 w-48 bg-white border border-[#E5E5E5] rounded-xl shadow-xl z-[100] py-2">
                            <a 
                              href={`https://api.whatsapp.com/send?text=${encodeURIComponent('Check out this amazing toy: ' + (product.title || product.name) + ' - ' + window.location.href)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 px-4 py-2 text-[13px] font-bold text-gray-700 hover:bg-gray-100 transition-colors"
                              onClick={() => setShowShareDropdown(false)}
                            >
                              <span className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px] font-bold">W</span>
                              Share on WhatsApp
                            </a>
                            <a 
                              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 px-4 py-2 text-[13px] font-bold text-gray-700 hover:bg-gray-100 transition-colors"
                              onClick={() => setShowShareDropdown(false)}
                            >
                              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">F</span>
                              Share on Facebook
                            </a>
                            <a 
                              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('Check out this amazing toy: ' + (product.title || product.name))}&url=${encodeURIComponent(window.location.href)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 px-4 py-2 text-[13px] font-bold text-gray-700 hover:bg-gray-100 transition-colors"
                              onClick={() => setShowShareDropdown(false)}
                            >
                              <span className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold">X</span>
                              Share on Twitter
                            </a>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(window.location.href)
                                success('Link copied to clipboard!')
                                setShowShareDropdown(false)
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2 text-[13px] font-bold text-gray-700 hover:bg-gray-100 transition-colors text-left"
                            >
                              <span className="w-5 h-5 rounded-full bg-gray-500 text-white flex items-center justify-center text-[10px] font-bold">🔗</span>
                              Copy Link
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-[13px] text-[#666] font-medium">Sku: {product.sku || (product._id || product.id || '').slice(-6).toUpperCase()}</p>
                </div>

                {(product.size?.length > 0 || product.color?.length > 0) && (
                  <div className="bg-[#F9EAD3] p-4 rounded-[20px] border-[1.2px] border-[#333333]/15 space-y-4 shadow-sm">
                    {product.size?.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[11px] font-bold text-[#666] font-grandstander">Select Size</p>
                        <div className="flex flex-wrap gap-1.5">
                          {product.size.map(size => (
                            <button
                              key={size}
                              onClick={() => setSelectedSize(size)}
                              className={`px-3 py-1 text-[11px] font-bold rounded-lg border transition-all font-grandstander ${selectedSize === size ? 'bg-[#E84949] text-white border-[#E84949]' : 'bg-[#FDF4E6] text-[#333] border-[#E5E5E5] hover:border-[#E84949]'}`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {product.color?.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[11px] font-bold text-[#666] font-grandstander">Choose Color</p>
                        <div className="flex flex-wrap gap-2">
                          {product.color.map(color => (
                            <button
                              key={color}
                              onClick={() => setSelectedColor(color)}
                              title={color}
                              className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 ${selectedColor === color ? 'border-[#333] scale-105 shadow-md' : 'border-white shadow-sm'}`}
                              style={{ background: color.toLowerCase() === 'multicolor' ? 'conic-gradient(red, yellow, green, blue, purple, red)' : color.toLowerCase() }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}


                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest">
                    {currentStock <= 0 ? (
                      <div className="flex items-center gap-2 text-red-600">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span>Out of stock!</span>
                      </div>
                    ) : currentStock <= (product.lowStockThreshold || 10) ? (
                      <div className="flex items-center gap-2 text-yellow-600">
                        <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                        <span>Only {currentStock} left in stock!</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-green-600">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span>{currentStock} units left in stock!</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  {currentStock <= 0 ? (
                    <button
                      disabled
                      className="w-full h-12 bg-gray-400 text-white rounded font-bold text-[12px] tracking-widest uppercase cursor-not-allowed"
                    >
                      OUT OF STOCK
                    </button>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <p className="text-[13px] text-[#333] font-medium">Quantity</p>
                      <div className="flex flex-row gap-4">
                        <div className="h-12 w-32 bg-[#FDF4E6] border border-[#222] rounded flex items-center justify-between px-4 shadow-sm shrink-0">
                          <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="text-[#666] hover:text-[#E84949] transition-colors"><Minus size={14} /></button>
                          <span className="font-bold text-[14px] text-[#333]">{quantity}</span>
                          <button 
                            onClick={() => {
                              if (quantity + 1 <= currentStock) {
                                setQuantity(quantity + 1)
                              } else {
                                showError(`Only ${currentStock} units left in stock.`)
                              }
                            }} 
                            className="text-[#666] hover:text-[#E84949] transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <button
                          onClick={handleAddToCart}
                          className="flex-1 h-12 bg-[#E84949] text-white rounded font-bold text-[12px] tracking-widest uppercase hover:opacity-90 transition-all shadow-md"
                        >
                          ADD TO CART
                        </button>
                      </div>
                      <button
                        onClick={handleBuyNow}
                        className="w-full h-12 mt-2 bg-[#333] text-white rounded font-bold text-[12px] tracking-widest uppercase hover:bg-black transition-all"
                      >
                        Buy It Now
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-4 space-y-3 font-roboto text-[14px] text-[#333]">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-[#E84949]" />
                    <span>Pickup available at Shop location</span>
                  </div>
                  <p className="text-[13px] text-[#333] ml-6">Usually ready in 24 hours</p>
                  <button onClick={() => setShowStoreInfo(true)} className="text-[12px] font-bold text-[#E84949] underline underline-offset-4 font-grandstander">View Store Information</button>
                  <div className="pt-4 border-t border-dashed border-gray-300 space-y-2">
                    <p><span className="font-medium text-[11px] text-gray-400 mr-2 font-grandstander">Categories:</span> <Link to="/collections/toys" className="underline hover:text-[#E84949] font-medium">{product.category}</Link></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div id="tabs-section" className="py-12 md:py-16 shell">
        <div className="flex overflow-x-auto w-full border border-[#E5E5E5] rounded-t-lg bg-[#FDF4E6] [&::-webkit-scrollbar]:h-[3px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
          {['Description', 'Specifications', 'Reviews', 'Additional'].map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t.toLowerCase())}
              className={`flex-1 min-w-[150px] px-4 md:px-6 py-4 md:py-5 text-[12px] md:text-[14px] font-bold transition-all relative border-r border-[#E5E5E5] last:border-r-0 whitespace-nowrap text-center ${
                activeTab === t.toLowerCase() 
                ? 'text-[#333] bg-[#FDF4E6] border-b border-b-[#FDF4E6]' 
                : 'text-[#666] bg-[#FDF4E6]/40 hover:bg-[#FDF4E6]/70 border-b border-b-[#E5E5E5]'
              }`}
            >
              {t === 'Description' ? 'Product Description' : 
               t === 'Specifications' ? 'Advanced Details' : 
               t === 'Reviews' ? 'Customer Reviews' : 'Additional Information'}
            </button>
          ))}
        </div>
        <div className="bg-[#FDF4E6] p-6 md:p-10 border border-t-0 border-[#E5E5E5] text-[#666] leading-relaxed font-roboto text-[14px] md:text-[15px] shadow-sm rounded-b-lg -mt-[1px]">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
              {activeTab === 'description' && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-dashed border-[#E84949]/20 mb-6">
                    <h4 className="text-[18px] font-black text-[#333] uppercase tracking-tight mb-3">Product Overview</h4>
                    <p className="text-[#444] leading-relaxed italic">{product.description || "High-quality premium product from ToyovoIndia."}</p>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-[18px] font-black text-[#333] uppercase tracking-tight">Why Choose TOYOVOINDIA?</h4>
                    <p>Discover **TOYOVOINDIA**, India's premium marketplace meticulously crafted for baby essentials and kids' toys. Our mission is to elevate your parenting journey with a seamless fusion of quality, safety, and joy.</p>
                    <p>At the heart of TOYOVOINDIA is a commitment to child development. Every product in our catalog—from educational STEM kits to plush baby rattles—is curated to spark imagination and support milestones. Our responsive platform ensures a smooth shopping experience across all your devices.</p>
                    <p>We prioritize safety above all. TOYOVOINDIA products undergo rigorous quality checks to ensure they are non-toxic and child-safe. Our secure payment gateways and robust data protection build the trust that modern parents deserve.</p>
                    <p>Experience the future of toy shopping with TOYOVOINDIA. From targeted categories to verified customer reviews, every detail is optimized to help you make the best choice for your little ones.</p>
                  </div>
                </div>
              )}
              {activeTab === 'additional' &&
                <div className="space-y-6">
                  <span className=" whitespace-pre-line w-full">
                    {`1) This information tab works when you add some description in metafield.
 
 2) Settings > Custom Data > Product > Add definition > give name as needed > in key "custom.additional_information" add this code and save the page.
 
 3) Select type "multi-line text"
 
 4) Now go in product, scroll down, and you will see the metafield section. Add your custom information as needed.
 
 EXAMPLE:-
 
 E-Techno: Your Premier Destination for Cutting-Edge Electronics and Gadgets
 
 Welcome to E-Techno, the ultimate haven for tech enthusiasts and gadget aficionados alike. Step into a world where innovation meets convenience, and where the latest advancements in electronics are just a click away.
 
 At E-Techno, we pride ourselves on being more than just a store; we're a gateway to the future. Our vast selection encompasses everything from state-of-the-art smartphones and sleek laptops to immersive VR headsets and smart home devices that streamline your lifestyle. Whether you're a tech-savvy professional seeking productivity tools or a gaming enthusiast in pursuit of the ultimate gaming setup, we have you covered.
 
 With a user-friendly interface and seamless browsing experience, navigating through our extensive catalog is a breeze. Explore our curated collections, stay updated on the newest releases, and take advantage of exclusive deals and promotions. Our commitment to quality ensures that every product we offer is rigorously tested and vetted, guaranteeing satisfaction and reliability.
 
 But E-Techno is more than just a retailer; we're a community of tech enthusiasts united by our passion for innovation. Join us on social media platforms and forums to engage with like-minded individuals, share your insights, and stay informed about the latest trends and developments in the tech world.
 
 Whether you're upgrading your gadgets, seeking the perfect gift for a fellow tech enthusiast, or simply looking to stay ahead of the curve, E-Techno is your one-stop destination for all things electronic. Experience the future today with E-Techno, where innovation knows no bounds.`}
                  </span>
                </div>
              }

              {activeTab === 'specifications' && (
                <div className="space-y-6 max-w-2xl">
                  <h4 className="text-[18px] font-black text-[#333] uppercase tracking-tight mb-4">Product Specifications</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { label: 'Brand', value: product.brand || 'TOYOVOINDIA' },
                      { label: 'SKU', value: product.sku || (product._id || product.id || '').slice(-6).toUpperCase() },
                      { label: 'Age Group', value: product.ageGroup || '3 Years +' },
                      { label: 'Gender Focus', value: product.gender || 'Unisex' },
                      { label: 'Material', value: product.material || 'Child-Safe Non-Toxic Material' },
                      { label: 'Weight', value: product.weight ? `${product.weight}g` : 'Lightweight' },
                      { label: 'Dimensions', value: product.dimensions?.length ? `${product.dimensions.length} x ${product.dimensions.width} x ${product.dimensions.height} ${product.dimensions.unit || 'cm'}` : 'Compact Play Size' }
                    ].map((spec, i) => (
                      <div key={i} className="flex justify-between py-3 px-4 bg-white rounded-xl border border-dashed border-[#FAEAD3] text-[13px]">
                        <span className="font-bold text-gray-400 uppercase tracking-widest text-[10px]">{spec.label}</span>
                        <span className="font-bold text-gray-800">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activeTab === 'reviews' && productState?._id && (
                <ReviewSection productId={productState._id} productName={product.title || product.name} onReviewsChange={handleReviewsChange} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Suggested Products (YOU MAY ALSO LIKE) */}
      <div className="shell py-8 md:py-12">
        <div className="mb-8 text-center">
          <h2 className="text-[28px] md:text-[36px] font-bold text-[#333] tracking-tighter">You May Also Like</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
          {related.slice(0, 4).map((p, i) => <ProductCard key={p.id} p={p} i={i} />)}
        </div>
      </div>

      {/* Recently Viewed Section */}
      <div className="shell py-8 md:py-12 border-t border-black/5">
        <div className="flex flex-col items-center justify-between mb-8 gap-4">
          <h2 className="text-[28px] md:text-[36px] font-bold text-[#333] tracking-tighter text-center">Recently Viewed</h2>
          <Link to="/all-categories" className="text-[12px] font-bold uppercase tracking-widest text-[#333] border-b-2 border-[#333] hover:opacity-70 transition-opacity">View All</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {recentlyViewed.slice(0, 5).map((p, i) => <ProductCard key={p.id} p={p} i={i} />)}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="shell py-8 md:py-12 mb-0 border-t border-[#E5E5E5]">
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-8 items-center">
          <div className="relative aspect-[4/3] rounded-[40px] overflow-hidden group border border-[#E5E5E5] p-3">
            <img src="https://toykio.myshopify.com/cdn/shop/files/product-08-02_1ed2d2ac-88dd-401e-a474-8579b20407ff.jpg?v=1716179376&width=950" alt="FAQ" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 rounded-[30px]" />
          </div>
          <div className="flex flex-col justify-center">
            <h2 className="text-3xl md:text-5xl font-black text-[#333] mb-12 uppercase tracking-tighter">Frequently <span className="text-[#E84949]">Asked</span> Questions</h2>
            <div className="space-y-5">
              {[
                { q: "What Types Of Furniture Can I Showcase With This Theme?", a: "TOYOVOINDIA is perfect for all types of kids furniture - from cribs and beds to play tables and storage units." },
                { q: "Is This Theme Mobile-Friendly?", a: "Yes, TOYOVOINDIA is engineered with a mobile-first philosophy, providing a lightning-fast and intuitive experience on all mobile devices." },
                { q: "Can I Customize The Color Scheme And Fonts?", a: "Absolutly. With our advanced theme settings, you can customize every color, font, and button style in a few clicks." }
              ].map((faq, i) => (
                <FAQItem
                  key={i}
                  question={faq.q}
                  answer={faq.a}
                  isOpen={openFAQ === i}
                  onToggle={() => setOpenFAQ(openFAQ === i ? null : i)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Store Information Modal */}
      <AnimatePresence>
        {showStoreInfo && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowStoreInfo(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-[#FDF4E6] w-full max-w-2xl max-h-[85vh] rounded-[30px] p-8 md:p-10 shadow-2xl border-[1.5px] border-dashed border-black/10 overflow-y-auto custom-scrollbar"
            >
              <button 
                onClick={() => setShowStoreInfo(false)} 
                className="absolute top-6 right-6 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-[#E84949] hover:text-white transition-all z-10"
              >
                <X size={18} />
              </button>

              <div className="text-center mb-8">
                <h3 className="font-grandstander font-bold text-3xl text-[#333] tracking-tight">Store & Product Info</h3>
                <p className="text-[14px] text-[#666] mt-2 font-medium">Everything you need to know about your purchase</p>
              </div>

              {/* Product Info Section */}
              <div className="bg-white p-6 rounded-2xl border border-dashed border-[#E84949]/30 flex flex-col sm:flex-row items-center gap-6 mb-6">
                <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 border border-black/5">
                  <img src={product.thumbnail?.url || product.images?.[0]?.url || product.img || 'https://images.unsplash.com/photo-1532330393533-443990a51d10?auto=format&fit=crop&q=80&w=800'} alt={product.title || product.name} className="w-full h-full object-cover" />
                </div>
                <div className="text-center sm:text-left">
                  <h4 className="font-grandstander font-bold text-xl text-[#333]">{product.title || product.name}</h4>
                  <p className="text-[#E84949] font-black text-lg mt-1">₹{Number(product.price || 0).toFixed(2)}</p>
                  <p className="text-[12px] text-[#666] mt-2"><strong>SKU:</strong> {product.sku || (product._id || product.id || '').slice(-6).toUpperCase()}</p>
                </div>
              </div>

              <div className="space-y-6 text-[14px] text-[#444] leading-relaxed">
                <div className="bg-white p-6 rounded-2xl border border-dashed border-black/10">
                  <h4 className="font-bold text-[#E84949] uppercase tracking-widest text-[11px] mb-3">About Us</h4>
                  <p>Discover <strong>TOYOVOINDIA</strong>, India's premium marketplace meticulously crafted for baby essentials and kids' toys. Our mission is to elevate your parenting journey with a seamless fusion of quality, safety, and joy.</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-dashed border-black/10">
                  <h4 className="font-bold text-[#333] uppercase tracking-widest text-[11px] mb-3">Product Guarantee</h4>
                  <p>At the heart of TOYOVOINDIA is a commitment to child development. Every product in our catalog—from educational STEM kits to plush baby rattles—is curated to spark imagination and support milestones.</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-dashed border-black/10">
                  <h4 className="font-bold text-[#333] uppercase tracking-widest text-[11px] mb-3">Store Policies</h4>
                  <ul className="list-disc pl-4 space-y-2 text-[13px]">
                    <li><strong>Shipping:</strong> Standard delivery within 3-5 business days across India.</li>
                    <li><strong>Returns:</strong> 7-day easy return policy for unused items in original packaging.</li>
                    <li><strong>Support:</strong> Dedicated customer support for all ToyovoIndia shoppers.</li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                <Link to="/about" className="px-6 py-3 bg-[#333] text-white rounded-xl text-[12px] font-bold uppercase tracking-widest text-center hover:bg-[#E84949] transition-all">Learn More</Link>
                <Link to="/contact" className="px-6 py-3 bg-white border border-[#333]/20 text-[#333] rounded-xl text-[12px] font-bold uppercase tracking-widest text-center hover:border-[#E84949] hover:text-[#E84949] transition-all">Contact Us</Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Buy It Now Merge Confirmation Modal */}
      <AnimatePresence>
        {showBuyNowModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#FDF4E6] border-2 border-black/10 rounded-[32px] p-6 max-w-md w-full shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold font-grandstander text-[#333]">Merge Cart Items?</h3>
                <button
                  onClick={() => setShowBuyNowModal(false)}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-[#E84949] hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <p className="text-[14px] text-gray-600 font-roboto leading-relaxed">
                You already have items in your shopping cart. Would you like to merge them with this checkout, or buy only this toy?
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    const added = addToCart(product, quantity)
                    if (added) {
                      sessionStorage.removeItem('TOYOVOINDIA_buyNowItem')
                      setShowBuyNowModal(false)
                      success(`Merged with cart and proceeding to checkout...`)
                      navigate('/checkout')
                    }
                  }}
                  className="w-full h-12 bg-[#E84949] hover:bg-[#d03d3d] text-white rounded-xl font-bold text-[12px] tracking-widest uppercase transition-colors shadow-md"
                >
                  Yes, Merge Cart
                </button>
                <button
                  onClick={() => {
                    sessionStorage.setItem('TOYOVOINDIA_buyNowItem', JSON.stringify({ ...product, qty: quantity }))
                    setShowBuyNowModal(false)
                    success(`Proceeding with only this toy...`)
                    navigate('/checkout')
                  }}
                  className="w-full h-12 bg-[#333] hover:bg-black text-white rounded-xl font-bold text-[12px] tracking-widest uppercase transition-colors"
                >
                  No, Checkout Only This Toy
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
