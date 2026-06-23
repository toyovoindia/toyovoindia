import mongoose from 'mongoose';
import dotenv from 'dotenv';
import PageContent from '../src/models/PageContent.js';

dotenv.config();

const cancellationPolicyContent = `
<p><em>Cancellation Policy for TOYOVO INDIA (OPC) PRIVATE LIMITED</em></p>

<h2>1. About TOYOVO INDIA (OPC) PRIVATE LIMITED</h2>
<p>TOYOVO INDIA (OPC) PRIVATE LIMITED, a company incorporated under the laws of India, having its office at Unit 703, 7th Floor, Block 1 Mayagarden, Zirakpur, Rajpura, Mohali – 140603, Punjab ("Company"), operates <strong>www.toyovoindia.com</strong> ("Website"), which facilitates the purchase of toys and related products ("Products") for users ("Users").</p>

<h2>2. Scope of This Policy</h2>
<p>This Cancellation Policy outlines the terms and conditions under which Users may cancel their orders placed on the Website. By placing an order, you acknowledge that you have read, understood, and agree to be bound by this Cancellation Policy, together with the Terms of Use and other applicable policies.</p>

<h2>3. Order Cancellation Terms</h2>

<h3>3.1 Cancellation Window:</h3>
<p>You may cancel your order <strong>at any time before it has been dispatched</strong> from our warehouse. Once an order has been handed over to our logistics/courier partner for delivery, it <strong>cannot be cancelled</strong>.</p>

<h3>3.2 How to Cancel:</h3>
<p>To cancel an order before dispatch, you may use any of the following methods:</p>
<ul>
  <li>Navigate to <strong>My Account → Orders</strong> on the Website and click the <strong>"Cancel Order"</strong> button next to the relevant order.</li>
  <li>Send an email to <strong>toyovoindia@gmail.com</strong> with your Order Number and the reason for cancellation.</li>
  <li>Contact us via WhatsApp/Phone at <strong>7901931534</strong> with your order details.</li>
</ul>

<h3>3.3 Partial Cancellation:</h3>
<p>If your order contains multiple items, you may request cancellation of specific items before the order is dispatched. Partial cancellations are subject to verification and processing at our discretion.</p>

<h3>3.4 Non-Cancellable Scenarios:</h3>
<p>Orders <strong>cannot</strong> be cancelled under the following circumstances:</p>
<ul>
  <li>(a) The order has already been dispatched or is in transit with the courier partner.</li>
  <li>(b) The order has been delivered to the shipping address.</li>
  <li>(c) Customized or personalized products made specifically to your specifications.</li>
  <li>(d) Products purchased during flash sales, clearance events, or limited-time promotions marked as non-cancellable at the time of purchase.</li>
</ul>

<h3>3.5 Cancellation Processing Time:</h3>
<p>Upon receiving your cancellation request, we will process it within <strong>2 (two) business days</strong>. You will receive an email/SMS confirmation once the cancellation is successfully processed.</p>

<h2>4. Refund After Cancellation</h2>

<h3>4.1 Prepaid Orders:</h3>
<p>If your prepaid order is successfully cancelled before dispatch, the full amount will be refunded to your original payment method within <strong>5–7 business days</strong>. The actual credit may take additional time depending on your bank or payment provider.</p>

<h3>4.2 Cash on Delivery (COD) Orders:</h3>
<p>For COD orders cancelled before dispatch, no payment has been collected, so no refund is applicable. Your order will simply be removed from our processing queue.</p>

<h3>4.3 Coupon/Discount Orders:</h3>
<p>If a coupon or discount code was applied to the cancelled order, the coupon may or may not be reinstated depending on its terms and validity. Please contact our support team for coupon-related queries.</p>

<h2>5. Cancellation by the Company</h2>
<p>We reserve the right to cancel any order at our sole discretion under the following circumstances:</p>
<ul>
  <li>(a) The Product is out of stock or discontinued.</li>
  <li>(b) Pricing or product information errors on the Website.</li>
  <li>(c) Suspected fraudulent, unauthorized, or illegal transaction activity.</li>
  <li>(d) Inability to deliver to the specified shipping address.</li>
  <li>(e) Non-availability of the Product from the supplier/manufacturer.</li>
</ul>
<p>In case of company-initiated cancellation, you will be notified via email/SMS, and a full refund will be processed within <strong>5–7 business days</strong>.</p>

<h2>6. Amendments</h2>
<p>We reserve the right to modify or update this Cancellation Policy at any time without prior notice. It is your responsibility to review this policy periodically. Continued use of the Website after changes constitutes acceptance of the revised Cancellation Policy.</p>

<h2>Grievance Redressal</h2>
<p>Any grievances relating to order cancellation may be directed to:</p>
<ul>
  <li><strong>Email:</strong> toyovoindia@gmail.com</li>
  <li><strong>Phone/WhatsApp:</strong> 7901931534</li>
  <li><strong>Address:</strong> Unit 703, 7th Floor, Block 1 Mayagarden, Zirakpur, Rajpura, Mohali – 140603, Punjab</li>
</ul>

<h2>Governing Law</h2>
<p>This Cancellation Policy is governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts at Zirakpur, India.</p>
`;

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/toyovoindia');
    console.log('MongoDB connected.');

    const page = await PageContent.findOneAndUpdate(
      { slug: 'cancellation-policy' },
      {
        title: 'Cancellation Policy',
        content: cancellationPolicyContent
      },
      { new: true, upsert: true }
    );

    console.log('Successfully seeded cancellation-policy page:', page.title);
    process.exit(0);
  } catch (err) {
    console.error('Failed to seed:', err);
    process.exit(1);
  }
};

seed();
