import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { 
  User, Shield, Bell, Palette, Globe, 
  Save, RefreshCcw, Camera, Mail, Lock,
  Truck, IndianRupee, MessageSquare, Image as ImageIcon,
  ExternalLink, Power, Zap, Eye, EyeOff
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getAdminStorefrontSettings, updateAdminStorefrontSettings } from '../../services/siteApi'
import { updateMyProfile } from '../../services/userProfileApi'
import { apiRequest } from '../../services/api'

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
const YtIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
)

export function AdminSettings() {
  const { user, updateUser } = useAuth()
  const { tab } = useParams()
  const navigate = useNavigate()
  const activeSection = tab || 'storefront'

  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [settingsMessage, setSettingsMessage] = useState(null)

  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    setLoadError('')
    try {
      const data = await getAdminStorefrontSettings()
      setSettings(data)
    } catch (err) {
      setLoadError(err.message || 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (updatedData) => {
    setSettingsMessage(null)
    const errors = {}
    
    // Storefront validation
    if (!updatedData.siteName || !updatedData.siteName.trim()) {
      errors.siteName = 'Store name is required'
    }

    // Communications validation
    if (!updatedData.contactPhone || !updatedData.contactPhone.trim()) {
       errors.contactPhone = 'Support Phone is required'
    } else {
       const digits = updatedData.contactPhone.replace(/\D/g, '')
       const digits10 = digits.slice(-10)
       if (digits10.length !== 10 || !/^[6-9]/.test(digits10)) {
         errors.contactPhone = 'Phone must be a valid 10-digit number starting with 6-9'
       }
    }
    
    if (!updatedData.contactAddress || !updatedData.contactAddress.trim()) {
      errors.contactAddress = 'Office address is required'
    }

    if (!updatedData.contactEmail || !updatedData.contactEmail.trim()) {
      errors.contactEmail = 'Support Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updatedData.contactEmail)) {
      errors.contactEmail = 'Please enter a valid email address'
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      if (errors.siteName) {
        navigate('/admin/settings/storefront')
      } else {
        navigate('/admin/settings/communications')
      }
      return
    }
    
    setFormErrors({})
    setSaving(true)
    try {
      const data = await updateAdminStorefrontSettings(updatedData)
      setSettings(data)
      setSettingsMessage({ type: 'success', text: 'Settings synchronized successfully!' })
      
      // Synchronize Admin Profile Phone if it has changed
      if (updatedData.contactPhone && user && user.phone !== updatedData.contactPhone) {
        try {
          const updatedProfile = await updateMyProfile({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: updatedData.contactPhone
          })
          updateUser(updatedProfile)
        } catch (profileErr) {
          console.error('Failed to sync profile phone:', profileErr)
        }
      }
    } catch (err) {
      setSettingsMessage({ type: 'error', text: err.message || 'Update failed' })
    } finally {
      setSaving(false)
    }
  }

  const sections = [
    { id: 'storefront', label: 'Storefront', icon: <Globe size={18} /> },
    { id: 'communications', label: 'Communications', icon: <MessageSquare size={18} /> },
    { id: 'profile', label: 'Admin Identity', icon: <User size={18} /> },
    { id: 'security', label: 'Security', icon: <Shield size={18} /> },
  ]

  if (loadError) {
    return (
      <div className="shell flex flex-col items-center justify-center h-[60vh] gap-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl text-center text-xs font-bold font-grandstander shadow-sm">
          {loadError}
        </div>
        <button 
          onClick={loadSettings} 
          className="h-12 px-6 bg-[#6651A4] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#523e8a] transition-all"
        >
          Retry
        </button>
      </div>
    )
  }

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
          {settings?.maintenanceMode ? (
            <span className="px-4 py-2 bg-amber-50 text-amber-600 rounded-2xl text-[10px] font-bold uppercase tracking-widest border border-amber-100 flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              Maintenance Mode
            </span>
          ) : (
            <span className="px-4 py-2 bg-green-50 text-green-600 rounded-2xl text-[10px] font-bold uppercase tracking-widest border border-green-100 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              System Live
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-72 flex flex-col gap-2">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => navigate(`/admin/settings/${section.id}`)}
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
            {activeSection === 'storefront' && (
              <StorefrontTab 
                settings={settings} 
                setSettings={setSettings} 
                handleUpdate={handleUpdate} 
                saving={saving} 
                formErrors={formErrors} 
                setFormErrors={setFormErrors}
                settingsMessage={settingsMessage}
                setSettingsMessage={setSettingsMessage}
              />
            )}
            {activeSection === 'communications' && (
              <ContactTab 
                settings={settings} 
                setSettings={setSettings} 
                formErrors={formErrors} 
                setFormErrors={setFormErrors}
                handleUpdate={handleUpdate} 
                saving={saving} 
                settingsMessage={settingsMessage}
                setSettingsMessage={setSettingsMessage}
              />
            )}
            {activeSection === 'profile' && <ProfileSettings />}
            {activeSection === 'security' && <SecuritySettings />}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

function StorefrontTab({ settings, setSettings, handleUpdate, saving, formErrors, setFormErrors, settingsMessage, setSettingsMessage }) {
  const [uploading, setUploading] = useState(false)
  const updateField = (field, value) => {
    setSettings({ ...settings, [field]: value })
    if (setSettingsMessage) setSettingsMessage(null)
    if (setFormErrors) {
      setFormErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

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
            className={`w-full h-14 px-6 bg-[#FDF4E6]/50 rounded-2xl border-2 outline-none font-bold transition-all ${
              formErrors?.siteName ? 'border-red-500 text-red-600' : 'border-transparent focus:border-[#6651A4]/30'
            }`} 
          />
          {formErrors?.siteName && <p className="text-red-500 text-xs px-2">{formErrors.siteName}</p>}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="md:col-span-1 lg:col-span-2 space-y-3">
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
          <div className="space-y-3 min-w-0">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Bar Color (HEX/RGB)</label>
            <div className="flex gap-2 min-w-0">
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
                className="flex-1 min-w-0 h-14 bg-gray-50 rounded-2xl px-4 font-mono text-[12px] text-gray-700 outline-none border border-transparent focus:border-[#6651A4]/30"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h4 className="text-[11px] font-bold text-[#F1641E] uppercase tracking-[0.2em] border-b pb-4">Financial & Shipping</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Free Shipping Threshold (₹)</label>
            <input 
              type="number" 
              min="0"
              value={settings.freeShippingThreshold !== undefined ? settings.freeShippingThreshold : ''}
              onChange={(e) => {
                const val = e.target.value === '' ? '' : Math.max(0, Number(e.target.value));
                updateField('freeShippingThreshold', val)
              }}
              onKeyDown={(e) => {
                if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                  e.preventDefault();
                }
              }}
              className="w-full h-14 px-6 bg-[#FDF4E6]/30 rounded-2xl border border-gray-100 font-medium" 
            />
            <p className="text-[11px] text-gray-400 font-medium px-2 leading-relaxed">
              If the order subtotal is greater than or equal to this limit, the Standard shipping method charge becomes ₹0 (Free).
            </p>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Default Shipping Fee (₹)</label>
            <input 
              type="number" 
              min="0"
              value={settings.defaultShippingFee !== undefined ? settings.defaultShippingFee : ''}
              onChange={(e) => {
                const val = e.target.value === '' ? '' : Math.max(0, Number(e.target.value));
                updateField('defaultShippingFee', val)
              }}
              onKeyDown={(e) => {
                if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                  e.preventDefault();
                }
              }}
              className="w-full h-14 px-6 bg-[#FDF4E6]/30 rounded-2xl border border-gray-100 font-medium" 
            />
            <p className="text-[11px] text-gray-400 font-medium px-2 leading-relaxed">
              Fallback fee applied only if no active shipping methods are found in the database.
            </p>
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

      {settingsMessage?.text && (
        <div className={`px-6 py-4 rounded-2xl text-xs font-bold font-grandstander shadow-sm text-center ${
          settingsMessage.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {settingsMessage.text}
        </div>
      )}

      <div className="pt-8 border-t border-black/[0.03] flex justify-end">
        <button 
          onClick={() => handleUpdate(settings)}
          disabled={saving}
          className="h-14 px-12 bg-[#6651A4] text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
        >
          {saving ? <RefreshCcw size={18} className="animate-spin" /> : <Save size={18} />}
          {saving ? 'Syncing...' : 'Save Storefront'}
        </button>
      </div>
    </div>
  )
}



function ContactTab({ settings, setSettings, formErrors, setFormErrors, handleUpdate, saving, settingsMessage, setSettingsMessage }) {
  const updateField = (field, value) => {
    setSettings({ ...settings, [field]: value })
    if (setSettingsMessage) setSettingsMessage(null)
    if (setFormErrors) {
      setFormErrors(prev => ({ ...prev, [field]: '' }))
    }
  }
  const updateSocial = (key, val) => {
    setSettings({ ...settings, socialLinks: { ...settings.socialLinks, [key]: val } })
    if (setSettingsMessage) setSettingsMessage(null)
  }

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
                onChange={(e) => {
                  const clean = e.target.value.replace(/\D/g, '').slice(0, 10)
                  updateField('contactPhone', clean ? `+91${clean}` : '')
                }}
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
            { id: 'youtube', label: 'YouTube', icon: <YtIcon />, color: 'hover:border-red-600' },
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

      {settingsMessage?.text && (
        <div className={`px-6 py-4 rounded-2xl text-xs font-bold font-grandstander shadow-sm text-center ${
          settingsMessage.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {settingsMessage.text}
        </div>
      )}

      <div className="pt-8 border-t border-black/[0.03] flex justify-end">
        <button 
          onClick={() => handleUpdate(settings)}
          disabled={saving}
          className="h-14 px-12 bg-[#6651A4] text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
        >
          {saving ? <RefreshCcw size={18} className="animate-spin" /> : <Save size={18} />}
          {saving ? 'Syncing...' : 'Save Communications'}
        </button>
      </div>
    </div>
  )
}

function ProfileSettings() {
  const { user, updateUser } = useAuth()
  const [profile, setProfile] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || ''
  })
  const [isSyncing, setIsSyncing] = useState(false)
  const [formErrors, setFormErrors] = useState({})
  const [profileMessage, setProfileMessage] = useState(null)

  const updateProfileField = (field, val) => {
    setProfile(prev => ({ ...prev, [field]: val }))
    if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: '' }))
    setProfileMessage(null)
  }

  const handleProfileUpdate = async () => {
    setProfileMessage(null)
    const errors = {}
    if (!profile.firstName.trim()) errors.firstName = 'First name is required'
    else if (!/^[a-zA-Z\s]+$/.test(profile.firstName)) errors.firstName = 'First name must contain only alphabets'

    if (!profile.lastName.trim()) errors.lastName = 'Last name is required'
    else if (!/^[a-zA-Z\s]+$/.test(profile.lastName)) errors.lastName = 'Last name must contain only alphabets'
    
    if (profile.phone && !/^\+91[6-9][0-9]{9}$/.test(profile.phone)) {
      errors.phone = 'Please enter a valid 10-digit mobile number'
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }
    setFormErrors({})

    setIsSyncing(true)
    try {
      const updated = await updateMyProfile(profile)
      updateUser(updated)
      setProfileMessage({ type: 'success', text: 'Admin profile synchronized successfully!' })

      // Synchronize storefront contactPhone if changed
      if (profile.phone) {
        try {
          const currentSettings = await getAdminStorefrontSettings()
          if (currentSettings.contactPhone !== profile.phone) {
            await updateAdminStorefrontSettings({
              ...currentSettings,
              contactPhone: profile.phone
            })
          }
        } catch (settingsErr) {
          console.error('Failed to sync settings phone:', settingsErr)
        }
      }
    } catch (err) {
      const msg = err.message || 'Profile sync failed'
      const lower = msg.toLowerCase()
      if (lower.includes('phone') || lower.includes('mobile')) {
        setFormErrors({ phone: msg })
      } else if (lower.includes('first name') || lower.includes('firstname')) {
        setFormErrors({ firstName: msg })
      } else if (lower.includes('last name') || lower.includes('lastname')) {
        setFormErrors({ lastName: msg })
      } else {
        setProfileMessage({ type: 'error', text: msg })
      }
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
               onChange={(e) => {
                 const clean = e.target.value.replace(/[^a-zA-Z\s]/g, '')
                 updateProfileField('firstName', clean)
               }}
               className={`w-full h-14 px-6 bg-gray-50 rounded-2xl outline-none border-2 font-bold ${formErrors.firstName ? 'border-red-500 text-red-600' : 'border-transparent focus:border-[#6651A4]/20'}`} 
             />
             {formErrors.firstName && <p className="text-red-500 text-xs px-2">{formErrors.firstName}</p>}
          </div>
          <div className="space-y-3">
             <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Last Name</label>
             <input 
               type="text" 
               value={profile.lastName}
               onChange={(e) => {
                 const clean = e.target.value.replace(/[^a-zA-Z\s]/g, '')
                 updateProfileField('lastName', clean)
               }}
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
                  disabled
                  className="w-full h-14 pl-14 pr-6 bg-gray-100 rounded-2xl outline-none border border-transparent font-bold cursor-not-allowed text-gray-500" 
                />
             </div>
          </div>
          <div className="md:col-span-2 space-y-3">
             <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Mobile Number</label>
             <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500 pointer-events-none">+91</span>
                <input 
                  type="tel" 
                  value={profile.phone?.replace(/^\+91/, '') || ''}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '').slice(0, 10)
                    updateProfileField('phone', clean ? '+91' + clean : '')
                  }}
                  placeholder="Enter 10-digit mobile number"
                  className={`w-full h-14 pl-14 pr-6 bg-gray-50 rounded-2xl outline-none border-2 font-bold ${formErrors.phone ? 'border-red-500 text-red-600' : 'border-transparent focus:border-[#6651A4]/20'}`} 
                />
             </div>
             {formErrors.phone && <p className="text-red-500 text-xs px-2">{formErrors.phone}</p>}
          </div>
       </div>

       {profileMessage?.text && (
         <div className={`px-6 py-4 rounded-2xl text-xs font-bold font-grandstander shadow-sm text-center ${
           profileMessage.type === 'success' 
             ? 'bg-green-50 border border-green-200 text-green-700' 
             : 'bg-red-50 border border-red-200 text-red-700'
         }`}>
           {profileMessage.text}
         </div>
       )}

       <div className="pt-8 border-t border-black/[0.03] flex justify-end">
          <button 
            onClick={handleProfileUpdate}
            disabled={isSyncing}
            className="h-14 px-12 bg-[#6651A4] text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
          >
            {isSyncing ? <RefreshCcw size={18} className="animate-spin" /> : <Save size={18} />}
            {isSyncing ? 'Syncing...' : 'Save Profile'}
          </button>
       </div>
    </div>
  )
}

