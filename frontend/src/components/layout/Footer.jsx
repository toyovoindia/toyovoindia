import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, Headset } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { subscribeToNewsletter } from '../../services/newsletterApi'
import { useAuth } from '../../context/AuthContext'
import { getStorefrontSettings } from '../../services/siteApi'

const FB = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
const IG = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
const TW = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
const YT = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
const PT = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 0a12 12 0 0 0-4.373 23.178c-.01-.937-.002-2.063.232-3.083l1.693-7.174s-.432-.864-.432-2.142c0-2.009 1.164-3.51 2.61-3.51 1.232 0 1.828.925 1.828 2.034 0 1.24-.79 3.095-1.197 4.812-.341 1.438.72 2.608 2.137 2.608 2.565 0 4.292-3.291 4.292-7.183 0-2.961-1.997-5.17-5.614-5.17-4.09 0-6.627 3.048-6.627 6.44 0 1.17.342 1.994.878 2.636a.35.35 0 0 1 .08.337c-.09.37-.289 1.44-.329 1.642-.052.26-.213.316-.49.19-1.816-.84-2.666-3.1-2.666-5.638 0-4.189 3.544-9.234 10.617-9.234 5.712 0 9.488 4.133 9.488 8.572 0 5.884-3.269 10.294-8.071 10.294-1.619 0-3.143-.878-3.664-1.87l-1.026 3.82c-.318 1.183-1.14 2.668-1.727 3.591A12 12 0 1 0 12 0z" /></svg>

