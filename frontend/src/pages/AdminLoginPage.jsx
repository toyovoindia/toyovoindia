import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, ShieldAlert } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import loginImage from '../assets/TOYOVOINIDIA_auth_banner.webp'
import logo from '../assets/toyovo.webp'

export function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pendingVerification, setPendingVerification] = useState(null)
  const [otp, setOtp] = useState('')
  const { login, verifyOtp, logout, user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
    if (user && isAdmin) {
      navigate('/admin', { replace: true })
    }
  }, [user, isAdmin, navigate])

  const nextPath = new URLSearchParams(location.search).get('next')

  const validateForm = () => {
    const errors = {}
    if (!email.trim()) {
      errors.email = 'Admin Email or Mobile is required'
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

    const res = await login(email.trim(), password, 'admin')
    if (res.success) {
      if (res.requireOtp) {
        setPendingVerification({ phone: res.phone, purpose: res.purpose })
        setError('')
      } else {
        const isUserAdmin = ['admin', 'super_admin'].includes(res.user?.role)
        if (!isUserAdmin) {
          await logout()
          setError('Access Denied. Only admin accounts are authorized to enter.')
        } else {
          navigate(nextPath || '/admin', { replace: true })
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
      if (!isUserAdmin) {
        await logout()
        setError('Access Denied. Only admin accounts are authorized to enter.')
        setPendingVerification(null)
      } else {
        navigate(nextPath || '/admin', { replace: true })
      }
    } else {
      setError(res.message)
    }
    setIsSubmitting(false)
  }

  return (
    <div className="min-h-[100dvh] lg:h-[100dvh] w-screen bg-[#1F192F] flex flex-col lg:flex-row overflow-hidden font-roboto text-white">
      {/* Inject custom autofill CSS to keep inputs dark and consistent */}
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 1000px #2A233D inset !important;
            -webkit-text-fill-color: #ffffff !important;
            transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>

      {/* Left Side: Premium Command Center Banner (Only on Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 h-full p-4 flex-col justify-center">
        <div className="w-full h-full relative rounded-[32px] overflow-hidden shadow-2xl border border-white/5">
          <img
            src={loginImage}
            alt="Toyovo India Admin Command Center"
            className="w-full h-full object-cover brightness-[0.6] contrast-[1.1] transform hover:scale-105 transition-transform duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1F192F]/90 via-black/35 to-transparent" />
          <div className="absolute bottom-12 left-12 max-w-md text-left">
            <div className="flex items-center gap-2 mb-3 px-3 py-1.5 bg-[#F1641E]/20 border border-[#F1641E]/30 rounded-full w-fit">
              <ShieldAlert className="w-4 h-4 text-[#F1641E]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#F1641E]">Secure Access Only</span>
            </div>
            <h2 className="text-white text-3xl font-grandstander font-bold drop-shadow-md">Admin Command Center</h2>
            <p className="text-white/80 mt-2 text-sm drop-shadow-sm font-medium">Configure configurations, manage global storefront inventory parameters, and monitor customer security protocols.</p>
          </div>
        </div>
      </div>

      {/* Right Side / Mobile: Form and Branding */}
      <div className="w-full lg:w-1/2 min-h-[100dvh] lg:min-h-0 lg:h-full flex flex-col justify-center items-center p-4 sm:p-6 md:p-12 overflow-y-auto">
        <div className="w-full max-w-[460px] flex flex-col items-center">
          {/* Logo Header */}
          <div className="flex flex-col items-center gap-2 mb-6">
            <div className="w-28 h-28 bg-white rounded-3xl flex items-center justify-center p-3 shadow-lg border border-white/10 mb-1">
              <img src={logo} alt="Toyovo Logo" className="w-24 h-24 object-contain" />
            </div>
            <span className="font-grandstander font-bold text-3xl text-white tracking-tight">
              Toyovo<span className="text-[#F1641E]">Admin</span>
            </span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-[#2A233D] border-[1.6px] border-dashed border-white/10 rounded-[32px] p-6 sm:p-8 shadow-2xl"
          >
            <div className="text-center mb-6">
              <h1 className="text-2xl md:text-3xl font-grandstander font-bold text-white tracking-tighter">Admin Portal Login</h1>
              <p className="text-xs text-gray-400 mt-1 font-medium">Log in to access your administrative workspace.</p>
              {error && <p className="mt-4 text-[#FF4D4D] text-[11px] font-bold uppercase tracking-wider bg-[#FF4D4D]/10 py-2.5 px-4 rounded-xl border border-[#FF4D4D]/25">{error}</p>}
            </div>

            {pendingVerification ? (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="text-center mb-4">
                  <p className="text-sm font-semibold text-white/90">OTP sent to {pendingVerification.phone}</p>
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 outline-none focus:border-[#F1641E] focus:bg-white/10 text-white transition-all text-center tracking-[0.5em] text-lg font-bold"
                    required
                  />
                </div>
                <div className="space-y-3 pt-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 bg-[#F1641E] text-white font-bold text-[12px] tracking-[0.2em] uppercase rounded-xl hover:bg-white hover:text-[#2A233D] transition-all shadow-md active:scale-95 flex items-center justify-center"
                  >
                    {isSubmitting ? 'VERIFYING...' : 'VERIFY OTP'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingVerification(null)}
                    className="w-full h-12 bg-transparent border border-white/10 text-white/70 font-bold text-[12px] tracking-[0.2em] uppercase rounded-xl hover:bg-white/5 transition-all flex items-center justify-center"
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
                    placeholder="Admin Email or Phone"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' })
                    }}
                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 outline-none focus:border-[#F1641E] focus:bg-white/10 text-white transition-all placeholder-white/30 text-sm font-medium"
                    required
                  />
                  {fieldErrors.email && (
                    <p className="mt-1 text-[#FF4D4D] text-[10px] font-bold uppercase tracking-wide ml-1">{fieldErrors.email}</p>
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
                      className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 outline-none focus:border-[#F1641E] focus:bg-white/10 text-white transition-all placeholder-white/30 text-sm font-medium"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors focus:outline-none"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="mt-1 text-[#FF4D4D] text-[10px] font-bold uppercase tracking-wide ml-1">{fieldErrors.password}</p>
                  )}
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 bg-[#F1641E] text-white font-bold text-[12px] tracking-[0.2em] uppercase rounded-xl hover:bg-white hover:text-[#2A233D] transition-all shadow-md active:scale-95 flex items-center justify-center"
                  >
                    {isSubmitting ? 'AUTHENTICATING...' : 'SECURE LOGIN'}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
