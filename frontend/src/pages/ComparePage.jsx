import { X, ShoppingCart, Trash2, Layers, ShoppingBag } from 'lucide-react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { useEffect } from 'react'

export function ComparePage() {
  const { compare, toggleCompare, addToCart, clearCompare } = useCart()
  const { success } = useToast()
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

  if (compare.length === 0) {
    return (
      <div className="bg-[#FDF4E6] h-full py-24">
        <div className="shell">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center"
          >
            <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-[#E84949] mb-10 shadow-sm">
              <Layers size={40} />
            </div>
            <h1 className="text-4xl md:text-5xl font-grandstander font-bold text-[#333] mb-6 tracking-tighter">Comparison is Empty</h1>
            <p className="max-w-xl mx-auto font-roboto text-[16px] md:text-[18px] text-[#333] leading-relaxed mb-12 opacity-70">
              Choose your favorite toys and compare them side-by-side to find the perfect adventure partner for your child!
            </p>
            <Link 
              to="/" 
              className="h-14 px-12 bg-[#E84949] text-white rounded-full font-bold text-[13px] tracking-[0.2em] uppercase hover:bg-[#333] transition-all flex items-center gap-3 shadow-lg"
            >
              <ShoppingBag size={18} /> BACK TO SHOP
            </Link>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#FDF4E6] min-h-screen py-16 font-roboto">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-grandstander font-bold text-[#333] tracking-tighter">Compare</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {compare.map((item) => (
            <div key={item.id} className="flex flex-col bg-[#FDF4E6] border border-black/10 rounded-lg overflow-hidden shadow-sm">
              {/* Product Image Section */}
              <div className="relative p-6 aspect-square bg-[#FDF4E6] border-b border-black/10 group">
                <button 
                  onClick={() => {
                    toggleCompare(item);
                    success(`${item.title} removed from comparison.`);
                  }} 
                  className="absolute top-4 right-4 z-10 w-8 h-8 bg-[#E84949] text-white rounded-md flex items-center justify-center shadow-md hover:scale-110 transition-all"
                >
                  <X size={16} />
                </button>
                <div className="w-full h-full overflow-hidden rounded-xl">
                   <img src={item.img} alt={item.title} className="w-full h-full object-contain mix-blend-multiply" />
                </div>
              </div>

              {/* Data Rows */}
              <div className="p-4 text-center border-b border-black/10 flex items-center justify-center min-h-[60px]">
                <h3 className="font-grandstander font-bold text-[14px] text-[#333] leading-tight uppercase tracking-tight">{item.title}</h3>
              </div>

              <div className="p-4 text-center border-b border-black/10 bg-transparent flex items-center justify-center gap-3">
                 <span className="text-[12px] text-gray-400 line-through font-medium">₹{(item.price + 200).toFixed(2)} INR</span>
                 <span className="text-[16px] font-bold text-[#333]">₹{item.price.toFixed(2)} INR</span>
              </div>

              <div className="p-4 text-center border-b border-black/10 bg-transparent text-[13px] flex items-center justify-center gap-2">
                 <span className="text-gray-400 font-medium">Vendor: </span>
                 <span className="text-[#333] font-bold">Toykio</span>
              </div>

              <div className="p-4 text-center border-b border-black/10 bg-transparent text-[13px] flex items-center justify-center gap-2">
                 <span className="text-gray-400 font-medium">SKU: </span>
                 <span className="text-[#333] font-bold uppercase">{item.sku || 'N/A'}</span>
              </div>

              <div className="p-4 text-center border-b border-black/10 bg-transparent text-[13px] flex items-center justify-center gap-2">
                 <span className="text-gray-400 font-medium">Type: </span>
                 <span className="text-[#333] font-bold">Toys & Games</span>
              </div>

              <div className="p-4 text-center border-b border-black/10 bg-transparent text-[13px] flex items-center justify-center gap-2">
                 <span className="text-gray-400 font-medium">Availability: </span>
                 <span className="text-green-600 font-bold">In Stock</span>
              </div>

              {/* Add to Cart Section */}
              <div className="p-6 bg-transparent mt-auto">
                <button 
                  onClick={() => {
                    addToCart(item);
                    success(`${item.title} added to cart!`);
                  }} 
                  className="w-full py-4 bg-[#E84949] text-white rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-[#333] transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <ShoppingCart size={15} /> Add to Cart
                </button>
              </div>
            </div>
          ))}

          {/* Empty Slots */}
          {[...Array(Math.max(0, 4 - compare.length))].map((_, i) => (
            <div key={`empty-${i}`} className="hidden lg:flex flex-col border border-dashed border-black/10 bg-[#FDF4E6]/30 rounded-lg items-center justify-center min-h-[500px]">
               <div className="w-16 h-16 rounded-full border-2 border-dashed border-black/10 flex items-center justify-center text-black/10">
                  <Layers size={24} />
               </div>
               <p className="text-[10px] font-bold uppercase tracking-widest text-black/20 mt-4 font-grandstander">Add Product to Compare</p>
            </div>
          ))}
        </div>

        <div className="mt-16 flex justify-center">
           <button 
             onClick={() => {
               clearCompare();
               success('Comparison cleared.');
             }} 
             className="px-12 py-4 border-2 border-[#333] text-[#333] rounded-full text-[12px] font-bold uppercase tracking-widest hover:bg-[#333] hover:text-white transition-all shadow-md active:scale-95"
           >
             Clear All Comparison
           </button>
        </div>
      </div>
    </div>
  )
}
