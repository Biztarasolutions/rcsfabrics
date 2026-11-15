import type { Metadata } from 'next';
import Link from 'next/link';
import PolicyPage, { BUSINESS } from '@/components/common/PolicyPage';

export const metadata: Metadata = {
  title: 'Returns, Cancellation & Refund Policy',
  description:
    'Cancel before dispatch, return fabric of 2 metres or more within 15 days of delivery, and how refunds work at RCS Fabrics.',
};

export default function ReturnPolicy() {
  return (
    <PolicyPage
      title="Returns, Cancellation & Refund Policy"
      intro={
        <p>
          Every length is cut to order at {BUSINESS.legalName} ({BUSINESS.brand}). This policy sets out when an order can be
          cancelled, which fabric can be returned, and how refunds are made.
        </p>
      }
      highlights={[
        { value: '15 days', label: 'Return window from the date of delivery' },
        { value: '2 m+', label: 'Minimum length for a return' },
        { value: '48 hours', label: 'To report a damaged or wrong item' },
        { value: '5–7 days', label: 'Refund to your original payment method' },
      ]}
      sections={[
        {
          heading: 'Cancelling an order',
          body: (
            <>
              <p>
                You can cancel an order yourself from <Link href="/account/orders">My Orders</Link>, or by contacting us, at any
                time <strong>before it is dispatched</strong>. Prepaid orders cancelled before dispatch are refunded in full.
              </p>
              <p>Once an order has been dispatched it can no longer be cancelled. You may still be able to return it as set out below.</p>
            </>
          ),
        },
        {
          heading: 'Return eligibility',
          body: (
            <>
              <p>A return is accepted when <strong>all</strong> of the following apply:</p>
              <ul>
                <li>The request is made within <strong>15 days of delivery</strong>.</li>
                <li>The fabric was bought in a length of <strong>2 metres or more</strong>.</li>
                <li>It is unused, unwashed, unstitched and not cut further, in the length and condition it was delivered.</li>
              </ul>
            </>
          ),
        },
        {
          heading: 'Non-returnable items',
          body: (
            <>
              <ul>
                <li>Any fabric bought in a length <strong>below 2 metres</strong>.</li>
                <li>Fabric that has been washed, cut, stitched or otherwise used.</li>
                <li>Bulk or wholesale orders and items sold on clearance.</li>
                <li>Returns requested more than 15 days after delivery.</li>
              </ul>
              <p>
                These exclusions do not apply to damaged, defective or wrong items, which are always covered (see
                &ldquo;Damaged, defective or wrong items&rdquo;).
              </p>
              <p>
                Slight variation in colour or shade from what you see on screen is normal for photographed fabric and is not
                treated as a defect. If you are unsure, ask us on WhatsApp for extra photos before you order.
              </p>
            </>
          ),
        },
        {
          heading: 'How to request a return',
          body: (
            <ol>
              <li>Message us on WhatsApp or email within 15 days of delivery with your order number and clear photos of the fabric.</li>
              <li>We confirm whether the return is accepted and share the return address or pickup details.</li>
              <li>Pack the fabric securely, ideally in its original packaging, and send it back.</li>
              <li>Once we receive and inspect the fabric, we confirm your refund.</li>
            </ol>
          ),
        },
        {
          heading: 'Damaged, defective or wrong items',
          body: (
            <p>
              If your fabric arrives damaged or defective, or you receive the wrong item or a short length, tell us within{' '}
              <strong>48 hours of delivery</strong> with photos. We will replace it or refund you in full, including shipping
              charges. This applies to every order, including lengths below 2 metres.
            </p>
          ),
        },
        {
          heading: 'Refunds',
          body: (
            <ul>
              <li>Refunds are processed after the returned fabric has been received and inspected.</li>
              <li>Online payments (UPI, card or netbanking via Razorpay) are refunded to the original payment method, usually within 5–7 working days of approval.</li>
              <li>Cash on Delivery orders are refunded by UPI or bank transfer to an account you share with us.</li>
              <li>Original shipping charges are not refunded, except for damaged, defective or wrong items.</li>
            </ul>
          ),
        },
      ]}
    />
  );
}
