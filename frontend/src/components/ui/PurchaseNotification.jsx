import React, { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle2, Clock } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { getPurchasePopupSettings } from '../../services/siteApi'

const formatRelativeTime = (value) => {
  if (!value) return 'recently'
  const createdAt = new Date(value).getTime()
  const diffMinutes = Math.max(1, Math.round((Date.now() - createdAt) / 60000))
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`
  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  const diffDays = Math.round(diffHours / 24)
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
}

export function PurchaseNotification() {
  const location = useLocation()
  const [popupConfig, setPopupConfig] = useState({
    enabled: false,
    initialDelaySeconds: 60,
    repeatDelaySeconds: 120,
    visibleDurationSeconds: 10,
    maskNames: true,
  })
  const [activities, setActivities] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [hasBeenClosed, setHasBeenClosed] = useState(false)

  useEffect(() => {
    let isMounted = true

    const loadPopupData = async () => {
      try {
        const data = await getPurchasePopupSettings()
        if (!isMounted) return
        setPopupConfig(data.settings || popupConfig)
        setActivities(data.activities || [])
      } catch {
        if (!isMounted) return
        setActivities([])
      }
    }

    loadPopupData()
    return () => {
      isMounted = false
    }
  }, [])

  const visibleActivities = useMemo(
    () => activities.filter((activity) => activity.status !== 'Hidden'),
    [activities],
  )

  useEffect(() => {
    if (hasBeenClosed || !popupConfig.enabled || visibleActivities.length === 0) return undefined

    const initialTimeout = setTimeout(() => {
      setIsVisible(true)
    }, Math.max(0, popupConfig.initialDelaySeconds) * 1000)

    return () => clearTimeout(initialTimeout)
  }, [hasBeenClosed, popupConfig.enabled, popupConfig.initialDelaySeconds, visibleActivities.length])

  useEffect(() => {
    if (hasBeenClosed || !isVisible || visibleActivities.length === 0) return undefined

    const hideTimeout = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % visibleActivities.length)
        setIsVisible(true)
      }, Math.max(30, popupConfig.repeatDelaySeconds) * 1000)
    }, Math.max(5, popupConfig.visibleDurationSeconds) * 1000)

    return () => clearTimeout(hideTimeout)
  }, [isVisible, hasBeenClosed, popupConfig.repeatDelaySeconds, popupConfig.visibleDurationSeconds, visibleActivities.length])

  const currentPurchase = visibleActivities[currentIndex]
  const isHiddenRoute = location.pathname === '/login' || location.pathname.startsWith('/admin')

  if (!popupConfig.enabled || !currentPurchase || isHiddenRoute) return null

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: -100, y: 0 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-[84px] md:bottom-6 left-5 md:left-6 z-[1001] w-[280px] md:w-[350px]"
        >
          <div className="bg-[#FFF8EE] border border-[#333]/10 rounded-2xl p-3 md:p-4 shadow-[0_10px_30px_rgba(0,0,0,0.08)] relative group">
            <button
              onClick={() => {
                setIsVisible(false)
                setHasBeenClosed(true)
              }}
              className="absolute -top-2 -right-2 w-6 h-6 bg-[#E84949] text-white flex items-center justify-center rounded-lg shadow-lg hover:scale-110 transition-all z-50"
            >
              <X size={14} strokeWidth={3} />
            </button>

            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-[#F9EAD3] rounded-2xl flex-shrink-0 p-1.5 overflow-hidden">
                {currentPurchase.image ? (
                  <img
                    src={currentPurchase.image}
                    alt={currentPurchase.product || 'Toy'}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <div className="w-full h-full rounded-xl bg-white" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-[12px] md:text-[14px] text-[#64748B] font-medium leading-none border-b border-dashed border-[#333]/10 pb-2 mb-2 flex items-center justify-between pr-2">
                  {currentPurchase.name} purchased from {currentPurchase.city}
                </div>

                <h4 className="text-[14px] md:text-[16px] font-grandstander font-bold text-[#333] truncate">
                  {currentPurchase.product}
                </h4>

                <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                  <div className="flex items-center gap-1.5 text-[11px] md:text-[12px] text-[#666]">
                    <Clock size={13} className="opacity-60" />
                    <span>{formatRelativeTime(currentPurchase.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] md:text-[12px] font-bold text-[#E84949]">
                    <div className="w-4 h-4 rounded-full bg-[#E84949]/10 flex items-center justify-center">
                      <CheckCircle2 size={11} strokeWidth={3} />
                    </div>
                    <span>Verified</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
