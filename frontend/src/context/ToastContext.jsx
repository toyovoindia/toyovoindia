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

function ToastItem({ toast, onRemove }) {
  const configs = {
    success: { icon: <CheckCircle2 size={18} />, color: 'bg-[#6651A4]', textColor: 'text-white' },
    error: { icon: <AlertCircle size={18} />, color: 'bg-[#E8312A]', textColor: 'text-white' },
    info: { icon: <Info size={18} />, color: 'bg-[#F1641E]', textColor: 'text-white' },
    warning: { icon: <Bell size={18} />, color: 'bg-yellow-500', textColor: 'text-white' }
  }

  const { icon, color, textColor } = configs[toast.type]

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      layout
      className={`pointer-events-auto flex items-center gap-4 px-6 py-4 rounded-[24px] shadow-2xl relative ${color} ${textColor} min-w-[320px] max-w-md border border-white/10`}
    >
      <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-[13px] font-bold uppercase tracking-widest leading-tight">
          {toast.type === 'success' ? 'Great!' : toast.type === 'error' ? 'Oops!' : 'Heads Up'}
        </p>
        <p className="text-[14px] font-medium mt-1 opacity-90">{toast.message}</p>
      </div>
      <button 
        onClick={onRemove}
        className="p-1 hover:bg-black/10 rounded-lg transition-colors opacity-60 hover:opacity-100"
      >
        <X size={16} />
      </button>
      
      {/* Progress Bar */}
      <motion.div 
        initial={{ width: '100%' }}
        animate={{ width: 0 }}
        transition={{ duration: 4, ease: 'linear' }}
        className="absolute bottom-0 left-0 h-1 bg-white/30 rounded-b-full"
      />
    </motion.div>
  )
}
