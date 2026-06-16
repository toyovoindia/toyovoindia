import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import registerImage from '../assets/TOYOVOINIDIA_auth_banner.webp'
import logo from '../assets/toyovo.webp'

export function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: ''
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pendingVerification, setPendingVerification] = useState(null)
  const [otp, setOtp] = useState('')
  const { register, verifyOtp, resendOtp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState('')
  const [agreePolicies, setAgreePolicies] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const nextPath = new URLSearchParams(location.search).get('next')

  const validateForm = () => {
    const errors = {}
    
    // First Name Validation: required, alphabetic only
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required'
    } else if (!/^[a-zA-Z\s]+$/.test(formData.firstName)) {
      errors.firstName = 'First name must contain only alphabets'
    }

    // Last Name Validation: required, alphabetic only
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required'
    } else if (!/^[a-zA-Z\s]+$/.test(formData.lastName)) {
      errors.lastName = 'Last name must contain only alphabets'
    }

    // Email Validation: required, standard RFC 5322 format check
    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address'
    }

    // Phone Validation: required, 10 digits starting with 6-9
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required'
    } else if (!/^[6-9][0-9]{9}$/.test(formData.phone)) {
      errors.phone = 'Phone number must be a 10-digit number starting with 6-9'
    }

    // Password Validation: required, minimum 8 characters
    if (!formData.password) {
      errors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long'
    }

    // Policies Checkbox Validation
    if (!agreePolicies) {
      errors.agreePolicies = 'You must agree to the Terms & Conditions and Privacy Policy'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    setIsSubmitting(true)
    
    if (!validateForm()) {
      setIsSubmitting(false)
      return
    }

    const payload = {
      ...formData,
      email: formData.email.trim(),
      phone: '+91' + formData.phone.trim()
    }

    const res = await register(payload)
    
    if (res.success) {
      if (res.requireOtp) {
        setPendingVerification({ phone: res.phone, purpose: res.purpose })
        setError('')
      } else {
        navigate(nextPath || '/', { replace: true })
      }
    } else {
      setError(res.message)
    }
    setIsSubmitting(false)
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP')
      return
    }
    setError('')
    setIsSubmitting(true)
    const res = await verifyOtp({ phone: pendingVerification.phone, otp, purpose: pendingVerification.purpose })
    if (res.success) {
      const fallbackPath = ['admin', 'super_admin'].includes(res.user?.role) ? '/admin' : '/'
      navigate(nextPath || fallbackPath, { replace: true })
    } else {
      setError(res.message)
    }
    setIsSubmitting(false)
  }

  const handleResendOtp = async () => {
    setResendLoading(true)
    setError('')
    setResendMessage('')
    const res = await resendOtp(pendingVerification.phone, pendingVerification.purpose)
    if (res.success) {
      setResendMessage(res.message)
    } else {
      setError(res.message)
    }
    setResendLoading(false)
  }

  return (
    <div className="min-h-[100dvh] lg:h-[100dvh] w-screen bg-[#FDF4E6] flex flex-col lg:flex-row overflow-hidden font-roboto">
      {/* Left Side: Premium Banner (Only on Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 h-full p-4 flex-col justify-center">
        <div className="w-full h-full relative rounded-[32px] overflow-hidden shadow-2xl">
          <img 
            src={registerImage}
            alt="Toyovo India Register" 
            className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#6651A4]/40 via-black/10 to-transparent" />
          <div className="absolute bottom-12 left-12 max-w-md text-left">
            <h2 className="text-white text-3xl font-grandstander font-bold drop-shadow-md">Premium Toys for Joyful Kids</h2>
            <p className="text-white/85 mt-2 text-sm drop-shadow-sm font-medium">Discover safe, educational, and fun toys crafted with love in India.</p>
          </div>
        </div>
      </div>

      {/* Right Side / Mobile: Form and Branding combined */}
      <div className="w-full lg:w-1/2 min-h-[100dvh] lg:min-h-0 lg:h-full flex flex-col justify-center items-center p-4 sm:p-6 md:p-12 overflow-y-auto">
        <div className="w-full max-w-[460px] flex flex-col items-center">
          {/* Logo Header (inside form side for consistency on both web and mobile) */}
          <Link to="/" className="flex flex-col items-center gap-2 mb-6 hover:opacity-90 transition-opacity">
            <img src={logo} alt="Toyovo Logo" className="w-20 h-20 object-contain drop-shadow-sm" />
            <span className="font-grandstander font-bold text-3xl text-[#6651A4] tracking-tight">
              Toyovo<span className="text-[#F1641E]">India</span>
            </span>
          </Link>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-[#F9EAD3] border-[1.6px] border-dashed border-[#333]/15 rounded-[32px] p-6 sm:p-8 shadow-xl"
          >
            <div className="text-center mb-5">
              <h1 className="text-2xl md:text-3xl font-grandstander font-bold text-[#333] tracking-tighter">Create account</h1>
              {error && <p className="mt-2 text-[#E84949] text-[11px] font-bold uppercase tracking-wider">{error}</p>}
            </div>

            {pendingVerification ? (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="text-center mb-4">
                  <p className="text-sm font-semibold text-[#333]">OTP sent to {pendingVerification.phone}</p>
                </div>
                <div>
                  <input 
                    type="text" 
                    placeholder="Enter 6-digit OTP" 
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full h-12 bg-transparent border-[1.2px] border-dashed border-[#333]/20 rounded-xl px-4 outline-none focus:border-[#E84949] transition-all text-center tracking-[0.5em] text-lg font-bold"
                    required
                  />
                </div>
                {resendMessage && (
                  <p className="text-green-600 text-xs text-center font-bold">{resendMessage}</p>
                )}
                <div className="text-right">
                  <button 
                    type="button"
                    disabled={resendLoading}
                    onClick={handleResendOtp}
                    className="text-xs font-bold text-[#E84949] underline hover:no-underline hover:text-[#333] transition-colors disabled:opacity-50"
                  >
                    {resendLoading ? 'Resending OTP...' : 'Resend OTP'}
                  </button>
                </div>
                <div className="space-y-3 pt-3">
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full h-12 bg-[#E84949] text-white font-bold text-[12px] tracking-[0.2em] uppercase rounded-xl hover:bg-[#333] transition-all shadow-md active:scale-95 flex items-center justify-center"
                  >
                    {isSubmitting ? 'VERIFYING...' : 'VERIFY OTP'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setPendingVerification(null)}
                    className="w-full h-12 bg-transparent border border-[#333]/20 text-[#333] font-bold text-[12px] tracking-[0.2em] uppercase rounded-xl hover:bg-[#FDF4E6] transition-all flex items-center justify-center"
                  >
                    BACK TO REGISTRATION
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input 
                      type="text" 
                      placeholder="First name" 
                      value={formData.firstName}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^a-zA-Z\s]/g, '')
                        setFormData({...formData, firstName: val})
                        if (fieldErrors.firstName) setFieldErrors({...fieldErrors, firstName: ''})
                      }}
                      className="w-full h-11 bg-transparent border-[1.2px] border-dashed border-[#333]/20 rounded-xl px-3 outline-none focus:border-[#E84949] transition-all placeholder-[#333]/40 text-xs font-semibold"
                      required
                    />
                    {fieldErrors.firstName && (
                      <p className="mt-1 text-[#E84949] text-[9px] font-bold uppercase tracking-wide ml-1.5 leading-tight">{fieldErrors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <input 
                      type="text" 
                      placeholder="Last name" 
                      value={formData.lastName}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^a-zA-Z\s]/g, '')
                        setFormData({...formData, lastName: val})
                        if (fieldErrors.lastName) setFieldErrors({...fieldErrors, lastName: ''})
                      }}
                      className="w-full h-11 bg-transparent border-[1.2px] border-dashed border-[#333]/20 rounded-xl px-3 outline-none focus:border-[#E84949] transition-all placeholder-[#333]/40 text-xs font-semibold"
                      required
                    />
                    {fieldErrors.lastName && (
                      <p className="mt-1 text-[#E84949] text-[9px] font-bold uppercase tracking-wide ml-1.5 leading-tight">{fieldErrors.lastName}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <input 
                    type="email" 
                    placeholder="Email" 
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({...formData, email: e.target.value})
                      if (fieldErrors.email) setFieldErrors({...fieldErrors, email: ''})
                    }}
                    className="w-full h-11 bg-transparent border-[1.2px] border-dashed border-[#333]/20 rounded-xl px-4 outline-none focus:border-[#E84949] transition-all placeholder-[#333]/40 text-xs font-semibold"
                    required
                  />
                  {fieldErrors.email && (
                    <p className="mt-1 text-[#E84949] text-[9px] font-bold uppercase tracking-wide ml-1.5 leading-tight">{fieldErrors.email}</p>
                  )}
                </div>

                <div>
                  <div className="relative flex items-center font-roboto">
                    <span className="absolute left-4 text-xs font-bold text-gray-500 pointer-events-none">+91</span>
                    <input 
                      type="tel" 
                      placeholder="Phone number" 
                      value={formData.phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                        setFormData({...formData, phone: val})
                        if (fieldErrors.phone) setFieldErrors({...fieldErrors, phone: ''})
                      }}
                      className="w-full h-11 bg-transparent border-[1.2px] border-dashed border-[#333]/20 rounded-xl pl-12 pr-4 outline-none focus:border-[#E84949] transition-all placeholder-[#333]/40 font-bold text-xs"
                      required
                    />
                  </div>
                  {fieldErrors.phone && (
                    <p className="mt-1 text-[#E84949] text-[9px] font-bold uppercase tracking-wide ml-1.5 leading-tight">{fieldErrors.phone}</p>
                  )}
                </div>

                <div>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Password" 
                      value={formData.password}
                      onChange={(e) => {
                        setFormData({...formData, password: e.target.value})
                        if (fieldErrors.password) setFieldErrors({...fieldErrors, password: ''})
                      }}
                      className="w-full h-11 bg-transparent border-[1.2px] border-dashed border-[#333]/20 rounded-xl pl-4 pr-12 outline-none focus:border-[#E84949] transition-all placeholder-[#333]/40 text-xs font-semibold"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#333]/40 hover:text-[#E84949] transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="mt-1 text-[#E84949] text-[9px] font-bold uppercase tracking-wide ml-1.5 leading-tight">{fieldErrors.password}</p>
                  )}
                </div>

                <div className="flex items-start gap-2.5 pt-1.5 px-1 font-roboto">
                  <input
                    type="checkbox"
                    id="agreePolicies"
                    checked={agreePolicies}
                    onChange={(e) => {
                      setAgreePolicies(e.target.checked)
                      if (fieldErrors.agreePolicies) setFieldErrors({...fieldErrors, agreePolicies: ''})
                    }}
                    className="mt-0.5 w-4.5 h-4.5 accent-[#E84949] cursor-pointer rounded border-[#333]/20"
                    required
                  />
                  <label htmlFor="agreePolicies" className="text-[10px] sm:text-[11px] text-[#666] font-medium leading-tight cursor-pointer select-none text-left">
                    I agree to the{' '}
                    <Link to="/pages/terms-conditions" target="_blank" className="text-[#E84949] font-bold underline hover:no-underline">
                      Terms & Conditions
                    </Link>{' '}
                    and{' '}
                    <Link to="/pages/privacy-policy" target="_blank" className="text-[#E84949] font-bold underline hover:no-underline">
                      Privacy Policy
                    </Link>
                    .
                  </label>
                </div>
                {fieldErrors.agreePolicies && (
                  <p className="text-[#E84949] text-[9px] font-bold uppercase tracking-wide ml-7 leading-tight">{fieldErrors.agreePolicies}</p>
                )}

                <div className="space-y-3 pt-3 text-center">
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full h-11 bg-[#E84949] text-white font-bold text-[11px] tracking-[0.2em] uppercase rounded-xl hover:bg-[#333] transition-all shadow-md active:scale-95 flex items-center justify-center"
                  >
                    {isSubmitting ? 'CREATING...' : 'CREATE'}
                  </button>
                  <div className="flex flex-col gap-2 pt-2">
                      <div>
                        <p className="text-[12px] text-[#666] inline mr-1">Already have an account?</p>
                        <Link to={`/login${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ''}`} className="text-[11px] font-bold text-[#333] underline hover:no-underline hover:text-[#E84949] uppercase tracking-widest transition-colors">Login here</Link>
                      </div>
                      <div>
                        <Link to="/" className="text-[11px] text-[#666] hover:text-[#E84949] font-semibold underline hover:no-underline transition-colors">Back to store</Link>
                      </div>
                  </div>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
