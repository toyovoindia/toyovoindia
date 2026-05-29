import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import heroImg from '../../assets/hero-section.webp'
import { getStorefrontSettings } from '../../services/siteApi'

/* ─── SVG Decorations ────────────────────────────────────────────── */
const Star = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="#FFD700" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
)
const Cloud = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="#a4e2f5" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M17.5 19C19.98 19 22 16.98 22 14.5C22 12.16 20.21 10.23 17.92 10.03C17.43 7.17 14.96 5 12 5C9.37 5 7.15 6.84 6.36 9.23C3.93 9.46 2 11.51 2 14C2 16.76 4.24 19 7 19H17.5Z" />
  </svg>
)
const Sun = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="#FFC107" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="5" />
    <path stroke="#FFC107" strokeWidth="2" strokeLinecap="round" d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
)
const Rocket = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="#FF5722" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M13.2 2.6c0 0-4.6 1.4-7 4.2C3.8 9.6 3 14 3 14l3.6-1.2L11 17.4 9.8 21s4.4-.8 7.2-3.2c2.8-2.4 4.2-7 4.2-7s-3-2.6-8-8.2z" fill="#FF5722" />
    <path d="M16 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" fill="#FFF" />
    <path d="M3 14l-1.8 5c-.3.8.5 1.5 1.3 1.2L7.3 18.5" fill="#FFC107" />
  </svg>
)

const Decorations = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    <div className="absolute right-[-15%] top-[-10%] w-[70%] h-[120%] bg-[#5B4694] rounded-[40%_60%_70%_30%/40%_50%_60%_50%] opacity-90 hidden md:block" />
    <svg className="absolute left-[5%] bottom-[8%] w-[45%] h-[25%] opacity-50 hidden md:block" viewBox="0 0 400 150" preserveAspectRatio="none">
      <path d="M 0 120 Q 150 150 250 80 T 400 30" stroke="white" strokeWidth="1.5" strokeDasharray="6 6" fill="none" />
    </svg>
    <Star className="float-a absolute top-[10%] left-[8%] w-6 h-6 md:w-8 md:h-8" />
    <Star className="float-b absolute top-[18%] left-[12%] w-4 h-4 md:w-6 md:h-6 opacity-70" />
    <Cloud className="float-a absolute top-[12%] left-[30%] w-12 h-12 md:w-16 md:h-16 hidden sm:block opacity-80" />
    <Sun className="float-b absolute top-[6%] left-[25%] md:top-[10%] md:left-[55%] w-16 h-16 md:w-20 md:h-20 drop-shadow-[0_0_15px_rgba(255,200,0,0.6)]" />
    <Cloud className="float-a absolute top-[8%] right-[8%] md:right-[15%] w-10 h-10 md:w-14 md:h-14 opacity-90" />
    <svg className="float-a absolute bottom-[25%] right-[6%] w-16 h-16 hidden md:block opacity-90" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
      <path d="M4 18v-2a8 8 0 0 1 16 0v2" stroke="#FF5722" />
      <path d="M7 18v-1a5 5 0 0 1 10 0v1" stroke="#FFC107" />
      <path d="M10 18v0a2 2 0 0 1 4 0v0" stroke="#4BBFB8" />
    </svg>
    <Rocket className="float-b absolute bottom-[18%] left-[10%] md:left-[35%] w-12 h-12 md:w-16 md:h-16 transform -rotate-12" />
    <div className="absolute bottom-[5%] md:bottom-[8%] left-[50%] md:left-[46%] transform -translate-x-1/2 md:translate-x-0 flex gap-[6px] items-center">
      <div className="w-[16px] md:w-[20px] h-[3px] bg-[#E84040] rounded-sm" />
      <div className="w-[8px] md:w-[12px] h-[3px] bg-white/60 rounded-sm" />
    </div>
  </div>
)

/* ─── Hero Text ──────────────────────────────────────────────────── */
const HeroText = () => (
  <div className="w-[100%] sm:w-[80%] md:w-[60%] lg:w-[50%] relative z-20 flex flex-col items-start text-left pointer-events-auto mt-[-15%] md:mt-0">
    <motion.p
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-white font-medium text-[11px] md:text-[12px] lg:text-[13px] tracking-[0.2em] mb-3 md:mb-4 font-roboto uppercase"
    >
      Selected Items Online Only.
    </motion.p>
    <motion.h1
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, delay: 0.1 }}
      className="text-white font-bold mb-5 sm:mb-6 lg:mb-8 whitespace-nowrap"
      style={{
        fontFamily: 'var(--font-header)',
        textShadow: '0 2px 4px rgba(0,0,0,0.12)',
        lineHeight: 1.05,
        fontSize: 'clamp(32px, 7vw, 68px)',
        letterSpacing: '-0.04em',
      }}
    >
      Find The Best Toys<br />
      For Your Kids
    </motion.h1>
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.28 }}
      className="w-fit"
    >
      <Link
        to="/all-categories"
        className="py-3 px-8 md:py-4 md:px-12 lg:py-5 lg:px-16 bg-white text-[#222] font-bold text-[11px] md:text-sm lg:text-[14px] uppercase rounded-md hover:bg-gray-50 hover:scale-[1.02] active:scale-95 transition-all duration-300 shadow-md cursor-pointer tracking-[0.15em] inline-block"
      >
        SHOP NOW
      </Link>
    </motion.div>
  </div>
)

