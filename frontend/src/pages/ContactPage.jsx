import { useEffect, useState } from 'react'
import { MapPin, Phone, Mail, Clock } from 'lucide-react'
import { submitContactMessage } from '../services/messageApi'
import { getStorefrontSettings } from '../services/siteApi'

const ContactInfoItem = ({ icon: Icon, title, content }) => (
  <div className="flex items-start gap-4 py-4 group">
    <div className="text-[#333333] mt-1 group-hover:text-[#E84949] transition-colors">
      <Icon size={20} strokeWidth={1.5} />
    </div>
    <div className="font-roboto">
      <h3 className="text-[17px] font-grandstander font-bold text-[#333333] mb-1 tracking-tight group-hover:text-[#E84949] transition-colors">{title}</h3>
      <p className="text-[15px] text-[#666] leading-relaxed whitespace-pre-line">{content}</p>
    </div>
  </div>
)

export function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [siteConfig, setSiteConfig] = useState(null)

  useEffect(() => {
    window.scrollTo(0, 0)
    getStorefrontSettings().then(setSiteConfig).catch(console.error)
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setFeedback('')
    try {
      await submitContactMessage({
        ...formData,
        type: 'contact',
        subject: formData.subject || 'Contact Form Enquiry',
      })
      setFeedback('Message sent successfully.')
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      })
    } catch (error) {
      setFeedback(error.message || 'Message could not be sent.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-[#FDF4E6] pb-24 overflow-x-hidden">

      {/* Map Header - Full Width */}
      <div className="w-full h-100 md:h-125 bg-gray-200 overflow-hidden relative grayscale-[0.2] border-b border-[#E5E5E5]">
        <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13728.484247833054!2d76.81491746682662!3d30.651528642738942!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390f94d01f1f51f1%3A0x6e2f1f1f1f1f1f1f!2sZirakpur%2C%20Punjab!5e0!3m2!1sen!2sin!4v1714201000000!5m2!1sen!2sin"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
          title="Google Map"
        ></iframe>
      </div>

      <div className="shell">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-32 mt-12 md:mt-20">

          {/* Left Column: Our Information */}
          <div className="flex flex-col gap-8">
            <h2 className="text-[32px] md:text-[42px] font-grandstander font-bold text-[#333333] leading-tight tracking-tight">Our Information</h2>
            <p className="text-[15px] text-[#666] leading-relaxed font-roboto">
               TOYOVO INDIA (OPC) PRIVATE LIMITED is an officially registered enterprise committed to bringing high-quality toys and joy to families across India. We believe in creativity, safety, and endless smiles.
            </p>

            <div className="mt-4 flex flex-col gap-2">
              <ContactInfoItem
                icon={MapPin}
                title="Address"
                content={siteConfig?.contactAddress || "Unit 703, 7th Floor, Block 1 Mayagarden, Zirakpur, Rajpura, Mohali- 140603, Punjab"}
              />
              <ContactInfoItem
                icon={Phone}
                title="Phone"
                content={siteConfig?.contactPhone?.replace('+91', '').trim() || "8814040056"}
              />
              <ContactInfoItem
                icon={Mail}
                title="Email"
                content={siteConfig?.contactEmail || "toyovoindia@gmail.com"}
              />
              <ContactInfoItem
                icon={Clock}
                title="Open Hours"
                content="Monday To Friday 09:30 - 18:30 Saturday & Sunday 10:00 - 17:00"
              />
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="flex flex-col gap-8">
            <h2 className="text-[32px] md:text-[42px] font-grandstander font-bold text-[#333333] leading-tight tracking-tight">Contact Form</h2>

            <form className="space-y-6 font-roboto" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <input
                  type="text"
                  name="name"
                  placeholder="Name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full h-13.5 bg-[#F9EAD3] border-[1.2px] border-[#333333]/20 rounded-md px-6 text-[14px] focus:outline-none focus:border-[#333333] transition-all"
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full h-13.5 bg-[#F9EAD3] border-[1.2px] border-[#333333]/20 rounded-md px-6 text-[14px] focus:outline-none focus:border-[#333333] transition-all"
                />
              </div>
              <input
                type="tel"
                name="phone"
                placeholder="Phone number"
                value={formData.phone}
                onChange={handleChange}
                className="w-full h-13.5 bg-[#F9EAD3] border-[1.2px] border-[#333333]/20 rounded-md px-6 text-[14px] focus:outline-none focus:border-[#333333] transition-all"
              />
              <input
                type="text"
                name="subject"
                placeholder="Subject"
                value={formData.subject}
                onChange={handleChange}
                className="w-full h-13.5 bg-[#F9EAD3] border-[1.2px] border-[#333333]/20 rounded-md px-6 text-[14px] focus:outline-none focus:border-[#333333] transition-all"
              />
              <textarea
                rows="6"
                name="message"
                placeholder="Comment"
                value={formData.message}
                onChange={handleChange}
                className="w-full bg-[#F9EAD3] border-[1.2px] border-[#333333]/20 rounded-md p-6 text-[14px] focus:outline-none focus:border-[#333333] transition-all resize-none"
              ></textarea>

              <div className="pt-4">
                <button disabled={submitting} className="h-13.5 px-12 bg-[#E84949] text-white rounded-md font-bold text-[13px] tracking-[0.2em] uppercase hover:bg-[#333333] transition-all shadow-md disabled:opacity-60">
                  {submitting ? 'SENDING...' : 'SEND MESSAGE'}
                </button>
                {feedback && (
                  <p className="mt-4 text-[13px] font-medium text-[#333333]">{feedback}</p>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
