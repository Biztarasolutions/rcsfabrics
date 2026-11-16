import type { Metadata } from 'next';
import Link from 'next/link';
import PolicyPage, { BUSINESS } from '@/components/common/PolicyPage';

export const metadata: Metadata = {
  title: 'Returns, Cancellation & Refund Policy',
  description:
    'No returns on cut fabric. Wrong or damaged items: report within 48 hours and we replace or refund. Cancel free before your order is shipped.',
};

export default function ReturnPolicy() {
  return (
    <PolicyPage
      title="Returns, Cancellation & Refund Policy"
      intro={
        <p>
          The short version: <strong>we don&apos;t accept returns</strong>, but you are fully covered if something goes wrong on
          our side — and you can cancel for free until your order is shipped.
        </p>
      }
      highlights={[
        { value: 'No returns', label: 'Fabric is cut to your length and gets damaged in transit back' },
        { value: '48 hours', label: 'To report a wrong or damaged item' },
        { value: 'Free', label: 'Cancellation any time before shipping' },
        { value: '5–7 days', label: 'Refund to your original payment method' },
      ]}
      sections={[
        {
          heading: 'At a glance',
          body: (
            <div className="not-prose overflow-hidden rounded-xl border border-gray-200 dark:border-dark-700">
              {[
                ['I want to cancel and my order is not shipped yet', 'Yes — cancel for free, full refund', true],
                ['I received the wrong fabric, colour or a short length', 'Yes — report within 48 hours', true],
                ['My fabric arrived damaged or defective', 'Yes — report within 48 hours', true],
                ['I changed my mind / don’t like the colour after delivery', 'No — returns are not accepted', false],
                ['My order has already been shipped and I want to cancel', 'No — it can’t be cancelled once shipped', false],
              ].map(([q, a, ok]) => (
                <div key={q as string} className="flex flex-col gap-1 border-b border-gray-100 px-4 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4 dark:border-dark-700">
                  <span className="text-gray-700 dark:text-gray-300">{q}</span>
                  <span className={`shrink-0 text-sm font-semibold ${ok ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {ok ? '✓ ' : '✕ '}{a}
                  </span>
                </div>
              ))}
            </div>
          ),
        },
        {
          heading: 'Why we don’t accept returns',
          body: (
            <>
              <p>
                Every order at {BUSINESS.legalName} ({BUSINESS.brand}) is cut fresh to the length you choose. Fabric sent back to
                us often arrives creased, stretched or soiled and can no longer be sold, so we&apos;re unable to accept returns
                for a change of mind.
              </p>
              <p>
                Not sure about a colour or feel? <strong>Ask us on WhatsApp before you order</strong> — we&apos;ll happily send
                extra photos or a short video. Slight variation in shade from what you see on screen is normal for photographed
                fabric and is not treated as a defect.
              </p>
            </>
          ),
        },
        {
          heading: 'Wrong or damaged item',
          body: (
            <>
              <p>If something is wrong on our side, we&apos;ll put it right at no cost to you:</p>
              <ol>
                <li>
                  <strong>Within 48 hours of delivery</strong>, message us on WhatsApp or email with your order number and clear
                  photos of the fabric and the packaging. An unboxing video helps if you have one.
                </li>
                <li>Keep the fabric unused, unwashed and uncut while we check.</li>
                <li>Once we confirm the problem, we arrange the return and send you a replacement or a full refund, including shipping charges.</li>
              </ol>
              <p>This covers wrong fabric or colour, a shorter length than ordered, and fabric that arrives torn, stained or defective. Reports made after 48 hours can&apos;t be accepted.</p>
            </>
          ),
        },
        {
          heading: 'Cancelling an order',
          body: (
            <>
              <p>
                You can cancel for free <strong>any time before your order is shipped</strong> — from{' '}
                <Link href="/account/orders">My Orders</Link>, or by messaging us. Prepaid orders are refunded in full.
              </p>
              <p>Once an order has been shipped it can no longer be cancelled.</p>
            </>
          ),
        },
        {
          heading: 'Refunds',
          body: (
            <ul>
              <li>Online payments (UPI, card or netbanking via Razorpay) are refunded to the original payment method, usually within 5–7 working days of approval.</li>
              <li>Cash on Delivery orders are refunded by UPI or bank transfer to an account you share with us.</li>
              <li>For wrong or damaged items, shipping charges are refunded too.</li>
            </ul>
          ),
        },
      ]}
    />
  );
}
