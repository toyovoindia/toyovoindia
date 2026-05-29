import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { apiRequest } from '../services/api'
import { useToast } from '../context/ToastContext'
import loginImage from '../assets/TOYOVOINIDIA_auth_banner.webp'
import logo from '../assets/toyovo.webp'
import { Lock, Mail, KeyRound, ArrowLeft, ShieldCheck, CheckCircle2, Eye, EyeOff } from 'lucide-react'
export function ForgotPasswordPage() {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState(1) // 1: Phone, 2: OTP & Password, 3: Success
  const [phoneError, setPhoneError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { success: showSuccess, error: showError } = useToast()
  const navigate = useNavigate()

  const handleSendOtp = async (e) => {
    e.preventDefault()
    setPhoneError('')
    if (!phone.trim()) {
      setPhoneError('Mobile number is required')
      return
    }
    if (!/^\d{10}$/.test(phone.trim())) {
      setPhoneError('Please enter a valid 10-digit mobile number')
      return
    }
    setIsSubmitting(true)
    try {
      const res = await apiRequest('/auth/forgot-password', { 
        method: 'POST',
        body: JSON.stringify({ phone: phone.trim() }) 
      })
      showSuccess(res.message)
      setStep(2)
    } catch (err) {
      showError(err.message || 'Failed to send OTP')
    } finally {
      setIsSubmitting(false)
    }
  }
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)


  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (!otp || !password) return
    setIsSubmitting(true)
    try {
      const res = await apiRequest('/auth/verify-otp', { 
        method: 'POST',
        body: JSON.stringify({ phone: phone.trim(), otp, password, purpose: 'reset' }) 
      })
      showSuccess(res.message)
      setStep(3)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      showError(err.message || 'Invalid OTP or reset failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-[100dvh] lg:h-[100dvh] w-screen bg-[#FDF4E6] flex flex-col lg:flex-row overflow-hidden font-roboto">
      {/* Left Side: Premium Banner (Only on Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 h-full p-4 flex-col justify-center">
        <div className="w-full h-full relative rounded-[32px] overflow-hidden shadow-2xl">
          <img 
            src={loginImage}
            alt="Toyovo India Auth" 
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
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <h1 className="text-2xl md:text-3xl font-grandstander font-bold text-[#333] tracking-tighter">Reset password</h1>
                    <p className="mt-2 text-gray-500 text-xs font-medium">We will send you an OTP to reset your password</p>
                  </div>

                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500 pointer-events-none">+91</span>
                        <input 
                          type="tel" 
                          placeholder="Enter your registered mobile number" 
                          value={phone}
                          onChange={(e) => {
                            setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                            if (phoneError) setPhoneError('')
                          }}
                          className="w-full h-12 bg-transparent border-[1.2px] border-dashed border-[#333]/20 rounded-xl pl-12 pr-4 outline-none focus:border-[#E84949] transition-all placeholder-[#333]/40 text-xs font-bold"
                          required
                        />
                      </div>
                      {phoneError && (
                        <p className="mt-1 text-[#E84949] text-[10px] font-bold uppercase tracking-wide ml-1">{phoneError}</p>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full h-12 bg-[#E84949] text-white font-bold text-[12px] tracking-[0.2em] uppercase rounded-xl hover:bg-[#333] transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? 'SENDING...' : 'SUBMIT'}
                      </button>
                      <Link 
                        to="/login"
                        className="w-full h-12 bg-[#333] text-white font-bold text-[12px] tracking-[0.2em] uppercase rounded-xl hover:bg-[#E84949] transition-all shadow-md flex items-center justify-center gap-2"
                      >
                        CANCEL
                      </Link>
                    </div>
                  </form>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <h1 className="text-2xl md:text-3xl font-grandstander font-bold text-[#333] tracking-tighter">Verify OTP</h1>
                    <p className="mt-2 text-gray-500 text-xs font-medium">Enter the code sent to {phone}</p>
                  </div>

                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="relative">
                      <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-[#333]/30" size={16} />
                      <input 
                        type="text" 
                        placeholder="6-Digit OTP" 
                        maxLength="6"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        className="w-full h-12 bg-transparent border-[1.2px] border-dashed border-[#333]/20 rounded-xl pl-11 pr-4 outline-none focus:border-[#E84949] transition-all placeholder-[#333]/40 text-sm font-semibold tracking-[0.3em] text-center font-bold"
                        required
                      />
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#333]/30" size={16} />
                      <input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="New Password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-12 bg-transparent border-[1.2px] border-dashed border-[#333]/20 rounded-xl pl-11 pr-11 outline-none focus:border-[#E84949] transition-all placeholder-[#333]/40 text-xs font-semibold"
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
                    
                    <div className="space-y-3">
                      <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full h-12 bg-[#E84949] text-white font-bold text-[12px] tracking-[0.2em] uppercase rounded-xl hover:bg-[#333] transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? 'RESETTING...' : 'UPDATE PASSWORD'}
                      </button>
                      <button 
                        type="button"
                        onClick={() => setStep(1)}
                        className="w-full h-12 bg-transparent border-[1.2px] border-[#333]/10 text-[#333] font-bold text-[10px] tracking-[0.2em] uppercase rounded-xl hover:bg-white transition-all flex items-center justify-center gap-1.5"
                      >
                        <ArrowLeft size={12} /> Back to Mobile
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-6 py-6"
                >
                  <div className="flex justify-center">
                    <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle2 size={40} />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-grandstander font-bold text-[#333]">Success!</h2>
                    <p className="mt-2 text-gray-500 text-xs font-medium">Your password has been reset successfully.</p>
                    <p className="text-gray-400 text-[10px] mt-1">Redirecting to login page...</p>
                  </div>
                  <Link 
                    to="/login"
                    className="inline-flex w-full h-12 bg-[#333] text-white font-bold text-[11px] tracking-[0.2em] uppercase rounded-xl hover:bg-[#E84949] transition-all items-center justify-center gap-2"
                  >
                    LOGIN NOW
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