const FooterAccordion = ({ title, children, isNewsletter = false }) => {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div className="w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex justify-between items-center group lg:pointer-events-none ${isNewsletter ? 'py-3 lg:py-0 lg:mb-6' : 'py-4 lg:py-0 lg:mb-6'}`}
      >
        <h4 className={`font-bold tracking-wide text-white text-left ${isNewsletter ? 'text-[17px] sm:text-[20px] lg:text-[28px] capitalize leading-snug pr-2 lg:pr-0' : 'text-[15px] lg:text-[16px] capitalize'}`}>{title}</h4>
        <div className="lg:hidden flex items-center justify-center text-white shrink-0">
          <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>
      <div className={`overflow-hidden transition-all duration-300 lg:max-h-none! lg:h-auto! lg:opacity-100! ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="pb-6 lg:pb-0">
          {children}
        </div>
      </div>
    </div>
  )
}

const PaymentBadges = () => (
  <div className="grid grid-cols-3 lg:flex lg:flex-wrap justify-center lg:justify-end gap-2 md:gap-3 w-full lg:w-auto px-2 lg:px-0">
    {[
      { name: 'Visa', url: 'https://www.logo.wine/a/logo/Visa_Inc./Visa_Inc.-Logo.wine.svg' },
      { name: 'Mastercard', url: 'https://www.logo.wine/a/logo/Mastercard/Mastercard-Logo.wine.svg' },
      { name: 'Google Pay', url: 'https://www.logo.wine/a/logo/Google_Pay/Google_Pay-Logo.wine.svg' },
      { name: 'PhonePe', url: 'https://www.logo.wine/a/logo/PhonePe/PhonePe-Logo.wine.svg' },
      { name: 'Paytm', url: 'https://www.logo.wine/a/logo/Paytm/Paytm-Logo.wine.svg' },
      { name: 'UPI', url: 'https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg' }
    ].map((icon) => (
      <div key={icon.name} className="bg-white rounded-md p-1.5 w-full lg:w-14 h-10 lg:h-9 flex items-center justify-center shadow-sm border border-black/5 shrink-0 overflow-hidden">
        <img src={icon.url} alt={icon.name} className="w-full h-full object-contain" />
      </div>
    ))}
  </div>
)

export function Footer() {
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { success, error } = useToast()

  const [siteConfig, setSiteConfig] = useState(null)
  const [isStandalone, setIsStandalone] = useState(false)

  // Update email if user logs in/out
  useEffect(() => {
    if (user?.email) setEmail(user.email)
    else setEmail('')

    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone)

    // Load site config for social links
    const loadConfig = async () => {
      try {
        const data = await getStorefrontSettings()
        setSiteConfig(data)
      } catch (err) {
        console.error('Failed to load footer config:', err)
      }
    }
    loadConfig()
  }, [user])

  const handleSubscribe = async (e) => {
    if (e) e.preventDefault()
    if (!email) return error('Please enter your email')

    setIsSubmitting(true)
    try {
      await subscribeToNewsletter(email)
      success('Thank you for subscribing! Check your email for your 10% discount code.')
      setEmail('')
    } catch (err) {
      error(err.message || 'Subscription failed. Please try again later.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <footer className="bg-[#6449A4] text-white">
      <div className="shell">
        <div className="flex flex-col lg:grid lg:grid-cols-[1.6fr_auto_0.7fr_0.7fr_0.9fr] xl:grid-cols-[1.8fr_auto_0.7fr_0.7fr_1fr] gap-x-4 lg:gap-x-8 gap-y-0">

          {/* Newsletter Column */}
          <div className="lg:pr-0 py-6 lg:py-16">
            <FooterAccordion
              title={user ? "Stay Updated With Our Latest Collections & News." : "Sign Up For News, Updates & 10% Off Your First Order."}
              isNewsletter={true}
            >
              <form onSubmit={handleSubscribe} className="flex flex-row gap-2 w-full max-w-xl mt-2 lg:mt-0">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full flex-1 h-11 px-3 sm:px-4 text-[14px] text-[#333] outline-none bg-white rounded-md placeholder:text-gray-500"
                  required
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`h-11 px-4 sm:px-6 bg-white text-[#333] text-[12px] sm:text-[13px] font-bold rounded-md hover:bg-[#E84949] hover:text-white transition-colors uppercase whitespace-nowrap ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? '...' : 'SUBSCRIBE'}
                </button>
              </form>

              <div className="flex gap-2.5 mt-8">
                {siteConfig?.socialLinks?.facebook && (
                  <a href={siteConfig.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-md bg-[#3B5998] flex items-center justify-center text-white hover:opacity-80 transition-opacity">
                    <FB />
                  </a>
                )}
                {siteConfig?.socialLinks?.instagram && (
                  <a href={siteConfig.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-md bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] flex items-center justify-center text-white hover:opacity-80 transition-opacity">
                    <IG />
                  </a>
                )}
                {siteConfig?.socialLinks?.youtube && (
                  <a href={siteConfig.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-md bg-[#FF0000] flex items-center justify-center text-white hover:opacity-80 transition-opacity">
                    <YT />
                  </a>
                )}
                {siteConfig?.socialLinks?.twitter && (
                  <a href={siteConfig.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-md bg-[#00ACEE] flex items-center justify-center text-white hover:opacity-80 transition-opacity">
                    <TW />
                  </a>
                )}
                {siteConfig?.socialLinks?.linkedin && (
                  <a href={siteConfig.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-md bg-[#0077b5] flex items-center justify-center text-white hover:opacity-80 transition-opacity">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                  </a>
                )}
              </div>
            </FooterAccordion>
          </div>

          {/* Vertical Dotted Divider (Desktop only) */}
          <div className="hidden lg:block w-px border-r border-dotted border-white/80 h-full"></div>

          {/* My Account */}
          <div className="lg:pl-8 py-2 lg:py-16">
            <FooterAccordion title="My Account">
              <ul className="flex flex-col gap-3">
                {[
                  { name: 'Return & exchange', href: '/pages/return-exchange' },
                  { name: 'Cancellation policy', href: '/pages/cancellation-policy' },
                  { name: 'Shipping policy', href: '/pages/shipping-policy' },
                  { name: 'Terms & condition', href: '/pages/terms-conditions' },
                  { name: 'Wishlist', href: '/wishlist' }
                ].map((item) => (
                  <li key={item.name}><Link to={item.href} className="text-white/80 text-[14px] hover:text-[#E84949] transition-colors">{item.name}</Link></li>
                ))}
              </ul>
            </FooterAccordion>
          </div>

          {/* Customer Service */}
          <div className="py-2 lg:py-16">
            <FooterAccordion title="Customer Service">
              <ul className="flex flex-col gap-3">
                {[
                  { name: 'About us', href: '/about' },
                  { name: 'Contact us', href: '/contact' },
                  { name: 'Faq\'s', href: '/pages/faq' },
                  { name: 'Privacy policy', href: '/pages/privacy-policy' }
                ].map((item) => (
                  <li key={item.name}><Link to={item.href} className="text-white/80 text-[14px] hover:text-[#E84949] transition-colors">{item.name}</Link></li>
                ))}
              </ul>
            </FooterAccordion>
          </div>

          {/* Contact Info */}
          <div className="py-2 lg:py-16">
            <FooterAccordion title="Contact Info">
              <div className="flex flex-col gap-5 text-[14px] text-white">
                <div className="flex gap-4 items-start">
                  <Headset size={32} strokeWidth={1} className="text-white shrink-0 mt-1" />
                  <div className="flex flex-col gap-1">
                    <span className="text-[13px] text-white/90">Hotline free 24/7:</span>
                    <span className="font-bold text-[18px] leading-none">{siteConfig?.contactPhone?.replace('+91', '').trim() || ' 7901931534'}</span>
                  </div>
                </div>
                <div className="mt-2">
                  <span className="font-bold uppercase text-[13px]">ADDRESS: </span>
                  <span className="text-white/90 text-[14px]">{siteConfig?.contactAddress || 'Unit 703, 7th Floor, Block 1 Mayagarden, Zirakpur, Rajpura, Mohali- 140603, Punjab'}</span>
                </div>
                <div>
                  <span className="font-bold uppercase text-[13px]">EMAIL: </span>
                  <a href={`mailto:${siteConfig?.contactEmail || 'toyovoindia@gmail.com'}`} className="text-white/90 text-[14px] hover:text-white">{siteConfig?.contactEmail || 'toyovoindia@gmail.com'}</a>
                </div>
              </div>
            </FooterAccordion>
          </div>

        </div>
      </div>

      {/* Bottom Bar Full Width */}
      <div className="w-full border-t border-dotted border-white/80 pb-20 lg:pb-0">
        <div className="shell py-6 flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-10">
            <div className="flex flex-col gap-2 text-center lg:text-left w-full lg:w-auto">
              {!isStandalone && (
                <a href="https://play.google.com/store/apps/details?id=com.toyovo.user" target="_blank" rel="noopener noreferrer" className="block hover:scale-105 transition-transform mx-auto lg:mx-0 w-[140px] md:w-[160px]">
                  <img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Get it on Google Play" className="w-full h-auto" />
                </a>
              )}
            </div>
            <div className="w-full lg:w-auto">
              <PaymentBadges />
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
