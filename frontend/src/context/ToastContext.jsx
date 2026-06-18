import React, { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, Info, X, Bell } from 'lucide-react'

const ToastContext = createContext()

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now()
    setToasts([{ id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }, [])

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const toast = React.useMemo(() => ({
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    info: (msg) => addToast(msg, 'info'),
    warning: (msg) => addToast(msg, 'warning')
  }), [addToast])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[999999] flex flex-col items-center gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <ToastItem key={t.id} toast={t} onRemove={() => removeToast(t.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)

// Smart title detection based on message context
const getSmartTitle = (message, type) => {
  const msg = message.toLowerCase()

  if (type === 'error') {
    if (msg.includes('report')) return 'Report Failed'
    if (msg.includes('login') || msg.includes('password') || msg.includes('credentials')) return 'Login Failed'
    if (msg.includes('coupon') || msg.includes('code')) return 'Coupon Invalid'
    if (msg.includes('order')) return 'Order Error'
    if (msg.includes('upload') || msg.includes('image')) return 'Upload Failed'
    return 'Something Went Wrong'
  }

  if (type === 'warning') {
    if (msg.includes('stock') || msg.includes('inventory')) return 'Low Stock'
    return 'Attention Needed'
  }

  if (type === 'info') return 'Info'

  // Success type — context-aware titles
  if (msg.includes('added to cart')) return 'Added to Cart'
  if (msg.includes('removed from cart')) return 'Removed from Cart'
  if (msg.includes('added to wishlist')) return 'Added to Wishlist'
  if (msg.includes('removed from wishlist')) return 'Removed from Wishlist'
  if (msg.includes('added to comparison') || msg.includes('added to compare')) return 'Added to Compare'
  if (msg.includes('removed from comparison') || msg.includes('removed from compare')) return 'Removed from Compare'
  if (msg.includes('comparison cleared')) return 'Compare Cleared'
  if (msg.includes('coupon') || msg.includes('applied successfully')) return 'Coupon Applied'
  if (msg.includes('checkout') || msg.includes('proceeding')) return 'Checkout'
  if (msg.includes('order') && msg.includes('cancel')) return 'Order Cancelled'
  if (msg.includes('return request')) return 'Return Requested'
  if (msg.includes('order') && msg.includes('moved')) return 'Order Status Changed'
  if (msg.includes('order')) return 'Order Updated'
  if (msg.includes('review submitted')) return 'Review Submitted'
  if (msg.includes('review updated')) return 'Review Updated'
  if (msg.includes('review deleted')) return 'Review Deleted'
  if (msg.includes('review')) return 'Review'
  if (msg.includes('subscrib') || msg.includes('discount code')) return 'Subscribed!'
  if (msg.includes('profile') && msg.includes('updated')) return 'Profile Updated'
  if (msg.includes('verified') || msg.includes('verification')) return 'Verified'
  if (msg.includes('otp') && msg.includes('sent')) return 'OTP Sent'
  if (msg.includes('copied')) return 'Copied!'
  if (msg.includes('gift wrap')) return 'Gift Wrap Saved'
  if (msg.includes('order message saved')) return 'Order Note Saved'
  if (msg.includes('order message cleared')) return 'Order Note Cleared'
  if (msg.includes('report') || msg.includes('downloaded')) return 'Report Ready'
  if (msg.includes('archived')) return 'Archived'
  if (msg.includes('permanently deleted') || msg.includes('deleted from')) return 'Permanently Deleted'
  if (msg.includes('deleted')) return 'Deleted'
  if (msg.includes('launched') || msg.includes('created')) return 'Created!'
  if (msg.includes('updated')) return 'Updated!'
  if (msg.includes('saved')) return 'Saved!'
  if (msg.includes('uploaded') || msg.includes('snapshot')) return 'Uploaded!'
  if (msg.includes('removed')) return 'Removed'
  if (msg.includes('cleared')) return 'Cleared'
  if (msg.includes('logged out') || msg.includes('logout')) return 'Logged Out'
  if (msg.includes('synchronized') || msg.includes('ledger')) return 'Synced'
  if (msg.includes('marked as')) return 'Status Changed'
  return 'Success'
}

function ToastItem({ toast, onRemove }) {
  const smartTitle = getSmartTitle(toast.message, toast.type)

  const premiumConfigs = {
    success: {
      title: smartTitle,
      icon: <CheckCircle2 size={15} strokeWidth={2.5} />,
      borderColor: 'border-[#10B981]/25',
      glowColor: 'bg-[#10B981]',
      iconBg: 'bg-[#10B981]/10 text-[#10B981]',
      progressBg: 'bg-[#10B981]/30'
    },
    error: {
      title: smartTitle,
      icon: <AlertCircle size={15} strokeWidth={2.5} />,
      borderColor: 'border-[#F43F5E]/25',
      glowColor: 'bg-[#F43F5E]',
      iconBg: 'bg-[#F43F5E]/10 text-[#F43F5E]',
      progressBg: 'bg-[#F43F5E]/30'
    },
    info: {
      title: smartTitle,
      icon: <Info size={15} strokeWidth={2.5} />,
      borderColor: 'border-[#3B82F6]/25',
      glowColor: 'bg-[#3B82F6]',
      iconBg: 'bg-[#3B82F6]/10 text-[#3B82F6]',
      progressBg: 'bg-[#3B82F6]/30'
    },
    warning: {
      title: smartTitle,
      icon: <Bell size={15} strokeWidth={2.5} />,
      borderColor: 'border-[#F59E0B]/25',
      glowColor: 'bg-[#F59E0B]',
      iconBg: 'bg-[#F59E0B]/10 text-[#F59E0B]',
      progressBg: 'bg-[#F59E0B]/30'
    }
  }

  const currentConfig = premiumConfigs[toast.type] || premiumConfigs.success

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
      layout
      className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#FFFBF6]/95 backdrop-blur-md border ${currentConfig.borderColor} shadow-[0_8px_30px_rgba(0,0,0,0.08)] min-w-[290px] max-w-sm relative overflow-hidden`}
    >
      {/* Glow indicator */}
      <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 ${currentConfig.glowColor} rounded-r-full`} />
      
      {/* Icon */}
      <div className={`flex-shrink-0 w-8 h-8 ${currentConfig.iconBg} rounded-full flex items-center justify-center ml-1`}>
        {currentConfig.icon}
      </div>
      
      {/* Text Area */}
      <div className="flex-1 min-w-0 pr-1 pl-1">
        <p className="text-[12px] font-bold text-gray-800 tracking-tight leading-none">
          {currentConfig.title}
        </p>
        <p className="text-[11px] text-gray-500 font-medium mt-1 truncate leading-snug">
          {toast.message}
        </p>
      </div>
      
      {/* Close Button */}
      <button 
        onClick={onRemove}
        className="p-1 hover:bg-black/5 rounded-lg transition-colors text-gray-400 hover:text-gray-600 flex-shrink-0"
      >
        <X size={14} />
      </button>

      {/* Progress Bar */}
      <motion.div 
        initial={{ width: '100%' }}
        animate={{ width: 0 }}
        transition={{ duration: 4, ease: 'linear' }}
        className={`absolute bottom-0 left-0 h-[2px] ${currentConfig.progressBg} rounded-b-full`}
      />
    </motion.div>
  )
}
