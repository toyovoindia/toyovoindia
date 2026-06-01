import { apiRequest } from './api'

const normalizeCoupon = (coupon) => ({
  ...coupon,
  id: coupon._id || coupon.id,
  code: coupon.code?.toUpperCase?.() || coupon.code,
})

export const getAdminCoupons = async (params = {}) => {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, value)
    }
  })

  const payload = await apiRequest(`/admin/coupons${query.toString() ? `?${query}` : ''}`)
  return {
    coupons: (payload.data || []).map(normalizeCoupon),
    meta: payload.meta || {},
  }
}

export const createAdminCoupon = async (data) => {
  const payload = await apiRequest('/admin/coupons', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return normalizeCoupon(payload.data)
}

export const updateAdminCouponStatus = async (id, status) => {
  const payload = await apiRequest(`/admin/coupons/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
  return normalizeCoupon(payload.data)
}

export const validateCouponCode = async (data) => {
  const payload = await apiRequest('/coupons/validate', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return payload.data
}

export const deleteAdminCoupon = async (id) => {
  const payload = await apiRequest(`/admin/coupons/${id}`, {
    method: 'DELETE',
  })
  return payload
}
