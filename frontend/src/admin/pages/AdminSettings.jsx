import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { 
  User, Shield, Bell, Palette, Globe, 
  Save, RefreshCcw, Camera, Mail, Lock,
  Truck, IndianRupee, MessageSquare, Image as ImageIcon,
  ExternalLink, Power, Zap
} from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import { getAdminStorefrontSettings, updateAdminStorefrontSettings } from '../../services/siteApi'
import { updateMyProfile } from '../../services/userProfileApi'

// Social Icons (Fallbacks for older lucide versions)
const FbIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
)
const IgIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <rect x="2" y="2" width="20" height="20" rx="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
)
const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
)
const LiIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
  </svg>
)

export function AdminSettings() {
  const [activeSection, setActiveSection] = useState('site')
  const { success, error: showError } = useToast()
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const data = await getAdminStorefrontSettings()
      setSettings(data)
    } catch (err) {
      showError(err.message || 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (updatedData) => {
    const errors = {}
    
    if (!updatedData.contactPhone || !updatedData.contactPhone.trim()) {
       errors.contactPhone = 'Support Phone is required'
    } else {
       const digits = updatedData.contactPhone.replace(/\D/g, '')
       if (digits.length !== 12 || !/^91[6-9]/.test(digits)) {
         errors.contactPhone = 'Phone must be a valid 10-digit number starting with 6-9'
       }
    }
    
    if (!updatedData.contactAddress || !updatedData.contactAddress.trim()) {
      errors.contactAddress = 'Office address is required'
    }

    if (!updatedData.contactEmail || !updatedData.contactEmail.trim()) {
      errors.contactEmail = 'Support Email is required'
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      setActiveSection('contact')
      return
    }
    
    setFormErrors({})
    setSaving(true)
    try {
      const data = await updateAdminStorefrontSettings(updatedData)
      setSettings(data)
      success('Settings synchronized successfully!')
    } catch (err) {
      showError(err.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const sections = [
    { id: 'site', label: 'Storefront', icon: <Globe size={18} /> },
    { id: 'contact', label: 'Communications', icon: <MessageSquare size={18} /> },
    { id: 'profile', label: 'Admin Identity', icon: <User size={18} /> },
    { id: 'security', label: 'Security', icon: <Shield size={18} /> },
  ]

  if (loading) {
    return (
      <div className="shell flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-[#6651A4]/20 border-t-[#6651A4] rounded-full animate-spin" />
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Warming up config center...</p>
      </div>
    )
  }

  return (
    <div className="shell space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-grandstander font-bold text-gray-800">Command Center</h1>
          <p className="text-gray-500 font-medium text-sm mt-1">Manage global storefront parameters and security protocols.</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="px-4 py-2 bg-green-50 text-green-600 rounded-2xl text-[10px] font-bold uppercase tracking-widest border border-green-100 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            System Live
          </span>
          <button 
            onClick={() => handleUpdate(settings)}
            disabled={saving}
            className="h-12 px-8 bg-[#6651A4] text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] shadow-lg shadow-[#6651A4]/20 flex items-center gap-2 hover:scale-[1.02] transition-all"
          >
            {saving ? <RefreshCcw size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Syncing...' : 'Save All'}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-72 flex flex-col gap-2">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-4 px-6 py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all ${
                activeSection === section.id 
                ? 'bg-[#6651A4] text-white shadow-xl shadow-[#6651A4]/20 translate-x-2' 
                : 'bg-white text-gray-400 hover:bg-gray-50 hover:text-gray-600 border border-black/[0.03]'
              }`}
            >
              {section.icon} {section.label}
            </button>
          ))}
        </div>

        <div className="flex-1">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[40px] p-8 md:p-12 shadow-sm border border-black/[0.03]"
          >
            {activeSection === 'site' && (
              <StorefrontTab settings={settings} setSettings={setSettings} />
            )}
            {activeSection === 'contact' && (
              <ContactTab settings={settings} setSettings={setSettings} formErrors={formErrors} />
            )}
            {activeSection === 'profile' && <ProfileSettings />}
            {activeSection === 'security' && <SecuritySettings />}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

function StorefrontTab({ settings, setSettings }) {
  const [uploading, setUploading] = useState(false)
  const updateField = (field, value) => setSettings({ ...settings, [field]: value })

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const { uploadAdminMedia } = await import('../../services/adminCatalogApi')
      const result = await uploadAdminMedia(file, 'site')
      updateField('siteLogo', { url: result.url, publicId: result.publicId })
    } catch (err) {
      alert(err.message || 'Logo upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Store Name</label>
          <input 
            type="text" 
            value={settings.siteName}
            onChange={(e) => updateField('siteName', e.target.value)}
            className="w-full h-14 px-6 bg-[#FDF4E6]/50 rounded-2xl border-2 border-transparent focus:border-[#6651A4]/30 font-bold" 
          />
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Maintenance Mode</label>
          <button 
            onClick={() => updateField('maintenanceMode', !settings.maintenanceMode)}
            className={`w-full h-14 px-6 rounded-2xl flex items-center justify-between font-bold transition-all ${settings.maintenanceMode ? 'bg-red-50 text-red-600 border-2 border-red-100' : 'bg-green-50 text-green-600 border-2 border-green-100'}`}
          >
            <span>{settings.maintenanceMode ? 'Enabled (Store Closed)' : 'Disabled (Store Open)'}</span>
            <Power size={20} />
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <h4 className="text-[11px] font-bold text-[#F1641E] uppercase tracking-[0.2em] border-b pb-4">Announcement Bar</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-3">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Prime Message</label>
            <input 
              type="text" 
              value={settings.announcementMessages?.[0] || ''}
              onChange={(e) => {
                const msgs = [...(settings.announcementMessages || [])]
                msgs[0] = e.target.value
                updateField('announcementMessages', msgs)
              }}
              className="w-full h-14 px-6 bg-[#FDF4E6]/30 rounded-2xl border border-gray-100 font-medium" 
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Bar Color (HEX/RGB)</label>
            <div className="flex gap-2">
              <input 
                type="color" 
                value={settings.announcementBg?.startsWith('#') ? settings.announcementBg : '#6651A4'}
                onChange={(e) => updateField('announcementBg', e.target.value)}
                className="w-14 h-14 rounded-2xl cursor-pointer bg-white p-1 border border-gray-100 shrink-0" 
              />
              <input 
                type="text"
                value={settings.announcementBg || '#6651A4'}
                onChange={(e) => updateField('announcementBg', e.target.value)}
                placeholder="e.g. #FF4E50 or rgb(255, 78, 80)"
                className="flex-1 h-14 bg-gray-50 rounded-2xl px-4 font-mono text-[12px] text-gray-700 outline-none border border-transparent focus:border-[#6651A4]/30"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h4 className="text-[11px] font-bold text-[#F1641E] uppercase tracking-[0.2em] border-b pb-4">Brand Identity</h4>
        <div className="flex items-center gap-8 p-8 bg-[#FDF4E6]/30 rounded-[32px] border border-dashed border-[#F1641E]/20">
          <div className="w-24 h-24 bg-white rounded-[24px] shadow-sm flex items-center justify-center border-2 border-white overflow-hidden">
            {settings.siteLogo?.url ? (
              <img src={settings.siteLogo.url} alt="Logo" className="w-full h-full object-contain p-2" />
            ) : (
              <ImageIcon size={32} className="text-gray-300" />
            )}
          </div>
          <div>
            <p className="font-bold text-gray-800">Store Logo</p>
            <p className="text-[12px] text-gray-500 mt-1">Upload a high-res PNG with transparent background.</p>
            <label className="mt-4 h-10 px-6 inline-flex items-center justify-center bg-white text-[#6651A4] border border-[#6651A4]/20 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#6651A4] hover:text-white transition-all cursor-pointer">
              {uploading ? 'Uploading...' : 'Update Logo'}
              <input type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploading} className="hidden" />
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}



function ContactTab({ settings, setSettings, formErrors }) {
  const updateField = (field, value) => setSettings({ ...settings, [field]: value })
  const updateSocial = (key, val) => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, [key]: val } })

  return (
    <div className="space-y-12">
      <div className="space-y-6">
        <h4 className="text-[11px] font-bold text-[#F1641E] uppercase tracking-[0.2em] border-b pb-4">Public Info</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Support Email</label>
            <input 
              type="email" 
              value={settings.contactEmail}
              onChange={(e) => updateField('contactEmail', e.target.value)}
              className={`w-full h-14 px-6 bg-[#FDF4E6]/50 rounded-2xl border-2 outline-none font-bold ${formErrors?.contactEmail ? 'border-red-500 text-red-600' : 'border-transparent focus:border-[#6651A4]/30'}`} 
            />
            {formErrors?.contactEmail && <p className="text-red-500 text-xs px-2">{formErrors.contactEmail}</p>}
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Support Phone</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-500 text-[13px]">+91</span>
              <input 
                type="text" 
                value={settings.contactPhone?.replace('+91', '').trim() || ''}
                onChange={(e) => updateField('contactPhone', e.target.value ? `+91${e.target.value}` : '')}
                className={`w-full h-14 pl-12 pr-6 bg-[#FDF4E6]/50 rounded-2xl border-2 outline-none font-bold ${formErrors?.contactPhone ? 'border-red-500 text-red-600' : 'border-transparent focus:border-[#6651A4]/30'}`} 
                placeholder="10 digit number"
              />
            </div>
            {formErrors?.contactPhone && <p className="text-red-500 text-xs px-2">{formErrors.contactPhone}</p>}
          </div>
          <div className="md:col-span-2 space-y-3">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Office Address</label>
            <input 
              type="text" 
              value={settings.contactAddress}
              onChange={(e) => updateField('contactAddress', e.target.value)}
              className={`w-full h-14 px-6 bg-[#FDF4E6]/50 rounded-2xl border-2 outline-none font-bold ${formErrors?.contactAddress ? 'border-red-500 text-red-600' : 'border-transparent focus:border-[#6651A4]/30'}`} 
            />
            {formErrors?.contactAddress && <p className="text-red-500 text-xs px-2">{formErrors.contactAddress}</p>}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h4 className="text-[11px] font-bold text-[#F1641E] uppercase tracking-[0.2em] border-b pb-4">Social Ecosystem</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { id: 'instagram', label: 'Instagram', icon: <IgIcon />, color: 'hover:border-pink-500' },
            { id: 'facebook', label: 'Facebook', icon: <FbIcon />, color: 'hover:border-blue-600' },
            { id: 'twitter', label: 'Twitter (X)', icon: <XIcon />, color: 'hover:border-black' },
            { id: 'linkedin', label: 'LinkedIn', icon: <LiIcon />, color: 'hover:border-blue-700' },
          ].map((soc) => (
            <div key={soc.id} className={`flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-transparent transition-all ${soc.color}`}>
              <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-400">{soc.icon}</div>
              <input 
                type="text" 
                placeholder={`@username or URL`}
                value={settings.socialLinks?.[soc.id] || ''}
                onChange={(e) => updateSocial(soc.id, e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-[13px] font-medium"
              />
              <ExternalLink size={14} className="text-gray-300" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ProfileSettings() {
  const { user, updateUser } = useAuth()
  const { success, error } = useToast()
  const [profile, setProfile] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || ''
  })
  const [isSyncing, setIsSyncing] = useState(false)
  const [formErrors, setFormErrors] = useState({})

  const handleProfileUpdate = async () => {
    const errors = {}
    if (!profile.firstName.trim()) errors.firstName = 'First name is required'
    else if (!/^[a-zA-Z\s]+$/.test(profile.firstName)) errors.firstName = 'First name must contain only alphabets'

    if (!profile.lastName.trim()) errors.lastName = 'Last name is required'
    else if (!/^[a-zA-Z\s]+$/.test(profile.lastName)) errors.lastName = 'Last name must contain only alphabets'
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }
    setFormErrors({})

    setIsSyncing(true)
    try {
      const updated = await updateMyProfile(profile)
      updateUser(updated)
      success('Admin profile synchronized!')
    } catch (err) {
      error(err.message || 'Profile sync failed')
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="space-y-12">
       <div className="flex flex-col sm:flex-row items-center gap-8">
          <div className="w-32 h-32 bg-[#FAEAD3] rounded-[40px] flex items-center justify-center text-[#6651A4] relative shadow-xl overflow-hidden">
             <User size={64} className="opacity-20" />
             <span className="text-4xl font-grandstander font-bold absolute">
               {profile.firstName?.[0]}{profile.lastName?.[0]}
             </span>
          </div>
          <div>
             <h3 className="text-2xl font-grandstander font-bold text-gray-800">Admin Identity</h3>
             <p className="text-sm text-gray-500 font-medium mt-1">
               {user?.role === 'super_admin' ? 'Super Admin' : 'Admin'} • Privilege Level: 10
             </p>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
             <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">First Name</label>
             <input 
               type="text" 
               value={profile.firstName}
               onChange={(e) => setProfile({...profile, firstName: e.target.value})}
               className={`w-full h-14 px-6 bg-gray-50 rounded-2xl outline-none border-2 font-bold ${formErrors.firstName ? 'border-red-500 text-red-600' : 'border-transparent focus:border-[#6651A4]/20'}`} 
             />
             {formErrors.firstName && <p className="text-red-500 text-xs px-2">{formErrors.firstName}</p>}
          </div>
          <div className="space-y-3">
             <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Last Name</label>
             <input 
               type="text" 
               value={profile.lastName}
               onChange={(e) => setProfile({...profile, lastName: e.target.value})}
               className={`w-full h-14 px-6 bg-gray-50 rounded-2xl outline-none border-2 font-bold ${formErrors.lastName ? 'border-red-500 text-red-600' : 'border-transparent focus:border-[#6651A4]/20'}`} 
             />
             {formErrors.lastName && <p className="text-red-500 text-xs px-2">{formErrors.lastName}</p>}
          </div>
          <div className="md:col-span-2 space-y-3">
             <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">System Email</label>
             <div className="relative">
                <Mail size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="email" 
                  value={profile.email}
                  onChange={(e) => setProfile({...profile, email: e.target.value})}
                  className="w-full h-14 pl-14 pr-6 bg-gray-50 rounded-2xl outline-none border border-transparent focus:border-[#6651A4]/20 font-bold" 
                />
             </div>
          </div>
       </div>

       <div className="pt-8 border-t border-black/[0.03] flex justify-end">
          <button 
            onClick={handleProfileUpdate}
            disabled={isSyncing}
            className="h-14 px-12 bg-[#6651A4] text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
          >
            {isSyncing ? <RefreshCcw size={18} className="animate-spin" /> : <Save size={18} />}
            {isSyncing ? 'Syncing...' : 'Commit Profile'}
          </button>
       </div>
    </div>
  )
}

function SecuritySettings() {
  const { user } = useAuth()
  const { success, error } = useToast()
  const [loading, setLoading] = useState(false)

  const handleResetPassword = async () => {
    setLoading(true)
    try {
      // Admin is already logged in, so we send the OTP to their email
      const res = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to send OTP')
      success('Password reset OTP sent to your email.')
    } catch (err) {
      error(err.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 text-center py-10">
       <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-red-500/10 mb-6">
          <Lock size={32} />
       </div>
       <h3 className="text-2xl font-grandstander font-bold text-gray-800">Admin Credentials</h3>
       <p className="text-gray-500 max-w-sm mx-auto text-sm">Regularly rotate your password to protect the admin command center.</p>
       <button 
         onClick={handleResetPassword}
         disabled={loading}
         className="h-14 px-12 bg-white text-red-500 border-2 border-red-100 rounded-2xl font-bold uppercase tracking-widest text-[11px] hover:bg-red-500 hover:text-white transition-all shadow-lg mt-4 disabled:opacity-50"
       >
          {loading ? 'Sending OTP...' : 'Reset Password'}
       </button>
    </div>
  )
}
