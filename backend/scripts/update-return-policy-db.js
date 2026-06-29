import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import PageContent from '../src/models/PageContent.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const updateReturnPolicy = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB...');

    const newContent = `
      <p class="text-[14px] text-[#888] font-medium">Return, Refund and Exchange Policy for TOYOVO INDIA (OPC) PRIVATE LIMITED</p>

      <section class="space-y-4">
        <h2 class="text-[22px] md:text-[26px] font-grandstander font-bold text-[#333]">1. About TOYOVO INDIA (OPC) PRIVATE LIMITED</h2>
        <p>TOYOVO INDIA (OPC) PRIVATE LIMITED, a company incorporated under the laws of India, having its office at Unit 703, 7th Floor, Block 1 Mayagarden, Zirakpur, Rajpura, Mohali – 140603, Punjab ("Company"), operates <strong>www.toyovoindia.com</strong> ("Website"), which facilitates the purchase of toys and related products ("Products") for users ("Users").</p>
      </section>

      <section class="space-y-4">
        <h2 class="text-[22px] md:text-[26px] font-grandstander font-bold text-[#333]">2. What Is This Return, Refund and Exchange Policy?</h2>
        <p>This Return, Refund and Exchange Policy, together with the Terms of Use, sets out our procedures and policies for accepting Product returns, refunds, and exchanges after delivery. Any return, refund, or exchange of Products shall be governed by this Return, Refund and Exchange Policy.</p>
        <p>Users must understand this Return, Refund and Exchange Policy. If you do not agree, do not accept the Terms of Use and stop using the Website. By initiating a purchase request, you agree to be bound by these terms.</p>
      </section>

      <section class="space-y-4">
        <h2 class="text-[22px] md:text-[26px] font-grandstander font-bold text-[#333]">3. Terms of Return, Refund and Exchange</h2>

        <h3 class="text-[18px] font-grandstander font-bold text-[#333]">3.1 Return/Refund/Exchange Period & Eligibility:</h3>
        <p>Returns are accepted subject to the following conditions: If you are dissatisfied with the purchased Product or there are defects (attributable to and accepted by us after verification at our sole discretion), you may initiate a return/exchange request on the Website within <strong>3–7 working days</strong> of delivery (including the delivery date). The product must be unused, undamaged, and in its original packaging. The original invoice must be provided. We reserve the right to alter this Return, Refund and Exchange Policy at any time without prior notice.</p>

        <h3 class="text-[18px] font-grandstander font-bold text-[#333]">3.2 Cancellation Before Dispatch:</h3>
        <p>You may fully or partially cancel orders before dispatch. After placing an order and handing Products to our logistics partner, you will receive a unique tracking number. To cancel before dispatch, reference the tracking number and email <a href="mailto:toyovoindia@gmail.com" class="text-[#E84949] hover:underline">toyovoindia@gmail.com</a>. We will initiate cancellation processing within <strong>2 (two) business days</strong> from receiving your request.</p>

        <h3 class="text-[18px] font-grandstander font-bold text-[#333]">3.3 Bundled Packages:</h3>
        <p>If you purchased Products as part of a package or promotional bundle, you must return all Products in the bundle to process returns/exchanges. For example, if you purchased a toy car and toy truck as one promotional package, you must return both items, not just one.</p>

        <h3 class="text-[18px] font-grandstander font-bold text-[#333]">3.4 Limited Return/Exchange Categories:</h3>
        <p>You can return/exchange the following categories only for <strong>manufacturing defects</strong>:</p>
        <ul class="list-disc pl-6 space-y-2">
          <li>Electronic Products</li>
        </ul>

        <h3 class="text-[18px] font-grandstander font-bold text-[#333]">3.5 Returns/Exchanges Will Not Be Accepted If:</h3>
        <ul class="list-disc pl-6 space-y-2">
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

        <h3 class="text-[18px] font-grandstander font-bold text-[#333]">3.6 Quality Checks and Return/Exchange Processing:</h3>
        <p>We will initiate exchange/return processing if quality checks confirm the Product return entitles you to it. We are not required to exchange/return Products deemed ineligible after quality checks.</p>

        <h3 class="text-[18px] font-grandstander font-bold text-[#333]">3.7 Exclusions:</h3>
        <p>Exchanges/returns shall not include shipping charges or other charges, except for Products with defects at delivery (for reasons attributable to and accepted by us after verification).</p>

        <h3 class="text-[18px] font-grandstander font-bold text-[#333]">3.8 Status Updates:</h3>
        <p>We will make reasonable attempts to keep you informed of return/exchange status through updates to your registered mobile number and email. We disclaim liabilities for failure to provide such updates.</p>

        <h3 class="text-[18px] font-grandstander font-bold text-[#333]">3.9 Missing Accessories:</h3>
        <p>If you return a Product without originally bundled accessories or gifts, we may (at our sole discretion):</p>
        <ul class="list-disc pl-6 space-y-2">
          <li>Refuse to accept the return</li>
          <li>Refuse to process any exchange/return</li>
          <li>Deduct the value of missing items from your transaction</li>
        </ul>

        <h3 class="text-[18px] font-grandstander font-bold text-[#333]">3.10 Exchange Timeline:</h3>
        <p>Subject to satisfactory quality checks, we will initiate exchange requests. Once approved, replacement/exchange products are typically delivered within <strong>10–15 working days</strong>.</p>

        <h3 class="text-[18px] font-grandstander font-bold text-[#333]">3.11 Refund Timeline and Method:</h3>
        <p>Subject to satisfactory quality checks, refunds are credited within <strong>5–7 business days</strong> after approval. The amount will be credited to the original payment method. Final credit timelines may vary depending on your bank or payment provider.</p>

        <h3 class="text-[18px] font-grandstander font-bold text-[#333]">3.12 Reverse Logistics:</h3>
        <p>Returns/exchanges are facilitated through our reverse-logistics partners. After you request a return/exchange and we acknowledge it, our reverse-logistics partners will contact you to collect the Product and deliver it to us.</p>
      </section>

      <section class="space-y-4">
        <h2 class="text-[22px] md:text-[26px] font-grandstander font-bold text-[#333]">Grievance Redressal</h2>
        <p>Any grievances relating to this Return, Refund and Exchange Policy may be directed to:</p>
        <ul class="list-disc pl-6 space-y-2">
          <li><strong>Email:</strong> <a href="mailto:toyovoindia@gmail.com" class="text-[#E84949] hover:underline">toyovoindia@gmail.com</a></li>
          <li><strong>Phone/WhatsApp:</strong> <a href="tel:7901931534" class="text-[#E84949] hover:underline">7901931534</a></li>
          <li><strong>Address:</strong> Unit 703, 7th Floor, Block 1 Mayagarden, Zirakpur, Rajpura, Mohali – 140603, Punjab</li>
        </ul>
      </section>

      <section class="space-y-4">
        <h2 class="text-[22px] md:text-[26px] font-grandstander font-bold text-[#333]">Governing Law</h2>
        <p>This Return, Refund and Exchange Policy is governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts at Zirakpur, India.</p>
      </section>
    `;

    await PageContent.findOneAndUpdate(
      { slug: 'return-policy' },
      { title: 'Return, Refund & Exchange Policy', content: newContent },
      { upsert: true }
    );
    
    console.log('Successfully updated return policy in DB!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

updateReturnPolicy();
