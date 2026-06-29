import { apiRequest } from './api'

const getImage = (product) => (
  product?.thumbnail?.url ||
  product?.images?.[0]?.url ||
  product?.img ||
  ''
)

export const normalizeProduct = (product) => ({
  ...product,
  id: product.slug || product.id || product._id,
  _id: product._id || product.id,
  slug: product.slug || product.id || product._id,
  title: product.name || product.title,
  name: product.name || product.title,
  img: getImage(product),
  hoverImg: product.images?.[1]?.url || getImage(product),
  categoryId: product.category?._id || product.categoryId || '',
  category: product.category?.slug || product.category || '',
  categoryName: product.category?.name || '',
  rating: product.ratingAverage || product.rating || 0,
  reviews: product.reviewCount || product.reviews || 0,
})

export const getNavbarCategories = async () => {
  const payload = await apiRequest('/categories/navbar')
  return payload.data
}

export const getCategoryTree = async () => {
  const payload = await apiRequest('/categories/tree')
  return payload.data || []
}

export const getProducts = async (params = {}) => {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, value)
    }
  })
  const payload = await apiRequest(`/products${query.toString() ? `?${query}` : ''}`)
  return {
    products: (payload.data || []).map(normalizeProduct),
    meta: payload.meta || {},
  }
}

export const getProductBySlug = async (slug) => {
  const payload = await apiRequest(`/products/${slug}`)
  return normalizeProduct(payload.data)
}

export const getFeaturedProducts = async () => {
  const payload = await apiRequest('/products/featured')
  return (payload.data || []).map(normalizeProduct)
}

export const getTrendingProducts = async () => {
  const payload = await apiRequest('/products/trending')
  return (payload.data || []).map(normalizeProduct)
}

export const getNewArrivalProducts = async () => {
  const payload = await apiRequest('/products/new-arrivals')
  return (payload.data || []).map(normalizeProduct)
}

export const getBestSellerProducts = async () => {
  const payload = await apiRequest('/products/best-sellers')
  return (payload.data || []).map(normalizeProduct)
}

export const getProductBrands = async () => {
  const payload = await apiRequest('/products/brands')
  return payload.data || []
}

export const getProductFilters = async () => {
  const payload = await apiRequest('/products/filters')
  return payload.data || { brands: [], genders: [], ages: [], materials: [], colors: [], sizes: [] }
}
