import { apiRequest } from './api'

export const loginUser = async (credentials) => {
  const payload = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
  return payload.data
}

export const registerUser = async (userData) => {
  const payload = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  })
  return payload.data
}

export const logoutUser = async () => {
  await apiRequest('/auth/logout', { method: 'POST' })
}

export const getCurrentUser = async () => {
  const payload = await apiRequest('/auth/me')
  return payload.data
}

export const verifyOtpUser = async (data) => {
  const payload = await apiRequest('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return payload.data
}

export const resendOtpUser = async (data) => {
  const payload = await apiRequest('/auth/resend-otp', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return payload.data
}
