const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const AUTH_USER_STORAGE_KEY = 'TOYOVOINDIA_auth_user'

const getStoredAccessToken = () => {
  try {
    const raw = localStorage.getItem(AUTH_USER_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.accessToken || null
  } catch {
    return null
  }
}

const updateStoredAuthUser = (partial) => {
  try {
    const raw = localStorage.getItem(AUTH_USER_STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify({
      ...parsed,
      ...partial,
    }))
  } catch {
    // no-op
  }
}

const buildHeaders = (options = {}) => {
  const headers = new Headers(options.headers || {})
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const accessToken = getStoredAccessToken()
  if (accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }
  return headers
}

const shouldTryRefresh = (path) => !path.startsWith('/auth/') || path === '/auth/me'

export async function apiRequest(path, options = {}, meta = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    headers: buildHeaders(options),
    ...options,
  })

  const payload = await response.json().catch(() => ({}))

  if (response.status === 401 && shouldTryRefresh(path) && !meta.skipRefresh) {
    const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: buildHeaders({ headers: { 'Content-Type': 'application/json' } }),
    })

    if (refreshResponse.ok) {
      const refreshPayload = await refreshResponse.json().catch(() => ({}))
      if (refreshPayload?.data?.accessToken) {
        updateStoredAuthUser(refreshPayload.data)
      }
      return apiRequest(path, options, { skipRefresh: true })
    }
  }

  if (!response.ok) {
    const details = payload.errors || []
    // If backend returns generic 'Validation failed', build a readable message from Zod field errors
    let message = payload.message || 'Request failed'
    if (message === 'Validation failed' && details.length > 0) {
      // Map field-level Zod errors to a user-friendly sentence
      const fieldMessages = details.map(err => {
        const field = err.path?.split('.').pop() || ''
        const msg = err.message || ''
        if (field === 'code') return 'Please enter a valid coupon code (3–40 characters)'
        if (field === 'subtotal') return 'Invalid order amount'
        return msg
      })
      message = fieldMessages[0] || message
    }
    const error = new Error(message)
    error.details = details
    error.status = response.status
    throw error
  }

  return payload
}

export { API_BASE_URL }
