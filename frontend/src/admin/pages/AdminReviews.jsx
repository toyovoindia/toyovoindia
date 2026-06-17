import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Check, X, Trash2, Filter, Search, MessageSquare, ExternalLink } from 'lucide-react'
import { getAllReviews, updateReviewStatus, deleteReview } from '../../services/reviewApi'
import { useToast } from '../../context/ToastContext'

export function AdminReviews() {
  const { success, error: showError } = useToast()
  const [reviews, setReviews] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadReviews()
  }, [])

  const loadReviews = async () => {
    try {
      setIsLoading(true)
      const data = await getAllReviews()
      setReviews(data)
    } catch (err) {
      showError('Failed to load reviews')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusUpdate = async (id, status) => {
    try {
      await updateReviewStatus(id, status)
      success(`Review ${status} successfully`)
      setReviews(reviews.map(r => r._id === id ? { ...r, status } : r))
    } catch (err) {
      showError('Failed to update status')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return
    try {
      await deleteReview(id)
      success('Review deleted')
      setReviews(reviews.filter(r => r._id !== id))
    } catch (err) {
      showError('Failed to delete review')
    }
  }

  const filteredReviews = reviews.filter(r => {
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus
    const cleanSearch = searchTerm.trim().toLowerCase()
    const matchesSearch = 
      !cleanSearch ||
      r.userName.toLowerCase().includes(cleanSearch) ||
      r.comment.toLowerCase().includes(cleanSearch) ||
      (r.product?.name || '').toLowerCase().includes(cleanSearch)
    return matchesStatus && matchesSearch
  })

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <h1 className="text-[32px] md:text-[40px] font-black text-[#333] leading-tight tracking-tight uppercase">Reviews Hub</h1>
          <p className="text-[14px] font-bold text-[#666] flex items-center gap-2">
            Manage customer feedback and testimonials
            <span className="w-1.5 h-1.5 rounded-full bg-[#6651A4]" />
            <span className="text-[#6651A4]">{reviews.length} Total</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <div className="flex-grow md:flex-grow-0 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search reviews..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64 h-12 pl-12 pr-4 bg-white border border-black/[0.05] rounded-2xl text-[13px] font-bold outline-none focus:ring-2 focus:ring-[#6651A4]/20 transition-all"
            />
          </div>
          
          <div className="flex items-center bg-white border border-black/[0.05] rounded-2xl p-1 gap-1">
            {['all', 'pending', 'approved', 'rejected'].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                  filterStatus === s 
                  ? 'bg-[#6651A4] text-white shadow-md' 
                  : 'text-gray-400 hover:bg-gray-50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: 'Pending', count: reviews.filter(r => r.status === 'pending').length, color: 'orange' },
          { label: 'Approved', count: reviews.filter(r => r.status === 'approved').length, color: 'green' },
          { label: 'Rejected', count: reviews.filter(r => r.status === 'rejected').length, color: 'red' },
          { label: 'Avg Rating', count: reviews.length > 0 ? (reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(1) : 0, color: 'purple' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[28px] border border-black/[0.03] shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{stat.label}</p>
            <h3 className="text-2xl font-black text-[#333]">{stat.count}</h3>
          </div>
        ))}
      </div>

      {/* Reviews Table/List */}
      <div className="bg-white rounded-[32px] border border-black/[0.03] shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-[#6651A4]/20 border-t-[#6651A4] rounded-full animate-spin" />
            <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest animate-pulse">Loading Feedbacks...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="p-20 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageSquare size={32} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">No reviews found</h3>
            <p className="text-gray-500 text-sm mt-1">Try adjusting your filters or search term</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-black/[0.05]">
                  <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">User & Product</th>
                  <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Feedback</th>
                  <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Rating</th>
                  <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.03]">
                {filteredReviews.map((review) => (
                  <tr key={review._id} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <p className="font-black text-[14px] text-gray-800">{review.userName}</p>
                        <p className="text-[11px] font-bold text-[#6651A4] flex items-center gap-1">
                          {review.product?.name || 'Unknown Product'}
                          <ExternalLink size={10} />
                        </p>
                      </div>
                    </td>
                    <td className="px-8 py-6 max-w-md">
                      <p className="text-[13px] text-gray-600 line-clamp-2 italic">"{review.comment}"</p>
                      <p className="text-[10px] text-gray-400 mt-1">{new Date(review.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} size={12} className={s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
                        ))}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        review.status === 'approved' ? 'bg-green-100 text-green-600' :
                        review.status === 'pending' ? 'bg-orange-100 text-orange-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {review.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        {review.status !== 'approved' && (
                          <button 
                            onClick={() => handleStatusUpdate(review._id, 'approved')}
                            className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                            title="Approve"
                          >
                            <Check size={16} />
                          </button>
                        )}
                        {review.status !== 'rejected' && (
                          <button 
                            onClick={() => handleStatusUpdate(review._id, 'rejected')}
                            className="p-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors"
                            title="Reject"
                          >
                            <X size={16} />
                          </button>
                        )}
                        <button 
                          onClick={() => handleDelete(review._id)}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
