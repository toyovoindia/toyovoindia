import { apiRequest } from './api'

export const getStorefrontSettings = async () => {
  const payload = await apiRequest('/site/storefront')
  return payload.data
}

export const getAdminStorefrontSettings = async () => {
  const payload = await apiRequest('/admin/site/storefront')
  return payload.data
}

export const getAdminDashboardStats = async () => {
  const payload = await apiRequest('/admin/site/dashboard-stats')
  return payload.data
}

export const updateAdminStorefrontSettings = async (data) => {
  const payload = await apiRequest('/admin/site/storefront', {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  return payload.data
}

export const getPurchasePopupSettings = async () => {
  const payload = await apiRequest('/site/purchase-popup')
  return payload.data
}

export const getAdminPurchasePopupSettings = async () => {
  const payload = await apiRequest('/admin/site/purchase-popup')
  return payload.data
}

export const updateAdminPurchasePopupSettings = async (data) => {
  const payload = await apiRequest('/admin/site/purchase-popup', {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  return payload.data
}
