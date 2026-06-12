import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import loginImage from '../assets/TOYOVOINIDIA_auth_banner.webp'
import logo from '../assets/toyovo.webp'
export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pendingVerification, setPendingVerification] = useState(null)
  const [otp, setOtp] = useState('')
  const { login, verifyOtp, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const nextPath = new URLSearchParams(location.search).get('next')

  const validateForm = () => {
    const errors = {}
    if (!email.trim()) {
      errors.email = 'Email or Mobile is required'
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim()) && !/^[6-9]\d{9}$/.test(email.trim())) {
      errors.email = 'Enter a valid email or 10-digit mobile number starting with 6-9'
    }

    if (!password) {
      errors.password = 'Password is required'
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

    const res = await login(email.trim(), password)
    if (res.success) {
      if (res.requireOtp) {
        setPendingVerification({ phone: res.phone, purpose: res.purpose })
        setError('')
      } else {
        const isUserAdmin = ['admin', 'super_admin'].includes(res.user?.role)
        if (isUserAdmin) {
          await logout()
          setError('Admins cannot log in using the user portal. Please log in via the Admin Login.')
        } else {
          navigate(nextPath || '/', { replace: true })
        }
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
      const isUserAdmin = ['admin', 'super_admin'].includes(res.user?.role)
      if (isUserAdmin) {
        await logout()
        setError('Admins cannot log in using the user portal. Please log in via the Admin Login.')
        setPendingVerification(null)
      } else {
        navigate(nextPath || '/', { replace: true })
      }
    } else {
      setError(res.message)
    }
    setIsSubmitting(false)
  }

  return (
    <div className="min-h-[100dvh] lg:h-[100dvh] w-screen bg-[#FDF4E6] flex flex-col lg:flex-row overflow-hidden font-roboto">
      {/* Left Side: Premium Banner (Only on Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 h-full p-4 flex-col justify-center">
        <div className="w-full h-full relative rounded-[32px] overflow-hidden shadow-2xl">
          <img
            src={loginImage}
            alt="Toyovo India Login"
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
            <div className="text-center mb-6">
              <h1 className="text-2xl md:text-3xl font-grandstander font-bold text-[#333] tracking-tighter">Login</h1>
              {/* <p className="text-xs text-[#333]/60 mt-1 font-medium">Enter your email or mobile number and password to log in.</p> */}
              {location.state?.registrationSuccess && (
                <p className="mt-2 text-green-600 text-[11px] font-bold uppercase tracking-wider">
                  Account created. Please log in to continue.
                </p>
              )}
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
                    BACK TO LOGIN
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    type="text"
                    placeholder="Email or Mobile number"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' })
                    }}
                    className="w-full h-12 bg-transparent border-[1.2px] border-dashed border-[#333]/20 rounded-xl px-4 outline-none focus:border-[#E84949] transition-all placeholder-[#333]/40 text-sm font-medium"
                    required
                  />
                  {fieldErrors.email && (
                    <p className="mt-1 text-[#E84949] text-[10px] font-bold uppercase tracking-wide ml-1">{fieldErrors.email}</p>
                  )}
                </div>
                <div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' })
                      }}
                      className="w-full h-12 bg-transparent border-[1.2px] border-dashed border-[#333]/20 rounded-xl pl-4 pr-12 outline-none focus:border-[#E84949] transition-all placeholder-[#333]/40 text-sm font-medium"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#333]/40 hover:text-[#E84949] transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="mt-1 text-[#E84949] text-[10px] font-bold uppercase tracking-wide ml-1">{fieldErrors.password}</p>
                  )}
                  <div className="flex justify-between items-center px-1 pt-2">
                    <Link to="/forgot-password" className="text-[11px] text-[#666] hover:text-[#E84949] font-semibold underline hover:no-underline transition-colors">Forgot password?</Link>
                    <Link to="/" className="text-[11px] text-[#666] hover:text-[#E84949] font-semibold underline hover:no-underline transition-colors">Back to store</Link>
                  </div>
                </div>

                <div className="space-y-3 pt-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 bg-[#E84949] text-white font-bold text-[12px] tracking-[0.2em] uppercase rounded-xl hover:bg-[#333] transition-all shadow-md active:scale-95 flex items-center justify-center"
                  >
                    {isSubmitting ? 'SIGNING IN...' : 'SIGN IN'}
                  </button>
                  <Link
                    to={`/register${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ''}`}
                    className="w-full h-12 bg-[#333] text-[#FDF4E6] font-bold text-[12px] tracking-[0.2em] uppercase rounded-xl hover:bg-[#E84949] hover:text-white transition-all shadow-md flex items-center justify-center"
                  >
                    CREATE ACCOUNT
                  </Link>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
