import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Star, Users, Trophy, Phone, MapPin, Mail } from 'lucide-react'
import { Link } from 'react-router-dom'

const TeamMemberCard = ({ name, role, img }) => (
  <div className="group relative cursor-pointer">
    <div className="aspect-3/4 rounded-lg overflow-hidden bg-[#F9EAD3] border-[1.6px] border-dashed border-[#333333]/20 hover:border-[#333333]/40 transition-all duration-500">
      <img src={img} alt={name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
      <div className="absolute inset-0 bg-[#333]/0 group-hover:bg-[#333]/10 transition-colors duration-500" />
    </div>
    <div className="-mt-6.25 relative z-10 mx-0 md:mx-0 bg-[#E84949] p-4 md:p-5 rounded-b-lg text-center shadow-2xl shadow-[#E84949]/30 group-hover:-translate-y-2 transition-all duration-500 font-roboto">
      <h4 className="text-white font-bold text-[14px] md:text-[16px] tracking-wider font-grandstander">{name}</h4>
      <p className="text-white/80 text-[10px] md:text-[11px] font-medium uppercase tracking-[0.2em] mt-1">{role}</p>
    </div>
  </div>
)

const MetricCard = ({ icon: Icon, value, label }) => (
  <div className="flex flex-col items-center text-center p-8 md:p-12 bg-[#F9EAD3] border-[1.6px] border-dashed border-[#333333] rounded-4xl shadow-sm hover:shadow-xl hover:translate-y-[-8px] transition-all duration-500 group group">
    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white border-[1.6px] border-dashed border-[#E84949] flex items-center justify-center text-[#E84949] mb-8 shrink-0 transition-transform duration-500 group-hover:rotate-[360deg]">
      <Icon size={28} />
    </div>
    <h3 className="text-4xl md:text-5xl font-grandstander font-bold text-[#333333] mb-3 group-hover:scale-110 transition-transform duration-500">{value}</h3>
    <p className="text-[12px] md:text-[14px] font-bold text-[#666] uppercase tracking-[0.3em] font-roboto">{label}</p>
  </div>
)

const InfoBox = ({ icon: Icon, title, content }) => (
  <div className="bg-[#FDF4E6] p-10 md:p-12 border-[1.2px] border-[#333333] rounded-3xl flex flex-col items-center text-center group hover:shadow-lg transition-all duration-500">
    <div className="w-16 h-16 rounded-full border border-[#333333] flex items-center justify-center mb-6 group-hover:bg-[#E84949] group-hover:border-[#E84949] group-hover:text-white transition-all duration-500">
      <Icon size={24} />
    </div>
    <h3 className="text-[18px] md:text-[18px] font-grandstander font-bold text-[#333333] mb-5 tracking-tight capitalize">
      {title}
    </h3>
    <p className="text-[14px] md:text-[15px] leading-relaxed text-[#666666] font-roboto">{content}</p>
  </div>
)

import { getStorefrontSettings } from '../services/siteApi'
// import { AboutSection } from '../components/sections/AboutSection'

export function AboutPage() {
  const [siteConfig, setSiteConfig] = useState(null)

  useEffect(() => {
    window.scrollTo(0, 0)
    getStorefrontSettings().then(setSiteConfig).catch(console.error)
  }, [])

  return (
    <div className="bg-[#FDF4E6] pb-24 overflow-x-hidden font-roboto">

      {/* Hero Section */}
      <div className="relative h-[350px] md:h-[450px] overflow-hidden flex items-center justify-center text-center group rounded-lg mx-4">
        <div className="absolute inset-0 bg-[#333]/30 z-10 transition-opacity duration-700 group-hover:opacity-40" />
        <img src="https://toykio.myshopify.com/cdn/shop/files/about-us.webp?v=1711002747" alt="About Hero" className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
        <div className="relative z-20 max-w-350 mx-auto px-4 w-full">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[#E84949] font-medium text-[14px] md:text-[16px] tracking-[0.3em] uppercase mb-6 drop-shadow-lg font-roboto"
          >
            Our Journey & Passion
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-6xl font-grandstander font-bold text-white drop-shadow-2xl leading-none tracking-tighter"
          >
            Our Story
          </motion.h1>
        </div>
      </div>

      <div className="shell">
        {/* Story Blocks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-32 items-center">
          <div className="text-center lg:text-left space-y-8">
            <span className="text-[#E84949] font-medium text-[12px] md:text-[14px] uppercase tracking-[0.4em] block font-roboto mt-10 md:mt-10">TOYOVOINDIA Vision</span>
            <h2 className="text-4xl md:text-6xl font-grandstander font-bold text-[#333333] leading-[1.1] tracking-tight">Every Toy Tells an Adventure Story</h2>
            <div className="space-y-8 text-[16px] md:text-[18px] text-[#666] leading-relaxed max-w-2xl mx-auto lg:mx-0">
              <p>Welcome toTOYOVO INDIA (OPC) PRIVATE LIMITED, where innovation meets the timeless magic of play. Officially incorporated on April 22, 2026, as TOYOVO INDIA (OPC) PRIVATE LIMITED, we are a legally recognized entity committed to transparency and excellence.</p>
              <p>Our journey began with a simple mission: to create toys that don't just entertain, but inspire children to explore the world around them with curiosity and joy. As a Ministry of Corporate Affairs registered company, we adhere to the highest standards of safety and quality.</p>
              <p>The Corporate Identity Number of the company is <span className="font-semibold">U47912PB2026OPC068091 </span> <br />
                {/* The Permanent Account Number (PAN) of the company is <span className="font-semibold">AANCT0674K</span><br/>  The Tax Deduction and Collection Account Number (TAN) of the company is <span className="font-semibold">PTLT16619B </span> */}
              </p>
            </div>
            {/* <button className="h-14 px-12 bg-[#333] text-white rounded-full font-bold text-[13px] tracking-[0.2em] uppercase hover:bg-[#E84949] transition-all transform hover:scale-105 shadow-xl"><Link to="/">EXPLORE OUR VALUES</Link></button> */}
          </div>
          <div className="relative group p-6">
            <div className="aspect-4/3 rounded-md sm:rounded-lg md:rounded-lg overflow-hidden shadow-2xl skew-x-[-1deg] group-hover:skew-x-0 transition-all duration-1000 border-[3px] border-dashed border-[#333333]/10 bg-[#F9EAD3]">
              <img src="https://toykio.myshopify.com/cdn/shop/files/about-us.webp?v=1711002747" alt="Story" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
            </div>
            <div className="absolute -bottom-8 -right-0 md:-bottom-12 md:-right-0 w-56 h-48 md:w-56 md:h-56 bg-[#E84949] rounded-[64px] flex items-center justify-center p-8 -rotate-6 shadow-2xl hidden sm:flex border-4 border-white group-hover:rotate-0 transition-all duration-700">
              <p className="text-white font-grandstander font-bold text-2xl md:text-3xl text-center leading-tight tracking-tighter">Registered & Certified Since 2026</p>
            </div>
          </div>
        </div>
      </div>

      {/* <AboutSection /> */}

      <div className="shell">
        {/* Info Box Section - Added for Parity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 md:mt-20 mt-12 gap-8">
          <InfoBox
            icon={Phone}
            title={siteConfig?.contactPhone || "+91 7901931534"}
            content="We're thrilled to connect with you and assist in every way possible. Feel free to reach out to us for any inquiries, suggestions, or assistance you might need."
          />
          <InfoBox
            icon={MapPin}
            title="Mohali, Punjab, India"
            content={siteConfig?.contactAddress ? `${siteConfig.contactAddress}. We look forward to seeing you!` : "Unit 703, 7th Floor, Block 1 Mayagarden, Zirakpur, Rajpura, Mohali- 140603, Punjab. We look forward to seeing you!"}
          />
          <InfoBox
            icon={Mail}
            title={siteConfig?.contactEmail || "toyovoindia@gmail.com"}
            content="Our dedicated team is at your service, ready to respond promptly and ensure your experience with TOYOVOINDIA is nothing short of exceptional."
          />
        </div>

        {/* Meet Our Team Section */}
        {/* <div className="mt-15 md:mt-20">
          <div className="text-center mb-10">
            <p className="text-[#E84949] font-medium tracking-[0.4em] uppercase text-[12px] md:text-[14px] mb-4 font-roboto">The Minds Behind the Magic</p>
            <h2 className="text-4xl md:text-5xl font-grandstander font-bold text-[#333333] leading-none tracking-tight">Meet Our Team</h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
            <TeamMemberCard name="David K" role="Founder & CEO" img="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop" />
            <TeamMemberCard name="John Doe" role="Head of Design" img="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop" />
            <TeamMemberCard name="Jemis P" role="Product Expert" img="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400&auto=format&fit=crop" />
            <TeamMemberCard name="Michel R" role="Quality Assurance" img="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=400&auto=format&fit=crop" />
          </div>
        </div> */}
      </div>
    </div>
  )
}
