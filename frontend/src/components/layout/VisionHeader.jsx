import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ShoppingCart, Menu, X, ChevronLeft, ChevronRight, ChevronDown, User, Home, LogOut, Globe } from 'lucide-react'
import CartDrawer from '../cart/CartDrawer'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'

const FbIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
)
const IgIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    <rect x="2" y="2" width="20" height="20" rx="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
)
const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
)
const YtIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
)
const LiIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
  </svg>
)

import { countries, languages, mainNavLinks, categoryData } from '../../data/navigationData'
import { getCategoryTree, getNavbarCategories, getProducts } from '../../services/catalogApi'
import { getStorefrontSettings } from '../../services/siteApi'

import logo from '../../assets/toyovo.webp'

export function VisionHeader() {
  const [promoIndex, setPromoIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [isPastHero, setIsPastHero] = useState(false)
  const [activeMobileSub, setActiveMobileSub] = useState(null)
  const [activeMobileSub2, setActiveMobileSub2] = useState(null)
  
  const [activeMasterCat, setActiveMasterCat] = useState('Musical Toys')
  const [activeMenu, setActiveMenu] = useState(null)
  const [navLinks, setNavLinks] = useState([
    { name: 'Home', href: '/', hideOnDesktop: true },
    {
      name: 'ALL CATEGORIES',
      href: '/all-categories',
      mega: {
        type: 'master',
        sidebar: []
      }
    },
    { name: 'Contact', href: '/contact', hideOnDesktop: true }
  ])
  const [megaCategoryData, setMegaCategoryData] = useState(categoryData)
  const [profileDropdown, setProfileDropdown] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [promoMessages, setPromoMessages] = useState([
    'Free Shipping On Orders Over ₹999!',
  ])
  const [siteConfig, setSiteConfig] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const { user, logout } = useAuth()
  const { cartCount } = useCart()
  const location = useLocation()
  const navigate = useNavigate()
  const searchRef = useRef(null)

  useEffect(() => {
    let isMounted = true

    const buildDynamicNav = async () => {
      try {
        const [navbarPayload, tree] = await Promise.all([
          getNavbarCategories(),
          getCategoryTree(),
        ])

        if (!isMounted) return

        const treeData = {}
        tree.forEach(category => {
          const staticData = categoryData[category.name] || {}
          treeData[category.name] = {
            content: [{
              title: 'SHOP BY TYPE',
              items: category.children?.length ? category.children.map(child => child.name) : [category.name],
            }],
            banner: category.bannerImage?.url || staticData.banner,
          }
        })

        const navbarCategories = (navbarPayload.categories || []).slice(0, 7)
        const dynamicLinks = [
          { name: 'Home', href: '/', hideOnDesktop: true },
          {
            name: 'ALL CATEGORIES',
            href: '/all-categories',
            mega: {
              type: 'master',
              sidebar: tree.map(category => ({ 
                name: category.name, 
                id: category.slug,
                children: category.children || []
              })),
            },
          },
          ...navbarCategories.map(category => ({
            name: category.name.toUpperCase(),
            href: `/collections/${category.slug}`,
            mega: treeData[category.name] || { 
              content: [{ title: 'SHOP BY TYPE', items: [category.name] }],
              banner: categoryData[category.name]?.banner
            },
          })),
          // Ensure specific categories are visible as requested
          ...['Stacking Toys', 'Kids Puzzles', 'Baby Rattles']
            .filter(name => !navbarCategories.find(c => c.name === name) && treeData[name])
            .map(name => ({
              name: name.toUpperCase(),
              href: `/collections/${name.toLowerCase().replaceAll(' ', '-')}`,
              mega: treeData[name]
            })),
          { name: 'Contact', href: '/contact', hideOnDesktop: true },
        ]

        setMegaCategoryData({ ...categoryData, ...treeData })
        setNavLinks(dynamicLinks)
        if (tree[0]?.name) setActiveMasterCat(tree[0].name)
      } catch (error) {
        console.warn('Falling back to static navigation data:', error.message)
        if (isMounted) {
          setNavLinks(mainNavLinks)
        }
      }
    }

    buildDynamicNav()
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const loadStorefront = async () => {
      try {
        const data = await getStorefrontSettings()
        if (!isMounted) return
        setSiteConfig(data)
        if (Array.isArray(data.announcementMessages) && data.announcementMessages.length > 0) {
          setPromoMessages(data.announcementMessages)
          setPromoIndex(0)
        }
        if (data.siteName) {
          document.title = `${data.siteName} | Premium Kids Toys Marketplace`
        }
      } catch {
        // keep fallback header copy
      }
    }

    loadStorefront()
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => setIsPastHero(window.scrollY > 100)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    if (mobileOpen) {
      html.style.overflow = 'hidden';
      body.style.overflow = 'hidden';
    } else {
      html.style.overflow = '';
      body.style.overflow = '';
    }
    return () => {
      html.style.overflow = '';
      body.style.overflow = '';
    }
  }, [mobileOpen])

  useEffect(() => {
    setMobileOpen(false)
    setActiveMobileSub(null)
    setActiveMobileSub2(null)
    setSearchOpen(false)
    setActiveMenu(null)
    setProfileDropdown(false)
    setSearchTerm('')
    setSuggestions([])
  }, [location])

  useEffect(() => {
    let isMounted = true

    if (searchTerm.trim().length <= 1) {
      setSuggestions([])
      return () => {
        isMounted = false
      }
    }

    const timer = setTimeout(async () => {
      try {
        const payload = await getProducts({
          search: searchTerm.trim(),
          limit: 5,
          sort: 'relevance',
        })
        if (isMounted) {
          setSuggestions(payload.products || [])
        }
      } catch {
        if (isMounted) {
          setSuggestions([])
        }
      }
    }, 180)

    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [searchTerm])

  const prev = () => {
    setDirection(-1)
    setPromoIndex(i => (i - 1 + promoMessages.length) % promoMessages.length)
  }
  const next = () => {
    setDirection(1)
    setPromoIndex(i => (i + 1) % promoMessages.length)
  }

  // Auto-cycle promo messages
  useEffect(() => {
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      navigate(`/search?q=${searchTerm.trim()}`)
      setSearchOpen(false)
    }
  }

  const handleLinkClick = () => {
    setActiveMenu(null)
    setMobileOpen(false)
  }

  const socialItems = [
    { key: 'facebook', icon: FbIcon },
    { key: 'instagram', icon: IgIcon },
    { key: 'youtube', icon: YtIcon },
    { key: 'twitter', icon: XIcon },
    { key: 'linkedin', icon: LiIcon },
  ].filter(item => siteConfig?.socialLinks?.[item.key] && siteConfig.socialLinks[item.key].trim() !== '')

  return (
    <div 
      id="vision-header-root"
      className="relative z-[1100]"
    >
      <div style={{ backgroundColor: siteConfig?.announcementBg || '#6651A4', width: '100%', padding: '7px 0' }} className="relative z-[1300]">
        {/* Desktop Utility Bar (1024px+) */}
        <div className="ann-desk hdr-inner" style={{ gridTemplateColumns: '1fr 1.5fr 1fr', alignItems: 'center' }}>
          <div className="flex items-center gap-4">
            {socialItems.map((item) => (
              <a 
                key={item.key} 
                href={siteConfig.socialLinks[item.key]} 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ color: '#FDF3E7', lineHeight: 0, display: 'flex' }} 
                className="hover:opacity-70 transition-opacity"
              >
                <item.icon />
              </a>
            ))}
          </div>
          
          <div className="flex items-center justify-center gap-3">
            <button onClick={prev} className="text-white/60 hover:text-white transition-colors z-10"><ChevronLeft size={14} /></button>
            <div className="overflow-hidden h-4 flex items-center min-w-[350px] justify-center relative">
              <AnimatePresence initial={false} custom={direction}>
                <motion.div 
                  key={promoIndex} 
                  custom={direction}
                  variants={{
                    enter: (direction) => ({ x: direction > 0 ? 100 : -100, opacity: 0 }),
                    center: { x: 0, opacity: 1 },
                    exit: (direction) => ({ x: direction < 0 ? 100 : -100, opacity: 0 })
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                  className="flex items-center gap-2 text-[#FDF3E7] text-[11px] font-bold uppercase tracking-wider whitespace-nowrap absolute"
                >
                  <span>⭐</span> {promoMessages[promoIndex]}
                </motion.div>
              </AnimatePresence>
            </div>
            <button onClick={next} className="text-white/60 hover:text-white transition-colors z-10"><ChevronRight size={14} /></button>
          </div>

          <div className="flex items-center gap-6 justify-end">
          </div>
        </div>

        {/* Tablet Utility Bar (768px - 1023px) */}
        <div className="ann-tab hdr-inner flex items-center justify-between">
           <div className="flex-1"></div>
           <div className="flex items-center gap-4">
              <button onClick={prev} className="text-[#FDF3E7]/60 hover:text-white transition-colors"><ChevronLeft size={14} /></button>
              <div className="overflow-hidden h-4 flex items-center min-w-[280px] justify-center relative">
                <AnimatePresence initial={false} custom={direction}>
                  <motion.div 
                    key={promoIndex} 
                    custom={direction}
                    variants={{
                      enter: (direction) => ({ x: direction > 0 ? 100 : -100, opacity: 0 }),
                      center: { x: 0, opacity: 1 },
                      exit: (direction) => ({ x: direction < 0 ? 100 : -100, opacity: 0 })
                    }}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                    className="flex items-center gap-2 text-[#FDF3E7] text-[11px] font-bold uppercase tracking-wider whitespace-nowrap absolute"
                  >
                    {promoMessages[promoIndex]}
                  </motion.div>
                </AnimatePresence>
              </div>
              <button onClick={next} className="text-[#FDF3E7]/60 hover:text-white transition-colors"><ChevronRight size={14} /></button>
           </div>
           <div className="flex-1 flex items-center gap-4 text-white justify-end">
           </div>
        </div>

        {/* Mobile Utility Bar (0 - 767px) */}
        <div style={{ backgroundColor: siteConfig?.announcementBg || '#6651A4' }} className="ann-mob hdr-inner flex items-center justify-center h-[25px]">
            <button onClick={prev} className="w-10 h-full flex items-center justify-start text-[#FDF3E7]/70 hover:text-white transition-colors shrink-0">
              <ChevronLeft size={14} />
            </button>
            <div className="grow overflow-hidden h-full flex items-center justify-center relative">
              <AnimatePresence initial={false} custom={direction}>
                <motion.div 
                  key={promoIndex} 
                  custom={direction}
                  variants={{
                    enter: (direction) => ({ x: direction > 0 ? 30 : -30, opacity: 0 }),
                    center: { x: 0, opacity: 1 },
                    exit: (direction) => ({ x: direction < 0 ? 30 : -30, opacity: 0 })
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                  className="flex items-center justify-center text-[#FDF3E7] text-[10px] font-bold uppercase tracking-wide text-center absolute w-full px-2"
                >
                  {promoMessages[promoIndex]}
                </motion.div>
              </AnimatePresence>
            </div>
            <button onClick={next} className="w-10 h-full flex items-center justify-end text-[#FDF3E7]/70 hover:text-white transition-colors shrink-0">
              <ChevronRight size={14} />
            </button>
        </div>
      </div>

      <header style={{ backgroundColor: '#FDF3E7', borderBottom: '1px solid #ebebeb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', position: 'sticky', top: 0, zIndex: 1200 }}>
        <div className="hdr-inner flex items-center h-15 md:h-17.5 relative max-w-[1600px] mx-auto px-4 lg:px-8">
          {/* Mobile Burger: Left-aligned, hidden on 1024px+ */}
          <div className="lg:hidden flex-1 flex items-center">
            <button 
              onClick={() => setMobileOpen(!mobileOpen)} 
              className="p-2 -ml-2 text-[#333] hover:text-[#E84949] transition-colors relative z-[1200]"
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          <div className="lg:static absolute left-1/2 -translate-x-1/2 lg:left-0 lg:translate-x-0 flex items-center justify-center shrink-0 lg:mr-1 xl:mr-4 z-10">
            <Link to="/" onClick={handleLinkClick} className="flex items-center justify-center">
              <img src={siteConfig?.siteLogo?.url || logo} alt={siteConfig?.siteName || "TOYOVOINDIA"} className="h-[50px] md:h-12 lg:h-11 xl:h-14 w-auto" />
            </Link>
          </div>

          {/* Desktop Navigation: Optimized for responsiveness */}
          <nav className="hidden lg:flex items-center justify-center gap-x-1 xl:gap-x-2 2xl:gap-x-4 flex-grow h-full px-2 overflow-hidden shrink min-w-0">
            {navLinks.filter(l => !l.hideOnDesktop).map(link => (
              <div key={link.name} className={`group/nav py-6 ${link.dropdown ? 'relative' : ''}`} onMouseEnter={() => { setActiveMenu(link.name); if(link.name === 'ALL CATEGORIES') setActiveMasterCat('Musical Toys'); }} onMouseLeave={() => setActiveMenu(null)}>
                <Link to={link.href} onClick={handleLinkClick} className={`flex items-center gap-0.5 px-0.5 xl:px-1 2xl:px-1.5 text-[10px] xl:text-[11px] 2xl:text-[12.5px] font-bold tracking-widest transition-all uppercase whitespace-nowrap font-grandstander ${location.pathname === link.href ? 'text-[#E84949]' : 'text-[#333] hover:text-[#E84949]'}`}>
                  {link.name} {(link.mega || link.dropdown) && <ChevronDown size={7} className={`${activeMenu === link.name ? 'rotate-180' : ''} transition-transform`} />}
                </Link>
                <AnimatePresence>
                  {activeMenu === link.name && link.mega && (
                      <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-1/2 -translate-x-1/2 w-screen bg-[#FDF4E6] shadow-[0_40px_100px_rgba(0,0,0,0.12)] border-t border-[#ebebeb] flex justify-center z-[1000]"
                      >
                        <div className="w-full max-w-[1400px] flex h-[480px]">
                          {/* Sidebar (Optional) */}
                          {link.mega.type === 'master' ? (
                            <div className="w-72 bg-[#F9EAD3] border-x border-black/5 p-8 space-y-1.5 h-full overflow-y-auto custom-scrollbar shrink-0">
                               {link.mega.sidebar.map(s => (
                                 <Link 
                                  key={s.name} 
                                  to={`/collections/${s.id}`}
                                  onMouseEnter={() => setActiveMasterCat(s.name)}
                                  onClick={handleLinkClick}
                                  className={`w-full text-left px-5 py-3 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all block ${activeMasterCat === s.name ? 'bg-[#E84949] text-white shadow-xl shadow-[#E84949]/20' : 'text-[#333] hover:bg-[#FDF4E6] hover:text-[#E84949]'}`}
                                 >
                                   {s.name}
                                 </Link>
                               ))}
                            </div>
                          ) : link.mega.sidebar ? (
                            <div className="w-64 bg-[#F9EAD3] border-x border-black/5 p-6 space-y-2 h-full overflow-y-auto shrink-0">
                               {link.mega.sidebar.map(s => (
                                 <button key={s.name} className={`w-full text-left px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${s.active ? 'bg-[#E84949] text-white shadow-lg shadow-[#E84949]/20' : 'text-[#333] hover:bg-[#FDF4E6]'}`}>
                                   {s.name}
                                 </button>
                               ))}
                            </div>
                          ) : null}

                          {/* Main Content Area */}
                          <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#FDF4E6]">
                            {/* Master Top Header (Optional) */}
                            {link.mega.type === 'master' && (
                              <div className="px-10 pt-8 pb-4 border-b border-black/5 bg-[#FDF4E6]/95 backdrop-blur-md sticky top-0 z-10">
                                <Link 
                                  to={`/collections/${link.mega.sidebar.find(s => s.name === activeMasterCat)?.id}`}
                                  onClick={handleLinkClick}
                                  className="group/all inline-block"
                                >
                                  <h3 className="text-[#E84949] font-black text-xs tracking-[0.3em] uppercase mb-1 group-hover/all:underline decoration-2 underline-offset-4">ALL</h3>
                                  <div className="w-10 h-[1.5px] bg-[#E84949] rounded-full"></div>
                                </Link>
                              </div>
                            )}

                            <div className="flex-1 p-8 xl:p-10 grid grid-cols-4 gap-8 overflow-y-auto custom-scrollbar">
                              <div className="col-span-3 grid grid-cols-3 gap-8 h-max">
                                {(link.mega.type === 'master' ? (megaCategoryData[activeMasterCat]?.content || []) : (Array.isArray(link.mega) ? link.mega : link.mega.content)).map((col, idx) => {
                                  let parentSlug = '';
                                  if (link.name === 'ALL CATEGORIES') {
                                    parentSlug = activeMasterCat?.toLowerCase().replaceAll(' ', '-');
                                  } else {
                                    parentSlug = link.href.split('/').pop();
                                  }
                                  
                                  return (
                                    <div key={idx} className="space-y-6">
                                      {col.title && (
                                        <h4 className="font-grandstander font-black text-[13px] text-[#333] border-b-2 border-dashed border-[#E84949]/20 pb-2 uppercase tracking-[0.2em]">
                                          {col.title}
                                        </h4>
                                      )}
                                      
                                      {col.items && (
                                        <ul className="space-y-2.5">
                                          {col.items.map(item => {
                                            const name = typeof item === 'object' ? item.name : item;
                                            const badge = typeof item === 'object' ? item.badge : null;
                                            const type = typeof item === 'object' ? item.type : 'normal';
                                            const itemSlug = name.toLowerCase().replaceAll(' ', '-');
                                            const finalHref = type === 'link' 
                                              ? `/product/${itemSlug}` 
                                              : `/collections/${parentSlug}/${itemSlug}`;
                                            
                                            return (
                                              <li key={name}>
                                                <Link 
                                                  to={finalHref}
                                                  onClick={handleLinkClick} 
                                                  className={`group/link flex items-center gap-2 text-[11px] transition-all font-bold uppercase tracking-wider ${type === 'link' ? 'text-[#E84949]' : 'text-[#666] hover:text-[#E84949]'}`}
                                                >
                                                  {type !== 'link' && <span className="w-1 h-1 bg-[#E84949]/0 group-hover/link:bg-[#E84949] group-hover/link:w-2 transition-all rounded-full"></span>}
                                                  {name}
                                                  {badge && (
                                                    <span className={`text-[7px] px-1.5 py-0.5 rounded-full text-white font-black uppercase ${badge === 'Hot' ? 'bg-orange-500' : badge === 'Sale' ? 'bg-[#E84949]' : 'bg-blue-500'}`}>
                                                      {badge}
                                                    </span>
                                                  )}
                                                </Link>
                                              </li>
                                            );
                                          })}
                                        </ul>
                                      )}

                                      {col.extra && (
                                        <div className="pt-4">
                                          <h4 className="font-grandstander font-black text-[13px] text-[#333] mb-4 border-b-2 border-dashed border-[#E84949]/20 pb-2 uppercase tracking-[0.2em]">
                                            {col.extra.title}
                                          </h4>
                                          <ul className="space-y-2.5">
                                            {col.extra.items.map(i => {
                                              const itemSlug = i.toLowerCase().replaceAll(' ', '-');
                                              return (
                                                <li key={i}>
                                                  <Link to={`/collections/${parentSlug}/${itemSlug}`} className="group/link flex items-center gap-2 text-[11px] text-[#666] hover:text-[#E84949] transition-all font-bold uppercase tracking-wider">
                                                    <span className="w-1 h-1 bg-[#E84949]/0 group-hover/link:bg-[#E84949] group-hover/link:w-2 transition-all rounded-full"></span>
                                                    {i}
                                                  </Link>
                                                </li>
                                              );
                                            })}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Visual Banner (Optional) */}
                              {(link.mega.type === 'master' ? megaCategoryData[activeMasterCat]?.banner : link.mega.banner) && (
                                <div className="col-span-1 flex flex-col items-center justify-start pt-2">
                                  <div className="rounded-[35px] overflow-hidden aspect-[4/5] relative group/banner cursor-pointer shadow-2xl border-4 border-[#F9EAD3] transform hover:-translate-y-2 transition-all duration-700 w-full">
                                      <img src={link.mega.type === 'master' ? megaCategoryData[activeMasterCat]?.banner : link.mega.banner} alt={link.name} className="w-full h-full object-cover group-hover/banner:scale-110 transition-transform duration-1000" />
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent p-6 flex flex-col justify-end">
                                        <span className="text-[#E84949] text-[9px] uppercase font-black tracking-[0.3em] mb-1">Featured</span>
                                        <h5 className="text-white font-grandstander text-[15px] font-black uppercase">Collection 2026</h5>
                                      </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  {activeMenu === link.name && link.dropdown && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="absolute top-full left-0 w-56 bg-[#FDF4E6] shadow-xl rounded-b-xl border-t border-[#ebebeb] py-2 z-[1000]">
                      {link.dropdown.map(sub => <Link key={sub.name} to={sub.href} onClick={handleLinkClick} className="block px-5 py-2.5 text-[12px] text-[#555] hover:text-[#E84949] hover:bg-[#F9EAD3] transition-all font-bold uppercase tracking-wider">{sub.name}</Link>)}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </nav>

          {/* Icons Section: Floated right, maintains spacing on all devices */}
          <div className="flex-1 lg:flex-none flex items-center justify-end gap-1 md:gap-2 shrink-0 ml-auto">
            {/* Desktop Search Bar (Static only on LG+) */}
            <div className="hidden lg:block mr-1 relative">
              <form onSubmit={handleSearchSubmit} className="relative z-10">
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search"
                  className="w-16 xl:w-28 2xl:w-36 h-8 bg-[#F9EAD3] border border-dashed border-[#333]/25 rounded-xl px-2 xl:px-4 py-1.5 text-[9px] xl:text-[11px] 2xl:text-[12px] font-medium outline-none focus:border-[#E84949] transition-all placeholder:text-[#333]/40 focus:w-48 xl:focus:w-56"
                />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-[#333]/40"><Search size={13} /></button>
              </form>

              <AnimatePresence>
                {searchTerm.trim().length > 1 && suggestions.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute top-full right-0 mt-3 w-72 bg-[#FDF4E6] shadow-2xl rounded-xl border-t-2 border-[#E84949] p-3 z-50 overflow-hidden"
                  >
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-[#666] tracking-widest uppercase mb-1 px-1">Suggestions</p>
                      {suggestions.map(p => (
                        <Link key={p.id} to={`/product/${p.slug || p.id}`} onClick={() => setSearchTerm('')} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#F9EAD3] transition-all">
                          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-black/5 bg-white"><img src={p.img} alt={p.name} className="w-full h-full object-cover" /></div>
                          <div className="grow"><h5 className="text-[11px] font-bold text-[#333] tracking-tight line-clamp-1">{p.name}</h5><p className="text-[10px] text-[#E84949] mt-0.5 font-bold">₹{p.price}</p></div>
                        </Link>
                      ))}
                      <button onClick={handleSearchSubmit} className="w-full mt-2 py-2 text-center text-[10px] font-bold text-[#333] hover:text-[#E84949] uppercase tracking-wider bg-black/5 rounded-lg transition-colors">View All Results</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button onClick={() => setSearchOpen(!searchOpen)} className="p-2 lg:hidden text-[#333] hover:text-[#E84949] transition-colors"><Search size={22} /></button>
            
            <button 
              onClick={() => setCartOpen(true)} 
              className="p-2 text-[#333] hover:text-[#E84949] transition-colors relative"
            >
              <ShoppingCart size={22} />
              {/* Dynamic Badge Synchronized with Cart Logic */}
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#E84949] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            </button>

            {/* Account Icon: Visible on Tablet and Desktop */}
            <div className="relative flex items-center" onMouseEnter={() => setProfileDropdown(true)} onMouseLeave={() => setProfileDropdown(false)}>
                <Link to={user ? "/account" : "/login"} className="p-2 text-[#333] hover:text-[#E84949] transition-colors flex items-center gap-2 group/user">
                    <User size={22} />
                    {user && <span className="hidden xl:block text-[11px] font-bold uppercase tracking-widest text-[#333] group-hover/user:text-[#E84949]">{user.firstName}</span>}
                </Link>
                <AnimatePresence>
                    {profileDropdown && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full right-0 w-56 bg-[#FDF4E6] shadow-2xl rounded-b-3xl border-t-2 border-[#E84949] py-4 z-50 overflow-hidden">
                            {!user ? (
                                <div className="px-4 space-y-3">
                                    <p className="text-[10px] font-bold text-[#666] tracking-widest uppercase mb-2">Welcome back!</p>
                                    <Link to="/login" onClick={handleLinkClick} className="block w-full py-3 bg-[#E84949] text-white text-center text-[11px] font-bold rounded-xl tracking-widest uppercase hover:bg-[#333] transition-all shadow-sm">Sign In</Link>
                                    <Link to="/register" onClick={handleLinkClick} className="block w-full py-3 border-2 border-[#333] text-[#333] text-center text-[11px] font-bold rounded-xl tracking-widest uppercase hover:bg-[#333] hover:text-white transition-all">Register</Link>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <div className="px-5 pb-4 border-b border-[#333]/10 mb-2"><p className="text-[13px] font-grandstander font-bold text-[#333] mb-0.5">{user.firstName} {user.lastName}</p><p className="text-[11px] text-[#666] truncate">{user.email}</p></div>
                                    <Link to="/account" onClick={handleLinkClick} className="flex items-center gap-3 px-5 py-3 text-[12px] font-bold text-[#333] hover:text-[#E84949] hover:bg-[#F9EAD3] transition-all uppercase tracking-wider"><User size={16}/> My Account</Link>
                                    <button onClick={() => { logout(); handleLinkClick(); }} className="w-full flex items-center gap-3 px-5 py-3 text-[12px] font-bold text-[#E84949] hover:bg-[#E84949] hover:text-white transition-all uppercase tracking-wider"><LogOut size={16}/> Log out</button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Mobile/Tablet Search Overlay (Limited Height) */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: 'auto', opacity: 1 }} 
              exit={{ height: 0, opacity: 0 }} 
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="absolute top-full left-0 right-0 bg-[#FDF4E6] z-[900] shadow-2xl border-t border-black/5 overflow-hidden"
            >
               <div className="p-4 md:p-6 lg:hidden">
                  <div className="flex justify-end mb-2">
                    <button onClick={() => setSearchOpen(false)} className="p-2"><X size={24} className="text-brand-ink/40" /></button>
                  </div>
                  
                  <div className="relative">
                    <form onSubmit={handleSearchSubmit}>
                        <div className="relative">
                          <input 
                            type="text" 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            placeholder="Search" 
                            className="w-full h-11 bg-[#F9EAD3] border-2 border-dashed border-[#333]/15 rounded-xl px-4 pr-12 text-[15px] font-medium outline-none focus:border-[#E84949] transition-all" 
                            autoFocus 
                          />
                          <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-ink/40 shadow-none"><Search size={19} /></button>
                        </div>
                    </form>

                    <div className="mt-4 flex flex-wrap items-baseline gap-2">
                       <p className="text-[14px] font-bold text-brand-ink border-b-2 border-brand-ink leading-tight">Popular Search:</p>
                       <div className="flex flex-wrap gap-x-4 gap-y-2">
                          {['Toys', 'Games'].map(tag => (
                            <button 
                              key={tag}
                              onClick={() => { setSearchTerm(tag); navigate(`/search?q=${tag}`); setSearchOpen(false); }}
                              className="text-[14px] font-medium text-brand-ink/60 hover:text-[#E84949] transition-colors"
                            >
                              {tag}
                            </button>
                          ))}
                       </div>
                    </div>

                    <AnimatePresence>
                        {suggestions.length > 0 && (
                            <motion.div 
                              initial={{ opacity: 0, y: 5 }} 
                              animate={{ opacity: 1, y: 0 }} 
                              className="mt-6 space-y-3 pb-4"
                            >
                                {suggestions.map(p => (
                                    <Link key={p.id} to={`/product/${p.slug || p.id}`} onClick={handleLinkClick} className="flex items-center gap-3 p-2 rounded-xl bg-white/30 hover:bg-white transition-all shadow-xs">
                                        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-black/5"><img src={p.img} alt={p.name} className="w-full h-full object-cover" /></div>
                                        <div className="grow"><h5 className="text-[14px] font-bold text-[#333] tracking-tight">{p.name}</h5><p className="text-[11px] text-[#999] mt-0.5 font-bold">₹{p.price}</p></div>
                                        <Search size={14} className="text-gray-300 mr-2" />
                                    </Link>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
      {/* Cart Drawer - Moved outside header stacking context to prevent header poke-through */}
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} className="fixed inset-0 bg-black/40 z-[1000]" />
            <motion.div 
              initial={{ x: '-100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '-100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 200 }} 
              className="fixed top-[calc(25px+60px)] md:top-[calc(25px+70px)] left-0 bottom-0 w-[85%] max-w-[320px] bg-[#FDF4E6] z-[1050] flex flex-col shadow-2xl border-t border-black/5"
            >
              <div className="overflow-y-auto grow">
                <div className="py-4">
                  {user && (
                      <div className="px-6 py-4 bg-[#F9EAD3]/50 mb-4 flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#E84949] text-white rounded-full flex items-center justify-center font-grandstander font-bold text-xl uppercase">{user.firstName[0]}</div>
                        <div>
                          <p className="text-[14px] font-bold text-[#333] capitalize">{user.firstName} {user.lastName}</p>
                          <Link to="/account" onClick={handleLinkClick} className="text-[11px] font-bold text-[#E84949] uppercase tracking-widest">My Account</Link>
                        </div>
                      </div>
                  )}
                  
                  {navLinks.map(link => (
                    <div key={link.name}>
                      <div className="flex items-center justify-between px-6 py-4 border-b border-[#333]/5">
                        <Link to={link.href} onClick={handleLinkClick} className={`text-[13px] font-bold tracking-widest uppercase transition-colors ${location.pathname === link.href ? 'text-[#E84949]' : 'text-[#333]'}`}>{link.name}</Link>
                        {(link.name === 'Contact' ? false : (link.mega || link.dropdown)) && (
                          <button onClick={() => setActiveMobileSub(activeMobileSub === link.name ? null : link.name)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${activeMobileSub === link.name ? 'bg-[#E84949] text-white rotate-180' : 'bg-[#F9EAD3] text-[#333]'}`}>
                            <ChevronRight size={14} />
                          </button>
                        )}
                      </div>
                      {(link.mega || link.dropdown) && activeMobileSub === link.name && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="bg-[#F9EAD3]/30 px-8 py-4 space-y-4">
                          {link.mega ? (
                            link.mega.type === 'master' ? (
                              <div className="flex flex-col gap-3">
                                {link.mega.sidebar.map(item => (
                                  <div key={item.id} className="flex flex-col">
                                    <div className="flex items-center justify-between border-b border-[#333]/5 pb-1">
                                      <Link 
                                        to={`/collections/${item.id || item.name.toLowerCase().replaceAll(' ', '-')}`} 
                                        onClick={handleLinkClick} 
                                        className="flex-1 text-[13px] text-[#333] font-bold hover:text-[#E84949] transition-colors py-1"
                                      >
                                        {item.name}
                                      </Link>
                                      {item.children && item.children.length > 0 && (
                                        <button 
                                          onClick={() => setActiveMobileSub2(activeMobileSub2 === item.name ? null : item.name)} 
                                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${activeMobileSub2 === item.name ? 'bg-[#E84949] text-white rotate-180' : 'bg-transparent text-[#333]'}`}
                                        >
                                          <ChevronRight size={14} />
                                        </button>
                                      )}
                                    </div>
                                    {activeMobileSub2 === item.name && item.children && item.children.length > 0 && (
                                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="pl-4 py-2 flex flex-col gap-2 border-l-2 border-[#E84949]/20 ml-2 mt-2">
                                        {item.children.map(child => (
                                          <Link
                                            key={child._id || child.slug || child.name}
                                            to={`/collections/${item.id || item.name.toLowerCase().replaceAll(' ', '-')}/${child.slug || child.name.toLowerCase().replaceAll(' ', '-')}`}
                                            onClick={handleLinkClick}
                                            className="text-[11.5px] text-[#555] font-semibold hover:text-[#E84949] transition-colors py-1"
                                          >
                                            {child.name}
                                          </Link>
                                        ))}
                                      </motion.div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              (Array.isArray(link.mega) ? link.mega : (link.mega.content || [])).map((col, cidx) => (
                                <div key={cidx}>
                                  {col.title && <h5 className="text-[10px] font-bold text-[#666] uppercase mb-2 tracking-widest">{col.title}</h5>}
                                  {col.items && (
                                    <div className="flex flex-col gap-2">
                                      {col.items.map(item => {
                                        const name = typeof item === 'object' ? item.name : item;
                                        const badge = typeof item === 'object' ? item.badge : null;
                                        const type = typeof item === 'object' ? item.type : 'normal';
                                        const subSlug = name.toLowerCase().replaceAll(' ', '-');
                                        const parentSlug = link.href.split('/').pop() || link.name.toLowerCase().replaceAll(' ', '-');
                                        
                                        return (
                                          <Link 
                                            key={name} 
                                            to={type === 'link' ? `/product/${subSlug}` : `/collections/${parentSlug}/${subSlug}`} 
                                            onClick={handleLinkClick} 
                                            className="flex items-center justify-between text-[12px] text-[#333] font-bold hover:text-[#E84949] transition-colors"
                                          >
                                            <span>{name}</span>
                                            {badge && (
                                              <span className={`text-[7px] px-1.5 py-0.5 rounded-full text-white font-black uppercase ${badge === 'Hot' ? 'bg-orange-500' : badge === 'Sale' ? 'bg-[#E84949]' : 'bg-blue-500'}`}>
                                                {badge}
                                              </span>
                                            )}
                                          </Link>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              ))
                            )
                          ) : (
                            (link.dropdown || []).map(sub => (
                              <Link key={sub.name} to={sub.href} onClick={handleLinkClick} className="block text-[12px] text-[#333] font-bold hover:text-[#E84949] transition-colors">{sub.name}</Link>
                            ))
                          )}
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Menu Footer Content Integrated into Single Scroll */}
                <div className="bg-[#FDF3E7]">
                  <div className="px-6 py-5 border-b border-[#333]/5">
                    <Link to={user ? "/account" : "/login"} onClick={handleLinkClick} className="flex items-center gap-3 text-[13px] font-bold text-[#333] uppercase tracking-widest">
                      <User size={18} className="text-[#333]" />
                      <span>{user ? 'My Account' : 'Log in'}</span>
                    </Link>
                  </div>


                  <div className="px-6 py-8 flex items-center gap-6">
                    {socialItems.map((item) => (
                      <a 
                        key={item.key} 
                        href={siteConfig.socialLinks[item.key]} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-[#333] hover:text-[#E84949] transition-colors"
                      >
                        <item.icon />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
