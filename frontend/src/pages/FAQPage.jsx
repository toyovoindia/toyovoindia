import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'
import { PolicyPageLayout } from '../components/layout/PolicyPageLayout'
import { getPageContent } from '../services/pageApi'

import { Link } from 'react-router-dom'

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border-b border-[#E5E5E5] py-6 last:border-b-0">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex justify-between items-center text-left group"
      >
        <span className="font-grandstander font-bold text-[18px] text-[#333333] group-hover:text-[#E84949] transition-colors leading-tight">
          {question}
        </span>
        <div className={`w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center transition-all shrink-0 ${isOpen ? 'bg-[#E84949] border-[#E84949] text-white' : 'text-gray-400 group-hover:border-[#E84949] group-hover:text-[#E84949]'}`}>
          {isOpen ? <Minus size={14} /> : <Plus size={14} />}
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }} 
            className="overflow-hidden"
          >
            <p className="pt-6 text-[15px] leading-relaxed text-[#666666] font-roboto italic">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function FAQPage() {
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.scrollTo(0, 0)
    const fetchContent = async () => {
      try {
        const data = await getPageContent('faq')
        setContent(data)
      } catch (err) {
        console.error('Failed to fetch FAQ content:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchContent()
  }, [])

  const faqs = [
    {
      q: "What age groups are your toys designed for?",
      a: "Our toy collection spans from newborns to 12-year-olds! Each product page specifies the recommended age range. We have everything from soft infant toys to complex STEM kits for older children."
    },
    {
      q: "Are the materials used in your toys safe and eco-friendly?",
      a: "Yes, absolutely! Safety is our top priority. Most of our toys are made from sustainably sourced wood, organic cotton, or BPA-free recycled plastics. Every toy meets or exceeds international safety standards."
    },
    {
      q: "Do you offer gift wrapping and personalized messages?",
      a: "We certainly do! During the checkout process, you'll see an option to add a gift wrap and a handwritten note to your order for a small additional fee."
    },
    {
      q: "How long does shipping typically take?",
      a: "Standard shipping within India usually takes 3-5 business days. Express shipping options are available for 1-2 day delivery in most major cities."
    },
    {
      q: "Can I return a toy if my child doesn't like it?",
      a: "Yes! We have a 30-day no-hassle return policy for items in their original packaging. Please check our Return Policy page for the full details."
    },
    {
      q: "How can I track my order?",
      a: "Once your order is shipped, we'll send you an email with a tracking number and a link to the carrier's website where you can follow its progress in real-time."
    }
  ]

  if (content) {
    return (
      <PolicyPageLayout
        title={content.title}
        subtitle={`Last updated: ${new Date(content.updatedAt).toLocaleDateString()}`}
      >
        <div
          className="dynamic-content prose prose-orange max-w-none"
          dangerouslySetInnerHTML={{ 
            __html: content.content 
              ? content.content
                  .replace(/font-family\s*:\s*[^;"]+;?/gi, '')
                  .replace(/face\s*=\s*['"][^'"]*['"]/gi, '')
                  .replace(/\u00a0/g, ' ')
                  .replace(/&nbsp;/g, ' ') 
              : '' 
          }}
        />
      </PolicyPageLayout>
    )
  }

  return (
    <PolicyPageLayout 
      title="Frequently Asked Questions" 
      subtitle="Help & Support"
    >
      <div className="space-y-2">
        {faqs.map((faq, index) => (
          <FAQItem key={index} question={faq.q} answer={faq.a} />
        ))}
      </div>
      
      <div className="mt-12 p-8 bg-[#F9EAD3] rounded-3xl border-[1.6px] border-dashed border-[#333333]/15 text-center">
        <h3 className="text-xl font-grandstander font-bold text-[#333] mb-4">Still have questions?</h3>
        <p className="mb-6 font-roboto text-[15px] text-[#666]">Our friendly support team is always ready to help you find the perfect toy.</p>
        <Link 
          to="/contact"
          className="inline-flex h-12 px-10 bg-[#E84949] text-white rounded-full font-bold text-[12px] tracking-[0.2em] uppercase hover:bg-[#333] transition-all items-center justify-center"
        >
          Contact Support
        </Link>
      </div>
    </PolicyPageLayout>
  )
}