function SecuritySettings() {
  const [loading, setLoading] = useState(false)
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [formErrors, setFormErrors] = useState({})
  const [successMessage, setSuccessMessage] = useState('')
  const [showPass, setShowPass] = useState({
    current: false,
    new: false,
    confirm: false
  })

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setSuccessMessage('')
    const errors = {}
    if (!passwords.currentPassword) errors.currentPassword = 'Current password is required'
    if (!passwords.newPassword) errors.newPassword = 'New password is required'
    else if (passwords.newPassword.length < 8) errors.newPassword = 'Password must be at least 8 characters long'
    
    if (passwords.newPassword !== passwords.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }
    setFormErrors({})
    setLoading(true)

    try {
      await apiRequest('/users/me/password', {
        method: 'PATCH',
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword
        })
      })
      setSuccessMessage('Password changed successfully!')
      setPasswords({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (err) {
      const msg = err.message || 'Failed to change password'
      const lower = msg.toLowerCase()
      if (lower.includes('current password') || lower.includes('current_password') || lower.includes('wrong')) {
        setFormErrors({ currentPassword: msg })
      } else if (lower.includes('new password') || lower.includes('new_password') || lower.includes('same as')) {
        setFormErrors({ newPassword: msg })
      } else {
        setFormErrors({ currentPassword: msg })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handlePasswordChange} className="space-y-8 max-w-xl mx-auto py-6">
       <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-red-500/10 mb-6">
          <Lock size={32} />
       </div>
       <div className="text-center">
         <h3 className="text-2xl font-grandstander font-bold text-gray-800">Admin Credentials</h3>
         <p className="text-gray-500 text-sm mt-1">Regularly rotate your password to protect the admin command center.</p>
       </div>

       {successMessage && (
         <div className="bg-green-50 border border-green-200 text-green-700 px-5 py-4 rounded-2xl text-center text-xs font-bold font-grandstander shadow-sm">
           {successMessage}
         </div>
       )}

       <div className="space-y-5">
         <div className="space-y-2 text-left">
           <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Current Password</label>
           <div className="relative">
             <input 
               type={showPass.current ? "text" : "password"}
               value={passwords.currentPassword}
               onChange={(e) => {
                 setPasswords({...passwords, currentPassword: e.target.value})
                 if (formErrors.currentPassword) setFormErrors({...formErrors, currentPassword: ''})
                 if (successMessage) setSuccessMessage('')
               }}
               className={`w-full h-14 pl-6 pr-12 bg-gray-50 rounded-2xl outline-none border-2 font-bold focus:bg-white transition-all ${formErrors.currentPassword ? 'border-red-500 text-red-600' : 'border-transparent focus:border-[#6651A4]/20'}`} 
               placeholder="••••••••"
             />
             <button
               type="button"
               onClick={() => setShowPass({ ...showPass, current: !showPass.current })}
               className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#6651A4] transition-colors"
             >
               {showPass.current ? <EyeOff size={18} /> : <Eye size={18} />}
             </button>
           </div>
           {formErrors.currentPassword && <p className="text-red-500 text-xs px-2">{formErrors.currentPassword}</p>}
         </div>

         <div className="space-y-2 text-left">
           <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">New Password</label>
           <div className="relative">
             <input 
               type={showPass.new ? "text" : "password"}
               value={passwords.newPassword}
               onChange={(e) => {
                 setPasswords({...passwords, newPassword: e.target.value})
                 if (formErrors.newPassword) setFormErrors({...formErrors, newPassword: ''})
                 if (successMessage) setSuccessMessage('')
               }}
               className={`w-full h-14 pl-6 pr-12 bg-gray-50 rounded-2xl outline-none border-2 font-bold focus:bg-white transition-all ${formErrors.newPassword ? 'border-red-500 text-red-600' : 'border-transparent focus:border-[#6651A4]/20'}`} 
               placeholder="•••••••• (Min 8 chars)"
             />
             <button
               type="button"
               onClick={() => setShowPass({ ...showPass, new: !showPass.new })}
               className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#6651A4] transition-colors"
             >
               {showPass.new ? <EyeOff size={18} /> : <Eye size={18} />}
             </button>
           </div>
           {formErrors.newPassword && <p className="text-red-500 text-xs px-2">{formErrors.newPassword}</p>}
         </div>

         <div className="space-y-2 text-left">
           <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Confirm New Password</label>
           <div className="relative">
             <input 
               type={showPass.confirm ? "text" : "password"}
               value={passwords.confirmPassword}
               onChange={(e) => {
                 setPasswords({...passwords, confirmPassword: e.target.value})
                 if (formErrors.confirmPassword) setFormErrors({...formErrors, confirmPassword: ''})
                 if (successMessage) setSuccessMessage('')
               }}
               className={`w-full h-14 pl-6 pr-12 bg-gray-50 rounded-2xl outline-none border-2 font-bold focus:bg-white transition-all ${formErrors.confirmPassword ? 'border-red-500 text-red-600' : 'border-transparent focus:border-[#6651A4]/20'}`} 
               placeholder="••••••••"
             />
             <button
               type="button"
               onClick={() => setShowPass({ ...showPass, confirm: !showPass.confirm })}
               className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#6651A4] transition-colors"
             >
               {showPass.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
             </button>
           </div>
           {formErrors.confirmPassword && <p className="text-red-500 text-xs px-2">{formErrors.confirmPassword}</p>}
         </div>
       </div>

       <div className="pt-6 border-t border-black/[0.03] flex justify-end">
         <button 
           type="submit"
           disabled={loading}
           className="h-14 px-12 bg-[#6651A4] text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
         >
           {loading ? <RefreshCcw size={18} className="animate-spin" /> : <Save size={18} />}
           {loading ? 'Updating...' : 'Update Password'}
         </button>
       </div>
    </form>
  )
}
