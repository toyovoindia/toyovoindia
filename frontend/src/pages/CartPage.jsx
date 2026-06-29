import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Minus, Plus, X, ShoppingBag, ArrowRight, Trash2, Trash } from 'lucide-react'

import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { validateCouponCode, getActiveCoupons } from '../services/couponApi'
import { useAuth } from '../context/AuthContext'

const CHECKOUT_COUPON_STORAGE_KEY = 'TOYOVOINDIA_checkout_coupon'
const getProductPath = (item) => `/product/${item.slug || item.id || item._id || item.title?.toLowerCase().replaceAll(' ', '-')}`
const getCheckoutDraftKey = (user) => `TOYOVOINDIA_checkout_draft_${user?.id || user?._id || user?.email || 'guest'}`

export function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, clearCart, subtotal } = useCart()
  const { success } = useToast()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [couponCode, setCouponCode] = useState(() => localStorage.getItem(CHECKOUT_COUPON_STORAGE_KEY) || '')
  const [couponState, setCouponState] = useState(null)
  const [couponError, setCouponError] = useState('')
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)
  const [orderMessage, setOrderMessage] = useState('')
  const [giftWrap, setGiftWrap] = useState(false)
  const [giftMessage, setGiftMessage] = useState('')
  const [notesErrors, setNotesErrors] = useState({})

  const [activeCoupons, setActiveCoupons] = useState([])

  useEffect(() => {
    window.scrollTo(0, 0)
    getActiveCoupons().then(setActiveCoupons).catch(console.error)
  }, [])

  useEffect(() => {
    localStorage.setItem(CHECKOUT_COUPON_STORAGE_KEY, couponCode)
  }, [couponCode])

  useEffect(() => {
    try {
      const draft = localStorage.getItem(getCheckoutDraftKey(user))
      if (!draft) return
      const parsed = JSON.parse(draft)
      setOrderMessage(parsed?.checkoutNotes?.orderMessage || '')
      setGiftWrap(Boolean(parsed?.checkoutNotes?.giftWrap))
      setGiftMessage(parsed?.checkoutNotes?.giftMessage || '')
    } catch {
      // ignore invalid draft 
    }
  }, [user])

  useEffect(() => {
    try {
      const key = getCheckoutDraftKey(user)
      const current = JSON.parse(localStorage.getItem(key) || '{}')
      localStorage.setItem(key, JSON.stringify({
        ...current,
        discountCode: couponCode,
        // persist validated coupon so checkout shows discount immediately
        couponState: couponState || current.couponState || null,
        checkoutNotes: {
          orderMessage,
          giftWrap,
          giftMessage,
        },
      }))
    } catch {
      // ignore local persistence failure
    }
  }, [user, couponCode, couponState, orderMessage, giftWrap, giftMessage])

  useEffect(() => {
    if (!cartItems.length) {
      setCouponState(null)
      setCouponError('')
    }
  }, [cartItems])

  const discountAmount = couponState?.discountAmount || 0
  const finalTotal = Math.max(0, subtotal - discountAmount)

  const applyCoupon = async () => {
    if (!couponCode.trim()) return
    setIsApplyingCoupon(true)
    setCouponError('')
    try {
      const result = await validateCouponCode({
        code: couponCode.trim(),
        subtotal,
        shippingAmount: 0,
        categorySlugs: [...new Set(cartItems.map((item) => item.category).filter(Boolean))],
      })
      setCouponState(result)
      success(`${result.coupon?.code || couponCode.trim().toUpperCase()} applied successfully.`)
    } catch (error) {
      setCouponState(null)
      // Use the backend's specific message (e.g. "Coupon code not found", "This coupon has expired")
      // Fall back to a clear, user-friendly message if none is provided
      const msg = error.message && error.message !== 'Request failed'
        ? error.message
        : 'Invalid or unrecognized coupon code. Please check and try again.'
      setCouponError(msg)
    } finally {
      setIsApplyingCoupon(false)
    }
  }

  // Order message: optional
  const handleSubmitOrderMessage = () => {
    setNotesErrors(prev => ({ ...prev, orderMessage: undefined }))
    success(orderMessage.trim() ? 'Order message saved for checkout.' : 'Order message cleared.')
  }

  // Gift wrap: checkbox must be checked, and gift message is required when it is
  const handleSaveGiftWrap = () => {
    if (!giftWrap) {
      setNotesErrors(prev => ({ ...prev, giftMessage: 'Please check the "Do you want a gift wrap?" option first' }))
      return
    }
    if (!giftMessage.trim()) {
      setNotesErrors(prev => ({ ...prev, giftMessage: 'Please enter a gift message for your gift wrap' }))
      return
    }
    setNotesErrors(prev => ({ ...prev, giftMessage: undefined }))
    success('Gift wrap preferences saved for checkout.')
  }

  if (cartItems.length === 0) {
    return (
      <div className="bg-[#FDF4E6] min-h-screen py-24 flex items-center font-roboto">
        <div className="shell text-center w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center"
          >
            <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-[#E84949] mb-10 shadow-sm">
              <ShoppingBag size={40} className="text-[#E84949]" />
            </div>
            <h1 className="text-4xl md:text-5xl font-grandstander font-bold text-[#333] mb-6 tracking-tighter">Your Cart is Empty</h1>
            <p className="max-w-xl mx-auto font-roboto text-[16px] md:text-[18px] text-[#333] leading-relaxed mb-12 opacity-70">
              It looks like you haven't added any magic to your cart yet. Browse our collections to find the perfect joy for your child!
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
      <div className="max-w-7xl mx-auto px-4">
        {/* Breadcrumbs */}
        <nav className="flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-[0.3em] text-[#333]/40 mb-6">
            <Link to="/" className="hover:text-[#E84949] transition-colors">Home</Link>
            <span>/</span>
            <span className="text-[#333]">Your Shopping Cart</span>
        </nav>

        <h1 className="text-5xl md:text-6xl font-grandstander font-bold text-[#333] text-center mb-16 tracking-tighter">Main Cart</h1>

        {/* Mobile Card Layout */}
        <div className="lg:hidden space-y-4 mb-10">
          {cartItems.map((item) => (
            <div key={item.id} className="bg-white/60 rounded-[28px] border border-black/10 p-4 shadow-sm">
              <div className="flex gap-4">
                <div className="w-24 h-24 bg-white rounded-2xl overflow-hidden shrink-0 border border-black/5">
                  <img src={item.img} alt={item.title} className="w-full h-full object-contain" />
                </div>
                <div className="min-w-0 flex-1">
                  <Link to={getProductPath(item)} className="font-grandstander font-bold text-[#333] hover:text-[#E84949] text-[16px] tracking-tight line-clamp-2 break-words">
                    {item.title}
                  </Link>
                  <p className="text-[15px] font-bold text-[#E84949] mt-1">₹{item.price.toFixed(2)}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 break-words">SKU: {item.sku || 'N/A'}</p>
                </div>
                <button 
                  onClick={() => {
                    removeFromCart(item.id);
                    success(`${item.title} removed from cart.`);
                  }} 
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[#333]/40 hover:text-[#E84949] hover:bg-red-50 transition-all shrink-0"
                >
                  <Trash size={16} />
                </button>
              </div>
              <div className="mt-4 flex items-center justify-between gap-4">
                <div className="flex items-center h-11 w-32 border border-black/20 rounded-xl bg-[#FDF4E6] overflow-hidden">
                  <button onClick={() => updateQuantity(item.id, -1)} className="flex-1 h-full flex items-center justify-center hover:text-[#E84949]"><Minus size={14} /></button>
                  <span className="w-8 text-center font-bold text-[15px]">{item.qty}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="flex-1 h-full flex items-center justify-center hover:text-[#E84949]"><Plus size={14} /></button>
                </div>
                <span className="font-grandstander font-bold text-[20px] text-[#333] tracking-tighter">₹{(item.price * item.qty).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table Layout */}
        <div className="hidden lg:block bg-transparent border-[1.2px] border-dashed border-[#333]/20 rounded-lg overflow-x-auto custom-scrollbar mb-12 shadow-sm">
           <table className="w-full min-w-[900px] border-collapse">
              <thead>
                 <tr className="border-b border-dashed border-[#333]/20 text-[11px] font-bold uppercase tracking-[0.2em] text-[#333]/60">
                    <th className="p-6 text-center w-24 border-r border-dashed border-[#333]/20">Remove</th>
                    <th className="p-6 text-center w-48 border-r border-dashed border-[#333]/20">Product Image</th>
                    <th className="p-6 text-left border-r border-dashed border-[#333]/20">Product</th>
                    <th className="p-6 text-center w-48 border-r border-dashed border-[#333]/20">Quantity</th>
                    <th className="p-6 text-right w-48">Total</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-dashed divide-[#333]/20">
                 {cartItems.map((item) => (
                    <tr key={item.id} className="group">
                       <td className="p-6 text-center border-r border-dashed border-[#333]/20">
                          <button onClick={() => removeFromCart(item.id)} className="w-10 h-10 rounded-full flex items-center justify-center mx-auto text-[#333]/40 hover:text-[#E84949] hover:bg-red-50 transition-all">
                             <Trash size={18} />
                          </button>
                       </td>
                       <td className="p-6 border-r border-dashed border-[#333]/20">
                          <div className="w-32 h-32 bg-white rounded-2xl overflow-hidden mx-auto shadow-inner group-hover:scale-105 transition-transform">
                             <img src={item.img} alt={item.title} className="w-full h-full object-contain mix-blend-multiply" />
                          </div>
                       </td>
                       <td className="p-6 border-r border-dashed border-[#333]/20">
                          <div className="space-y-1">
                             <Link to={getProductPath(item)} className="font-grandstander font-bold text-[#333] hover:text-[#E84949] text-[18px] tracking-tight">{item.title}</Link>
                             <p className="text-[16px] font-bold text-[#E84949]">₹{item.price.toFixed(2)}</p>
                             <p className="text-[12px] text-gray-400 font-bold uppercase tracking-widest">SKU: {item.sku || 'N/A'}</p>
                          </div>
                       </td>
                       <td className="p-6 border-r border-dashed border-[#333]/20">
                          <div className="flex items-center justify-center h-12 w-32 bg-white border border-[#333]/20 rounded-xl mx-auto">
                             <button onClick={() => updateQuantity(item.id, -1)} className="flex-1 h-full flex items-center justify-center hover:text-[#E84949]"><Minus size={14} /></button>
                             <span className="w-8 text-center font-bold text-[15px]">{item.qty}</span>
                             <button onClick={() => updateQuantity(item.id, 1)} className="flex-1 h-full flex items-center justify-center hover:text-[#E84949]"><Plus size={14} /></button>
                          </div>
                       </td>
                       <td className="p-6 text-right">
                          <span className="font-grandstander font-bold text-[20px] text-[#333] tracking-tighter">₹{(item.price * item.qty).toFixed(2)}</span>
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12">
           {/* Order Message Box */}
           <div className="p-8 border-[1.2px] border-dashed border-[#333]/20 rounded-2xl space-y-4">
              <h3 className="font-grandstander font-bold text-xl text-[#333]">Order message <span className="text-[12px] font-medium text-[#333]/40 normal-case tracking-normal">(optional)</span></h3>
              <textarea 
                className={`w-full h-32 bg-transparent border ${notesErrors.orderMessage ? 'border-red-400' : 'border-[#333]/10'} rounded-xl p-4 text-[14px] outline-none focus:border-[#E84949] font-roboto italic text-[#666] transition-colors`} 
                placeholder="Add a note for your order..."
                value={orderMessage}
                onChange={(e) => {
                  setOrderMessage(e.target.value)
                  if (notesErrors.orderMessage) setNotesErrors(prev => ({ ...prev, orderMessage: undefined }))
                }}
              />
              {notesErrors.orderMessage && (
                <p className="text-[11px] font-bold text-red-500 uppercase tracking-tight flex items-center gap-1">
                  <span>⚠</span> {notesErrors.orderMessage}
                </p>
              )}
              <button
                onClick={handleSubmitOrderMessage}
                className="h-10 px-8 bg-[#333] text-white rounded-xl font-bold uppercase tracking-widest text-[11px] hover:bg-[#E84949] transition-all active:scale-95"
              >
                Submit
              </button>
           </div>

           {/* Totals and Buttons */}
           <div className="flex flex-col items-stretch lg:items-end space-y-6">
              <div className="text-left lg:text-right space-y-2">
                 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-6">
                    <span className="text-[16px] font-bold text-[#333]/60 uppercase tracking-widest">Estimated total:</span>
                    <span className="text-3xl font-grandstander font-bold text-[#333] tracking-tighter">₹{finalTotal.toFixed(2)} INR</span>
                 </div>
                 {couponState && (
                  <p className="text-[12px] font-bold text-green-600">Discount ({couponState.coupon?.code}) applied: -₹{discountAmount.toFixed(2)}</p>
                 )}
                 <p className="text-[12px] text-gray-400 font-medium italic">Taxes, discounts and shipping calculated at checkout</p>
              </div>

              <div className="flex flex-col gap-3 w-full sm:w-[400px]">
                 <button onClick={() => { sessionStorage.removeItem('TOYOVOINDIA_buyNowItem'); navigate(user ? '/checkout' : '/login?next=%2Fcheckout'); }} className="w-full h-14 bg-[#E84949] text-white rounded-xl font-bold uppercase tracking-widest text-[12px] flex items-center justify-center hover:scale-[1.01] transition-all shadow-xl shadow-[#E84949]/20">
                   {user ? 'Check Out' : 'Login to Checkout'}
                 </button>
                 <Link to="/" className="w-full h-14 bg-[#333] text-white rounded-xl font-bold uppercase tracking-widest text-[12px] flex items-center justify-center hover:scale-[1.01] transition-all shadow-lg">Continue Shopping</Link>
              </div>
           </div>
        </div>

        {/* Gift Wrap and Coupon Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
           <div className="p-6 md:p-8 border-[1.2px] border-dashed border-[#333]/20 rounded-2xl flex flex-col sm:flex-row gap-6 items-start">
              <div className="grow space-y-3 w-full">
                 <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={giftWrap}
                      onChange={(e) => {
                        setGiftWrap(e.target.checked)
                        // clear gift message error when unchecking
                        if (!e.target.checked) setNotesErrors(prev => ({ ...prev, giftMessage: undefined }))
                      }}
                      className="w-5 h-5 accent-[#E84949]"
                    />
                    <span className="text-[14px] font-bold text-[#333]">Do you want a gift wrap?</span>
                 </label>
                 <textarea
                   value={giftMessage}
                   onChange={(e) => {
                     setGiftMessage(e.target.value)
                     if (notesErrors.giftMessage) setNotesErrors(prev => ({ ...prev, giftMessage: undefined }))
                   }}
                   className={`w-full h-24 bg-transparent border ${notesErrors.giftMessage ? 'border-red-400' : 'border-[#333]/10'} rounded-xl p-4 text-[13px] outline-none italic transition-colors ${!giftWrap ? 'opacity-40 cursor-not-allowed' : ''}`}
                   placeholder={giftWrap ? 'Enter gift message (required)' : 'Gift message'}
                   disabled={!giftWrap}
                 />
                 {notesErrors.giftMessage && (
                   <p className="text-[11px] font-bold text-red-500 uppercase tracking-tight flex items-center gap-1">
                     <span>⚠</span> {notesErrors.giftMessage}
                   </p>
                 )}
              </div>
              <button
                onClick={handleSaveGiftWrap}
                className="h-12 px-10 bg-[#E84949] text-white rounded-xl font-bold uppercase tracking-widest text-[11px] shrink-0 mt-0 sm:mt-8 w-full sm:w-auto hover:bg-[#333] transition-all active:scale-95"
              >
                Save
              </button>
           </div>

           <div className="p-6 md:p-8 border-[1.2px] border-dashed border-[#333]/20 rounded-2xl space-y-4">
              <p className="text-[13px] font-bold text-[#333]/60 uppercase tracking-widest">Enter coupon or discount code:</p>
              <div className="flex flex-col sm:flex-row gap-4">
                 <input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} type="text" placeholder="Coupon code" className="grow h-14 bg-white border border-[#333]/10 rounded-xl px-4 outline-none font-bold text-[14px] focus:border-[#E84949] transition-all" />
                 <button onClick={applyCoupon} disabled={isApplyingCoupon || !couponCode.trim()} className={`h-14 px-10 rounded-xl font-bold uppercase tracking-widest text-[11px] w-full sm:w-auto transition-all ${isApplyingCoupon || !couponCode.trim() ? 'bg-[#E84949]/30 text-white cursor-not-allowed' : 'bg-[#E84949] text-white hover:bg-[#333] shadow-lg active:scale-95'}`}>{isApplyingCoupon ? 'Applying...' : 'Submit'}</button>
              </div>
              {couponError && <p className="text-[12px] font-bold text-[#E84949]">{couponError}</p>}
              {activeCoupons.length > 0 && (
                <div className="pt-2">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Available Coupons (Click to apply):</p>
                  <div className="flex flex-wrap gap-2">
                    {activeCoupons.map((c) => (
                      <button
                        key={c.id || c.code}
                        onClick={() => setCouponCode(c.code)}
                        className={`px-3 py-1.5 rounded-full border text-[11px] font-black transition-all ${
                          couponCode === c.code
                            ? 'bg-[#E84949] border-[#E84949] text-white shadow-sm'
                            : 'bg-white border-black/10 text-[#333] hover:border-[#E84949] hover:text-[#E84949]'
                        }`}
                        title={c.title}
                      >
                        {c.code}
                      </button>
                    ))}
                  </div>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  )
}
