import type { Metadata } from 'next';
import PolicyPage, { BUSINESS } from '@/components/common/PolicyPage';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms that apply when you browse or buy from RCS Fabrics.',
};

export default function TermsOfService() {
  return (
    <PolicyPage
      title="Terms of Service"
      intro={<p>These terms apply when you use this website or buy from {BUSINESS.legalName} ({BUSINESS.brand}). By placing an order you agree to them.</p>}
      sections={[
        {
          heading: 'Products and pricing',
          body: (
            <ul>
              <li>Fabrics are sold by the metre, in steps of 0.5 m, subject to each product’s minimum order.</li>
              <li>All prices are in Indian Rupees (₹) and include applicable taxes unless stated otherwise.</li>
              <li>Colours may look slightly different on different screens. Measurements such as width are approximate.</li>
              <li>We may change prices or stop selling a product at any time; the price you pay is the one shown at checkout.</li>
            </ul>
          ),
        },
        {
          heading: 'Orders',
          body: <p>Your order is confirmed once payment is received (or once a Cash on Delivery order is accepted). We may cancel an order and refund you in full if an item is out of stock, a price was shown in error, or we suspect fraud.</p>,
        },
        {
          heading: 'Payment',
          body: <p>We accept the payment methods shown at checkout, which may include UPI, Razorpay (cards, UPI, netbanking, wallets) and Cash on Delivery. Coupons are subject to their own conditions and cannot be combined unless stated.</p>,
        },
        {
          heading: 'Shipping, returns and refunds',
          body: <p>Delivery is covered by our <a href="/shipping">Shipping Policy</a>, and cancellations, returns and refunds by our <a href="/returns">Returns, Cancellation &amp; Refund Policy</a>.</p>,
        },
        {
          heading: 'Your account',
          body: <p>You are responsible for keeping your login details safe and for activity on your account. Please provide accurate contact and delivery information.</p>,
        },
        {
          heading: 'Acceptable use',
          body: <p>Do not misuse the website — for example by attempting to access other accounts, interfering with its operation, or placing fraudulent orders.</p>,
        },
        {
          heading: 'Liability',
          body: <p>To the extent permitted by law, our liability for any order is limited to the amount you paid for it. Nothing in these terms limits your rights under applicable Indian consumer protection law.</p>,
        },
        {
          heading: 'Governing law',
          body: <p>These terms are governed by the laws of India.</p>,
        },
      ]}
    />
  );
}
