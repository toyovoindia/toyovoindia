import { useEffect, useState } from 'react'
import { PolicyPageLayout } from '../components/layout/PolicyPageLayout'
import { getPageContent } from '../services/pageApi'
import { getStorefrontSettings } from '../services/siteApi'

export function ShippingPolicy() {
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [siteConfig, setSiteConfig] = useState(null)

  useEffect(() => {
    getStorefrontSettings().then(setSiteConfig).catch(console.error)
    const fetchContent = async () => {
      try {
        const data = await getPageContent('shipping-policy')
        setContent(data)
      } catch (err) {
        console.error('Failed to fetch shipping policy:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchContent()
  }, [])

  if (loading) {
    return (
      <PolicyPageLayout title="Shipping Policy" subtitle="Loading...">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-full" />
        </div>
      </PolicyPageLayout>
    )
  }

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
      title="Shipping Policy"
      subtitle="Delivery & Logistics"
    >
      <p className="text-[14px] text-[#888] font-medium">Shipping Policy for TOYOVO INDIA (OPC) PRIVATE LIMITED</p>

      <section className="space-y-4">
        <h2 className="text-[22px] md:text-[26px] font-grandstander font-bold text-[#333]">1. Shipping Within India</h2>
        <p>We ship orders within <strong>15 working days</strong> of receiving orders. Our working days are <strong>Monday to Friday</strong>, excluding public holidays. Orders received on Sunday or holidays are dispatched the following Monday or next working day.</p>

        <h3 className="text-[18px] font-grandstander font-bold text-[#333] mt-4">Some Exceptions: Delivery time</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Metro cities Delivery Time :</strong> 3–5 days after shipping</li>
          <li><strong>Non-metros Delivery Time :</strong> 7–10 days after shipping</li>
          <li><strong>During busy periods Delivery Time :</strong> (holidays or unforeseen circumstances), there may be delays in processing your order</li>
          <li><strong>Out-of-stock items Delivery Time :</strong> Could take 2–6 weeks for dispatch</li>
        </ul>
        <p>In all cases, we will keep you informed via email or phone call.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-[22px] md:text-[26px] font-grandstander font-bold text-[#333]">2. International Shipping</h2>
        <p>We ship to most countries outside India, particularly the USA, Europe, Singapore, and the Middle East.</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Shipping and delivery costs</strong> are borne by the customer for international shipments</li>
          <li><strong>Handling charges</strong> may apply since products must go through airport clearance in India</li>
          <li>Costs depend on consignment weight and country/zone of delivery, indicated on the Checkout screen at <a href="https://toyovoindia.com" className="text-[#E84949] hover:underline">www.toyovoindia.com</a></li>
          <li>Customers must provide proper import documents required in the country of delivery</li>
          <li>You are solely responsible for getting clearance if customs authorities stop the consignment</li>
          <li>Due to numerous variables including country prerequisites and import clearance documents, we cannot estimate delivery time for international shipments</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-[22px] md:text-[26px] font-grandstander font-bold text-[#333]">Tracking Orders</h2>
        <p>After dispatch, you will receive a <strong>tracking number</strong> to monitor your order's delivery status.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-[22px] md:text-[26px] font-grandstander font-bold text-[#333]">Delivery Issues</h2>
        <p>If you experience delivery issues or delays, please contact us immediately:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Email:</strong> <a href={`mailto:${siteConfig?.contactEmail || 'toyovoindia@gmail.com'}`} className="text-[#E84949] hover:underline">{siteConfig?.contactEmail || 'toyovoindia@gmail.com'}</a></li>
          <li><strong>Phone/WhatsApp:</strong> <a href={`tel:${siteConfig?.contactPhone?.replace('+91', '').trim() || ' 7901931534'}`} className="text-[#E84949] hover:underline">{siteConfig?.contactPhone?.replace('+91', '').trim() || ' 7901931534'}</a></li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-[22px] md:text-[26px] font-grandstander font-bold text-[#333]">Governing Law</h2>
        <p>This Shipping Policy is governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts at Zirakpur, India.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-[22px] md:text-[26px] font-grandstander font-bold text-[#333]">Contact Us</h2>
        <p>For questions about this Shipping Policy, please contact us at:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Email:</strong> <a href={`mailto:${siteConfig?.contactEmail || 'toyovoindia@gmail.com'}`} className="text-[#E84949] hover:underline">{siteConfig?.contactEmail || 'toyovoindia@gmail.com'}</a></li>
          <li><strong>Phone/WhatsApp:</strong> <a href={`tel:${siteConfig?.contactPhone?.replace('+91', '').trim() || ' 7901931534'}`} className="text-[#E84949] hover:underline">{siteConfig?.contactPhone?.replace('+91', '').trim() || ' 7901931534'}</a></li>
          <li><strong>Address:</strong> {siteConfig?.contactAddress || 'Unit 703, 7th Floor, Block 1 Mayagarden, Zirakpur, Rajpura, Mohali – 140603, Punjab'}</li>
        </ul>
      </section>
    </PolicyPageLayout>
  )
}
