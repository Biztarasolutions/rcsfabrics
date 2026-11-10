import type { Metadata } from 'next';
import PolicyPage, { BUSINESS } from '@/components/common/PolicyPage';

export const metadata: Metadata = {
  title: 'Returns, Cancellation & Refund Policy',
  description: 'How to cancel an order, return uncut fabric within 30 days, and get a refund from RCS Fabrics.',
};

export default function ReturnPolicy() {
  return (
    <PolicyPage
      title="Returns, Cancellation & Refund Policy"
      intro={<p>We want you to love your fabric. This policy explains cancellations, returns and refunds for orders placed with {BUSINESS.legalName} ({BUSINESS.brand}).</p>}
      sections={[
        {
          heading: 'Cancelling an order',
          body: <p>You can cancel an order from <a href="/account/orders">My Orders</a> at any time before it has been shipped. Once an order has shipped it can no longer be cancelled, but you may be able to return it as described below.</p>,
        },
        {
          heading: 'Returns',
          body: (
            <ul>
              <li>Returns are accepted within <strong>30 days of delivery</strong>.</li>
              <li>Fabric must be <strong>unused, unwashed and uncut</strong> (in the length it was delivered), in its original condition.</li>
              <li>Fabric cut to a custom length on request, items bought on clearance, and bulk/wholesale orders are not returnable unless they arrive damaged or incorrect.</li>
              <li>Slight colour variation from what you see on screen is normal for photographed fabric and is not considered a defect.</li>
            </ul>
          ),
        },
        {
          heading: 'How to request a return',
          body: <p>Contact us by WhatsApp, phone or email with your order number and photos of the fabric. We will confirm whether the return is accepted and share pickup or shipping instructions.</p>,
        },
        {
          heading: 'Damaged, defective or wrong items',
          body: <p>If you receive a damaged, defective or wrong item, tell us within 48 hours of delivery with photos. We will replace it or refund you in full, including shipping charges.</p>,
        },
        {
          heading: 'Refunds',
          body: (
            <ul>
              <li>Approved refunds are issued after we receive and inspect the returned fabric.</li>
              <li>Online payments (UPI / card / netbanking via Razorpay) are refunded to the original payment method, usually within 5–7 business days after approval.</li>
              <li>Cash on Delivery orders are refunded by UPI or bank transfer to an account you provide.</li>
              <li>Original shipping charges are not refundable unless the item was damaged, defective or incorrect.</li>
              <li>If you cancel a prepaid order before shipping, you receive a full refund.</li>
            </ul>
          ),
        },
      ]}
    />
  );
}
