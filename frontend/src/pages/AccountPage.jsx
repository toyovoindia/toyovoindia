import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePayment } from '../context/PaymentContext'
import { useCart } from '../context/CartContext'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, Package, MapPin, LogOut, ChevronRight, Wallet, History, CreditCard, 
  Plus, ArrowUpRight, ArrowDownLeft, Check, Smartphone, Landmark, Truck, 
  AlertCircle, X, Search, Lock, Loader2, ShieldCheck, Home, Edit2, Save, 
  Trash2, HelpCircle, Shield, FileText, ChevronLeft, Star, ShoppingBag, Gift, Heart, Menu, RefreshCw, Box, ExternalLink, Building, Map, ChevronDown, RotateCcw
} from 'lucide-react'
import { indianStates, commonCities, addressTypes } from '../utils/indiaData'
import { cancelMyOrder, getMyOrders, requestMyOrderReturn, createOrder } from '../services/orderApi'
import { useToast } from '../context/ToastContext'
import { printOrderInvoice } from '../utils/invoice'
import { updateMyProfile } from '../services/userProfileApi'
import { requestForToken } from '../config/firebase'
import { saveFcmToken } from '../services/notificationApi'
import { apiRequest } from '../services/api'
import { ProductCard } from '../components/ui/ProductCard'
import { getStorefrontSettings } from '../services/siteApi'

const upiLogos = {
  'Google Pay': (
    <svg viewBox="0 0 48 48" className="h-6 w-auto">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  ),
  'PhonePe': (
    <svg viewBox="0 0 120 120" className="h-6 w-auto">
      <rect width="120" height="120" rx="20" fill="#5f259f"/>
      <circle cx="60" cy="60" r="25" fill="white"/>
      <path d="M60 45v30M45 60h30" stroke="#5f259f" strokeWidth="8"/>
    </svg>
  ),
  'Paytm': (
    <svg viewBox="0 0 100 100" className="h-6 w-auto">
      <rect width="100" height="100" rx="10" fill="#00baf2"/>
      <text x="50" y="65" fontSize="26" fontWeight="bold" fill="white" textAnchor="middle">Paytm</text>
    </svg>
  )
}

