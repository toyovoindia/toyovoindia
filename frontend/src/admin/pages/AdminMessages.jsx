import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, MessageSquare, Search, UserRound, X, Clock, Phone, ChevronRight } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { getAdminMessages, updateAdminMessageStatus } from '../../services/messageApi'

export function AdminMessages() {
  const { success, error: showError } = useToast()
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [messages, setMessages] = useState([])
  const [selectedMessage, setSelectedMessage] = useState(null)

  useEffect(() => {
    let isMounted = true

    const loadMessages = async () => {
      try {
        const data = await getAdminMessages()
        if (!isMounted) return
        setMessages(data)
      } catch (error) {
        if (isMounted) showError(error.message || 'Messages could not be loaded')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadMessages()
    return () => {
      isMounted = false
    }
  }, [showError])

  const filteredMessages = useMemo(() => messages.filter((message) => {
    const query = search.trim().toLowerCase()
    if (!query) return true
    return [message.name, message.email, message.subject, message.message, message.typeLabel]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(query))
  }), [messages, search])

  const handleStatusChange = async (id, status) => {
    try {
      const updated = await updateAdminMessageStatus(id, status)
      setMessages((prev) => prev.map((message) => (message.id === id ? updated : message)))
      
      // Bug 124 Fix: Update selectedMessage in-place so admin stays on the detail view
      if (selectedMessage && selectedMessage.id === id) {
        setSelectedMessage(updated)
      }
      
      success('Message status updated.')
    } catch (error) {
      showError(error.message || 'Message status could not be updated')
    }
  }

  const formatMessageDate = (dateString) => {
    if (!dateString) return ''
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString))
  }

  return (
    <div className="shell space-y-6 pb-10">
      <div>
        <h1 className="text-2xl md:text-4xl font-grandstander font-bold text-gray-800">Messages</h1>
        <p className="text-gray-500 font-medium text-[12px] md:text-sm mt-1">Contact forms and customer support messages.</p>
      </div>

      <div className="bg-white p-4 rounded-[24px] shadow-sm border border-black/[0.03]">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Search messages..." 
            className="w-full h-12 pl-12 pr-4 bg-[#FDF4E6]/50 rounded-xl outline-none border border-transparent focus:border-[#F1641E]/30 font-medium text-[13px] transition-all" 
          />
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-black/[0.03] shadow-sm divide-y divide-gray-50 overflow-hidden">
        {loading ? (
          <div className="p-6 text-[12px] font-bold text-gray-400 uppercase tracking-widest animate-pulse">Loading messages...</div>
        ) : filteredMessages.length === 0 ? (
          <div className="p-6 text-[12px] font-bold text-gray-400 uppercase tracking-widest">No messages found.</div>
        ) : filteredMessages.map((message) => (
          <div 
            key={message.id} 
            onClick={() => setSelectedMessage(message)}
            className="p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#FDF4E6]/40 transition-colors cursor-pointer group"
          >
            <div className="flex items-start gap-4 min-w-0 flex-1">
              <div className="w-12 h-12 rounded-2xl bg-[#FAEAD3] text-[#F1641E] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                {message.type === 'newsletter' ? <Mail size={20} /> : <MessageSquare size={20} />}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-gray-800 text-[14px] md:text-[16px] group-hover:text-[#6651A4] transition-colors">{message.subject}</h3>
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-1 flex items-center gap-2 flex-wrap">
                  <UserRound size={12} /> {message.name} • {message.email} • {message.typeLabel}
                </p>
                <p className="text-[12px] text-gray-500 mt-2 line-clamp-2">{message.message}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 self-end md:self-center" onClick={(e) => e.stopPropagation()}>
              <select 
                value={message.status} 
                onChange={(e) => handleStatusChange(message.id, e.target.value)} 
                className="h-10 px-4 rounded-xl border border-black/[0.05] bg-white text-[10px] font-bold uppercase tracking-widest text-gray-700 outline-none cursor-pointer hover:bg-gray-50"
              >
                <option value="Unread">Unread</option>
                <option value="Read">Read</option>
                <option value="Closed">Closed</option>
              </select>
              <ChevronRight size={18} className="text-gray-300 group-hover:text-[#6651A4] transition-colors hidden md:block" />
            </div>
          </div>
        ))}
      </div>

      {/* Message Details Modal */}
      <AnimatePresence>
        {selectedMessage && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[32px] p-6 md:p-8 max-w-2xl w-full shadow-2xl relative border border-black/[0.03]"
            >
              <button 
                onClick={() => setSelectedMessage(null)} 
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-[#FAEAD3] text-[#F1641E] flex items-center justify-center shrink-0">
                  {selectedMessage.type === 'newsletter' ? <Mail size={24} /> : <MessageSquare size={24} />}
                </div>
                <div>
                  <span className="px-2.5 py-0.5 bg-[#6651A4]/10 text-[#6651A4] rounded-md text-[9px] font-bold uppercase tracking-widest">
                    {selectedMessage.typeLabel}
                  </span>
                  <h3 className="text-xl font-grandstander font-bold text-gray-800 mt-1">{selectedMessage.subject}</h3>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-[#FDF4E6]/50 rounded-[24px] mb-6 text-[13px]">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-600">
                    <UserRound size={16} className="text-gray-400 shrink-0" />
                    <span className="font-bold text-gray-800">{selectedMessage.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail size={16} className="text-gray-400 shrink-0" />
                    <a href={`mailto:${selectedMessage.email}`} className="text-[#6651A4] hover:underline font-medium">{selectedMessage.email}</a>
                  </div>
                </div>
                <div className="space-y-3">
                  {selectedMessage.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone size={16} className="text-gray-400 shrink-0" />
                      <a href={`tel:${selectedMessage.phone}`} className="text-gray-800 hover:underline font-medium">{selectedMessage.phone}</a>
                    </div>
                  )}
                  {selectedMessage.createdAt && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <Clock size={16} className="shrink-0" />
                      <span className="font-medium">{formatMessageDate(selectedMessage.createdAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-8">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Message Content</h4>
                <div className="p-5 bg-white border border-[#FAEAD3] rounded-[24px] text-gray-700 text-[14px] leading-relaxed whitespace-pre-wrap max-h-[250px] overflow-y-auto custom-scrollbar">
                  {selectedMessage.message}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-gray-50">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Status:</span>
                  <select 
                    value={selectedMessage.status} 
                    onChange={(e) => handleStatusChange(selectedMessage.id, e.target.value)} 
                    className="h-11 px-4 rounded-xl border border-black/[0.05] bg-white text-[11px] font-bold uppercase tracking-widest text-gray-700 outline-none cursor-pointer hover:bg-gray-50"
                  >
                    <option value="Unread">Unread</option>
                    <option value="Read">Read</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
                <button 
                  onClick={() => setSelectedMessage(null)} 
                  className="h-11 px-6 bg-[#6651A4] text-white rounded-xl font-bold uppercase tracking-widest text-[11px] hover:bg-[#5a4892] transition-colors text-center shadow-md shadow-[#6651A4]/15"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