/* ─── Toy graphic (right side) ───────────────────────────────────── */
const ToyGraphic = ({ visible }) => (
  <div
    className="absolute bottom-[0%] right-[-25%] sm:right-[-10%] md:right-[-5%] lg:right-[0%] w-[125%] sm:w-[95%] md:w-[70%] lg:w-[60%] z-10 pointer-events-none flex justify-end items-end h-[95%]"
    style={{ opacity: visible ? 1 : 0, transition: 'opacity 900ms ease-in-out' }}
  >
    <img
      src={heroImg}
      alt="Hero Graphic"
      className="w-full h-full max-w-none object-contain object-right-bottom drop-shadow-[0_25px_25px_rgba(0,0,0,0.4)]"
      onError={(e) => {
        e.target.src = 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&q=80&w=800'
      }}
    />
  </div>
)

/* ─── Helpers ────────────────────────────────────────────────────── */
const DEFAULT_DURATION = 5000  // default hero gets 5 s
const IMAGE_DURATION   = 3000  // each DB image gets 3 s

function preloadImages(urls) {
  urls.forEach(url => {
    const img = new window.Image()
    img.src = url
  })
}

/* ─── Main Export ────────────────────────────────────────────────── */
export function HeroSection() {
  // slides: [{ type:'default' } , { type:'image', url, alt }, ...]
  const [slides, setSlides]     = useState([{ type: 'default' }])
  const [current, setCurrent]   = useState(0)
  const [ready, setReady]       = useState(false)   // true once images preloaded
  const [paused, setPaused]     = useState(false)
  const timerRef                = useRef(null)

  /* Load config + preload images, then mark ready */
  useEffect(() => {
    // Always show default first — slides already seeded with [{type:'default'}]
    getStorefrontSettings()
      .then(data => {
        const media        = data?.storefrontMedia || {}
        const showDefault  = media.showDefaultHero !== false
        const banners      = (media.heroBanners || []).filter(b => b?.url)

        // Preload all DB images in background immediately
        if (banners.length > 0) preloadImages(banners.map(b => b.url))

        // Build slide deck
        const deck = []
        if (showDefault || banners.length === 0) deck.push({ type: 'default' })
        banners.forEach(b => deck.push({ type: 'image', url: b.url, alt: b.alt || '' }))

        setSlides(deck)
        setReady(true)
      })
      .catch(() => {
        // Fallback: just default hero
        setSlides([{ type: 'default' }])
        setReady(true)
      })
  }, [])

  /* Per-slide timer — uses setTimeout so each slide can have its own duration */
  useEffect(() => {
    if (!ready || paused || slides.length <= 1) return
    const duration = slides[current]?.type === 'default' ? DEFAULT_DURATION : IMAGE_DURATION
    timerRef.current = setTimeout(() => {
      setCurrent(c => (c + 1) % slides.length)
    }, duration)
    return () => clearTimeout(timerRef.current)
  }, [current, slides, paused, ready])

  const isDefault = slides[current]?.type === 'default'

  return (
    <section
      className="relative bg-brand-purple overflow-hidden h-[calc(40vh-104px)] sm:h-[calc(45vh-104px)] md:h-[calc(55vh-104px)] lg:h-[calc(100vh-104px)] lg:min-h-[650px] min-h-[320px] w-full flex items-center"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* ── Layer 0: decorations always rendered ── */}
      <Decorations />

      {/* ── Layer 1: all DB image slides stacked — only current is opaque ── */}
      {slides.map((slide, i) => {
        if (slide.type !== 'image') return null
        const isActive = i === current
        return (
          <div
            key={slide.url}
            aria-hidden={!isActive}
            className="absolute inset-0 z-10"
            style={{
              opacity: isActive ? 1 : 0,
              transition: 'opacity 900ms ease-in-out',
              pointerEvents: 'none',
              willChange: 'opacity',
            }}
          >
            <img
              src={slide.url}
              alt={slide.alt || `Slide ${i}`}
              className="absolute inset-0 w-full h-full object-cover object-center"
              loading="eager"
            />
            {/* Gradient so text stays readable over any image */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-transparent" />
          </div>
        )
      })}

      {/* ── Layer 2: toy graphic — fades out when on image slide ── */}
      <ToyGraphic visible={isDefault} />

      {/* ── Layer 3: text (always on top) ── */}
      <div className="hdr-inner relative z-20 w-full h-full flex items-center">
        <HeroText />
      </div>

      {/* ── Layer 4: dot indicators ── */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => { clearTimeout(timerRef.current); setCurrent(i) }}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'}`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}