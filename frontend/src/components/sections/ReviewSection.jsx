import { useState, useEffect } from 'react'
import { Star, MessageSquare, Send, CheckCircle, Pencil, Trash2, X, Loader2 } from 'lucide-react'
import { getProductReviews, submitReview, updateMyReview, deleteMyReview } from '../../services/reviewApi'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { motion, AnimatePresence } from 'framer-motion'

export function ReviewSection({ productId, productName, onReviewsChange }) {
  const { user } = useAuth()
  const { success, error: showError } = useToast()

  const [reviews, setReviews] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Notify parent of review list updates dynamically
  useEffect(() => {
    if (onReviewsChange) {
      onReviewsChange(reviews)
    }
  }, [reviews, onReviewsChange])

  // Form state
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [hoverRating, setHoverRating] = useState(0)

  // Edit state
  const [editingReview, setEditingReview] = useState(null) // { _id, rating, comment }
  const [editRating, setEditRating] = useState(0)
  const [editComment, setEditComment] = useState('')
  const [editHover, setEditHover] = useState(0)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  // Find current user's review
  const myReview = user ? reviews.find((r) => r.user?._id === user.id || r.user?._id?.toString() === user.id) : null

  // ──────────────────────────────────────────
  // Load reviews
  // ──────────────────────────────────────────
  const loadReviews = async () => {
    if (!productId || productId === 'undefined') return
    try {
      setIsLoading(true)
      const data = await getProductReviews(productId)
      setReviews(data)
    } catch {
      // silently fail
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (productId) loadReviews()
  }, [productId])

  // ──────────────────────────────────────────
  // Submit new review
  // ──────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) { showError('Please login to submit a review'); return }
    if (rating === 0) { showError('Please select a rating'); return }
    if (!comment.trim()) { showError('Please write a review comment'); return }

    try {
      setIsSubmitting(true)
      const saved = await submitReview({ product: productId, rating, comment })
      success(myReview ? 'Review updated!' : 'Review submitted!')
      setComment('')
      setRating(0)
      // Refresh reviews — auto-approved so shows immediately
      await loadReviews()
    } catch (err) {
      showError(err.message || 'Failed to submit review')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ──────────────────────────────────────────
  // Start editing own review
  // ──────────────────────────────────────────
  const startEdit = (review) => {
    setEditingReview(review)
    setEditRating(review.rating)
    setEditComment(review.comment)
    setEditHover(0)
  }

  const cancelEdit = () => {
    setEditingReview(null)
    setEditRating(0)
    setEditComment('')
    setEditHover(0)
  }

  // ──────────────────────────────────────────
  // Save edited review
  // ──────────────────────────────────────────
  const handleSaveEdit = async () => {
    if (editRating === 0) { showError('Please select a rating'); return }
    if (!editComment.trim()) { showError('Comment cannot be empty'); return }

    try {
      setIsSavingEdit(true)
      const updated = await updateMyReview(editingReview._id, { rating: editRating, comment: editComment })
      setReviews((prev) => prev.map((r) => (r._id === editingReview._id ? { ...r, ...updated } : r)))
      success('Review updated!')
      cancelEdit()
    } catch (err) {
      showError(err.message || 'Failed to update review')
    } finally {
      setIsSavingEdit(false)
    }
  }

  // ──────────────────────────────────────────
  // Delete own review
  // ──────────────────────────────────────────
  const handleDelete = async (reviewId) => {
    if (!window.confirm('Delete your review?')) return
    try {
      setDeletingId(reviewId)
      await deleteMyReview(reviewId)
      setReviews((prev) => prev.filter((r) => r._id !== reviewId))
      success('Review deleted.')
    } catch (err) {
      showError(err.message || 'Failed to delete review')
    } finally {
      setDeletingId(null)
    }
  }

  // ──────────────────────────────────────────
  // Computed stats
  // ──────────────────────────────────────────
  const approvedReviews = reviews.filter((r) => r.status === 'approved')
  const averageRating =
    approvedReviews.length > 0
      ? (approvedReviews.reduce((acc, r) => acc + r.rating, 0) / approvedReviews.length).toFixed(1)
      : 0

  const isMyReviewInForm = !!myReview // already submitted → show "Update" mode

  return (
    <div className="space-y-10">
      {/* ── Summary Bar ─────────────────────────── */}
      <div className="flex flex-col md:flex-row gap-8 items-center bg-[#F9EAD3]/50 p-8 rounded-[24px] border border-dashed border-black/10">
        <div className="text-center md:text-left shrink-0">
          <h3 className="text-5xl font-black text-[#333] mb-2">{averageRating}</h3>
          <div className="flex gap-1 justify-center md:justify-start mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={20}
                className={s <= Math.round(Number(averageRating)) ? 'fill-[#E84949] text-[#E84949]' : 'text-gray-300'}
              />
            ))}
          </div>
          <p className="text-[13px] font-bold text-[#666] uppercase tracking-widest">
            {approvedReviews.length} Customer {approvedReviews.length === 1 ? 'Review' : 'Reviews'}
          </p>
        </div>

        <div className="flex-grow w-full space-y-2">
          {[5, 4, 3, 2, 1].map((s) => {
            const count = approvedReviews.filter((r) => Math.round(r.rating) === s).length
            const pct = approvedReviews.length > 0 ? (count / approvedReviews.length) * 100 : 0
            return (
              <div key={s} className="flex items-center gap-4">
                <span className="text-[12px] font-bold text-[#333] w-4">{s}</span>
                <div className="flex-grow h-2 bg-black/5 rounded-full overflow-hidden">
                  <div className="h-full bg-[#E84949] rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[12px] text-gray-400 w-8">{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Main Grid: Review List + Form ────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

        {/* ── Review List ──────────────────────── */}
        <div className="lg:col-span-7 space-y-8">
          <h4 className="text-[20px] font-black text-[#333] uppercase tracking-tight flex items-center gap-3">
            Customer Reviews
            <span className="h-6 px-2 bg-black/5 rounded-md text-[11px] flex items-center">{approvedReviews.length}</span>
          </h4>

          {isLoading ? (
            <div className="space-y-6">
              {[1, 2].map((i) => (
                <div key={i} className="animate-pulse space-y-3">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-black/5" />
                    <div className="space-y-2 flex-grow">
                      <div className="h-4 bg-black/5 rounded w-1/4" />
                      <div className="h-3 bg-black/5 rounded w-1/6" />
                    </div>
                  </div>
                  <div className="h-16 bg-black/5 rounded w-full" />
                </div>
              ))}
            </div>
          ) : approvedReviews.length === 0 ? (
            <div className="py-12 text-center bg-black/5 rounded-[24px] border border-dashed border-black/10">
              <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-[#666] font-medium">No reviews yet. Be the first to review!</p>
            </div>
          ) : (
            <div className="space-y-8">
              <AnimatePresence mode="popLayout">
                {approvedReviews.map((review) => {
                  const isOwn = user && (review.user?._id === user.id || review.user?._id?.toString() === user.id)
                  const isEditing = editingReview?._id === review._id

                  return (
                    <motion.div
                      key={review._id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="pb-8 border-b border-dashed border-gray-300 last:border-0"
                    >
                      {/* Header */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-4 items-center">
                          <div className="w-12 h-12 rounded-full bg-[#E84949]/10 flex items-center justify-center font-black text-[#E84949] uppercase text-lg shrink-0">
                            {review.userName?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <h5 className="font-bold text-[#333] text-[15px] flex items-center gap-2">
                              {review.userName}
                              {isOwn && (
                                <span className="text-[9px] bg-[#6651A4]/10 text-[#6651A4] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
                                  You
                                </span>
                              )}
                            </h5>
                            <div className="flex items-center gap-2">
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star key={s} size={12} className={s <= review.rating ? 'fill-[#E84949] text-[#E84949]' : 'text-gray-300'} />
                                ))}
                              </div>
                              <span className="text-[11px] text-gray-400 font-medium">
                                · {new Date(review.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {review.role === 'Verified Buyer' && (
                            <span className="flex items-center gap-1 text-[10px] font-black text-green-600 uppercase tracking-widest bg-green-50 px-2 py-1 rounded-full">
                              <CheckCircle size={10} /> Verified
                            </span>
                          )}
                          {isOwn && !isEditing && (
                            <>
                              <button
                                onClick={() => startEdit(review)}
                                className="p-1.5 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-100 transition-colors"
                                title="Edit review"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                onClick={() => handleDelete(review._id)}
                                disabled={deletingId === review._id}
                                className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                                title="Delete review"
                              >
                                {deletingId === review._id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Body: normal view or inline editor */}
                      {isEditing ? (
                        <div className="bg-[#FDF4E6] rounded-2xl p-5 space-y-4 border border-[#E84949]/20">
                          {/* Star picker */}
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <button
                                key={s}
                                type="button"
                                onMouseEnter={() => setEditHover(s)}
                                onMouseLeave={() => setEditHover(0)}
                                onClick={() => setEditRating(s)}
                              >
                                <Star
                                  size={28}
                                  className={(editHover || editRating) >= s ? 'fill-[#FFD700] text-[#FFD700]' : 'text-gray-300'}
                                />
                              </button>
                            ))}
                          </div>
                          <textarea
                            value={editComment}
                            onChange={(e) => setEditComment(e.target.value)}
                            rows={3}
                            className="w-full bg-white rounded-xl p-3 text-[14px] border border-black/10 outline-none focus:ring-2 focus:ring-[#E84949] resize-none"
                          />
                          <div className="flex gap-3">
                            <button
                              onClick={handleSaveEdit}
                              disabled={isSavingEdit}
                              className="h-10 px-5 bg-[#333] text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-[#E84949] transition-all flex items-center gap-2 disabled:opacity-60"
                            >
                              {isSavingEdit ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                              Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="h-10 px-5 bg-white border border-gray-200 text-gray-500 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center gap-2"
                            >
                              <X size={14} /> Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[#444] leading-relaxed italic text-[15px]">"{review.comment}"</p>
                      )}
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* ── Submit / Update Form ─────────────── */}
        <div className="lg:col-span-5">
          <div className="bg-white p-8 rounded-[32px] shadow-sm border border-black/[0.03] sticky top-24">
            <h4 className="text-[20px] font-black text-[#333] uppercase tracking-tight mb-2">
              {isMyReviewInForm ? 'Update Your Review' : 'Write a Review'}
            </h4>
            {isMyReviewInForm && (
              <p className="text-[11px] text-[#6651A4] font-bold uppercase tracking-widest mb-4">
                You've already reviewed this product — submitting will update your review.
              </p>
            )}

            {user ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Rating Stars */}
                <div className="space-y-3">
                  <label className="text-[12px] font-black text-[#666] uppercase tracking-widest">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onMouseEnter={() => setHoverRating(s)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(s)}
                        className="transition-transform hover:scale-110 active:scale-95"
                      >
                        <Star
                          size={32}
                          className={(hoverRating || rating) >= s ? 'fill-[#FFD700] text-[#FFD700]' : 'text-gray-200'}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <div className="space-y-3">
                  <label className="text-[12px] font-black text-[#666] uppercase tracking-widest">Review Message</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell us what you think..."
                    rows={4}
                    className="w-full bg-[#FDF4E6] border-none rounded-2xl p-4 text-[14px] focus:ring-2 focus:ring-[#E84949] transition-all resize-none font-roboto outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-14 bg-[#333] text-white rounded-2xl font-black text-[12px] tracking-[0.2em] uppercase hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <Send size={16} />
                      {isMyReviewInForm ? 'Update Review' : 'Submit Review'}
                    </>
                  )}
                </button>
                <p className="text-[10px] text-gray-400 text-center font-medium">
                  Reviews are published instantly.
                </p>
              </form>
            ) : (
              <div className="text-center py-8">
                <p className="text-[#666] mb-6 font-medium">
                  Please log in to share your experience with {productName}
                </p>
                <button
                  onClick={() => (window.location.href = '/login')}
                  className="h-12 px-8 bg-[#E84949] text-white rounded-xl font-black text-[11px] tracking-widest uppercase shadow-md hover:scale-105 transition-all"
                >
                  Log In Now
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
