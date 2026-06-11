import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileText, Save, ChevronRight, 
  ShieldCheck, Truck, RotateCcw, Gavel, 
  Clock, AlertCircle, Search, Edit3,
  Info, HelpCircle
} from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { getAdminPages, updateAdminPage } from '../../services/pageApi'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'

const PAGE_METADATA = {
  'privacy-policy': { icon: ShieldCheck, color: 'text-blue-500', bg: 'bg-blue-50' },
  'terms-conditions': { icon: Gavel, color: 'text-purple-500', bg: 'bg-purple-50' },
  'shipping-policy': { icon: Truck, color: 'text-orange-500', bg: 'bg-orange-50' },
  'return-policy': { icon: RotateCcw, color: 'text-red-500', bg: 'bg-red-50' },
  'about-us': { icon: Info, color: 'text-green-500', bg: 'bg-green-50' },
  'faq': { icon: HelpCircle, color: 'text-teal-500', bg: 'bg-teal-50' },
}

export function AdminPages() {
  const { success, error: showError } = useToast()
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPage, setSelectedPage] = useState(null)
  const [saving, setSaving] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [editTitle, setEditTitle] = useState('')

  useEffect(() => {
    loadPages()
  }, [])

  const loadPages = async () => {
    setLoading(true)
    try {
      const data = await getAdminPages()
      setPages(data.filter(p => p.slug !== 'about-us'))
    } catch (err) {
      showError(err.message || 'Could not load pages')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPage = (page) => {
    setSelectedPage(page)
    setEditTitle(page.title)
    setEditContent(page.content)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSave = async () => {
    if (!selectedPage) return
    setSaving(true)
    try {
      const updated = await updateAdminPage({
        slug: selectedPage.slug,
        title: editTitle,
        content: editContent
      })
      setPages(prev => prev.map(p => p.slug === updated.slug ? updated : p))
      setSelectedPage(updated)
      success(`${updated.title} updated successfully.`)
    } catch (err) {
      showError(err.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="shell flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-[#6651A4]/20 border-t-[#6651A4] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="shell space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-grandstander font-bold text-gray-800">Legal & Policy Pages</h1>
          <p className="text-gray-500 font-medium text-[12px] md:text-sm mt-1">Manage the core content of your storefront's policy pages.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Page List Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-[24px] border border-black/[0.03] shadow-sm p-4">
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">Site Policies</h3>
            <div className="space-y-2">
              {pages.map((page) => {
                const meta = PAGE_METADATA[page.slug] || { icon: FileText, color: 'text-gray-500', bg: 'bg-gray-50' }
                const Icon = meta.icon
                const isActive = selectedPage?.slug === page.slug

                return (
                  <button
                    key={page.slug}
                    onClick={() => handleSelectPage(page)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${isActive ? 'bg-[#6651A4] text-white shadow-lg shadow-[#6651A4]/20' : 'bg-transparent hover:bg-gray-50 text-gray-700'}`}
                  >
                    <div className="flex items-center gap-4 truncate">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isActive ? 'bg-white/20' : meta.bg}`}>
                        <Icon size={18} className={isActive ? 'text-white' : meta.color} />
                      </div>
                      <div className="text-left truncate">
                        <p className="font-bold text-[14px] truncate">{page.title}</p>
                        <p className={`text-[10px] font-medium opacity-60 flex items-center gap-1 mt-0.5`}>
                          <Clock size={10} /> {new Date(page.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={16} className={`shrink-0 transition-transform ${isActive ? 'translate-x-1' : 'opacity-0 group-hover:opacity-100'}`} />
                  </button>
                )
              })}
            </div>
          </div>

          <div className="bg-[#6651A4]/5 rounded-[24px] border border-[#6651A4]/10 p-6">
            <div className="flex items-start gap-3 text-[#6651A4]">
              <Edit3 size={20} className="shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-[14px]">Visual Editor</h4>
                <p className="text-[12px] mt-1 leading-relaxed opacity-80">
                  Select a page and start typing. Your changes will be saved with all formatting and reflected instantly for users.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Editor Area */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {selectedPage ? (
              <motion.div
                key={selectedPage.slug}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-[32px] border border-black/[0.03] shadow-sm overflow-hidden"
              >
                <div className="p-6 md:p-8 border-b border-black/[0.03] flex items-center justify-between bg-gray-50/50">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${PAGE_METADATA[selectedPage.slug]?.bg}`}>
                      {(() => {
                        const Icon = PAGE_METADATA[selectedPage.slug]?.icon || FileText
                        return <Icon size={20} className={PAGE_METADATA[selectedPage.slug]?.color} />
                      })()}
                    </div>
                    <div>
                      <input 
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="text-lg md:text-xl font-grandstander font-bold text-gray-800 bg-transparent border-none outline-none focus:ring-0 w-full"
                        placeholder="Page Title"
                      />
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Slug: {selectedPage.slug}</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="h-10 md:h-12 px-6 bg-[#6651A4] text-white rounded-xl md:rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-lg hover:scale-[1.02] transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>

                  <div className="p-6 md:p-8 space-y-6 quill-editor-wrapper">
                    <div className="relative group">
                      <div className="absolute -top-3 left-6 px-2 bg-white text-[10px] font-bold text-gray-400 uppercase tracking-widest z-10 group-focus-within:text-[#6651A4] transition-colors">
                        Page Content Editor
                      </div>
                      <ReactQuill 
                        theme="snow"
                        value={editContent}
                        onChange={setEditContent}
                        className="bg-gray-50/30 rounded-[24px] overflow-hidden border-gray-100"
                        modules={{
                          toolbar: [
                            [{ 'header': [1, 2, 3, false] }],
                            ['bold', 'italic', 'underline', 'strike'],
                            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                            ['link', 'clean']
                          ],
                        }}
                      />
                      <style dangerouslySetInnerHTML={{ __html: `
                        .quill-editor-wrapper .ql-toolbar {
                          border-top-left-radius: 24px;
                          border-top-right-radius: 24px;
                          border-color: #f3f4f6;
                          background: #fff;
                          padding: 12px 24px;
                        }
                        .quill-editor-wrapper .ql-container {
                          border-bottom-left-radius: 24px;
                          border-bottom-right-radius: 24px;
                          border-color: #f3f4f6;
                          min-height: 500px;
                          font-family: 'Inter', sans-serif;
                          font-size: 14px;
                          color: #374151;
                        }
                        .quill-editor-wrapper .ql-editor {
                          min-height: 500px;
                          padding: 24px;
                        }
                        .quill-editor-wrapper .ql-editor.ql-blank::before {
                          left: 24px;
                        }
                      `}} />
                    </div>
                  </div>

                <div className="px-8 py-4 bg-gray-50 border-t border-black/[0.03] flex items-center justify-between text-[11px] font-medium text-gray-400">
                  <span>Last modified: {new Date(selectedPage.updatedAt).toLocaleString()}</span>
                  <span>Character count: {editContent.length}</span>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-gray-50/50 border border-dashed border-gray-200 rounded-[32px]">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6 text-gray-300">
                  <Edit3 size={32} />
                </div>
                <h3 className="text-xl font-grandstander font-bold text-gray-800">Select a Page</h3>
                <p className="text-gray-500 max-w-xs mt-2 text-sm">Choose a policy from the sidebar to start editing its content.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
