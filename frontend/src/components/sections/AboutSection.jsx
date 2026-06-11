import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'
import { Link } from 'react-router-dom'

const faqs = [
  {
    q: 'Safety Packaging',
    a: 'All products undergo a rigorous scientific evaluation to meet our strict standards for purity, potency, and efficacy via being together the best of nature and science to create a truly harmonious experience.'
  },
  {
    q: '100% Warranty Product',
    a: 'Every single product sold on TOYOVO INDIA (OPC) PRIVATE LIMITED comes with a 100% satisfaction guarantee. If you are not happy, we will make it right — no questions asked.'
  },
  {
    q: 'Premium Product',
    a: 'All products undergo a rigorous scientific evaluation to meet our strict standards for purity, potency, and efficacy via being together the best of nature and science to create a truly harmonious experience.'
  },
]

const bottomImages = [
  'https://images.unsplash.com/photo-1563396983906-b3795482a59a?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1545558014-8692077e9b5c?auto=format&fit=crop&q=80&w=400',
]

export function AboutSection() {
  const [open, setOpen] = useState(2)

  return (
  <section className="py-16 md:py-24">
      <div className="shell grid grid-cols-1 lg:grid-cols-10 gap-12 lg:gap-16 xl:gap-32">
        {/* Left Side: Images */}
        <div className="lg:col-span-6">
          <div className="grid grid-cols-1 gap-4">
            {bottomImages.map((src, i) => (
              <div key={i} className="overflow-hidden rounded-3xl border border-[#333]/10">
                <img src={src} alt={`Toy Store ${i + 1}`} className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Content */}
        <div className="lg:col-span-4">
          <div className="space-y-10">
            {/* Subtitle */}
            <p className="text-[#E84949] font-medium text-[12px] md:text-[14px] uppercase tracking-[0.4em] font-roboto">
              What Makes Toyovo Special
            </p>

            {/* Main Title */}
            <h2 className="text-4xl md:text-5xl font-grandstander font-bold text-[#333333] leading-[1.2]">
              Our Commitment
            </h2>

            {/* FAQs */}
            <div className="space-y-4">
              {faqs.map((item, idx) => (
                <div key={idx} className="overflow-hidden rounded-3xl border border-[#333]/10">
                  <div
                    className="p-6 md:p-8 bg-[#FDF4E6] cursor-pointer flex justify-between items-center"
                    onClick={() => setOpen(open === idx ? null : idx)}
                  >
                    <span className="text-[16px] md:text-[18px] font-grandstander font-semibold text-[#333333]">{item.q}</span>
                    {open === idx ? <Minus className="text-[#E84949]" size={20} /> : <Plus className="text-[#E84949]" size={20} />}
                  </div>

                  <AnimatePresence>
                    {open === idx && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <p className="px-6 pb-6 md:px-8 md:pb-8 text-[14px] md:text-[16px] leading-relaxed text-[#666666] font-roboto border-t border-[#333]/5">
                          {item.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* Contact Button */}
            <Link to="/contact" className="inline-block">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-[#E84949] text-white font-bold text-[16px] md:text-[18px] uppercase tracking-[0.2em] rounded-lg hover:bg-[#d33f3f] transition-colors duration-300 font-roboto shadow-lg shadow-[#E84949]/20"
              >
                Contact Us
              </motion.button>
            </Link>
          </div>
        </div>
      </div>
    </section>
)
}
