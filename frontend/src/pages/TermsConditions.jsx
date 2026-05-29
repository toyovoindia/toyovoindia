import { useEffect, useState } from 'react'
import { PolicyPageLayout } from '../components/layout/PolicyPageLayout'
import { getPageContent } from '../services/pageApi'
import { getStorefrontSettings } from '../services/siteApi'

export function TermsConditions() {
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [siteConfig, setSiteConfig] = useState(null)

  useEffect(() => {
    getStorefrontSettings().then(setSiteConfig).catch(console.error)
    const fetchContent = async () => {
      try {
        const data = await getPageContent('terms-conditions')
        setContent(data)
      } catch (err) {
        console.error('Failed to fetch terms:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchContent()
  }, [])

  if (loading) {
    return (
      <PolicyPageLayout title="Terms & Conditions" subtitle="Loading...">
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
      title="Terms & Conditions"
      subtitle="Website Usage Policy"
    >
      <p className="text-[14px] text-[#888] font-medium">Terms and Conditions for TOYOVO INDIA (OPC) PRIVATE LIMITED</p>

      <p className="leading-relaxed">These "Terms and Conditions" govern your use of <strong>www.toyovoindia.com</strong> (the "Website").</p>

      <p className="leading-relaxed">Please read these Terms of Use carefully before accessing, downloading, installing, or using the Website or purchasing any products. If you do not agree to these Terms of Use, you may not access, install, download, or use the Website or purchase products available on the Website.</p>

      <p className="leading-relaxed">By accessing, installing, downloading, or using the Website or purchasing products, you signify your acceptance of these Terms of Use and Privacy Policy (incorporated herein by reference), creating a legally binding arrangement.</p>

      <p className="leading-relaxed">The Website is operated and owned by TOYOVO INDIA (OPC) PRIVATE LIMITED (hereinafter referred to as "we", "us" or "our"), having its office at {siteConfig?.contactAddress || 'Unit 703, 7th Floor, Block 1 Mayagarden, Zirakpur, Rajpura, Mohali – 140603, Punjab'}.</p>

      <p className="leading-relaxed">We reserve the right to change these Terms of Use and Privacy Policy at any time by posting changes on the Website. You are responsible for regularly reviewing these changes. Your continued use of the Website after changes are posted constitutes acceptance of the amended Terms.</p>

      <section className="space-y-4">
        <h2 className="text-[22px] md:text-[26px] font-grandstander font-bold text-[#333]">General Terms of Use</h2>
        
        <h3 className="text-[18px] font-grandstander font-bold text-[#333]">1. Age Requirement:</h3>
        <p>Only individuals 18 years of age or older may use the Website. If you are under 18 and wish to use the Website or purchase products, your parents or legal guardian must acknowledge and agree to these Terms of Use and Privacy Policy.</p>

        <h3 className="text-[18px] font-grandstander font-bold text-[#333]">2. Compliance with Laws:</h3>
        <p>Our office is in India, and we have complied with applicable Indian laws in making the Website available. If you access the Website from outside India, you do so at your own risk and are responsible for compliance with local laws.</p>

        <h3 className="text-[18px] font-grandstander font-bold text-[#333]">3. Device and Connectivity:</h3>
        <p>Use of the Website requires internet connectivity and telecommunication links. You bear the costs to access and use the Website. We are not responsible for such costs.</p>

        <h3 className="text-[18px] font-grandstander font-bold text-[#333]">4. User Representations and Warranties:</h3>
        <p>By using the Website and purchasing products, you represent and warrant that:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>(i) All information you submit is truthful, lawful, and accurate, and you agree to maintain its accuracy.</li>
          <li>(ii) Your use is solely for personal use, and you are responsible for all content published and interactions with other users. You will abide by applicable local, state, national, and foreign laws.</li>
          <li>(iii) You will not submit, post, upload, distribute, or make available any content that is:
            <ul className="list-[circle] pl-6 mt-1 space-y-1">
              <li>Defamatory, abusive, harassing, insulting, threatening, or stalking</li>
              <li>Bigoted, hateful, racially or otherwise offensive</li>
              <li>Violent, vulgar, obscene, pornographic, or sexually explicit</li>
              <li>Illegal or encourages illegal activity</li>
            </ul>
          </li>
          <li>(iv) You own all necessary licenses, consents, permissions, and rights for content you submit.</li>
          <li>(v) You will not:
            <ul className="list-[circle] pl-6 mt-1 space-y-1">
              <li>Use Website services for commercial purposes without authorization</li>
              <li>Advertise or sell products or services</li>
              <li>Use the Website unlawfully or to harm others</li>
              <li>Post software or files containing viruses or harmful components</li>
              <li>Use another person’s account information or impersonate anyone</li>
              <li>Engage in antisocial, disrupting, or destructive acts including flaming, spamming, flooding, trolling, or griefing</li>
              <li>Delete or modify Website content, including legal notices or proprietary symbols</li>
            </ul>
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-[22px] md:text-[26px] font-grandstander font-bold text-[#333]">Account Registration</h2>
        <p>To access certain Website features and purchase products, you may register to create an account. You can register directly or by logging into Third Party social networking sites (e.g., Facebook).</p>
        <p>You agree to provide accurate, current, and complete information during registration and update it as needed. We reserve the right to suspend or terminate your account if information is inaccurate or incomplete.</p>
        <p>You are responsible for safeguarding your password and will immediately notify us of unauthorized account use. Registration is not mandatory; you may use the Website as a guest.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-[22px] md:text-[26px] font-grandstander font-bold text-[#333]">Terms of Service</h2>

        <h3 className="text-[18px] font-grandstander font-bold text-[#333]">1. Pricing and Payment:</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>Products are sold at listed prices unless otherwise specified</li>
          <li>Prices do not include duties, taxes, shipping, and handling, which are charged as applicable</li>
          <li>You are liable for applicable duties, taxes, and storage fees</li>
          <li>Placing an order constitutes irrevocable acceptance unless canceled by us within 1 working day</li>
          <li>We will raise an invoice, and you must make full payment according to invoice terms</li>
          <li>We may cancel orders if payment is not received</li>
        </ul>

        <h3 className="text-[18px] font-grandstander font-bold text-[#333]">2. Services Provided:</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>We facilitate purchase of quality products showcased on the Website</li>
          <li>Each purchase contains necessary product information and redemption instructions</li>
          <li>You are not entitled to credit or cash back for product value sold</li>
          <li>Products cannot be used, exchanged, or combined with other products</li>
        </ul>

        <h3 className="text-[18px] font-grandstander font-bold text-[#333]">3. Payment Gateway:</h3>
        <p>You may provide credit or debit card details to approved payment gateways. You agree to provide correct details and use only cards lawfully owned by you. Information will not be shared with Third Parties except for fraud verification or as required by law. You are responsible for card security and confidentiality. We disclaim all liabilities for unauthorized card use.</p>

        <h3 className="text-[18px] font-grandstander font-bold text-[#333]">4. Refunds:</h3>
        <p>You are entitled to refunds only if:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Product is damaged during shipping</li>
          <li>An error directly attributable to us occurred during purchase</li>
          <li>Order is canceled, or terms of service change, including price or availability changes</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-[22px] md:text-[26px] font-grandstander font-bold text-[#333]">Website Access, Accuracy, and Security</h2>
        <p>We endeavor to make the Website available 24 hours a day but do not guarantee uninterrupted, timely, error-free, or virus-free access.</p>
        <p>We do not warrant Website compatibility with all hardware and software. We are not liable for damage to equipment, software, data, or property resulting from Website use or for Third Party actions.</p>
        <p>We do not guarantee information accuracy or reliability on the Website. We reserve the right to suspend or withdraw Website access temporarily or permanently without notice.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-[22px] md:text-[26px] font-grandstander font-bold text-[#333]">Disclaimers</h2>
        <p className="font-bold">THE WEBSITE MAY BE UNDER CONSTANT UPGRADES, AND SOME FUNCTIONS MAY NOT BE FULLY OPERATIONAL.</p>
        <p>DUE TO ELECTRONIC DISTRIBUTION LIMITATIONS AND MULTIPLE INFORMATION SOURCES, THERE MAY BE DELAYS, OMISSIONS, OR INACCURACIES IN CONTENT OR WEBSITE FUNCTIONALITY. WE DO NOT GUARANTEE INFORMATION CORRECTNESS IN EVERY CASE.</p>
        <p className="font-bold">WE EXPRESSLY DISCLAIM ALL LIABILITIES FOR UNAUTHORIZED CREDIT/DEBIT CARD USE.</p>
        <p>THIRD PARTY SERVICES ARE AVAILABLE ON THE WEBSITE. WE MAKE NO REPRESENTATION OR WARRANTY REGARDING THIRD PARTY SERVICES AND ARE NOT LIABLE FOR CONSEQUENCES OR CLAIMS ARISING FROM THIRD PARTY SERVICES.</p>
        <p>INFORMATION IS PROVIDED "AS IS". WE MAKE NO WARRANTY REGARDING TIMELINESS, CONTENT, ACCURACY, EFFECTIVENESS, OR COMPLETENESS OF INFORMATION.</p>
        <p>WE ARE NOT LIABLE FOR LOSSES OR INJURIES ARISING FROM INFORMATION PROVIDED ON THE WEBSITE.</p>
        <p>IN NO EVENT WILL WE BE LIABLE FOR DAMAGES (INCLUDING DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR EXEMPLARY DAMAGES, PERSONAL INJURY, WRONGFUL DEATH, LOST PROFITS, LOST DATA, OR BUSINESS INTERRUPTION) RESULTING FROM THIRD PARTY SERVICES ACCESSED THROUGH THE WEBSITE.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-[22px] md:text-[26px] font-grandstander font-bold text-[#333]">Intellectual Property</h2>
        <p>We own or license all intellectual property rights in the Website and published materials. These works are protected by copyright laws and treaties. All rights are reserved.</p>
        <p>You may print one copy and download extracts for personal reference. You must not modify copies or use illustrations, photographs, videos, audio, or graphics separately from accompanying text.</p>
        <p>You must not use any Website materials for commercial purposes without obtaining a license from us or our licensors.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-[22px] md:text-[26px] font-grandstander font-bold text-[#333]">Third Party Content</h2>
        <p>We cannot assure that other users will comply with these Terms of Use, and you assume all risk of harm from such non-compliance.</p>
        <p>When you access links leaving the Website, different terms of use and privacy policies may apply. We are not responsible for those sites. We reserve the right to disable links to/from Third Party sites but are under no obligation to do so.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-[22px] md:text-[26px] font-grandstander font-bold text-[#333]">Severability</h2>
        <p>If any term is determined illegal, invalid, or unenforceable, it shall be severed, and remaining Terms shall survive and remain in full force.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-[22px] md:text-[26px] font-grandstander font-bold text-[#333]">Non-Assignment</h2>
        <p>You shall not assign or transfer the contract between you and us to any other person.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-[22px] md:text-[26px] font-grandstander font-bold text-[#333]">Governing Law and Dispute Resolution</h2>
        <p>These Terms of Use are governed by the laws of India. Any legal proceeding arising from or relating to this Website shall be subject to the exclusive jurisdiction of the courts at Zirakpur, India.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-[22px] md:text-[26px] font-grandstander font-bold text-[#333]">Contact Us</h2>
        <p>For questions about these Terms and Conditions, please contact us at:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Email:</strong> <a href={`mailto:${siteConfig?.contactEmail || 'toyovoindia@gmail.com'}`} className="text-[#E84949] hover:underline">{siteConfig?.contactEmail || 'toyovoindia@gmail.com'}</a></li>
          <li><strong>Phone/WhatsApp:</strong> <a href={`tel:${siteConfig?.contactPhone?.replace('+91', '').trim() || '8814040056'}`} className="text-[#E84949] hover:underline">{siteConfig?.contactPhone?.replace('+91', '').trim() || '8814040056'}</a></li>
          <li><strong>Address:</strong> {siteConfig?.contactAddress || 'Unit 703, 7th Floor, Block 1 Mayagarden, Zirakpur, Rajpura, Mohali – 140603, Punjab'}</li>
        </ul>
      </section>
    </PolicyPageLayout>
  )
}