const states = ["Andhra Pradesh", "Bihar", "Delhi", "Gujarat", "Haryana", "Karnataka", "Kerala", "Maharashtra", "Punjab", "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "West Bengal"];
const citiesByState = {
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik"],
  "Delhi": ["New Delhi", "North Delhi", "South Delhi"],
  "Karnataka": ["Bengaluru", "Mysuru", "Hubli"],
  "Uttar Pradesh": ["Lucknow", "Noida", "Kanpur", "Varanasi"],
  "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Zirakpur"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara"]
};

// Indian Banks List
const indianBanks = [
  "HDFC Bank", "State Bank of India (SBI)", "ICICI Bank", "Axis Bank", "Kotak Mahindra Bank",
  "Punjab National Bank (PNB)", "Bank of Baroda", "Canara Bank", "Union Bank of India",
  "IndusInd Bank", "Yes Bank", "IDFC First Bank", "Standard Chartered", "Federal Bank"
];

// Enhanced Payment Method Modal
const AddPaymentMethodModal = ({ isOpen, type, onComplete, onCancel }) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => { 
    if (!isOpen) {
      setFormData({});
      setErrors({});
    } 
  }, [isOpen]);

  const handleNumericChange = (e, field, length) => {
    const value = e.target.value.replace(/\D/g, '');
    if (length && value.length > length) return;
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    
    if (type === 'bankAccounts') {
      if (!formData.bankName) newErrors.bankName = 'Bank name is required';
      if (!formData.accNo) newErrors.accNo = 'Account number is required';
      else if (!/^\d{9,18}$/.test(formData.accNo)) newErrors.accNo = 'Account number must be 9 to 18 digits';
      if (!formData.ifsc) newErrors.ifsc = 'IFSC code is required';
      else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifsc)) newErrors.ifsc = 'Valid IFSC code is required (e.g. HDFC0001234)';
    }
    
    if (type === 'upiIds') {
      if (!formData.upiId) newErrors.upiId = 'UPI ID is required';
      else if (!formData.upiId.includes('@')) newErrors.upiId = 'Please enter a valid UPI ID (e.g. user@upi)';
    }
    
    if (type === 'cards') {
      if (!formData.cardNo) newErrors.cardNo = 'Card number is required';
      else if (formData.cardNo.length < 16) newErrors.cardNo = 'Card number must be 16 digits';

      if (!formData.exp) newErrors.exp = 'Expiry date is required';
      else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(formData.exp)) {
        newErrors.exp = 'Valid expiry date (MM/YY) is required';
      } else {
        const [month, year] = formData.exp.split('/');
        const currentDate = new Date();
        const currentYear = parseInt(currentDate.getFullYear().toString().slice(-2));
        const currentMonth = currentDate.getMonth() + 1;
        
        if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
          newErrors.exp = 'This card has expired';
        }
      }
      
      if (!formData.cvv) newErrors.cvv = 'CVV is required';
      else if (formData.cvv.length !== 3 && formData.cvv.length !== 4) newErrors.cvv = 'CVV must be 3 or 4 digits';
    }
    
    if (Object.keys(newErrors).length > 0) {
      newErrors.msg = 'Please correct the highlighted fields';
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    onComplete(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300000] overflow-y-auto bg-[#333]/60 backdrop-blur-md font-roboto p-3 sm:p-4">
       <motion.div initial={{scale: 0.95, opacity:0}} animate={{scale: 1, opacity:1}} className="bg-[#FAEAD3] w-full max-w-md rounded-[28px] sm:rounded-[40px] overflow-hidden shadow-2xl border border-white/40 my-3 sm:my-6 mx-auto max-h-[calc(100dvh-24px)] sm:max-h-[calc(100dvh-48px)] flex flex-col">
          <div className="bg-[#E84949] p-6 text-white flex justify-between items-center shadow-lg">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm"><Plus size={18}/></div>
               <div>
                 <h3 className="font-grandstander text-lg font-bold leading-tight">Add Payment Method</h3>
                 <p className="text-[10px] uppercase tracking-widest font-bold opacity-60">Registering {type === 'bankAccounts' ? 'Bank' : type === 'upiIds' ? 'UPI' : 'Card'}</p>
               </div>
             </div>
             <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full transition-all"><X size={20}/></button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-6 overflow-y-auto custom-scrollbar">
             {type === 'bankAccounts' && (
               <>
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Select Bank</label>
                   <div className="relative group">
                     <select value={formData.bankName || ''} onChange={e=>setFormData({...formData, bankName: e.target.value})} className={`w-full h-14 px-5 bg-[#FDF4E6] border-2 ${errors.bankName ? 'border-red-400' : 'border-transparent focus:border-[#E84949]'} rounded-2xl outline-none text-sm font-bold appearance-none transition-all cursor-pointer`}>
                        <option value="">Choose your bank</option>
                        {indianBanks.map(bank => <option key={bank} value={bank}>{bank}</option>)}
                     </select>
                     <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                   </div>
                   {errors.bankName && <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight ml-1">{errors.bankName}</p>}
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Account Number</label>
                   <input type="text" placeholder="XXXX XXXX XXXX" value={formData.accNo || ''} onChange={e=>handleNumericChange(e, 'accNo', 18)} className={`w-full h-14 px-5 bg-[#FDF4E6] border-2 ${errors.accNo ? 'border-red-400' : 'border-transparent focus:border-[#E84949]'} rounded-2xl outline-none text-sm font-bold tracking-widest transition-colors`} />
                   {errors.accNo && <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight ml-1">{errors.accNo}</p>}
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">IFSC Code</label>
                   <input type="text" placeholder="HDFC0001234" maxLength="11" value={formData.ifsc || ''} onChange={e=>setFormData({...formData, ifsc: e.target.value.toUpperCase()})} className={`w-full h-14 px-5 bg-[#FDF4E6] border-2 ${errors.ifsc ? 'border-red-400' : 'border-transparent focus:border-[#E84949]'} rounded-2xl outline-none text-sm font-bold uppercase tracking-widest transition-colors`} />
                   {errors.ifsc && <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight ml-1">{errors.ifsc}</p>}
                 </div>
               </>
             )}

             {type === 'upiIds' && (
               <div className="space-y-1.5">
                 <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">UPI ID (VPA)</label>
                 <input type="text" placeholder="username@upi" value={formData.upiId || ''} onChange={e=>setFormData({...formData, upiId: e.target.value})} className={`w-full h-14 px-5 bg-[#FDF4E6] border-2 ${errors.upiId ? 'border-red-400' : 'border-transparent focus:border-[#E84949]'} rounded-2xl outline-none text-sm font-bold lowercase transition-colors`} />
                 {errors.upiId && <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight ml-1">{errors.upiId}</p>}
                 <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-2 ml-1 flex items-center gap-1"><ShieldCheck size={10}/> Verified VPA only</p>
               </div>
             )}

             {type === 'cards' && (
               <>
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Card Number</label>
                   <div className="relative">
                     <input type="text" placeholder="XXXX XXXX XXXX XXXX" autoComplete="cc-number" value={formData.cardNo || ''} onChange={e=>handleNumericChange(e, 'cardNo', 16)} className={`w-full h-14 px-5 bg-[#FDF4E6] border-2 ${errors.cardNo ? 'border-red-400' : 'border-transparent focus:border-[#E84949]'} rounded-2xl outline-none text-sm font-bold font-mono tracking-widest transition-colors`} />
                     <CreditCard className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300" size={20}/>
                   </div>
                   {errors.cardNo && <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight ml-1">{errors.cardNo}</p>}
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Expiry Date</label>
                     <input type="text" placeholder="MM/YY" autoComplete="cc-exp" maxLength="5" value={formData.exp || ''} onChange={e=>{
                       let v = e.target.value.replace(/\D/g, '');
                       if (v.length > 2) v = v.slice(0,2) + '/' + v.slice(2,4);
                       setFormData({...formData, exp: v});
                     }} className={`w-full h-14 px-5 bg-[#FDF4E6] border-2 ${errors.exp ? 'border-red-400' : 'border-transparent focus:border-[#E84949]'} rounded-2xl outline-none text-sm font-bold text-center transition-colors`} />
                     {errors.exp && <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight ml-1">{errors.exp}</p>}
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">CVV</label>
                     <input type="password" placeholder="***" autoComplete="new-password" value={formData.cvv || ''} onChange={e=>handleNumericChange(e, 'cvv', 4)} className={`w-full h-14 px-5 bg-[#FDF4E6] border-2 ${errors.cvv ? 'border-red-400' : 'border-transparent focus:border-[#E84949]'} rounded-2xl outline-none text-sm font-bold text-center transition-colors`} />
                     {errors.cvv && <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight ml-1">{errors.cvv}</p>}
                   </div>
                 </div>
               </>
             )}

             {errors.msg && (
               <motion.div initial={{opacity:0, y:-5}} animate={{opacity:1, y:0}} className="p-3 bg-red-50 rounded-xl border border-red-100 flex items-center gap-2">
                 <AlertCircle className="text-red-500" size={14}/>
                 <p className="text-[10px] text-red-600 font-bold uppercase tracking-widest">{errors.msg}</p>
               </motion.div>
             )}

             <div className="pt-4">
                <button type="submit" className="w-full h-16 bg-[#333] text-white rounded-2xl font-bold uppercase tracking-[0.2em] text-[11px] shadow-xl hover:bg-[#E84949] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                   <ShieldCheck size={16}/> Securely Save Details
                </button>
             </div>
          </form>
       </motion.div>
    </div>
  )
}

// Valid tab slugs mapped to internal tab IDs
const TAB_SLUG_MAP = {
  'dashboard': 'dashboard',
  'orders': 'orders',
  'payments': 'payments',
  'addresses': 'addresses',
  'wishlist': 'wishlist',
  'settings': 'profile',
}
const TAB_ID_TO_SLUG = {
  'dashboard': 'dashboard',
  'orders': 'orders',
  'payments': 'payments',
  'addresses': 'addresses',
  'wishlist': 'wishlist',
  'profile': 'settings',
}

export function AccountPage() {
  const { user, authLoading, logout, updateUser, addresses, addAddress, deleteAddress, updateAddress, setAsDefaultAddress, verifyOtp, resendOtp } = useAuth()
  const { paymentHistory, savedMethods, addSavedMethod, deleteSavedMethod } = usePayment()
  const { wishlist, addToCart } = useCart()
  const { success, error: showError } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const { tab: tabParam, orderId } = useParams()

  // Derive active tab from URL param; fallback to 'dashboard'
  const tabFromUrl = orderId ? 'orders' : (TAB_SLUG_MAP[tabParam] || 'dashboard')
  const [activeTab, setActiveTab] = useState(tabFromUrl)
  const [viewMode, setViewMode] = useState('content')
  
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [profileForm, setProfileForm] = useState(user || {})
  const [profileErrors, setProfileErrors] = useState({})
  const [showAddAddress, setShowAddAddress] = useState(false)
  const [editingAddressId, setEditingAddressId] = useState(null)
  const [addressForm, setAddressForm] = useState({ type: 'Home', firstName: '', lastName: '', address: '', apartment: '', city: '', state: '', postalCode: '', phone: '', district: '' })
  const [addressErrors, setAddressErrors] = useState({})

  const [showAddPayment, setShowAddPayment] = useState(false)
  const [paymentTypeToAdd, setPaymentTypeToAdd] = useState('bankAccounts')
  const [isProcessing, setIsProcessing] = useState(false)
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [returnReason, setReturnReason] = useState('')
  const [siteConfig, setSiteConfig] = useState(null)
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, action: null, message: '', title: '' })

  // Phone Verification States and Handlers
  const [verificationOtp, setVerificationOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [verificationError, setVerificationError] = useState('')

  const handleSendVerificationOtp = async () => {
    setSendingOtp(true)
    setVerificationError('')
    try {
      const res = await resendOtp(user.phone, 'register')
      if (res.success) {
        setOtpSent(true)
        success('Verification OTP has been sent to your mobile number.')
      } else {
        setVerificationError(res.message)
      }
    } catch (err) {
      setVerificationError(err.message || 'Failed to send OTP')
    } finally {
      setSendingOtp(false)
    }
  }

  const handleVerifyPhoneOtp = async () => {
    if (verificationOtp.length !== 6) {
      setVerificationError('Please enter a valid 6-digit OTP')
      return
    }
    setVerifyingOtp(true)
    setVerificationError('')
    try {
      const res = await verifyOtp({ phone: user.phone, otp: verificationOtp, purpose: 'register' })
      if (res.success) {
        updateUser(res.user)
        setOtpSent(false)
        setVerificationOtp('')
        success('Your mobile number has been verified successfully!')
      } else {
        setVerificationError(res.message)
      }
    } catch (err) {
      setVerificationError(err.message || 'Verification failed')
    } finally {
      setVerifyingOtp(false)
    }
  }

  // Sync active tab when URL param changes (e.g. browser back/forward)
  useEffect(() => {
    const derived = orderId ? 'orders' : (TAB_SLUG_MAP[tabParam] || 'dashboard')
    setActiveTab(derived)
    setViewMode('content')
  }, [tabParam, orderId])

  useEffect(() => {
    if (user) {
      setProfileForm(user)
    }
  }, [user])

  const canCancelOrder = (order) => ['pending', 'processing'].includes(order?.status)
  const canRequestReturn = (order) => (
    order?.status === 'delivered' &&
    order?.paymentStatus === 'paid' &&
    ['none', 'rejected'].includes(order?.returnRequest?.status || 'none')
  )

  const handleCancelOrder = async (orderId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Cancel Order',
      message: 'Are you sure you want to cancel this order?',
      action: async () => {
        setConfirmModal({ isOpen: false, action: null, message: '', title: '' })
        setIsProcessing(true)
        try {
          const updatedOrder = await cancelMyOrder(orderId)
          setOrders((prev) => prev.map((order) => order.id === orderId ? updatedOrder : order))
          setSelectedOrder((prev) => (prev?.id === orderId ? updatedOrder : prev))
          success(`Order ${updatedOrder.orderNumber} cancelled.`)
        } catch (err) {
          showError(err.message || 'Order cancellation failed')
        } finally {
          setIsProcessing(false)
        }
      }
    })
  }

  const handleRequestReturn = async (orderId) => {
    if (!returnReason.trim()) {
      showError('Please enter a return or refund reason.')
      return
    }

    setIsProcessing(true)
    try {
      const updatedOrder = await requestMyOrderReturn(orderId, { reason: returnReason.trim() })
      setOrders((prev) => prev.map((order) => order.id === orderId ? updatedOrder : order))
      setSelectedOrder((prev) => (prev?.id === orderId ? updatedOrder : prev))
      setReturnReason('')
      success(`Return request submitted for order ${updatedOrder.orderNumber}.`)
    } catch (err) {
      showError(err.message || 'Return request failed')
    } finally {
      setIsProcessing(false)
    }
  }

  // Bug 136: Reorder — add all delivered-order items to cart and go to cart
  const handleReorder = (order) => {
    if (!order?.items?.length) return
    setConfirmModal({
      isOpen: true,
      title: 'Reorder Items',
      message: `Add all ${order.items.length} item(s) from Order #${order.orderNumber} to your cart?`,
      action: async () => {
        setConfirmModal({ isOpen: false, action: null, message: '', title: '' })
        try {
          let addedCount = 0
          for (const item of order.items) {
            const cartProduct = {
              id: item.id || item.product,
              slug: item.productSlug || item.slug || item.id || item.product,
              title: item.title || item.name || '',
              name: item.title || item.name || '',
              price: item.price,
              img: item.img || '',
              stock: 9999, // default to unlimited/large stock for reorder check
            }
            const successAdd = addToCart(cartProduct, item.qty || 1)
            if (successAdd) addedCount++
          }
          if (addedCount > 0) {
            success(`Added ${addedCount} item(s) to cart. Redirecting...`)
            navigate('/cart')
          }
        } catch (err) {
          showError('Could not add items to cart')
        }
      }
    })
  }

  // Corporate Info based on Image
  const corporateInfo = {
    name: "TOYOVO INDIA (OPC) PRIVATE LIMITED",
    cin: "U47912PB2026OPC068091",
    pan: "AANCT0674K",
    tan: "PTLT16619B",
    incDate: "22nd April 2026",
    address: siteConfig?.contactAddress || "UNIT 703, 7th FLOOR, BLOCK 1 MAYAGARDEN, Zirakpur, Rajpura, Mohali- 140603, Punjab"
  }

  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'account-page-overrides';
    style.innerHTML = `header, .announcement-bar, footer { display: none !important; } body { overflow: hidden; }`;
    document.head.appendChild(style);
    return () => {
      const el = document.getElementById('account-page-overrides');
      if (el) el.remove();
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    getStorefrontSettings().then(setSiteConfig).catch(console.error)
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
    if (!authLoading && !user) navigate('/login')
  }, [authLoading, user, navigate])

  useEffect(() => {
    if (!user) return

    let isMounted = true
    const loadOrders = async (showLoading = true) => {
      if (showLoading) setOrdersLoading(true)
      try {
        const { orders: data } = await getMyOrders({ limit: 50 })
        if (isMounted) {
          setOrders(data)
          if (orderId) {
            const found = data.find(o => o.id === orderId || o.orderNumber === orderId)
            if (found) {
              setSelectedOrder(found)
            }
          }
        }
      } catch {
        if (isMounted) setOrders([])
      } finally {
        if (isMounted) setOrdersLoading(false)
      }
    }

    loadOrders(true)

    // Periodically sync orders every 10 seconds to reflect status updates (like Delivered) immediately
    const interval = setInterval(() => loadOrders(false), 10000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [user, orderId])

  if (authLoading) return null
  if (!user) return null

  const handleTabChange = (id) => {
    const slug = TAB_ID_TO_SLUG[id] || id
    navigate(`/account/${slug}`, { replace: true })
    window.scrollTo(0, 0)
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Star size={16}/>, color: 'text-yellow-500/60' },
    { id: 'orders', label: 'Order History', icon: <Box size={16}/>, color: 'text-[#6651A4]/60' },
    { id: 'payments', label: 'Bank & Cards', icon: <CreditCard size={16}/>, color: 'text-[#E84949]/60' },
    { id: 'addresses', label: 'Addresses', icon: <MapPin size={16}/>, color: 'text-green-500/60' },
    { id: 'wishlist', label: 'My Wishlist', icon: <Heart size={16}/>, color: 'text-pink-500/60' },
    { id: 'profile', label: 'Settings', icon: <User size={16}/>, color: 'text-blue-500/60' },
  ]

  const legalItems = [
    { id: 'help', label: 'Help & Support', icon: <HelpCircle size={14}/> },
    { id: 'returns', label: 'Returns & Exchange', icon: <RefreshCw size={14}/> },
    { id: 'shipping', label: 'Shipping Policy', icon: <Truck size={14}/> },
    { id: 'privacy', label: 'Privacy Policy', icon: <Shield size={14}/> },
    { id: 'terms', label: 'Terms & Conditions', icon: <FileText size={14}/> },
  ]

  return (
    <div className="fixed inset-0 z-[200000] bg-[#FDF4E6] flex flex-col lg:flex-row overflow-hidden text-gray-600 font-roboto">
      
      {/* Add Payment Method Modal */}
      <AddPaymentMethodModal 
        isOpen={showAddPayment} 
        type={paymentTypeToAdd} 
        onCancel={() => setShowAddPayment(false)} 
        onComplete={(data) => { 
          setShowAddPayment(false); 
          setIsProcessing(true); 
          setTimeout(() => { 
            addSavedMethod(paymentTypeToAdd, data); 
            setIsProcessing(false); 
          }, 1000); 
        }} 
      />

      {isProcessing && (
        <div className="fixed inset-0 z-[1000000] bg-[#FDF4E6]/95 backdrop-blur-md flex flex-col items-center justify-center">
           <div className="w-8 h-8 border-2 border-gray-100 border-t-[#6651A4] rounded-full animate-spin mb-3" />
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Processing...</p>
        </div>
      )}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[2000000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
             <motion.div initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.95, opacity:0}} className="bg-white max-w-sm w-full rounded-3xl overflow-hidden shadow-2xl p-6">
                 <h3 className="text-xl font-bold font-grandstander text-gray-800 mb-2">{confirmModal.title}</h3>
                 <p className="text-sm text-gray-500 mb-6">{confirmModal.message}</p>
                 <div className="flex gap-3">
                    <button onClick={() => setConfirmModal({ isOpen: false, action: null, message: '', title: '' })} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl text-[12px] uppercase tracking-wider hover:bg-gray-200 transition-colors">No</button>
                    <button onClick={confirmModal.action} className="flex-1 py-3 bg-[#E84949] text-white font-bold rounded-xl text-[12px] uppercase tracking-wider hover:bg-[#333] transition-colors">Yes, Confirm</button>
                 </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[300000] overflow-y-auto bg-black/30 backdrop-blur-sm p-3 sm:p-4">
             <motion.div initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.95, opacity:0}} className="bg-[#FDF4E6] w-full max-w-lg rounded-[24px] sm:rounded-[32px] overflow-hidden shadow-2xl border border-white/50 my-3 sm:my-6 mx-auto max-h-[calc(100dvh-24px)] sm:max-h-[calc(100dvh-48px)] flex flex-col">
                <div className="p-5 sm:p-8 space-y-5 sm:space-y-6 overflow-y-auto custom-scrollbar">
                    <div className="flex justify-between items-start bg-[#FDF4E6] pb-3 gap-2">
                       <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-2xl flex items-center justify-center text-[#6651A4] shadow-sm shrink-0"><Box size={20}/></div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm sm:text-lg font-grandstander font-bold break-all leading-tight">Order #{selectedOrder.orderNumber}</h3>
                            <p className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase mt-0.5">{selectedOrder.date}</p>
                          </div>
                       </div>
                       <button onClick={()=>setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-full shrink-0"><X size={18}/></button>
                    </div>
                   <div className="space-y-4 max-h-[240px] sm:max-h-[300px] overflow-y-auto custom-scrollbar">
                      {selectedOrder.items.map((item, i) => (
                        <div key={i} className="flex gap-3 sm:gap-4 p-3 bg-white/50 rounded-2xl border border-black/[0.03]">
                           <img src={item.img} className="w-14 h-14 rounded-xl object-cover shadow-sm shrink-0" />
                           <div className="min-w-0 flex-1 flex flex-col justify-between">
                             <div>
                               <h4 className="text-[12px] font-bold line-clamp-2 break-words">{item.title}</h4>
                               <p className="text-[10px] text-gray-400 mt-1 font-semibold">₹{item.price.toFixed(2)} · Qty {item.qty}</p>
                             </div>
                             {selectedOrder.status === 'delivered' && (
                               <Link
                                 to={`/product/${item.productSlug || item.id}?tab=reviews`}
                                 onClick={() => setSelectedOrder(null)}
                                 className="mt-2 w-max inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-50 text-yellow-600 border border-yellow-200 rounded-lg text-[9px] font-bold uppercase tracking-wider hover:bg-[#6651A4] hover:text-white hover:border-[#6651A4] transition-all duration-300"
                               >
                                 <Star size={10} className="fill-yellow-400 text-yellow-400 mr-1" />
                                 Rate &amp; Review
                               </Link>
                             )}
                           </div>
                        </div>
                      ))}
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 sm:p-5 bg-[#FAEAD3] rounded-2xl">
                      <div><p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Total Value</p><p className="text-xl sm:text-2xl font-bold font-grandstander text-gray-700 break-words">₹{selectedOrder.total.toFixed(2)}</p></div>
                      <div className="text-left sm:text-right"><p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Current Status</p><p className="text-[12px] font-bold text-green-500 uppercase tracking-widest break-words">{selectedOrder.statusLabel}</p></div>
                    </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                     <div className="p-4 bg-white/60 rounded-2xl border border-black/[0.03]">
                       <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{selectedOrder.status === 'cancelled' ? 'Cancelled On' : 'Expected Delivery'}</p>
                       <p className="mt-2 text-[13px] font-bold text-gray-700">{selectedOrder.status === 'cancelled' ? (selectedOrder.cancelledAt ? new Date(selectedOrder.cancelledAt).toLocaleDateString() : '-') : (selectedOrder.deliveryDate || '-')}</p>
                     </div>
                     <div className="p-4 bg-white/60 rounded-2xl border border-black/[0.03]">
                       <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Tracking Number</p>
                       <p className="mt-2 text-[13px] font-bold text-gray-700">{selectedOrder.trackingNumber || '-'}</p>
                     </div>
                   </div>
                   {selectedOrder.deliveryDelayReason && (
                     <div className="p-4 bg-white/60 rounded-2xl border border-black/[0.03]">
                       <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Delivery Update</p>
                       <p className="mt-2 text-[12px] font-medium text-gray-600">{selectedOrder.deliveryDelayReason}</p>
                     </div>
                   )}
                   {(selectedOrder.status === 'delivered' || selectedOrder.paymentStatus === 'refunded' || (selectedOrder.returnRequest && selectedOrder.returnRequest.status !== 'none')) && (
                      <div className="p-4 bg-white/60 rounded-2xl border border-black/[0.03]">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Return / Refund</p>
                        <p className="mt-2 text-[13px] font-bold text-gray-700">{selectedOrder.returnRequest?.statusLabel || (selectedOrder.paymentStatus === 'refunded' ? 'Refunded' : 'No Request')}</p>
                        {selectedOrder.returnRequest?.reason && (
                          <p className="mt-2 text-[12px] text-gray-600"><span className="font-bold">Reason:</span> {selectedOrder.returnRequest.reason}</p>
                        )}
                        {selectedOrder.returnRequest?.adminNote && (
                          <p className="mt-2 text-[12px] text-gray-600"><span className="font-bold">Admin Update:</span> {selectedOrder.returnRequest.adminNote}</p>
                        )}
                        {selectedOrder.paymentStatus === 'refunded' && (
                          <p className="mt-2 text-[12px] text-gray-600">
                            <span className="font-bold text-[#E84949]">Refunded Amount:</span> 
                            <span className="font-bold text-[#E84949] ml-1">₹{selectedOrder.total.toFixed(2)}</span>
                          </p>
                        )}
                        {!canRequestReturn(selectedOrder) && selectedOrder.returnRequest?.status === 'none' && selectedOrder.paymentStatus !== 'refunded' && (
                          <p className="mt-2 text-[12px] text-gray-500">
                            {selectedOrder.paymentStatus !== 'paid'
                              ? 'Refund requests are available only for paid orders.'
                              : 'No request submitted yet.'}
                          </p>
                        )}
                      </div>
                    )}
                   {selectedOrder.statusHistory?.length > 0 && (
                     <div className="p-4 bg-white/60 rounded-2xl border border-black/[0.03]">
                       <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-4">Order Timeline</p>
                       <div className="space-y-3 max-h-[180px] overflow-y-auto custom-scrollbar">
                         {selectedOrder.statusHistory.slice().reverse().map((entry, index) => (
                           <div key={`${entry.status}-${entry.createdAt}-${index}`} className="flex items-start justify-between gap-4">
                             <div>
                               <p className="text-[11px] font-bold text-gray-700 uppercase tracking-widest">{entry.status}</p>
                               <p className="mt-1 text-[11px] text-gray-500">{entry.note || 'Status updated'}</p>
                             </div>
                             <p className="text-[10px] text-gray-400 font-medium shrink-0">
                               {new Date(entry.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                             </p>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}
                   {canCancelOrder(selectedOrder) && (
                     <button
                       onClick={() => handleCancelOrder(selectedOrder.id)}
                       className="w-full h-12 bg-[#E84949] text-white rounded-2xl font-bold uppercase tracking-[0.18em] text-[10px] hover:bg-[#333] transition-all"
                     >
                       Cancel Order
                     </button>
                   )}
                   {(selectedOrder.status === 'delivered' || selectedOrder.status === 'cancelled') && (
                      <button
                        onClick={() => handleReorder(selectedOrder)}
                        className="w-full h-12 bg-[#6651A4] text-white rounded-2xl font-bold uppercase tracking-[0.18em] text-[10px] hover:bg-[#333] transition-all flex items-center justify-center gap-2"
                      >
                        <RotateCcw size={14} /> Reorder Items
                      </button>
                    )}
                   <button
                     onClick={() => printOrderInvoice(selectedOrder)}
                     className="w-full h-12 bg-[#333] text-white rounded-2xl font-bold uppercase tracking-[0.18em] text-[10px] hover:bg-[#6651A4] transition-all"
                   >
                     Download Invoice
                   </button>
                   {canRequestReturn(selectedOrder) && (
                     <div className="space-y-3">
                       <textarea
                         value={returnReason}
                         onChange={(event) => setReturnReason(event.target.value)}
                         onFocus={(event) => {
                           const inputEl = event.target
                           setTimeout(() => {
                             inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
                             const scrollContainer = inputEl.closest('.overflow-y-auto')
                             if (scrollContainer) {
                               scrollContainer.scrollTo({
                                 top: scrollContainer.scrollHeight,
                                 behavior: 'smooth'
                               })
                             }
                           }, 150)
                         }}
                         onClick={(event) => {
                           const inputEl = event.target
                           setTimeout(() => {
                             inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
                             const scrollContainer = inputEl.closest('.overflow-y-auto')
                             if (scrollContainer) {
                               scrollContainer.scrollTo({
                                 top: scrollContainer.scrollHeight,
                                 behavior: 'smooth'
                               })
                             }
                           }, 150)
                         }}
                         placeholder="Reason for return or refund request"
                         rows={3}
                         className="w-full px-4 py-3 rounded-2xl bg-white/70 border border-black/[0.03] text-[12px] text-gray-700 outline-none resize-none"
                       />
                       <button
                         onClick={() => handleRequestReturn(selectedOrder.id)}
                         className="w-full h-12 bg-[#6651A4] text-white rounded-2xl font-bold uppercase tracking-[0.18em] text-[10px] hover:bg-[#333] transition-all"
                       >
                         Request Return / Refund
                       </button>
                     </div>
                   )}
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LEFT PANEL - Fixed Sidebar */}
      <div className={`w-full lg:w-[320px] bg-[#FAEAD3] h-screen lg:flex flex-col border-r border-black/[0.03] transition-transform duration-300 shrink-0 ${viewMode === 'content' ? 'hidden lg:flex' : 'flex'}`}>
         
         <div className="bg-[#6651A4] h-[200px] relative shrink-0 rounded-b-[60px] overflow-hidden flex flex-col items-center justify-center">
            {/* Geometric Pattern */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#E84949]/10 rounded-full -ml-24 -mb-24 blur-2xl" />
            
            <Link to="/" className="absolute top-6 left-6 w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/20 transition-all border border-white/20 shadow-sm z-20">
               <Home size={18} className="text-white" />
            </Link>

            <div className="relative z-10 flex flex-col items-center gap-3">
               <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center border-[4px] border-[#FAEAD3] shadow-xl text-3xl font-bold font-grandstander text-[#6651A4]">
                  {user.firstName.charAt(0)}
               </div>
               <div className="text-center">
                  <h2 className="text-2xl font-grandstander font-bold tracking-tight text-white">{user.firstName} {user.lastName}</h2>
                  <p className="text-[8px] font-bold text-white/40 uppercase tracking-[0.4em] mt-1">{user.email}</p>
               </div>
            </div>
         </div>

         <div className="grow overflow-y-auto custom-scrollbar p-5 flex flex-col">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-3">Quick Navigation</p>
            <div className="space-y-0.5 mb-10">
                {menuItems.map(item => (
                  <button key={item.id} onClick={() => item.isLink ? navigate(item.path) : handleTabChange(item.id)} className={`w-full p-3.5 rounded-xl flex items-center gap-4 transition-all border-b border-black/[0.03] last:border-b-0 ${activeTab === item.id ? 'bg-white shadow-sm' : 'hover:bg-white/40'}`}>
                     <span className={item.color}>{item.icon}</span>
                     <span className={`text-[12px] font-bold ${activeTab === item.id ? 'text-[#333]' : 'text-gray-600'}`}>{item.label}</span>
                     {activeTab === item.id && <ChevronRight size={14} className="ml-auto text-[#6651A4]/40"/>}
                  </button>
                ))}
            </div>

            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-3">Help & Policy</p>
            <div className="space-y-0.5">
               {legalItems.map(item => (
                 <button key={item.id} onClick={() => {
                    if (item.id === 'returns') navigate('/pages/return-exchange');
                    else if (item.id === 'shipping') navigate('/pages/shipping-policy');
                    else if (item.id === 'privacy') navigate('/pages/privacy-policy');
                    else if (item.id === 'terms') navigate('/pages/terms-conditions');
                    else if (item.id === 'help') navigate('/pages/faq');
                    else handleTabChange(item.id);
                 }} className={`w-full p-3 rounded-xl flex items-center gap-4 transition-all border-b border-black/[0.02] last:border-b-0 ${activeTab === item.id ? 'bg-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                    <span className="opacity-60">{item.icon}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{item.label}</span>
                 </button>
               ))}
            </div>

            <div className="mt-auto pt-10 pb-6">
               <button 
                 onClick={logout}
                 className="w-full bg-white border border-[#E84949]/5 py-4 rounded-full flex items-center justify-center gap-3 group hover:shadow-xl hover:shadow-[#E84949]/5 transition-all active:scale-95 shadow-sm"
               >
                  <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center group-hover:bg-[#E84949] group-hover:text-white transition-all text-[#E84949]">
                     <LogOut size={16} />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#E84949]">Logout</span>
               </button>
            </div>
         </div>
      </div>

      {/* RIGHT PANEL - Content Area */}
      <div className={`grow h-full overflow-y-auto custom-scrollbar flex flex-col bg-[#FDF4E6] ${viewMode === 'menu' ? 'hidden lg:flex' : 'flex'}`}>
         
         <div className="sticky top-0 z-50 bg-[#FDF4E6]/90 backdrop-blur-md px-6 py-5 border-b border-black/[0.03] flex items-center gap-4">
            <button onClick={() => { setViewMode('menu'); navigate('/account', { replace: true }); }} className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-[#333] shadow-sm lg:hidden"><Menu size={18}/></button>
            <h3 className="font-grandstander font-bold text-[16px] text-gray-700 capitalize tracking-tight">{activeTab}</h3>
         </div>

         <div className="p-4 md:p-8 lg:p-10 w-full space-y-12 pb-32">
            <AnimatePresence mode="wait">
               
               {activeTab === 'dashboard' && (
                 <motion.div key="dashboard" initial={{opacity:0}} animate={{opacity:1}} className="space-y-10">
                    <div className="flex justify-between items-end border-b border-black/[0.03] pb-10">
                       <div><h1 className="text-3xl md:text-4xl font-grandstander font-bold text-gray-800">Hello, {user.firstName}!</h1><p className="text-gray-400 font-medium text-xs mt-1">Ready to explore more toys?</p></div>
                       <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-[#E84949] shadow-sm border border-white"><Star size={32} fill="#E84949" className="opacity-30"/></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div className="p-8 bg-[#FAEAD3] rounded-3xl space-y-4 hover:shadow-md transition-all group relative">
                          <button onClick={() => handleTabChange('orders')} className="absolute top-4 right-4 p-2 bg-white rounded-xl text-gray-400 hover:text-[#6651A4] shadow-sm transition-all"><ExternalLink size={14}/></button>
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#6651A4] group-hover:scale-110 transition-all"><Package size={20}/></div>
                          <div><p className="text-3xl font-bold font-grandstander text-gray-700">{orders.length}</p><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Hauls</p></div>
                       </div>
                       <div className="p-8 bg-[#FAEAD3] rounded-3xl space-y-4 hover:shadow-md transition-all group relative">
                          <button onClick={() => handleTabChange('wishlist')} className="absolute top-4 right-4 p-2 bg-white rounded-xl text-gray-400 hover:text-[#6651A4] shadow-sm transition-all"><ExternalLink size={14}/></button>
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-pink-500 group-hover:scale-110 transition-all"><Heart size={20}/></div>
                          <div><p className="text-3xl font-bold font-grandstander text-gray-700">{wishlist.length}</p><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Saved Joy</p></div>
                       </div>
                       <div className="p-8 bg-[#FAEAD3] rounded-3xl space-y-4 hover:shadow-md transition-all group relative">
                          <button onClick={() => handleTabChange('payments')} className="absolute top-4 right-4 p-2 bg-white rounded-xl text-gray-400 hover:text-[#6651A4] shadow-sm transition-all"><ExternalLink size={14}/></button>
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-green-500 group-hover:scale-110 transition-all"><Landmark size={20}/></div>
                          <div><p className="text-3xl font-bold font-grandstander text-gray-700">{savedMethods.bankAccounts.length + savedMethods.upiIds.length + savedMethods.cards.length}</p><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Accounts</p></div>
                       </div>
                    </div>

                    {/* ── PUSH NOTIFICATION TEST PANEL ── */}
                    <div className="p-6 md:p-8 bg-white rounded-3xl border border-dashed border-[#6651A4]/20 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#6651A4]/10 rounded-xl flex items-center justify-center">
                          <span className="text-xl">🔔</span>
                        </div>
                        <div>
                          <h4 className="text-[13px] font-bold text-gray-700 uppercase tracking-widest">Push Notification Test</h4>
                          <p className="text-[10px] text-gray-400 font-medium mt-0.5">Dev tool — test FCM token & foreground notification</p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          id="btn-test-fcm-token"
                          onClick={async () => {
                            try {
                              console.log('[FCM] Requesting permission & token...');
                              const token = await requestForToken();
                              if (token) {
                                console.log('[FCM] ✅ Token generated:', token);
                                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? 'mobile' : 'web';
                                await saveFcmToken(token, isMobile);
                                console.log(`[FCM] ✅ Token saved to DB via API as ${isMobile}`);
                                success(`FCM token saved as ${isMobile}! Check console for details.`);
                              } else {
                                console.warn('[FCM] ⚠️ No token — check browser permission');
                                showError('No token generated. Allow notification permission first.');
                              }
                            } catch (err) {
                              console.error('[FCM] ❌ Error:', err);
                              showError('Error: ' + err.message);
                            }
                          }}
                          className="flex-1 h-12 bg-[#6651A4] text-white text-[11px] font-bold uppercase tracking-widest rounded-2xl hover:bg-[#5541a0] active:scale-95 transition-all shadow-md shadow-[#6651A4]/20"
                        >
                          📱 Get & Save FCM Token
                        </button>

                        <button
                          id="btn-test-foreground-notif"
                          onClick={async () => {
                            try {
                              console.log('[FCM] Triggering backend test notification...');
                              await apiRequest('/users/me/test-notification', { method: 'POST' });
                              success('Real push notification triggered! You should receive it via FCM shortly.');
                            } catch (err) {
                              console.error('[FCM] Test failed:', err);
                              showError('Failed to trigger push: ' + err.message);
                            }
                          }}
                          className="flex-1 h-12 bg-[#E84949] text-white text-[11px] font-bold uppercase tracking-widest rounded-2xl hover:bg-[#d43d3d] active:scale-95 transition-all shadow-md shadow-[#E84949]/20"
                        >
                          🔔 Fire Test Notification
                        </button>
                      </div>

                      <p className="text-[9px] text-gray-400 font-medium leading-relaxed">
                        <span className="font-bold text-[#6651A4]">Step 1:</span> Click "Get & Save FCM Token" — allow browser permission, check console + DB.<br/>
                        <span className="font-bold text-[#E84949]">Step 2:</span> Click "Fire Test Notification" to verify foreground display.
                      </p>
                    </div>
                    {/* ── END TEST PANEL ── */}

                 </motion.div>
               )}

               {/* Legal/Support Content Mapping with Image Details */}
               {['help', 'returns', 'shipping', 'privacy', 'terms'].includes(activeTab) && (
                  <motion.div key={activeTab} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="space-y-12">
                     <div className="space-y-4">
                        <h3 className="text-4xl font-grandstander font-bold text-gray-700 uppercase tracking-tight">{activeTab}</h3>
                        <p className="text-gray-400 font-medium italic">Official Statement of {corporateInfo.name}</p>
                     </div>

                     <div className="space-y-8 text-gray-600 leading-relaxed">
                        <div className="p-10 bg-[#FAEAD3] rounded-[40px] border border-black/[0.03] space-y-6">
                           <div className="flex items-center gap-4 text-[#6651A4] font-bold text-sm uppercase tracking-[0.2em] mb-4">
                              <Building size={20}/> Corporate Identity
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[13px] font-medium">
                              <div className="space-y-1">
                                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Entity Name</p>
                                 <p>{corporateInfo.name}</p>
                              </div>
                              <div className="space-y-1">
                                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">CIN Number</p>
                                 <p>{corporateInfo.cin}</p>
                              </div>
                              <div className="space-y-1">
                                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Registered Office</p>
                                 <p className="leading-relaxed">{corporateInfo.address}</p>
                              </div>
                              <div className="space-y-1">
                                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tax Identifiers</p>
                                 <p>PAN: {corporateInfo.pan} · TAN: {corporateInfo.tan}</p>
                              </div>
                           </div>
                        </div>

                        <div className="space-y-6 px-4">
                           <h4 className="text-xl font-grandstander font-bold text-gray-700">Detailed Policies</h4>
                           <p className="text-[15px]">At TOYOVOINDIA, our operations are governed by the Companies Act, 2013. Incorporated on {corporateInfo.incDate}, we strive to maintain the highest standards of transparency for our explorers.</p>
                           <p className="text-[15px]">Your engagement with our platform, including orders, returns, and wallet usage, is protected under the laws of the Ministry of Corporate Affairs, Government of India.</p>
                        </div>
                     </div>
                  </motion.div>
               )}

               {/* Other Tabs (Wallet, Orders, Profile, etc.) continue below */}
               {activeTab === 'orders' && (
                 <motion.div key="orders" initial={{opacity:0}} animate={{opacity:1}} className="space-y-0.5">
                    {ordersLoading ? (
                       <div className="py-20 text-center text-gray-300 font-bold uppercase tracking-widest text-[9px]">Loading Orders...</div>
                    ) : orders.length === 0 ? (
                       <div className="py-20 text-center text-gray-300 font-bold uppercase tracking-widest text-[9px]">No orders found</div>
                    ) : orders.map(order => (
                       <div key={order.id} onClick={()=>setSelectedOrder(order)} className="p-5 md:p-6 bg-white/60 rounded-[32px] border border-black/[0.03] hover:shadow-lg transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 sm:gap-4">
                           <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 md:gap-5 text-center sm:text-left">
                              <div className="w-20 h-20 sm:w-12 sm:h-12 bg-white rounded-2xl flex items-center justify-center overflow-hidden shrink-0 border border-black/5 shadow-sm">
                                 {order.items?.[0]?.img ? (
                                    <img src={order.items[0].img} className="w-full h-full object-cover" />
                                 ) : (
                                    <Box size={24} className="text-[#6651A4] opacity-20"/>
                                 )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[14px] sm:text-[13px] font-bold text-gray-700 font-grandstander">Order #{order.orderNumber}</p>
                                <p className="text-[11px] sm:text-[10px] text-gray-400 font-medium mt-1 uppercase tracking-wider">{order.date} · {order.items.length} Items</p>
                                <p className="text-[11px] sm:text-[10px] text-[#6651A4] font-bold mt-0.5 uppercase tracking-widest">{order.status === 'cancelled' ? 'Cancelled' : `ETA ${order.deliveryDate || '-'}`}</p>
                                {order.trackingNumber && (
                                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Tracking: {order.trackingNumber}</p>
                                )}
                              </div>
                           </div>
                           <div className="text-center sm:text-right flex flex-col sm:flex-row items-center gap-4 md:gap-6 border-t sm:border-t-0 border-black/[0.03] pt-4 sm:pt-0">
                              <div className="grow sm:grow-0">
                                <p className="text-2xl sm:text-lg md:text-xl font-bold font-grandstander text-gray-800">₹{order.total.toFixed(2)}</p>
                                <div className="flex items-center justify-center sm:justify-end gap-2 mt-1">
                                  <div className={`w-1.5 h-1.5 rounded-full ${order.status==='cancelled'?'bg-red-400':'bg-green-500'}`}></div>
                                  <p className={`text-[10px] font-bold uppercase tracking-widest ${order.status==='cancelled'?'text-red-400':'text-green-500'}`}>{order.statusLabel}</p>
                                </div>
                                {order.returnRequest?.status !== 'none' && (
                                  <p className="mt-1 text-[9px] font-bold uppercase text-[#6651A4]">{order.returnRequest.statusLabel}</p>
                                )}
                                {canCancelOrder(order) && (
                                  <button
                                    onClick={(event) => {
                                      event.stopPropagation()
                                      handleCancelOrder(order.id)
                                    }}
                                    className="mt-3 sm:mt-2 text-[10px] sm:text-[9px] font-bold uppercase tracking-[0.2em] text-[#E84949] hover:text-[#333] transition-colors py-1.5 px-4 sm:p-0 bg-red-50 sm:bg-transparent rounded-lg"
                                  >
                                    Cancel
                                  </button>
                                )}
                              </div>
                              <ChevronRight size={18} className="text-[#333]/40 group-hover:text-[#333] translate-x-0 group-hover:translate-x-1 transition-all hidden sm:block"/>
                           </div>
                        </div>
                    ))}
                 </motion.div>
               )}

               {activeTab === 'payments' && (
                 <motion.div key="payments" initial={{opacity:0}} animate={{opacity:1}} className="space-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {[
                         { id: 'bankAccounts', label: 'Linked Banks', icon: <Landmark size={24}/>, items: savedMethods.bankAccounts, theme: 'bg-[#FAEAD3]' },
                         { id: 'upiIds', label: 'UPI Addresses', icon: <Smartphone size={24}/>, items: savedMethods.upiIds, theme: 'bg-[#FAEAD3]' },
                         { id: 'cards', label: 'Vaulted Cards', icon: <CreditCard size={24}/>, items: savedMethods.cards, theme: 'bg-[#FAEAD3]' }
                       ].map(section => (
                         <div key={section.id} className="p-6 bg-[#FAEAD3] border border-white/20 rounded-[40px] space-y-6 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col">
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#E84949]/5 rounded-full blur-3xl group-hover/card:bg-[#E84949]/10 transition-colors" />
                            
                            <div className="flex justify-between items-start">
                               <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-[#E84949] shadow-inner group-hover/card:scale-110 transition-all duration-500">{section.icon}</div>
                               <button onClick={() => { setPaymentTypeToAdd(section.id); setShowAddPayment(true); }} className="relative z-20 w-10 h-10 bg-[#333] text-white rounded-xl flex items-center justify-center hover:bg-[#E84949] transition-all shadow-lg active:scale-90"><Plus size={20}/></button>
                            </div>
                            
                            <div>
                               <h4 className="text-[14px] font-bold uppercase tracking-widest text-[#333] mb-1 font-grandstander">{section.label}</h4>
                               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.25em]">{section.items.length} Active Records</p>
                            </div>

                            <div className="space-y-4">
                               {section.items.map(item => (
                                 <motion.div initial={{opacity:0, x:-10}} animate={{opacity:1, x:0}} key={item.id} className="p-4 bg-white/40 backdrop-blur-md border border-white/50 rounded-[24px] flex justify-between items-center group/item hover:bg-white/60 transition-all cursor-default">
                                    <div className="truncate pr-4">
                                       <p className="text-[12px] font-bold text-gray-700 truncate font-grandstander">{item.bankName || item.upiId || `Card • ${item.cardNo.slice(-4)}`}</p>
                                       <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">{item.accNo ? `A/C: ${item.accNo.slice(-4)}` : item.exp ? `Exp: ${item.exp}` : 'Primary VPA'}</p>
                                    </div>
                                    <button onClick={() => deleteSavedMethod(section.id, item.id)} className="w-7 h-7 rounded-lg bg-red-50 text-[#E84949] flex items-center justify-center hover:bg-[#E84949] hover:text-white transition-all"><Trash2 size={12}/></button>
                                 </motion.div>
                               ))}
                            </div>
                         </div>
                       ))}
                    </div>

                        <div className="flex items-center justify-between px-6">
                           <h4 className="text-[13px] font-bold uppercase tracking-[0.3em] text-gray-400 font-grandstander">Ledger Records</h4>
                           <button onClick={() => { setIsProcessing(true); setTimeout(() => { setIsProcessing(false); success('Ledger synchronized.'); }, 1000); }} className="p-2 bg-white rounded-xl text-gray-400 hover:text-[#6651A4] shadow-sm transition-all"><RefreshCw size={14} className={isProcessing ? 'animate-spin' : ''}/></button>
                        </div>
                       <div className="bg-[#FAEAD3]/30 rounded-[40px] border border-white/20 overflow-hidden">
                          {paymentHistory.length === 0 ? (
                            <div className="py-24 text-center">
                               <p className="text-gray-300 font-bold uppercase tracking-widest text-[10px]">No transaction trail found</p>
                            </div>
                          ) : paymentHistory.map((txn, idx) => (
                             <div key={txn.id} className={`p-6 flex items-center justify-between hover:bg-white/40 transition-all border-b border-white/20 last:border-0 ${idx % 2 === 0 ? 'bg-white/10' : ''}`}>
                                <div className="flex items-center gap-6">
                                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${txn.type==='Refund'?'bg-emerald-400':'bg-[#333]'}`}>{txn.type==='Refund'?<ArrowDownLeft size={20}/>:<ArrowUpRight size={20}/>}</div>
                                   <div>
                                      <p className="text-[14px] font-bold text-gray-700 font-grandstander uppercase tracking-wider">{txn.method}</p>
                                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{txn.date} • {txn.id}</p>
                                   </div>
                                </div>
                                <div className="text-right">
                                   <p className={`text-2xl font-bold font-grandstander ${txn.type==='Refund'?'text-emerald-500':'text-[#E84949]'}`}>{txn.type==='Refund'?'+':'-'}₹{txn.amount.toFixed(2)}</p>
                                   <p className="text-[8px] font-bold text-gray-300 uppercase tracking-[0.2em] mt-1">Authorized</p>
                                </div>
                             </div>
                          ))}
                       </div>
                 </motion.div>
               )}

               {activeTab === 'addresses' && (
                  <motion.div key="addresses" initial={{opacity:0}} animate={{opacity:1}} className="space-y-10">
                     <div id="addresses-tab-header" className="flex justify-between items-center px-4">
                        <h3 className="text-2xl font-grandstander font-bold text-gray-700">Saved Addresses</h3>
                        <button onClick={() => { 
                           setEditingAddressId(null); 
                           setAddressForm({ type: 'Home', firstName: user.firstName || '', lastName: user.lastName || '', address: '', apartment: '', city: '', state: '', postalCode: '', phone: '', district: '', country: 'India' });
                           const nextShow = !showAddAddress;
                           setShowAddAddress(nextShow); 
                           if (nextShow) {
                              setTimeout(() => {
                                 document.getElementById('addresses-tab-header')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }, 100);
                           }
                        }} className="text-[11px] font-bold text-[#6651A4] uppercase flex items-center gap-2 hover:underline transition-all">
                           {showAddAddress ? <X size={18}/> : <Plus size={18}/>} {showAddAddress ? 'Cancel' : 'Add New Address'}
                        </button>
                     </div>

                     <AnimatePresence>
                        {showAddAddress && (
                          <motion.form 
                            initial={{height:0, opacity:0}} animate={{height:'auto', opacity:1}} exit={{height:0, opacity:0}} 
                            onSubmit={(e) => { 
                               e.preventDefault(); 
                               const newErrors = {};
                               if (!addressForm.firstName.trim()) newErrors.firstName = 'First name is required';
                               else if (!/^[A-Za-z\s]+$/.test(addressForm.firstName)) newErrors.firstName = 'First name must contain alphabets only';
                               
                               if (!addressForm.lastName.trim()) newErrors.lastName = 'Last name is required';
                               else if (!/^[A-Za-z\s]+$/.test(addressForm.lastName)) newErrors.lastName = 'Last name must contain alphabets only';
                               
                               if (!addressForm.address.trim()) newErrors.address = 'Street address is required';
                               const countryVal = addressForm.country || 'India';
                               if (!countryVal) newErrors.country = 'Country/Region is required';
                               if (!addressForm.state) newErrors.state = 'State is required';
                               if (!addressForm.city) newErrors.city = 'City is required';
                               if (addressForm.city === 'Other' && !addressForm.district.trim()) newErrors.district = 'City/District is required';

                               if (!addressForm.postalCode) newErrors.postalCode = 'ZIP code is required';
                               else if (!/^\d{6}$/.test(addressForm.postalCode)) newErrors.postalCode = 'ZIP code must be exactly 6 digits';
                               
                               let cleanPhone = addressForm.phone.replace(/\D/g, '');
                               if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
                                 cleanPhone = cleanPhone.slice(2);
                               }
                               if (!cleanPhone) newErrors.phone = 'Mobile number is required';
                               else if (!/^[6-9]\d{9}$/.test(cleanPhone)) newErrors.phone = 'Mobile number must be 10 digits starting with 6-9';

                               if (Object.keys(newErrors).length > 0) {
                                 setAddressErrors(newErrors);
                                 return;
                               }
                               setAddressErrors({});
                               
                               const formattedPhone = cleanPhone.startsWith('91') && cleanPhone.length === 12 
                                  ? '+' + cleanPhone 
                                  : '+91' + cleanPhone;
                               const finalAddress = { ...addressForm, country: countryVal, phone: formattedPhone };

                               if (editingAddressId) updateAddress(editingAddressId, finalAddress);
                               else addAddress(finalAddress);
                               
                               setShowAddAddress(false); 
                               setEditingAddressId(null);
                            }} 
                            noValidate 
                            className="p-10 bg-[#FAEAD3] rounded-[50px] space-y-6 overflow-hidden border border-white/40 shadow-xl"
                          >
                             <div className="flex gap-3 mb-4 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
                                {addressTypes.map(t => (
                                   <button key={t} type="button" onClick={() => setAddressForm({...addressForm, type: t})} className={`px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest border-2 transition-all shrink-0 ${addressForm.type === t ? 'bg-[#333] text-white border-[#333]' : 'bg-[#FDF4E6] border-transparent text-gray-400 hover:border-gray-200'}`}>
                                      {t}
                                   </button>
                                ))}
                             </div>
                             <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1 mt-2">Contact Information</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <input required placeholder="First Name" value={addressForm.firstName} onChange={e=>setAddressForm({...addressForm, firstName: e.target.value.replace(/[^A-Za-z\s]/g, '')})} className={`w-full h-14 px-6 bg-[#FDF4E6] rounded-2xl text-[13px] font-bold outline-none border-2 ${addressErrors.firstName ? 'border-red-400' : 'border-transparent focus:border-[#E84949]'} transition-all`} />
                                  {addressErrors.firstName && <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight ml-1 mt-1">{addressErrors.firstName}</p>}
                                </div>
                                <div>
                                  <input required placeholder="Last Name" value={addressForm.lastName} onChange={e=>setAddressForm({...addressForm, lastName: e.target.value.replace(/[^A-Za-z\s]/g, '')})} className={`w-full h-14 px-6 bg-[#FDF4E6] rounded-2xl text-[13px] font-bold outline-none border-2 ${addressErrors.lastName ? 'border-red-400' : 'border-transparent focus:border-[#E84949]'} transition-all`} />
                                  {addressErrors.lastName && <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight ml-1 mt-1">{addressErrors.lastName}</p>}
                                </div>
                             </div>

                              <div>
                                 <div className="relative">
                                   <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[13px] font-bold text-[#333] pointer-events-none select-none z-10">+91</span>
                                   <input required placeholder="Phone Number" maxLength="10" value={addressForm.phone.replace(/^\+91/, '')} onChange={e=>setAddressForm({...addressForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})} className={`w-full h-14 pl-14 pr-6 bg-[#FDF4E6] rounded-2xl text-[13px] font-bold outline-none border-2 ${addressErrors.phone ? 'border-red-400' : 'border-transparent focus:border-[#E84949]'} transition-all`} />
                                 </div>
                                {addressErrors.phone && <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight ml-1 mt-1">{addressErrors.phone}</p>}
                              </div>

                              {/* Delivery Address Header and Country Selection */}
                              <div className="space-y-4 pt-4 border-t border-black/[0.03]">
                                 <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">Delivery Address</h4>
                                 <div className="relative">
                                    <select required value={addressForm.country || 'India'} onChange={e=>setAddressForm({...addressForm, country: e.target.value})} className={`w-full h-14 px-6 bg-[#FDF4E6] rounded-2xl text-[13px] font-bold outline-none border-2 ${addressErrors.country ? 'border-red-400' : 'border-transparent focus:border-[#E84949]'} appearance-none cursor-pointer`}>
                                       <option value="India">India</option>
                                    </select>
                                    <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                                 </div>
                                 {addressErrors.country && <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight ml-1 mt-1">{addressErrors.country}</p>}
                              </div>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <div className="relative">
                                    <select required value={addressForm.state} onChange={e=>setAddressForm({...addressForm, state: e.target.value, city: ''})} className={`w-full h-14 px-6 bg-[#FDF4E6] rounded-2xl text-[13px] font-bold outline-none border-2 ${addressErrors.state ? 'border-red-400' : 'border-transparent focus:border-[#E84949]'} appearance-none cursor-pointer`}>
                                       <option value="">Select State</option>
                                       {indianStates.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                                  </div>
                                  {addressErrors.state && <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight ml-1 mt-1">{addressErrors.state}</p>}
                                </div>
                                <div>
                                  <div className="relative">
                                    <select required value={addressForm.city} onChange={e=>setAddressForm({...addressForm, city: e.target.value})} className={`w-full h-14 px-6 bg-[#FDF4E6] rounded-2xl text-[13px] font-bold outline-none border-2 ${addressErrors.city ? 'border-red-400' : 'border-transparent focus:border-[#E84949]'} appearance-none cursor-pointer`}>
                                       <option value="">Select City</option>
                                       {(commonCities[addressForm.state] || []).map(c => <option key={c} value={c}>{c}</option>)}
                                       <option value="Other">Other (Manual Entry)</option>
                                    </select>
                                    <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                                  </div>
                                  {addressErrors.city && <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight ml-1 mt-1">{addressErrors.city}</p>}
                                </div>
                             </div>

                             {addressForm.city === 'Other' && (
                                <div>
                                  <input required placeholder="Enter City/District" value={addressForm.district} onChange={e=>setAddressForm({...addressForm, district: e.target.value})} className={`w-full h-14 px-6 bg-[#FDF4E6] rounded-2xl text-[13px] font-bold outline-none border-2 ${addressErrors.district ? 'border-red-400' : 'border-[#E84949]'}`} />
                                  {addressErrors.district && <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight ml-1 mt-1">{addressErrors.district}</p>}
                                </div>
                             )}

                             <div>
                               <input required placeholder="Street Address / Address Line 1" value={addressForm.address} onChange={e=>setAddressForm({...addressForm, address: e.target.value})} className={`w-full h-14 px-6 bg-[#FDF4E6] rounded-2xl text-[13px] font-bold outline-none border-2 ${addressErrors.address ? 'border-red-400' : 'border-transparent focus:border-[#E84949]'} transition-all`} />
                               {addressErrors.address && <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight ml-1 mt-1">{addressErrors.address}</p>}
                             </div>

                             <div>
                                <input placeholder="Apartment, suite, unit, etc. (optional)" value={addressForm.apartment} onChange={e=>setAddressForm({...addressForm, apartment: e.target.value})} className="w-full h-14 px-6 bg-[#FDF4E6] rounded-2xl text-[13px] font-bold outline-none border-2 border-transparent focus:border-[#E84949] transition-all" />
                             </div>

                             <div>
                               <input required placeholder="Postal Code / ZIP Code" maxLength="6" value={addressForm.postalCode} onChange={e=>setAddressForm({...addressForm, postalCode: e.target.value.replace(/\D/g, '').slice(0, 6)})} className={`w-full h-14 px-6 bg-[#FDF4E6] rounded-2xl text-[13px] font-bold outline-none border-2 ${addressErrors.postalCode ? 'border-red-400' : 'border-transparent focus:border-[#E84949]'} transition-all`} />
                               {addressErrors.postalCode && <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight ml-1 mt-1">{addressErrors.postalCode}</p>}
                             </div>
                             <div className="hidden">
                               <div className="hidden">
                                 <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[13px] font-bold text-gray-500 pointer-events-none">+91</span>
                                 <input required placeholder="Phone Number" maxLength="10" value={addressForm.phone.replace(/^\+91/, '')} onChange={e=>setAddressForm({...addressForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})} className={`w-full h-14 pl-14 pr-6 bg-[#FDF4E6] rounded-2xl text-[13px] font-bold outline-none border-2 ${addressErrors.phone ? 'border-red-400' : 'border-transparent focus:border-[#E84949]'} transition-all`} />
                               </div>
                               
                             </div>
                             
                             <button type="submit" className="w-full h-16 bg-[#333] text-white rounded-2xl font-bold uppercase tracking-[0.2em] text-[11px] hover:bg-[#E84949] transition-all shadow-xl active:scale-[0.98] mt-4 flex items-center justify-center gap-3">
                                {editingAddressId ? 'Update Address' : 'Save Address'}
                             </button>
                          </motion.form>
                        )}
                     </AnimatePresence>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
                        {addresses.map(addr => (
                           <div key={addr.id} className={`p-8 rounded-[40px] border transition-all relative group overflow-hidden ${addr.isDefault ? 'bg-[#FAEAD3] border-[#E84949]/30 shadow-lg' : 'bg-[#FDF4E6] border-white/40 hover:bg-[#FAEAD3] hover:shadow-xl'}`}>
                              <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#E84949]/5 rounded-full blur-3xl group-hover:bg-[#E84949]/10 transition-colors" />
                              
                              <div className="flex justify-between items-start mb-6 relative z-10">
                                 <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-[#E84949] transition-all shadow-inner group-hover:scale-110 duration-500">
                                       {addr.type === 'Home' ? <Home size={24}/> : addr.type === 'Office' ? <Building size={24}/> : <MapPin size={24}/>}
                                    </div>
                                    <div>
                                       <p className="text-[14px] font-bold text-gray-700 font-grandstander">{addr.firstName} {addr.lastName}</p>
                                       <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">{addr.type} Station</p>
                                    </div>
                                 </div>
                                 <div className="flex gap-2">
                                    <button onClick={() => { 
                                       setEditingAddressId(addr.id); 
                                       setAddressForm(addr); 
                                       setShowAddAddress(true); 
                                       setTimeout(() => {
                                         document.getElementById('addresses-tab-header')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                       }, 100);
                                    }} className="w-10 h-10 rounded-xl flex items-center justify-center text-[#6651A4] bg-[#6651A4]/10 hover:bg-[#6651A4] hover:text-white transition-all shadow-sm"><Edit2 size={16}/></button>
                                    {!addr.isDefault && (
                                       <button onClick={() => deleteAddress(addr.id)} className="w-10 h-10 rounded-xl flex items-center justify-center text-[#E84949] bg-[#E84949]/10 hover:bg-[#E84949] hover:text-white transition-all shadow-sm"><Trash2 size={16}/></button>
                                    )}
                                 </div>
                              </div>
                              <div className="space-y-1 text-[13px] font-bold text-gray-500 mb-8 pl-1 relative z-10 leading-relaxed">
                                 <p className="text-[#333] font-extrabold flex items-center gap-2 mb-2 text-[11px] uppercase tracking-widest text-[#E84949]">
                                    <Smartphone size={12}/> {addr.phone}
                                 </p>
                                 <p className="text-[#333] text-[14px]">{addr.country || 'India'}</p>
                                 <p>{addr.state}</p>
                                 <p>{addr.city === 'Other' ? addr.district : addr.city}{addr.district && addr.city !== 'Other' ? ` (${addr.district})` : ''}</p>
                                 <p className="text-gray-700">{addr.address}</p>
                                 {addr.apartment && <p className="text-gray-600">{addr.apartment}</p>}
                                 <p className="text-gray-800 tracking-wider font-mono">{addr.postalCode}</p>
                              </div>
                              <div className="flex items-center justify-between mt-auto relative z-10 pt-4 border-t border-black/[0.03]">
                                 {!addr.isDefault ? (
                                    <button onClick={() => setAsDefaultAddress(addr.id)} className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6651A4] hover:text-[#E84949] transition-all">Set as Primary Address</button>
                                 ) : (
                                    <span className="px-4 py-1.5 bg-[#E84949] text-white rounded-full text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-[#E84949]/20"><Check size={12}/> Primary Address</span>
                                 )}
                              </div>
                           </div>
                        ))}
                     </div>
                  </motion.div>
               )}

               {activeTab === 'wishlist' && (
                  <motion.div key="wishlist" initial={{opacity:0}} animate={{opacity:1}} className="space-y-8">
                     <h3 className="text-2xl font-grandstander font-bold text-gray-700">My Saved Joy</h3>
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        {wishlist.length === 0 ? (
                           <div className="col-span-full py-24 text-center border-2 border-dashed border-black/[0.03] rounded-[40px] space-y-6">
                              <Heart className="mx-auto text-gray-300" size={48}/>
                              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">No toys in your wishlist yet</p>
                              <Link to="/" className="inline-block px-10 py-3 bg-[#333] text-white rounded-xl font-bold uppercase tracking-widest text-[10px]">Start Exploring</Link>
                           </div>
                        ) : wishlist.map((item, i) => (
                           <ProductCard key={item.id} p={item} i={i} />
                        ))}
                     </div>
                  </motion.div>
               )}

               {activeTab === 'profile' && (
                  <motion.div key="profile" initial={{opacity:0}} animate={{opacity:1}} className="max-w-xl mx-auto space-y-12">
                     <h3 className="text-3xl font-grandstander font-bold text-gray-700 text-center">Profile Settings</h3>
                     <form onSubmit={async (e)=>{
                        e.preventDefault()
                        const newErrors = {};
                        if (!profileForm.firstName?.trim()) newErrors.firstName = 'First name is required';
                        else if (!/^[A-Za-z\s]+$/.test(profileForm.firstName)) newErrors.firstName = 'First name must contain alphabets only';
                        
                        if (!profileForm.lastName?.trim()) newErrors.lastName = 'Last name is required';
                        else if (!/^[A-Za-z\s]+$/.test(profileForm.lastName)) newErrors.lastName = 'Last name must contain alphabets only';
                        
                        const cleanPhone = profileForm.phone?.replace(/^\+91/, '').replace(/\D/g, '');
                        if (!cleanPhone) newErrors.phone = 'Mobile number is required';
                        else if (!/^[6-9]\d{9}$/.test(cleanPhone)) newErrors.phone = 'Mobile number must be 10 digits starting with 6-9';

                        if (Object.keys(newErrors).length > 0) {
                           setProfileErrors(newErrors);
                           return;
                        }
                        setProfileErrors({});
                        
                        setIsProcessing(true)
                        try {
                          const formattedPhone = cleanPhone ? '+91' + cleanPhone : '';
                          const updatedProfile = await updateMyProfile({
                            firstName: profileForm.firstName,
                            lastName: profileForm.lastName,
                            phone: formattedPhone,
                          })
                          updateUser(updatedProfile)
                          setOtpSent(false)
                          setVerificationOtp('')
                          setVerificationError('')
                          success('Your profile is updated successfully.')
                        } catch (err) {
                          showError(err.message || 'Profile update failed')
                        } finally {
                          setIsProcessing(false)
                        }
                     }} className="space-y-8">
                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-2">
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4">First Name</label>
                              <input value={profileForm.firstName} onChange={e=>setProfileForm({...profileForm, firstName:e.target.value.replace(/[^A-Za-z\s]/g, '')})} className={`w-full h-12 px-6 bg-[#FAEAD3]/50 rounded-2xl outline-none border-b-2 ${profileErrors.firstName ? 'border-red-400' : 'border-transparent focus:border-[#6651A4]'} font-bold text-gray-600 transition-colors`} />
                              {profileErrors.firstName && <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight px-4">{profileErrors.firstName}</p>}
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4">Last Name</label>
                              <input value={profileForm.lastName} onChange={e=>setProfileForm({...profileForm, lastName:e.target.value.replace(/[^A-Za-z\s]/g, '')})} className={`w-full h-12 px-6 bg-[#FAEAD3]/50 rounded-2xl outline-none border-b-2 ${profileErrors.lastName ? 'border-red-400' : 'border-transparent focus:border-[#6651A4]'} font-bold text-gray-600 transition-colors`} />
                              {profileErrors.lastName && <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight px-4">{profileErrors.lastName}</p>}
                           </div>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4">Email Address</label>
                           <input value={profileForm.email} disabled className="w-full h-12 px-6 bg-[#FAEAD3]/50 rounded-2xl outline-none border-b-2 border-transparent font-bold text-gray-600 opacity-70 cursor-not-allowed" />
                        </div>
                        {(() => {
                           const typedPhone = (profileForm.phone || '').replace(/^\+91/, '').replace(/\D/g, '');
                           const savedPhone = (user?.phone || '').replace(/^\+91/, '').replace(/\D/g, '');
                           const isPhoneChanged = typedPhone !== savedPhone;
                           const isVerified = user?.phoneVerified;

                           return (
                              <div className="space-y-2">
                                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4">Phone Number</label>
                                 <div className="relative">
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[13px] font-bold text-gray-500 pointer-events-none">+91</span>
                                    <input maxLength="10" value={typedPhone} onChange={e=>setProfileForm({...profileForm, phone:e.target.value.replace(/\D/g, '').slice(0, 10)})} className={`w-full h-12 pl-14 pr-6 bg-[#FAEAD3]/50 rounded-2xl outline-none border-b-2 ${profileErrors.phone ? 'border-red-400' : 'border-transparent focus:border-[#6651A4]'} font-bold text-gray-600 transition-colors`} />
                                 </div>
                                 {profileErrors.phone && <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight px-4">{profileErrors.phone}</p>}
                                 
                                 {isPhoneChanged ? (
                                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-tight px-4 leading-relaxed mt-1">
                                       Phone number changed. Click 'Update Profile' to save it. You will need to verify the new number after saving.
                                    </p>
                                 ) : (
                                    <>
                                       {isVerified ? (
                                          <div className="flex items-center gap-1.5 px-4 mt-1.5 text-[11px] font-bold text-green-600 uppercase tracking-wider">
                                             <Check size={14} className="stroke-[3]" /> Verified
                                          </div>
                                       ) : (
                                          <div className="mt-2.5 px-4 space-y-2">
                                             <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600 uppercase tracking-wider">
                                                   <AlertCircle size={14} className="stroke-[3]" /> Unverified
                                                </div>
                                                {!otpSent && (
                                                   <button
                                                      type="button"
                                                      disabled={sendingOtp}
                                                      onClick={handleSendVerificationOtp}
                                                      className="text-[11px] font-extrabold text-[#E84949] hover:underline uppercase tracking-wider disabled:opacity-50"
                                                   >
                                                      {sendingOtp ? 'Sending OTP...' : 'Verify now via OTP'}
                                                   </button>
                                                )}
                                             </div>

                                             {otpSent && (
                                                <div className="mt-2 bg-[#FAEAD3]/40 border border-dashed border-[#333]/15 rounded-2xl p-4 space-y-3">
                                                   <p className="text-[11px] font-semibold text-gray-600">Enter the 6-digit OTP sent to +91{savedPhone}</p>
                                                   <div className="flex gap-2">
                                                      <input
                                                         type="text"
                                                         placeholder="OTP"
                                                         maxLength="6"
                                                         value={verificationOtp}
                                                         onChange={e => setVerificationOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                         className="w-1/2 h-10 px-4 bg-[#FAEAD3]/50 rounded-xl outline-none font-bold text-center tracking-widest text-sm border-b-2 border-transparent focus:border-[#6651A4]"
                                                      />
                                                      <button
                                                         type="button"
                                                         disabled={verifyingOtp}
                                                         onClick={handleVerifyPhoneOtp}
                                                         className="w-1/2 h-10 bg-[#E84949] hover:bg-[#333] text-white rounded-xl font-grandstander font-bold uppercase tracking-wider text-[11px] transition-all flex items-center justify-center disabled:opacity-50"
                                                      >
                                                         {verifyingOtp ? 'Verifying...' : 'Submit'}
                                                      </button>
                                                   </div>
                                                   {verificationError && (
                                                      <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight">{verificationError}</p>
                                                   )}
                                                   <div className="text-right">
                                                      <button
                                                         type="button"
                                                         disabled={sendingOtp}
                                                         onClick={handleSendVerificationOtp}
                                                         className="text-[10px] font-bold text-gray-500 hover:text-[#6651A4] underline uppercase tracking-wider disabled:opacity-50"
                                                      >
                                                         Resend OTP
                                                      </button>
                                                   </div>
                                                </div>
                                             )}
                                          </div>
                                       )}
                                    </>
                                 )}
                              </div>
                           );
                        })()}
                        <button type="submit" className="w-full h-16 bg-[#333] text-white rounded-[25px] font-grandstander font-bold uppercase tracking-widest text-[13px] hover:bg-[#6651A4] transition-all shadow-xl">Update Profile</button>
                     </form>
                  </motion.div>
               )}
            </AnimatePresence>
         </div>
      </div>
    </div>
  )
}
