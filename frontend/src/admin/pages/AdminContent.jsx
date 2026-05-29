import { useEffect, useRef, useState } from 'react'
import { GripVertical, Image, Link as LinkIcon, Megaphone, Save, Star, Trash2, Upload, X, Eye, EyeOff } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { getAdminStorefrontSettings, updateAdminStorefrontSettings } from '../../services/siteApi'
import { uploadAdminMedia } from '../../services/adminCatalogApi'

const emptyMessages = ['', '', '']

export function AdminContent() {
  const { success, error: showError } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [messages, setMessages] = useState(emptyMessages)
  const [maintenanceMode, setMaintenanceMode] = useState(false)

  // Hero slider state
  const [heroBanners, setHeroBanners] = useState([])
  const [showDefaultHero, setShowDefaultHero] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [urlAlt, setUrlAlt] = useState('')
  const [urlError, setUrlError] = useState('')
  const [savingMedia, setSavingMedia] = useState(false)

  // Drag-and-drop state
  const dragIndex = useRef(null)
  const dragOverIndex = useRef(null)

  const fileInputRef = useRef(null)

  useEffect(() => {
    let isMounted = true
    const load = async () => {
      try {
        const data = await getAdminStorefrontSettings()
        if (!isMounted) return
        setMessages([...(data.announcementMessages || []), '', '', ''].slice(0, 3))
        const media = data.storefrontMedia || {}
        setHeroBanners(media.heroBanners || [])
        setShowDefaultHero(media.showDefaultHero !== false) // default true
        setMaintenanceMode(Boolean(data.maintenanceMode))
      } catch (err) {
        if (isMounted) showError(err.message || 'Failed to load storefront settings')
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    load()
    return () => { isMounted = false }
  }, [showError])

  const handleSaveMessages = async () => {
    const announcementMessages = messages.map((m) => m.trim()).filter(Boolean)
    if (announcementMessages.length === 0) {
      showError('At least one announcement message is required.')
      return
    }
    setSaving(true)
    try {
      const data = await updateAdminStorefrontSettings({ announcementMessages })
      setMessages([...(data.announcementMessages || []), '', '', ''].slice(0, 3))
      success('Announcement messages saved.')
    } catch (err) {
      showError(err.message || 'Failed to save messages')
    } finally {
      setSaving(false)
    }
  }

  /* ── Toggle Maintenance Mode ──────────────────────────────────── */
  const handleToggleMaintenance = async () => {
    const next = !maintenanceMode
    setMaintenanceMode(next)
    try {
      await updateAdminStorefrontSettings({ maintenanceMode: next })
      success(next ? 'Store is now in Maintenance Mode (Closed).' : 'Store is now Live (Open).')
    } catch (err) {
      showError(err.message || 'Failed to update maintenance mode')
      setMaintenanceMode(!next)
    }
  }

  /* ── Persist hero banners + showDefaultHero to DB ──────────── */
  const persistMedia = async (banners, defaultHero) => {
    setSavingMedia(true)
    try {
      await updateAdminStorefrontSettings({
        storefrontMedia: { heroBanners: banners, showDefaultHero: defaultHero },
      })
    } catch (err) {
      showError(err.message || 'Failed to save slider settings')
      throw err
    } finally {
      setSavingMedia(false)
    }
  }

  /* ── Upload files ────────────────────────────────────────────── */
  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const uploads = await Promise.all(
        Array.from(files).map((file) => uploadAdminMedia(file, 'storefront'))
      )
      const newBanners = uploads.map((u) => ({
        url: u.url,
        publicId: u.publicId || '',
        alt: u.originalFilename || 'Hero banner',
      }))
      const updated = [...heroBanners, ...newBanners]
      setHeroBanners(updated)
      await persistMedia(updated, showDefaultHero)
      success(`${uploads.length} image${uploads.length > 1 ? 's' : ''} added.`)
    } catch (err) {
      showError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  /* ── Add by URL ──────────────────────────────────────────────── */
  const handleAddUrl = async () => {
    const trimUrl = urlInput.trim()
    if (!trimUrl) { setUrlError('Please enter a valid image URL.'); return }
    if (!/^https?:\/\/.+/.test(trimUrl)) { setUrlError('URL must start with http:// or https://'); return }
    setUrlError('')
    const newBanner = { url: trimUrl, publicId: '', alt: urlAlt.trim() || 'Hero banner' }
    const updated = [...heroBanners, newBanner]
    setHeroBanners(updated)
    setUrlInput('')
    setUrlAlt('')
    try {
      await persistMedia(updated, showDefaultHero)
      success('Banner URL added.')
    } catch {/* already shown */ }
  }

  /* ── Delete a banner ─────────────────────────────────────────── */
  const handleDelete = async (index) => {
    const updated = heroBanners.filter((_, i) => i !== index)
    setHeroBanners(updated)
    try {
      await persistMedia(updated, showDefaultHero)
      success('Banner removed.')
    } catch {
      // rollback
      setHeroBanners((prev) => {
        const rb = [...prev]
        rb.splice(index, 0, heroBanners[index])
        return rb
      })
    }
  }

  /* ── Toggle showDefaultHero ──────────────────────────────────── */
  const handleToggleDefault = async () => {
    const next = !showDefaultHero
    setShowDefaultHero(next)
    try {
      await persistMedia(heroBanners, next)
      success(next ? 'Default hero is now visible.' : 'Default hero is now hidden.')
    } catch {
      setShowDefaultHero(!next) // rollback
    }
  }

  /* ── Drag-and-drop reorder ───────────────────────────────────── */
  const handleDragStart = (index) => { dragIndex.current = index }
  const handleDragOver = (e, index) => {
    e.preventDefault()
    dragOverIndex.current = index
  }
  const handleDrop = async () => {
    const from = dragIndex.current
    const to = dragOverIndex.current
    if (from === null || to === null || from === to) { dragIndex.current = null; dragOverIndex.current = null; return }
    const reordered = [...heroBanners]
    const [moved] = reordered.splice(from, 1)
    reordered.splice(to, 0, moved)
    setHeroBanners(reordered)
    dragIndex.current = null
    dragOverIndex.current = null
    try {
      await persistMedia(reordered, showDefaultHero)
      success('Slide order saved.')
    } catch {/* already shown */ }
  }

  return (
    <div className="shell space-y-6 pb-10">
      <div>
        <h1 className="text-2xl md:text-4xl font-grandstander font-bold text-gray-800">Storefront</h1>
        <p className="text-gray-500 font-medium text-[12px] md:text-sm mt-1">Manage announcement bar and homepage hero slider.</p>
      </div>

      {/* ── Maintenance Mode ── */}
      <div className="bg-white rounded-[32px] p-6 md:p-8 border border-black/[0.03] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h2 className="text-xl font-grandstander font-bold text-gray-800">Maintenance Mode</h2>
          <p className="text-[12px] text-gray-400 font-medium mt-1">Close the store temporarily. Customers will see a maintenance screen.</p>
        </div>
        <button
          onClick={handleToggleMaintenance}
          disabled={loading}
          className={`shrink-0 flex items-center justify-between h-12 w-full md:w-64 px-5 rounded-2xl font-bold uppercase tracking-widest text-[11px] transition-all disabled:opacity-60 border-2 ${
            maintenanceMode 
              ? 'border-red-100 bg-red-50 text-red-600 hover:bg-red-100' 
              : 'border-green-100 bg-green-50 text-green-600 hover:bg-green-100'
          }`}
        >
          {maintenanceMode ? 'Enabled (Store Closed)' : 'Disabled (Store Open)'}
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </button>
      </div>

      {/* ── Announcement Bar ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-[32px] p-6 md:p-8 border border-black/[0.03] shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-grandstander font-bold text-gray-800">Announcement Bar</h2>
              <p className="text-[12px] text-gray-400 font-medium mt-1">These messages rotate in the top header.</p>
            </div>
            <Megaphone className="text-[#F1641E] shrink-0" />
          </div>
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <input
                key={idx}
                value={msg}
                onChange={(e) => setMessages((prev) => prev.map((m, i) => i === idx ? e.target.value : m))}
                disabled={loading}
                placeholder={`Announcement ${idx + 1}`}
                className="w-full h-13 px-5 bg-[#FDF4E6]/60 rounded-2xl border border-transparent focus:border-[#F1641E]/30 outline-none text-[13px] font-bold text-gray-700 disabled:opacity-60"
              />
            ))}
          </div>
          <button
            onClick={handleSaveMessages}
            disabled={loading || saving}
            className="mt-6 h-12 px-8 bg-[#6651A4] text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] shadow-lg flex items-center gap-3 disabled:opacity-60 hover:bg-[#5a4892] transition-colors"
          >
            <Save size={16} /> {saving ? 'Saving...' : 'Save Messages'}
          </button>
        </div>

        <div className="bg-[#6651A4] rounded-[32px] p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/10 rounded-full" />
          <Star size={28} className="text-[#F1641E] mb-8" />
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/50">Featured Rules</p>
          <h3 className="text-3xl font-grandstander font-bold mt-2">Homepage Slots</h3>
          <p className="text-sm text-white/70 mt-3 leading-relaxed">Announcements persist in the database. Hero images power the homepage slider in real-time.</p>
        </div>
      </div>

      {/* ── Hero Banner Slider Manager ── */}
      <div className="bg-white rounded-[32px] p-6 md:p-8 border border-black/[0.03] shadow-sm space-y-6">

        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-grandstander font-bold text-gray-800">Hero Banner Slider</h2>
            <p className="text-[12px] text-gray-400 font-medium mt-1">
              Upload or paste a URL. Drag <GripVertical size={12} className="inline text-gray-400" /> to reorder slides.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {savingMedia && <span className="text-[10px] font-bold text-[#6651A4] uppercase tracking-widest animate-pulse">Saving…</span>}
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full">
              {heroBanners.length} slide{heroBanners.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Default hero toggle */}
        <div className="flex items-center justify-between p-4 bg-[#FDF4E6] rounded-2xl border border-orange-100">
          <div>
            <p className="text-[13px] font-bold text-gray-700">Show Default Hero Design</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Display the original decorative hero (stars, clouds, toy image) on the homepage.</p>
          </div>
          <button
            onClick={handleToggleDefault}
            className={`flex items-center gap-2 h-10 px-4 rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all ${showDefaultHero ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}
          >
            {showDefaultHero ? <><Eye size={14} /> Visible</> : <><EyeOff size={14} /> Hidden</>}
          </button>
        </div>

        {/* Add image row: Upload + URL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Upload */}
          <div className="flex flex-col gap-3 p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <div className="flex items-center gap-2">
              <Upload size={16} className="text-[#F1641E]" />
              <span className="text-[12px] font-bold text-gray-600 uppercase tracking-widest">Upload Image</span>
            </div>
            <label className={`h-11 flex items-center justify-center gap-2 bg-[#F1641E] text-white rounded-xl font-bold uppercase tracking-widest text-[10px] cursor-pointer hover:bg-[#d94f12] transition-colors ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
              <Upload size={14} /> {uploading ? 'Uploading…' : 'Choose Files'}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
                disabled={uploading}
              />
            </label>
            <p className="text-[10px] text-gray-400">JPG, PNG, WebP — multiple allowed</p>
          </div>

          {/* URL */}
          <div className="flex flex-col gap-3 p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <div className="flex items-center gap-2">
              <LinkIcon size={16} className="text-[#6651A4]" />
              <span className="text-[12px] font-bold text-gray-600 uppercase tracking-widest">Add by URL</span>
            </div>
            <input
              value={urlInput}
              onChange={(e) => { setUrlInput(e.target.value); setUrlError('') }}
              placeholder="https://example.com/banner.jpg"
              className={`w-full h-10 px-4 bg-white rounded-xl border text-[12px] font-medium outline-none transition-all ${urlError ? 'border-red-400' : 'border-gray-200 focus:border-[#6651A4]/40'}`}
            />
            {urlError && <p className="text-red-500 text-[11px] font-semibold -mt-1">{urlError}</p>}
            <input
              value={urlAlt}
              onChange={(e) => setUrlAlt(e.target.value)}
              placeholder="Alt text (optional)"
              className="w-full h-10 px-4 bg-white rounded-xl border border-gray-200 focus:border-[#6651A4]/40 text-[12px] font-medium outline-none transition-all"
            />
            <button
              onClick={handleAddUrl}
              className="h-11 bg-[#6651A4] text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-[#5a4892] transition-colors"
            >
              Add URL
            </button>
          </div>
        </div>

        {/* Banner grid */}
        {heroBanners.length === 0 ? (
          <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
            <Image size={40} className="text-gray-300 mx-auto mb-4" />
            <p className="text-[13px] font-bold text-gray-400">No hero images yet</p>
            <p className="text-[11px] text-gray-300 mt-1">Upload images or add a URL above to start the slider</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {heroBanners.map((img, idx) => (
              <div
                key={`${img.url}-${idx}`}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={handleDrop}
                className="relative aspect-video rounded-2xl overflow-hidden border border-black/[0.05] bg-gray-50 cursor-grab active:cursor-grabbing group"
              >
                <img src={img.url} alt={img.alt || `Slide ${idx + 1}`} className="w-full h-full object-cover" />

                {/* Drag handle */}
                <div className="absolute top-2 left-2 w-6 h-6 bg-black/50 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <GripVertical size={12} className="text-white" />
                </div>

                {/* Slide number */}
                <div className="absolute top-2 left-10 h-6 px-2 bg-black/50 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <span className="text-white text-[9px] font-bold">{idx + 1}</span>
                </div>

                {/* Delete button — always visible */}
                <button
                  onClick={() => handleDelete(idx)}
                  className="absolute top-2 right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center transition-colors shadow-md z-10"
                  title="Remove slide"
                >
                  <X size={12} strokeWidth={3} />
                </button>

                {/* Bottom alt text */}
                {img.alt && img.alt !== 'Hero banner' && (
                  <div className="absolute bottom-0 inset-x-0 bg-black/50 px-2 py-1">
                    <p className="text-white text-[9px] font-medium truncate">{img.alt}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {heroBanners.length > 0 && (
          <p className="text-[11px] text-gray-400 font-medium flex items-center gap-2">
            <GripVertical size={12} className="text-gray-300" />
            Drag slides to reorder. Changes save automatically.
          </p>
        )}
      </div>
    </div>
  )
}
