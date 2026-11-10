import type { Metadata } from 'next';
import PolicyPage, { BUSINESS } from '@/components/common/PolicyPage';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'How RCS Fabrics uses cookies and browser storage.',
};

export default function CookiePolicy() {
  return (
    <PolicyPage
      title="Cookie Policy"
      intro={<p>This page explains how {BUSINESS.brand} uses cookies and similar browser storage.</p>}
      sections={[
        {
          heading: 'What we store in your browser',
          body: (
            <ul>
              <li><strong>Essential storage:</strong> your login session, shopping cart, wishlist, recently viewed items and theme (light/dark) preference. These are needed for the store to work.</li>
              <li><strong>Payments:</strong> when you pay online, Razorpay may set its own cookies or storage to process the payment securely and prevent fraud.</li>
            </ul>
          ),
        },
        {
          heading: 'Advertising and tracking',
          body: <p>We do not currently use advertising cookies. If we add analytics or marketing tools in future, we will update this page.</p>,
        },
        {
          heading: 'Managing cookies',
          body: <p>You can clear or block cookies and site data in your browser settings. Blocking essential storage may stop the cart and login from working.</p>,
        },
      ]}
    />
  );
}
