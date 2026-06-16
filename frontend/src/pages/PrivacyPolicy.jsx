import { useEffect, useState } from 'react'
import { PolicyPageLayout } from '../components/layout/PolicyPageLayout'
import { getPageContent } from '../services/pageApi'
import { getStorefrontSettings } from '../services/siteApi'

export function PrivacyPolicy() {
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [siteConfig, setSiteConfig] = useState(null)

  useEffect(() => {
    getStorefrontSettings().then(setSiteConfig).catch(console.error)
    const fetchContent = async () => {
      try {
        const data = await getPageContent('privacy-policy')
        setContent(data)
      } catch (err) {
        console.error('Failed to fetch privacy policy:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchContent()
  }, [])

  if (loading) {
    return (
      <PolicyPageLayout title="Privacy Policy" subtitle="Loading...">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
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
      title="Privacy Policy"
      subtitle="Your Data Security"
    >
      <p className="text-[14px] text-[#888] font-medium">Privacy Policy for TOYOVO INDIA (OPC) PRIVATE LIMITED</p>

      <p className="leading-relaxed">The terms of this Privacy Policy ("Privacy Policy") govern the information practices for <strong>www.toyovoindia.com</strong> (the "Website").</p>

      <p className="leading-relaxed">TOYOVO INDIA (OPC) PRIVATE LIMITED (hereinafter referred to as "we", "us" or "our"), is a private company limited by shares incorporated under the Companies Act, with its office at {siteConfig?.contactAddress || 'Unit 703, 7th Floor, Block 1 Mayagarden, Zirakpur, Rajpura, Mohali – 140603, Punjab'}. We operate and own the Website. We are committed to protecting your privacy and have provided this Privacy Policy to inform you about how we collect, use, and protect information obtained from the Website.</p>

      <p className="leading-relaxed">Reference to "you" in this Privacy Policy refers to users of the Website, whether or not you access services available on the Website or complete a transaction. This Privacy Policy discloses our information practices, including the types of information collected, how it is collected, how it is used, and with whom it is shared.</p>

      <p className="leading-relaxed">By using or accessing this Website, you agree to the terms and conditions of this Privacy Policy. You expressly consent to our use and disclosure of your Personal Information (as defined below) as described in this Privacy Policy and acknowledge your agreement to this Privacy Policy and the Terms of Use. If you do not agree with the terms and conditions of this Privacy Policy, please do not use or access this Website.</p>

      <section className="space-y-4">
        <h2 className="text-[22px] md:text-[26px] font-grandstander font-bold text-[#333]">Definitions</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>"Force Majeure Event"</strong> means any event beyond our reasonable control, including but not limited to sabotage, fire, flood, explosion, acts of God, civil commotion, strikes, riots, insurrection, war, acts of government, computer hacking, unauthorized access, crashes, and breach of security.</li>
          <li><strong>"Personal Information"</strong> refers to any information that identifies or can be used to identify, contact, or locate a person, including but not limited to name, address, phone number, email address, and credit card information disclosed in relation to services available on the Website.</li>
          <li><strong>"Products"</strong> refers to toys and related products sold on the Website.</li>
          <li><strong>"Third Party"</strong> refers to any person or entity other than you or us.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-[22px] md:text-[26px] font-grandstander font-bold text-[#333]">Personal Information Collection and Use</h2>

        <h3 className="text-[18px] font-grandstander font-bold text-[#333]">1. Personal Information Provided During Website Use:</h3>
        <p>To access and purchase Products on the Website, we may collect your Personal Information as required for processing orders. We may disclose such Personal Information to Third Parties solely for purchase, sale, and delivery of Products in accordance with their terms and conditions.</p>

        <h3 className="text-[18px] font-grandstander font-bold text-[#333]">2. Personal Information Provided During Registration:</h3>
        <p>To provide a safe, efficient, and customized experience, you may complete an online registration form providing Personal Information. Registration allows you to make inquiries, subscribe to newsletters, access reviews, and participate in surveys. You will choose a user identity and password for future Website access.</p>
        <p>You may also register by logging into Third Party service provider accounts (e.g., Facebook). We will obtain Personal Information you have provided to the Third Party Account and use it to create your account and profile. Depending on privacy settings, information about your "friends" or connections may also be accessible.</p>

        <h3 className="text-[18px] font-grandstander font-bold text-[#333]">3. Cookies:</h3>
        <p>Cookies are small pieces of information saved by your browser. We use cookies to:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Authenticate your login information</li>
          <li>Personalize and customize your experience</li>
          <li>Enable security features</li>
          <li>Improve Website features and services</li>
        </ul>
        <p>You may change your browser settings to reject cookies, but this may affect your Website experience.</p>

        <h3 className="text-[18px] font-grandstander font-bold text-[#333]">4. Other Information Collected:</h3>
        <p>We may collect non-personal information to improve user experience, assist customer service, and prevent fraud. This may include IP address, server details, visit duration, date, time, and purpose of visit.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-[22px] md:text-[26px] font-grandstander font-bold text-[#333]">Sharing Information with Third Parties</h2>
        <p>To provide services on the Website, we may share your Personal Information with Third Party contractors working on our behalf, including online communications services, postal and courier service providers. These contractors may use and disclose Personal Information in accordance with their own privacy policies.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-[22px] md:text-[26px] font-grandstander font-bold text-[#333]">Communication</h2>
        <p>We may send email, SMS, MMS, or other communications about promotions, features, or information from our affiliates, partners, and sponsors. You may receive these by registering or subscribing to special features.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-[22px] md:text-[26px] font-grandstander font-bold text-[#333]">Legal Proceedings and Business Transfers</h2>
        <p>Your Personal Information may be disclosed in response to subpoenas, court orders, or legal processes. In the event of a sale, merger, or restructuring, your Personal Information may be transferred as a business asset.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-[22px] md:text-[26px] font-grandstander font-bold text-[#333]">Third Party Links</h2>
        <p>The Website may contain Third Party advertisements and links to other websites. We are not responsible for privacy practices or content of such Third Parties. We recommend reviewing their privacy policies before providing information.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-[22px] md:text-[26px] font-grandstander font-bold text-[#333]">Security</h2>
        <p>We strive to ensure security, integrity, and privacy of your Personal Information and protect it against unauthorized access, alteration, disclosure, or destruction. However, we are not responsible for loss, damage, or misuse attributable to Force Majeure Events or Third Party actions.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-[22px] md:text-[26px] font-grandstander font-bold text-[#333]">Children’s Privacy</h2>
        <p>The Website is not directed to individuals under 18. We do not knowingly collect Personal Information from children under 18. If we become aware of such collection, we will delete the information.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-[22px] md:text-[26px] font-grandstander font-bold text-[#333]">Changes to Privacy Policy</h2>
        <p>We reserve the right to change, modify, add, or delete portions of this Privacy Policy at any time. Your continued use of the Website constitutes acceptance of the amended Privacy Policy.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-[22px] md:text-[26px] font-grandstander font-bold text-[#333]">Governing Law</h2>
        <p>This Privacy Policy is governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts at Zirakpur, India.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-[22px] md:text-[26px] font-grandstander font-bold text-[#333]">Contact Us</h2>
        <p>For questions about this Privacy Policy, please contact us at:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Email:</strong> <a href={`mailto:${siteConfig?.contactEmail || 'toyovoindia@gmail.com'}`} className="text-[#E84949] hover:underline">{siteConfig?.contactEmail || 'toyovoindia@gmail.com'}</a></li>
          <li><strong>Phone/WhatsApp:</strong> <a href={`tel:${siteConfig?.contactPhone?.replace('+91', '').trim() || ' 7901931534'}`} className="text-[#E84949] hover:underline">{siteConfig?.contactPhone?.replace('+91', '').trim() || ' 7901931534'}</a></li>
          <li><strong>Address:</strong> {siteConfig?.contactAddress || 'Unit 703, 7th Floor, Block 1 Mayagarden, Zirakpur, Rajpura, Mohali – 140603, Punjab'}</li>
        </ul>
      </section>
    </PolicyPageLayout>
  )
}
