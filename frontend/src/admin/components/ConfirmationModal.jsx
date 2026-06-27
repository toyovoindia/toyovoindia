import { motion, AnimatePresence } from 'framer-motion'
import { Archive, Trash2, X, AlertTriangle } from 'lucide-react'

export function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Are you sure?", 
  message, 
  confirmText = "Delete", 
  cancelText = "Cancel",
  type = "danger" // danger, warning
}) {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
          onClick={onClose} 
        />
        <div className="min-h-full flex items-center justify-center p-4 pointer-events-none">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden p-8 text-center border border-white/20 pointer-events-auto"
          >
          <div className={`w-16 h-16 ${type === 'danger' ? 'bg-red-50 text-red-500' : 'bg-orange-50 text-orange-500'} rounded-full flex items-center justify-center mx-auto mb-6`}>
            {type === 'danger' ? <Trash2 size={28} /> : <AlertTriangle size={28} />}
          </div>
          
          <h3 className="text-2xl font-grandstander font-bold text-gray-800">{title}</h3>
          <p className="text-[14px] text-gray-500 mt-3 font-medium leading-relaxed">
            {message}
          </p>
          
          <div className="grid grid-cols-2 gap-3 mt-10">
            <button 
              onClick={onClose}
              className="h-14 rounded-2xl bg-gray-50 text-gray-500 text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-gray-100 transition-all active:scale-[0.98]"
            >
              {cancelText}
            </button>
            <button 
              onClick={() => {
                onConfirm()
                onClose()
              }}
              className={`h-14 rounded-2xl ${type === 'danger' ? 'bg-[#E8312A]' : 'bg-[#F1641E]'} text-white text-[11px] font-bold uppercase tracking-[0.2em] shadow-lg ${type === 'danger' ? 'shadow-red-200' : 'shadow-orange-200'} hover:opacity-90 transition-all active:scale-[0.98]`}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
        </div>
      </div>
    </AnimatePresence>
  )
}
