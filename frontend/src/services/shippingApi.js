import { apiRequest } from './api'

const normalizeShippingMethod = (method) => ({
  ...method,
  id: method._id || method.id,
  etaLabel: `${method.minDays}-${method.maxDays} days`,
  chargeLabel: `₹${Number(method.charge || 0).toFixed(2)}`,
})

export const getShippingMethods = async (subtotal = 0) => {
  const payload = await apiRequest(`/shipping-methods?subtotal=${subtotal}`)
  return (payload.data || []).map(normalizeShippingMethod)
}

export const getAdminShippingMethods = async () => {
  const payload = await apiRequest('/admin/shipping-methods')
  return (payload.data || []).map(normalizeShippingMethod)
}

export const createAdminShippingMethod = async (data) => {
  const payload = await apiRequest('/admin/shipping-methods', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return normalizeShippingMethod(payload.data)
}

export const updateAdminShippingMethod = async (id, data) => {
  const payload = await apiRequest(`/admin/shipping-methods/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  return normalizeShippingMethod(payload.data)
}

export const deleteAdminShippingMethod = async (id) => {
  const payload = await apiRequest(`/admin/shipping-methods/${id}`, {
    method: 'DELETE',
  })
  return payload
}
