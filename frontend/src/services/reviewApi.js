import { apiRequest } from './api'

// ─── Public / Product ──────────────────────────────────

export const getRecentReviews = async () => {
  const payload = await apiRequest('/reviews/recent')
  return payload.data || []
}

export const getProductReviews = async (productId) => {
  const payload = await apiRequest(`/reviews/product/${productId}`)
  return payload.data || []
}

// ─── Customer ──────────────────────────────────────────

export const submitReview = async (data) => {
  const payload = await apiRequest('/reviews', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return payload.data
}

export const getMyProductReview = async (productId) => {
  const payload = await apiRequest(`/reviews/my/${productId}`)
  return payload.data || null
}

export const updateMyReview = async (reviewId, data) => {
  const payload = await apiRequest(`/reviews/${reviewId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  return payload.data
}

export const deleteMyReview = async (reviewId) => {
  const payload = await apiRequest(`/reviews/my/${reviewId}`, {
    method: 'DELETE',
  })
  return payload.data
}

// ─── Admin ─────────────────────────────────────────────

export const getAllReviews = async () => {
  const payload = await apiRequest('/reviews')
  return payload.data || []
}

export const updateReviewStatus = async (id, status) => {
  const payload = await apiRequest(`/reviews/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
  return payload.data
}

export const deleteReview = async (id) => {
  const payload = await apiRequest(`/reviews/${id}`, {
    method: 'DELETE',
  })
  return payload.data
}
