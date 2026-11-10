import type { Metadata } from 'next';
import PolicyPage, { BUSINESS } from '@/components/common/PolicyPage';

export const metadata: Metadata = {
  title: 'Shipping Policy — RCS Fabrics',
  description: 'Shipping charges, delivery times and order tracking for RCS Fabrics orders across India.',
};

export default function ShippingPolicy() {
  return (
    <PolicyPage
      title="Shipping Policy"
      intro={<p>This policy explains how {BUSINESS.legalName} ({BUSINESS.brand}) ships orders placed on this website.</p>}
      sections={[
        { heading: 'Where we ship', body: <p>We currently ship to addresses within India.</p> },
        {
          heading: 'Shipping charges',
          body: (
            <ul>
              <li>Orders of ₹2,000 or more (after discounts): <strong>free shipping</strong>.</li>
              <li>Orders below ₹2,000: flat <strong>₹150</strong> per order.</li>
            </ul>
          ),
        },
        {
          heading: 'Dispatch and delivery time',
          body: (
            <p>
              Orders are usually dispatched within 1–2 business days after payment is confirmed (or after confirmation for
              Cash on Delivery). Delivery normally takes 2–5 business days after dispatch depending on your location.
              Remote areas, public holidays and courier delays can add time.
            </p>
          ),
        },
        {
          heading: 'Order tracking',
          body: <p>Once your order ships, you can see its status under <a href="/account/orders">My Orders</a>. We share courier tracking details where available.</p>,
        },
        {
          heading: 'Bulk orders',
          body: <p>For bulk or wholesale orders, delivery time and charges are confirmed with your quote. <a href="/contact#bulk">Request a bulk quote</a>.</p>,
        },
        {
          heading: 'Damaged or missing parcels',
          body: <p>If your parcel arrives damaged or an item is missing, please contact us within 48 hours of delivery with photos of the parcel and contents so we can resolve it.</p>,
        },
      ]}
    />
  );
}
