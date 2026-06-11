import { useEffect, useState } from 'react'
import { PolicyPageLayout } from '../components/layout/PolicyPageLayout'
import { getPageContent } from '../services/pageApi'
import { getStorefrontSettings } from '../services/siteApi'

export function ReturnPolicy() {
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [siteConfig, setSiteConfig] = useState(null)

  useEffect(() => {
    getStorefrontSettings().then(setSiteConfig).catch(console.error)
    const fetchContent = async () => {
      try {
        const data = await getPageContent('return-policy')
        setContent(data)
      } catch (err) {
        console.error('Failed to fetch return policy:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchContent()
  }, [])

  if (loading) {
    return (
      <PolicyPageLayout title="Return & Refund Policy" subtitle="Loading...">
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
          dangerouslySetInnerHTML={{ __html: content.content }}
        />
      </PolicyPageLayout>
    )
  }

  return (
    <PolicyPageLayout
      title="Return & Refund Policy"
      subtitle="Hassle-free Satisfaction"
    >
      <p className="text-[14px] text-[#888] font-medium">Return and Refund Policy for TOYOVO INDIA (OPC) PRIVATE LIMITED</p>

      <section className="space-y-4">
        <h2 className="text-[22px] md:text-[26px] font-grandstander font-bold text-[#333]">1. About TOYOVO INDIA (OPC) PRIVATE LIMITED</h2>
        <p>TOYOVO INDIA (OPC) PRIVATE LIMITED, a company incorporated under the laws of India, having its office at {siteConfig?.contactAddress || 'Unit 703, 7th Floor, Block 1 Mayagarden, Zirakpur, Rajpura, Mohali – 140603, Punjab'} ("Company"), operates <strong>www.toyovoindia.com</strong> ("Website"), which facilitates the purchase of toys and related products ("Products") for users ("Users").</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-[22px] md:text-[26px] font-grandstander font-bold text-[#333]">2. What Is This Return and Refund Policy?</h2>
        <p>This Return and Refund Policy, together with the Terms of Use, sets out our procedures and policies for accepting Product returns after delivery. Any return of Products shall be governed by this Return and Refund Policy.</p>
        <p>Users must understand this Return and Refund Policy. If you do not agree, do not accept the Terms of Use and stop using the Website. By initiating a purchase request, you agree to be bound by these terms.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-[22px] md:text-[26px] font-grandstander font-bold text-[#333]">3. Terms of Return and Refund</h2>

        <h3 className="text-[18px] font-grandstander font-bold text-[#333]">3.1 Return Period:</h3>
        <p>If you are dissatisfied with the purchased Product or there are defects (attributable to and accepted by us after verification at our sole discretion), you may initiate a return request on the Website within <strong>30 (thirty) days</strong> from delivery date. You may request a refund of money paid toward the purchase. You must produce a copy of the original invoice when placing a return or exchange request. Exchanged product will be delivered within <strong>10–15 days</strong>. We reserve the right to alter this Return and Refund Policy at any time without prior notice.</p>

        <h3 className="text-[18px] font-grandstander font-bold text-[#333]">3.2 Cancellation Before Dispatch:</h3>
        <p>You may fully or partially cancel orders before dispatch. After placing an order and handing Products to our logistics partner, you will receive a unique tracking number. To cancel before dispatch, reference the tracking number and email <a href={`mailto:${siteConfig?.contactEmail || 'toyovoindia@gmail.com'}`} className="text-[#E84949] hover:underline">{siteConfig?.contactEmail || 'toyovoindia@gmail.com'}</a>. We will initiate refunds within <strong>2 (two) business days</strong> from receiving your cancellation request. All refunds are subject to applicable bank charges.</p>

        <h3 className="text-[18px] font-grandstander font-bold text-[#333]">3.3 Bundled Packages:</h3>
        <p>If you purchased Products as part of a package or promotional bundle, you must return all Products in the bundle to process refunds. For example, if you purchased a toy car and toy truck as one promotional package, you must return both items, not just one.</p>

        <h3 className="text-[18px] font-grandstander font-bold text-[#333]">3.4 Limited Return Categories:</h3>
        <p>You can return the following categories only for <strong>manufacturing defects</strong>:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Electronic Products</li>
        </ul>

        <h3 className="text-[18px] font-grandstander font-bold text-[#333]">3.5 Returns Will Not Be Accepted If:</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>(a) The Product has been used for reasons apart from checking fit and comfort</li>
          <li>(b) Price tags, brand tags, box, original packaging material, and accessories have been damaged or discarded</li>
          <li>(c) Serial number/IMEI number/bar code does not match our records</li>
          <li>(d) Accessories delivered with the Product (chargers, remote, user manuals, etc.) are not returned in undamaged condition</li>
          <li>(e) There are dents, scratches, tears, or any other damage to Products</li>
          <li>(f) Electronics are not sealed in poly jiffy bag provided by us</li>
          <li>(g) Gifts accompanying the Product have not been returned or show signs of use or defect</li>
          <li>(h) We determine the Product has been rendered defective or unusable</li>
          <li>(i) Products are on our non-returnable list specified from time to time</li>
          <li>(j) Assorted products sold on the Website</li>
        </ul>

        <h3 className="text-[18px] font-grandstander font-bold text-[#333]">3.6 Quality Checks and Refund Processing:</h3>
        <p>We will initiate refunds if quality checks confirm the Product return entitles you to a refund. We are not required to refund Products deemed ineligible after quality checks.</p>

        <h3 className="text-[18px] font-grandstander font-bold text-[#333]">3.7 Refund Exclusions:</h3>
        <p>Refunds shall not include money paid toward shipping charges or other charges, except for Products with defects at delivery (for reasons attributable to and accepted by us after verification).</p>

        <h3 className="text-[18px] font-grandstander font-bold text-[#333]">3.8 Refund Status Updates:</h3>
        <p>We will make reasonable attempts to keep you informed of refund status through updates to your registered mobile number and email. We disclaim liabilities for failure to provide such updates.</p>

        <h3 className="text-[18px] font-grandstander font-bold text-[#333]">3.9 Missing Accessories:</h3>
        <p>If you return a Product without originally bundled accessories or gifts, we may (at our sole discretion):</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Refuse to accept the return</li>
          <li>Refuse to process any refund</li>
          <li>Deduct the amount of missing items from your refund</li>
        </ul>

        <h3 className="text-[18px] font-grandstander font-bold text-[#333]">3.10 Refund Timeline:</h3>
        <p>Subject to satisfactory quality checks, we will initiate refund requests. Approved refunds will be credited to the original payment method within <strong>5–7 business days</strong>. If undisputed, refunds should reflect in your bank account within a reasonable time (subject to your bank's policies) from when we initiate the refund.</p>

        <h3 className="text-[18px] font-grandstander font-bold text-[#333]">3.11 Refund Method:</h3>
        <p>Refunds are processed through normal banking channels. If you used multiple payment options, we will process refunds through a payment option we deem fit, at our sole discretion.</p>

        <h3 className="text-[18px] font-grandstander font-bold text-[#333]">3.12 Reverse Logistics:</h3>
        <p>Returns are facilitated through our reverse-logistics partners. After you request a return and we acknowledge it, our reverse-logistics partners will contact you to collect the Product and deliver it to us.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-[22px] md:text-[26px] font-grandstander font-bold text-[#333]">Grievance Redressal</h2>
        <p>Any grievances relating to this Return and Refund Policy may be directed to:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Email:</strong> <a href={`mailto:${siteConfig?.contactEmail || 'toyovoindia@gmail.com'}`} className="text-[#E84949] hover:underline">{siteConfig?.contactEmail || 'toyovoindia@gmail.com'}</a></li>
          <li><strong>Phone/WhatsApp:</strong> <a href={`tel:${siteConfig?.contactPhone?.replace('+91', '').trim() || ' 7901931534'}`} className="text-[#E84949] hover:underline">{siteConfig?.contactPhone?.replace('+91', '').trim() || ' 7901931534'}</a></li>
          <li><strong>Address:</strong> {siteConfig?.contactAddress || 'Unit 703, 7th Floor, Block 1 Mayagarden, Zirakpur, Rajpura, Mohali – 140603, Punjab'}</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-[22px] md:text-[26px] font-grandstander font-bold text-[#333]">Governing Law</h2>
        <p>This Return and Refund Policy is governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts at Zirakpur, India.</p>
      </section>
    </PolicyPageLayout>
  )
}
