import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import PageContent from '../src/models/PageContent.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const INITIAL_PAGES = [
  {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    content: `
      <h2>Our Commitment to Privacy</h2>
      <p>At TOYOVO INDIA(OPC) PRIVATE LIMITED, we respect your privacy and are committed to protecting the personal information you share with us. This policy explains how we collect, use, and safeguard your data.</p>
      
      <h3>Information We Collect</h3>
      <ul>
        <li><strong>Personal Details:</strong> Name, email address, phone number, and shipping address when you make a purchase.</li>
        <li><strong>Payment Information:</strong> Securely processed through our payment gateways.</li>
        <li><strong>Browsing Data:</strong> Cookies and usage data to improve your shopping experience.</li>
      </ul>

      <h3>How We Use Your Information</h3>
      <p>We use your data primarily to process orders, provide customer support, and send you updates about new products if you opt-in.</p>
    `
  },
  {
    slug: 'terms-conditions',
    title: 'Terms & Conditions',
    content: `
      <h2>Website Usage</h2>
      <p>By accessing this website, you agree to comply with and be bound by the following terms and conditions of use.</p>
      
      <h3>Intellectual Property</h3>
      <p>All content included on this site, such as text, graphics, logos, and images, is the property of TOYOVOINDIA.</p>

      <h3>Product Descriptions</h3>
      <p>We attempt to be as accurate as possible. However, we do not warrant that product descriptions or other content is accurate, complete, reliable, or error-free.</p>
    `
  },
  {
    slug: 'shipping-policy',
    title: 'Shipping Policy',
    content: `
      <h2>Shipping Methods</h2>
      <p>We offer standard and express shipping options across India.</p>
      
      <h3>Processing Time</h3>
      <p>Orders are typically processed within 1-2 business days. You will receive a tracking number once your order has shipped.</p>

      <h3>Delivery Estimates</h3>
      <ul>
        <li><strong>Standard Shipping:</strong> 3-5 business days.</li>
        <li><strong>Express Delivery:</strong> 1-2 business days.</li>
      </ul>
    `
  },
  {
    slug: 'return-policy',
    title: 'Return & Exchange',
    content: `
      <h2>Easy Returns</h2>
      <p>We want you to be completely satisfied with your purchase. If you are not happy with your toys, you can return them within 15 days of delivery.</p>
      
      <h3>Conditions for Returns</h3>
      <ul>
        <li>Items must be in original packaging and unused condition.</li>
        <li>Proof of purchase is required.</li>
      </ul>

      <h3>Refund Process</h3>
      <p>Once we receive and inspect your return, we will process your refund within 5-7 business days to your original payment method.</p>
    `
  },
  {
    slug: 'about-us',
    title: 'About Us',
    content: `
      <h2>TOYOVOINDIA Vision</h2>
      <p>Welcome to TOYOVO INDIA (OPC) PRIVATE LIMITED, where innovation meets the magic of play. Incorporated on April 22, 2026, we are a legally recognized entity committed to transparency and excellence.</p>
      
      <h3>Our Story</h3>
      <p>Our journey began with a simple mission: to create toys that don't just entertain, but inspire children to explore the world with curiosity and joy. As a Ministry of Corporate Affairs registered company, we adhere to the highest safety and quality standards.</p>
      
      <h3>Company Details</h3>
      <ul>
        <li><strong>Corporate Identity Number (CIN):</strong> U47912PB2026OPC068091</li>
        <li><strong>PAN:</strong> AANCT0674K</li>
        <li><strong>TAN:</strong> PTLT16619B</li>
      </ul>
    `
  },
  {
    slug: 'faq',
    title: 'FAQs',
    content: `
      <h3>What age groups are your toys designed for?</h3>
      <p>Our toy collection spans from newborns to 12-year-olds! Each product page specifies the recommended age range.</p>
      
      <h3>Are the materials used in your toys safe and eco-friendly?</h3>
      <p>Yes, absolutely! Safety is our top priority. Most of our toys are made from sustainably sourced wood, organic cotton, or BPA-free recycled plastics. Every toy meets or exceeds international safety standards.</p>
      
      <h3>Do you offer gift wrapping and personalized messages?</h3>
      <p>We certainly do! During the checkout process, you'll see an option to add a gift wrap and a handwritten note to your order for a small additional fee.</p>
      
      <h3>How long does shipping typically take?</h3>
      <p>Standard shipping within India usually takes 3-5 business days. Express shipping options are available for 1-2 day delivery in most major cities.</p>
      
      <h3>Can I return a toy if my child doesn't like it?</h3>
      <p>Yes! We have a 30-day no-hassle return policy for items in their original packaging. Please check our Return Policy page for the full details.</p>
      
      <h3>How can I track my order?</h3>
      <p>Once your order is shipped, we'll send you an email with a tracking number and a link to the carrier's website where you can follow its progress in real-time.</p>
    `
  }
];

const seedPolicies = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding policies...');

    for (const page of INITIAL_PAGES) {
      await PageContent.findOneAndUpdate(
        { slug: page.slug },
        page,
        { upsert: true, new: true }
      );
      console.log(`Seeded/Updated: ${page.title}`);
    }

    console.log('Policy seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding policies:', error);
    process.exit(1);
  }
};

seedPolicies();
