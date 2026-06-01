import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Plus, Minus, Truck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { getStorefrontSettings } from '../../services/siteApi';

const CartDrawer = ({ isOpen, onClose }) => {
  const { cartItems, updateQuantity, removeFromCart, subtotal } = useCart();
  const { user } = useAuth();
  const [orderMessageOpen, setOrderMessageOpen] = useState(false);
  const navigate = useNavigate();

  const [freeShippingThreshold, setFreeShippingThreshold] = useState(999);

  useEffect(() => {
    getStorefrontSettings()
      .then((data) => {
        if (data && typeof data.freeShippingThreshold === 'number') {
          setFreeShippingThreshold(data.freeShippingThreshold);
        }
      })
      .catch(console.error);
  }, []);

  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const progressPercent = Math.min((subtotal / freeShippingThreshold) * 100, 100);

  // Hard-lock body scroll
  useEffect(() => {
    const unlockBody = () => {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflowY = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0', 10) * -1);
      }
    };

    if (isOpen) {
      const scrollY = window.pageYOffset;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflowY = 'hidden';
    } else {
      unlockBody();
    }

    return () => {
      unlockBody();
    };
  }, [isOpen]);

  const handleLinkClick = (path) => {
    onClose();
    navigate(path);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - Supreme Z-Index to completely isolate and obscure the entire page including VisionHeader */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[99998] backdrop-blur-[8px]"
          />

          {/* Drawer Sidebar: Custom 92% width on mobile as requested, max-width on desktop */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.35, ease: 'easeOut' }}
            className="fixed top-0 right-0 h-screen w-[92%] md:max-w-[450px] bg-[#FDF4E6] shadow-[-10px_0_40px_rgba(0,0,0,0.15)] z-[99999] flex flex-col overflow-hidden"
          >
            {/* Header: Fixed top part of the sidebar */}
            <div className="px-6 py-5 border-b border-black/5 flex items-center justify-between bg-[#FDF4E6]">
              <h2 className="text-[20px] font-bold text-[#333] font-grandstander">Main Cart</h2>
              <button 
                onClick={onClose}
                className="w-10 h-10 bg-[#E84949] text-white rounded-[7px] flex items-center justify-center hover:scale-105 transition-all shadow-md"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Container (Fixed height, internal scroll) */}
            <div className="flex-grow overflow-y-auto custom-scrollbar px-6 py-6 pb-20">
              
              {cartItems.length > 0 ? (
                <div className="flex flex-col">
                  {/* Shipping Bar Section */}
                  <div className="space-y-4 mb-8">
                    <p className="text-[14px] text-[#333]">
                      {remainingForFreeShipping > 0 
                        ? `Buy ₹${remainingForFreeShipping.toLocaleString()} enjoy free shipping within India.`
                        : "Congratulations! You've unlocked FREE shipping!"}
                    </p>
                    <div className="relative h-[3px] bg-black/5 rounded-full overflow-visible">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        className="absolute h-full bg-[#E84949] rounded-full"
                      />
                      {/* Driving Truck - Exact Toykio White Circle Style */}
                      <motion.div 
                        initial={{ left: 0 }}
                        animate={{ left: `${progressPercent}%` }}
                        transition={{ type: 'spring', damping: 15, stiffness: 40 }}
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white border border-black/10 rounded-full flex items-center justify-center shadow-lg z-10"
                      >
                        <Truck size={16} className="text-[#E84949]" />
                      </motion.div>
                    </div>
                  </div>

                  {/* Product Table Header with dividers */}
                  <div className="border-t border-black/10 mt-2 py-3 flex justify-between text-[11px] font-bold uppercase tracking-[1.5px] text-[#333]">
                    <span>Product</span>
                    <span>Total</span>
                  </div>

                  {/* Product List */}
                  <div className="space-y-6">
                    {cartItems.map((item) => (
                      <div key={item.id} className="pt-4 pb-6 border-t border-black/5 last:border-b last:border-black/10">
                        <div className="flex gap-4">
                          <div className="w-20 h-20 bg-white border border-black/5 rounded-lg overflow-hidden shrink-0">
                            <img src={item.thumbnail?.url || item.images?.[0]?.url || item.img} alt={item.title} className="w-full h-full object-cover" />
                          </div>

                          <div className="grow flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-0.5">
                              <h3 className="text-[14px] font-bold text-[#333] hover:text-[#E84949] leading-tight grow pr-4">{item.title}</h3>
                              <span className="text-[14px] font-bold text-[#333]">₹{(item.price * item.qty).toFixed(2)}</span>
                            </div>
                            <p className="text-[14px] text-[#333] mb-0.5">₹{item.price.toFixed(2)}</p>
                            <p className="text-[11px] text-[#333]/50 italic mb-3">SKU: {item.sku}</p>

                            <div className="flex items-center gap-3">
                              {/* High-Fidelity Quantity Box with Interior Dividers - Matching Cart BG Color */}
                              <div className="flex items-center h-10 w-28 border border-black rounded-[7px] bg-[#FDF4E6] overflow-hidden">
                                <button onClick={() => updateQuantity(item.id, -1)} className="flex-1 h-full flex items-center justify-center hover:bg-black/5 border-r border-black text-[#333]"><Minus size={14} /></button>
                                <span className="flex-1 h-full flex items-center justify-center text-[14px] font-bold text-[#333]">{item.qty}</span>
                                <button onClick={() => updateQuantity(item.id, 1)} className="flex-1 h-full flex items-center justify-center hover:bg-black/5 border-l border-black text-[#333]"><Plus size={14} /></button>
                              </div>
                              <button onClick={() => removeFromCart(item.id)} className="p-2 text-[#333]/40 hover:text-[#E84949] transition-all">
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Message Collapsible */}
                  <div className="border-b border-black/10">
                    <button 
                      onClick={() => setOrderMessageOpen(!orderMessageOpen)}
                      className={`w-full py-5 flex items-center justify-between transition-all ${orderMessageOpen ? 'text-[#E84949]' : 'text-[#333]'}`}
                    >
                      <span className="text-[14px] font-bold uppercase tracking-wider">Order message</span>
                      <Plus size={16} className={`transition-transform duration-300 ${orderMessageOpen ? 'rotate-45' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {orderMessageOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <textarea 
                            value={localStorage.getItem(`TOYOVOINDIA_checkout_draft_${user?.id || user?._id || user?.email || 'guest'}`) ? (JSON.parse(localStorage.getItem(`TOYOVOINDIA_checkout_draft_${user?.id || user?._id || user?.email || 'guest'}`)).checkoutNotes?.orderMessage || '') : ''}
                            onChange={(e) => {
                               const key = `TOYOVOINDIA_checkout_draft_${user?.id || user?._id || user?.email || 'guest'}`;
                               const current = JSON.parse(localStorage.getItem(key) || '{}');
                               localStorage.setItem(key, JSON.stringify({
                                 ...current,
                                 checkoutNotes: {
                                   ...(current.checkoutNotes || {}),
                                   orderMessage: e.target.value
                                 }
                               }));
                            }}
                            className="w-full h-28 p-4 mb-5 bg-[#F9EAD3] border border-black/10 rounded-[7px] text-[13px] outline-none font-roboto italic"
                            placeholder="Add a message for your order..."
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Currency Marquee - Faster & Immediate via CSS */}
                  <style>{`
                    @keyframes marquee {
                      0% { transform: translateX(0); }
                      100% { transform: translateX(-50%); }
                    }
                    .marquee-container {
                      display: flex;
                      width: max-content;
                      animation: marquee 15s linear infinite;
                    }
                  `}</style>
                  <div className="py-4 border-b border-black/10 overflow-hidden relative">
                    <div className="marquee-container">
                      <div className="whitespace-nowrap text-[11px] font-bold text-[#333]/40 uppercase tracking-[1.5px] py-1 pr-4">
                        All charges are applied in Indian Rupees (INR ₹) &nbsp; &bull; &nbsp; Pan India Express Delivery &nbsp; &bull; &nbsp; Fast Pan India Shipping &nbsp; &bull; &nbsp; 
                      </div>
                      <div className="whitespace-nowrap text-[11px] font-bold text-[#333]/40 uppercase tracking-[1.5px] py-1 pr-4">
                        All charges are applied in Indian Rupees (INR ₹) &nbsp; &bull; &nbsp; Pan India Express Delivery &nbsp; &bull; &nbsp; Fast Pan India Shipping &nbsp; &bull; &nbsp; 
                      </div>
                    </div>
                  </div>

                  {/* Footer Section (NOT sticky, part of the flow) */}
                  <div className="pt-8 space-y-6">
                    <div className="flex justify-between items-center text-[15px] font-bold text-[#333]">
                      <span>Estimated total</span>
                      <span className="text-[18px]">₹{subtotal.toFixed(2)} INR</span>
                    </div>
                    <p className="text-[12px] text-[#333]/60 italic font-medium leading-relaxed">
                      Taxes, discounts and shipping calculated at checkout
                    </p>

                    <div className="space-y-3">
                      <button onClick={() => handleLinkClick('/checkout')} className="w-full py-4 bg-[#E84949] text-white font-bold rounded-[7px] uppercase tracking-widest hover:bg-[#333] transition-all text-[13px]">
                        Check Out
                      </button>
                      <button onClick={() => handleLinkClick('/cart')} className="w-full py-4 bg-[#E84949] text-white font-bold rounded-[7px] uppercase tracking-widest hover:bg-[#333] transition-all text-[13px]">
                        View My Cart
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="min-h-[400px] flex flex-col items-center justify-center text-center">
                  <h3 className="text-[20px] font-bold text-[#333] mb-8">Your cart is empty</h3>
                  <button 
                    onClick={() => handleLinkClick('/collections/all')}
                    className="w-full py-4 bg-[#E84949] text-white font-bold rounded-[7px] uppercase tracking-widest mb-6"
                  >
                    Continue Shopping
                  </button>
                  
                  {!user && (
                    <p className="text-[13px] text-[#333]">
                      <span className="font-bold">Have an account?</span> / <Link to="/login" onClick={onClose} className="text-[#3a6ea5] underline underline-offset-4 font-normal">Log in to check out faster.</Link>
                    </p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
