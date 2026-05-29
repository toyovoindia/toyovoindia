import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Heart, ShoppingBag, ArrowRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { ProductCard } from '../components/ui/ProductCard'

export function WishlistPage() {
  const { wishlist } = useCart()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login')
    }
  }, [user, authLoading, navigate])

  if (authLoading || !user) return null

  if (wishlist.length === 0) {
    return (
      <div className="bg-[#FDF4E6] h-full py-24">
        <div className="shell">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center"
          >
            <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-[#E84949] mb-10 shadow-sm">
              <Heart size={40} fill="#E84949" />
            </div>
            <h1 className="text-4xl md:text-5xl font-grandstander font-bold text-[#333] mb-6 tracking-tighter">Your Wishlist is Empty</h1>
            <p className="max-w-xl mx-auto font-roboto text-[16px] md:text-[18px] text-[#333] leading-relaxed mb-12 opacity-70">
              Looks like you haven't added any favorite toys yet. Browse our collection and click the heart icon to save items you love for later!
            </p>
            <Link 
              to="/" 
              className="h-14 px-12 bg-[#E84949] text-white rounded-full font-bold text-[13px] tracking-[0.2em] uppercase hover:bg-[#333] transition-all flex items-center gap-3 shadow-lg"
            >
              <ShoppingBag size={18} /> START SHOPPING
            </Link>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#FDF4E6] min-h-screen py-16 font-roboto">
       <div className="shell">
          <div className="text-center mb-16">
             <h1 className="text-5xl font-grandstander font-bold text-[#333] mb-4">My Saved Joy</h1>
             <p className="text-[#666] uppercase tracking-[0.3em] text-[11px] font-bold">Your personal collection of magic</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
             {wishlist.map((item, i) => (
                <ProductCard key={item.id} p={item} i={i} />
             ))}
          </div>
       </div>
    </div>
  )
}
