import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ShoppingBag, Heart, Eye, Layers, X, Star, Plus, Minus } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const QuickViewModal = ({ p, isOpen, onClose }) => {
  const { addToCart } = useCart()
  const [qty, setQty] = useState(1)

  // Scroll lock implementation - Refined to prevent initial mount scroll jump
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      // Only restore scroll if we actually have a saved position (prevents jump on mount)
      const savedScrollY = document.body.style.top;
      if (savedScrollY) {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, parseInt(savedScrollY || '0') * -1);
      }
    }
    return () => {
      // Cleanup: Only reset if the modal being unmounted is actually the one that locked the scroll
      // (This prevents multiple cards from fighting over the body style during unmount)
      if (isOpen) {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
      }
    };
  }, [isOpen]);

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-10">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-md" 
        />
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 50 }}
          className="relative bg-[#FDF4E6] w-full max-w-4xl max-h-[90vh] rounded-[30px] md:rounded-[50px] overflow-hidden shadow-2xl flex flex-col md:flex-row border-[1.5px] border-dashed border-black/10 overflow-y-auto no-scrollbar"
        >
          {/* Close Button */}
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 md:top-8 md:right-8 z-[100] w-10 h-10 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#E84949] hover:text-white transition-all active:scale-90"
          >
            <X size={20}/>
          </button>
          
          {/* Left: Image Section */}
          <div className="w-full md:w-[45%] bg-[#F9EAD3] p-6 md:p-10 flex items-center justify-center border-b md:border-b-0 md:border-r border-dashed border-black/10 shrink-0">
            <div className="relative w-full aspect-square max-w-[300px] md:max-w-none">
              <img 
                src={p.thumbnail?.url || p.images?.[0]?.url || p.img || 'https://images.unsplash.com/photo-1532330393533-443990a51d10?auto=format&fit=crop&q=80&w=800'} 
                alt={p.name} 
                className="w-full h-full object-cover rounded-[25px] md:rounded-[40px] shadow-xl border-[1.5px] border-dashed border-black/10" 
              />
            </div>
          </div>

          {/* Right: Info Section */}
          <div className="w-full md:w-[55%] p-6 md:p-14 flex flex-col">
            <div className="my-auto space-y-4 md:space-y-6 py-4">
              <div className="space-y-2">
                <p className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] text-[#E84949]">Limited Edition</p>
                <h2 className="text-2xl md:text-5xl font-grandstander font-bold text-[#333] tracking-tighter leading-tight">{p.name}</h2>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex text-[#E84949]">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} size={14} fill={s <= Math.round(p.ratingAverage || 0) ? "currentColor" : "none"} className={s <= Math.round(p.ratingAverage || 0) ? "" : "text-gray-300"} />
                  ))}
                </div>
                <span className="text-[10px] md:text-[12px] font-bold text-gray-400 uppercase tracking-widest">({p.reviewCount || 0} Customer Reviews)</span>
              </div>

              <div className="flex items-center gap-4 py-4 md:py-6 border-y border-dashed border-black/10">
                <span className="text-3xl md:text-5xl font-black text-[#E84949]">₹{p.price}</span>
                {p.oldPrice && <span className="text-base md:text-xl text-gray-600 line-through font-bold">₹{p.oldPrice}</span>}
              </div>

              <p className="text-[13px] md:text-[15px] text-gray-500 leading-relaxed font-roboto italic opacity-80">Experience the joy of premium toys crafted with love. Perfect for gifts and creative playtime adventures that inspire imagination and endless smiles.</p>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
                <div className="flex items-center justify-between h-14 md:h-20 bg-white border-[1.5px] border-dashed border-black/10 rounded-2xl px-6 sm:w-36 shrink-0">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-8 flex justify-center text-[#666] hover:text-[#E84949] transition-colors"><Minus size={18} /></button>
                  <span className="w-10 text-center font-bold text-2xl font-grandstander">{qty}</span>
                  <button onClick={() => setQty(qty + 1)} className="w-8 flex justify-center text-[#666] hover:text-[#E84949] transition-colors"><Plus size={18} /></button>
                </div>
                <button 
                  onClick={() => { addToCart(p, qty); onClose(); }}
                  className="flex-1 h-14 md:h-20 bg-[#E84949] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[13px] md:text-[14px] shadow-xl shadow-[#E84949]/20 hover:bg-[#333] transition-all active:scale-95 flex items-center justify-center gap-3 px-8 py-4 md:py-6"
                >
                  <ShoppingBag size={22}/> Add to Cart
                </button>
              </div>
              
              <Link 
                to={`/product/${p.slug || p.id}`} 
                onClick={onClose} 
                className="block text-center text-[10px] md:text-[12px] font-black text-[#333] uppercase tracking-widest underline underline-offset-4 decoration-2 decoration-[#E84949]/30 hover:text-[#E84949] transition-colors pt-4"
              >
                View Full Product Details
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export function ProductCard({ p, i, isGridOne = false }) {
  const { addToCart, toggleWishlist, toggleCompare, wishlist, compare } = useCart()
  const { success } = useToast()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [showQuickView, setShowQuickView] = useState(false)
  
  const finalPrice = (p.price || 0).toFixed(0)
  const finalOldPrice = p.oldPrice ? p.oldPrice.toFixed(0) : null
  const discountPercent = p.oldPrice ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100) : null

  const isWishlisted = wishlist?.find(item => item.id === p.id)
  const isCompared = compare?.find(item => item.id === p.id)

  const handleAddToCart = () => {
    addToCart(p)
    success(`${p.name} added to cart!`)
  }

  const handleWishlist = () => {
    if (!user) {
      navigate('/login')
      return
    }
    toggleWishlist(p)
    success(isWishlisted ? `${p.name} removed from wishlist.` : `${p.name} added to wishlist!`)
  }

  const handleCompare = () => {
    if (!user) {
      navigate('/login')
      return
    }
    toggleCompare(p)
    success(isCompared ? `${p.name} removed from comparison.` : `${p.name} added to comparison!`)
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: i * 0.05 }}
        className={`group relative flex bg-transparent w-full transition-all duration-500 ${
          isGridOne 
            ? 'flex-col md:flex-row items-center gap-6 md:gap-10 max-w-none' 
            : 'flex-col mx-auto'
        }`}
      >
        {/* Dashed Box Container */}
        <div className={`relative aspect-square rounded-[16px] md:rounded-[20px] border-[1.5px] border-dashed border-[#333]/30 group-hover:border-[#E84949] transition-all duration-300 bg-[#F9EAD3] overflow-hidden shrink-0 ${
          isGridOne ? 'w-full md:w-[320px] lg:w-[400px]' : 'w-full'
        }`}>
          <Link to={`/product/${p.slug || p.id}`} className="block w-full h-full relative z-10">
            <img
              src={p.thumbnail?.url || p.images?.[0]?.url || p.img || 'https://images.unsplash.com/photo-1532330393533-443990a51d10?auto=format&fit=crop&q=80&w=800'}
              alt={p.name}
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </Link>

          {/* Action Icons */}
          <div className="absolute top-2 right-2 md:top-3 md:right-3 z-30 flex flex-col gap-1.5 md:gap-2 transition-all duration-500 transform 
            opacity-0 translate-x-4
            group-hover:opacity-100 group-hover:translate-x-0
            max-[1023px]:opacity-100 max-[1023px]:translate-x-0">
            
            {[
              { icon: <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />, label: 'Quick View', action: () => setShowQuickView(true) },
              { icon: <ShoppingBag className="w-3.5 h-3.5 md:w-4 md:h-4" />, label: 'Add to Cart', action: handleAddToCart },
              { icon: <Heart className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isWishlisted ? 'fill-white' : ''}`} />, label: 'Wishlist', action: handleWishlist },
              { icon: <Layers className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isCompared ? 'fill-white' : ''}`} />, label: 'Compare', action: handleCompare },
            ].map((action, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  action.action();
                }}
                className="w-6 h-6 sm:w-7 sm:h-7 md:w-9 md:h-9 bg-[#E84949] text-white rounded-[6px] sm:rounded-[8px] md:rounded-xl flex items-center justify-center shadow-lg transition-all transform hover:scale-110 active:scale-95 border border-white/10"
                title={action.label}
              >
                {action.icon}
              </button>
            ))}
          </div>

          {/* Promo Badge */}
          {discountPercent && (
            <span className="absolute top-3 left-3 z-20 bg-[#222] text-[#fff] text-[12px] md:text-[13px] font-black px-3 py-1.5 rounded shadow-sm uppercase tracking-wider">
              {discountPercent}%
            </span>
          )}
        </div>

        {/* Details Section (OUTSIDE the box) */}
        <div className={`mt-4 flex flex-col ${isGridOne ? 'text-left items-start md:mt-0' : 'text-center items-center'} px-2`}>
          <Link to={`/product/${p.slug || p.id}`}>
            <h3 className={`${isGridOne ? 'text-xl md:text-3xl' : 'text-[13px] md:text-[15px]'} font-bold text-[#444] group-hover:text-[#E84949] transition-colors duration-300 uppercase tracking-tight mb-1`}>
              {p.name}
            </h3>
          </Link>
          
          <div className={`flex items-center gap-2 ${isGridOne ? 'justify-start' : 'justify-center'}`}>
            {finalOldPrice && (
              <span className={`${isGridOne ? 'text-sm md:text-lg' : 'text-[10px] md:text-[11px]'} text-[#444]/50 line-through font-bold tracking-tight whitespace-nowrap`}>
                ₹{finalOldPrice}
              </span>
            )}
            <span className={`${isGridOne ? 'text-lg md:text-2xl' : 'text-[13px] md:text-[15px]'} font-black text-[#444] group-hover:text-[#E84949] transition-colors tracking-tight whitespace-nowrap`}>
              ₹{finalPrice}
            </span>
          </div>

          {isGridOne && (
             <p className="hidden md:block mt-6 text-gray-400 text-sm md:text-base leading-relaxed max-w-xl italic">
                Experience the magic of creative play with our premium quality toys. Designed to inspire imagination and bring endless joy to every child's world.
             </p>
          )}
        </div>
        
        {/* Responsive Visibility Logic */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media (max-width: 1023px) {
            .group .transform.lg\\:translate-x-4 {
              transform: translateX(0) !important;
              opacity: 1 !important;
            }
          }
        `}} />
      </motion.div>

      <QuickViewModal p={p} isOpen={showQuickView} onClose={() => setShowQuickView(false)} />
    </>
  )
}
