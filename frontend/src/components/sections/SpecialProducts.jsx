import { useState } from 'react'
import { motion } from 'framer-motion'
import { ProductCard } from '../ui/ProductCard'
import { useEffect } from 'react'
import { getFeaturedProducts, getNewArrivalProducts } from '../../services/catalogApi'

const tabs = ['Featured', 'New Arrival']

export function SpecialProducts() {
  const [activeTab, setActiveTab] = useState('Featured')
  const [products, setProducts] = useState({
    Featured: [],
    'New Arrival': [],
  })

  useEffect(() => {
    let isMounted = true

    const loadProducts = async () => {
      try {
        const [featured, arrivals] = await Promise.all([
          getFeaturedProducts(),
          getNewArrivalProducts(),
        ])

        if (isMounted) {
          setProducts({
            Featured: featured,
            'New Arrival': arrivals,
          })
        }
      } catch {
        if (isMounted) {
          setProducts({
            Featured: [],
            'New Arrival': [],
          })
        }
      }
    }

    loadProducts()
    return () => {
      isMounted = false
    }
  }, [])

  return (
    <section className="pt-4 pb-4 md:pt-6 md:pb-8 bg-brand-cream border-t border-dashed border-gray-200">
      <div className="shell">
        <div className="text-center mb-8">
          <p className="text-brand-orange font-bold text-[11px] tracking-[0.25em] mb-2 font-roboto uppercase">Shop Collection</p>
          <h2 className="font-grandstander text-[28px] md:text-[40px] font-bold text-brand-ink tracking-tight">Special Products</h2>
          <div className="flex items-center justify-center gap-2 mt-6">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab(tab);
                }}
                className={`h-9 px-6 rounded-md text-[13px] font-bold transition-all duration-200 shadow-md font-grandstander ${activeTab === tab
                  ? 'bg-[#F1641E] text-white border border-[#F1641E]'
                  : 'bg-[#1A1A1A] text-white border border-[#1A1A1A] hover:bg-[#6651A4] hover:border-[#6651A4]'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
        >
          {products[activeTab].map((p, i) => (
            <ProductCard key={p.id} p={p} i={i} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
