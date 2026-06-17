import { apiRequest } from './api'
import { normalizeProduct } from './catalogApi'

const mapCategory = (category) => ({
  ...category,
  id: category._id || category.id,
  status: category.isActive ? 'Active' : 'Archived',
  children: category.children || [],
})

export const getAdminCategories = async () => {
  const payload = await apiRequest('/admin/categories')
  return (payload.data || []).map(mapCategory)
}

export const toggleAdminCategoryNavbar = async (id, showInNavbar) => {
  const payload = await apiRequest(`/admin/categories/${id}/navbar`, {
    method: 'PATCH',
    body: JSON.stringify({ showInNavbar }),
  })
  return mapCategory(payload.data)
}

export const updateAdminCategory = async (id, data) => {
  const payload = await apiRequest(`/admin/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  return mapCategory(payload.data)
}

export const createAdminCategory = async (data) => {
  const payload = await apiRequest('/admin/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return mapCategory(payload.data)
}

export const deleteAdminCategory = async (id) => {
  const payload = await apiRequest(`/admin/categories/${id}`, {
    method: 'DELETE',
  })
  return mapCategory(payload.data)
}

export const getAdminProducts = async (params = {}) => {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, value)
    }
  })

  const payload = await apiRequest(`/admin/products${query.toString() ? `?${query}` : ''}`)
  return {
    products: (payload.data || []).map(normalizeProduct),
    meta: payload.meta || {},
  }
}

export const getAdminProduct = async (id) => {
  const payload = await apiRequest(`/admin/products/${id}`)
  return normalizeProduct(payload.data)
}

export const createAdminProduct = async (data) => {
  const payload = await apiRequest('/admin/products', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return normalizeProduct(payload.data)
}

export const updateAdminProduct = async (id, data) => {
  const payload = await apiRequest(`/admin/products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  return normalizeProduct(payload.data)
}

export const deleteAdminProduct = async (id) => {
  const payload = await apiRequest(`/admin/products/${id}`, {
    method: 'DELETE',
  })
  return normalizeProduct(payload.data)
}

export const permanentlyDeleteAdminProduct = async (id) => {
  const payload = await apiRequest(`/admin/products/${id}/permanent`, {
    method: 'DELETE',
  })
  return payload
}

export const uploadAdminMedia = async (file, folder = 'products') => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder', folder)

  const payload = await apiRequest('/admin/media/upload', {
    method: 'POST',
    body: formData,
  })

  return payload.data
}
