import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Heart, Home, User, Layers, ArrowUp } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export function MobileBottomBar() {
  const [showNav, setShowNav] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShowNav(window.scrollY > 60)
    }

    const handleResize = () => {
      // If the viewport height decreases significantly, the keyboard is likely open
      if (window.visualViewport) {
        setIsKeyboardOpen(window.visualViewport.height < window.innerHeight * 0.8)
      }
    }

    window.addEventListener('scroll', handleScroll)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize)
    }
    
    handleScroll()
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize)
      }
    }
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const menuItems = [
    { icon: <ShoppingBag size={20} />, path: '/cart', label: 'Cart' },
    { icon: <Heart size={20} />, path: '/wishlist', label: 'Wishlist' },
    { icon: <Home size={20} />, path: '/', label: 'Home' },
    { icon: <User size={20} />, path: '/account', label: 'Account' },
    { icon: <Layers size={20} />, path: '/collections/educational-toy', label: 'Explore' },
  ]

  return (
    <>
      <AnimatePresence>
        {showNav && !isKeyboardOpen && (
          <>
            {/* Scroll To Top Button */}
            <motion.button
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              onClick={scrollToTop}
              className="md:hidden fixed bottom-20 right-5 z-[999] w-12 h-12 bg-white border-2 border-dashed border-[#333]/30 rounded-xl flex items-center justify-center text-[#333] shadow-lg hover:bg-[#E84949] hover:text-white transition-all cursor-pointer"
            >
              <ArrowUp size={24} />
            </motion.button>

            {/* Bottom Navigation Bar */}
            <motion.div 
              initial={{ y: 80 }}
              animate={{ y: 0 }}
              exit={{ y: 80 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="md:hidden fixed bottom-0 left-0 right-0 z-[1000] bg-[#FDF4E6] border-t border-gray-200 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] h-16"
            >
              <div className="flex items-center justify-around h-full">
                {menuItems.map((item, index) => {
                  const isActive = location.pathname === item.path
                  return (
                    <React.Fragment key={index}>
                      <Link 
                        to={item.path}
                        onClick={(e) => {
                          if (item.path === '/wishlist' && !user) {
                            e.preventDefault()
                            navigate('/login')
                          }
                        }}
                        className={`flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${isActive ? 'text-[#E84949]' : 'text-[#333]/60 hover:text-[#E84949]'}`}
                      >
                        <div className={`${isActive ? 'scale-110' : 'scale-100'} transition-transform`}>
                          {item.icon}
                        </div>
                      </Link>
                      {index < menuItems.length - 1 && (
                        <div className="h-8 w-[1px] bg-gray-300/50 shrink-0" />
                      )}
                    </React.Fragment>
                  )
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
