import type { Metadata } from 'next';
import PolicyPage, { BUSINESS } from '@/components/common/PolicyPage';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'What personal data RCS Fabrics collects, why, and how we protect it.',
};

export default function PrivacyPolicy() {
  return (
    <PolicyPage
      title="Privacy Policy"
      intro={<p>{BUSINESS.legalName} ({BUSINESS.brand}, “we”) respects your privacy. This policy explains what information we collect when you use this website and how we use it.</p>}
      sections={[
        {
          heading: 'Information we collect',
          body: (
            <ul>
              <li><strong>Account details:</strong> name, email address, phone number and password (stored only in encrypted/hashed form).</li>
              <li><strong>Order details:</strong> delivery addresses, items ordered, order history and payment status.</li>
              <li><strong>Messages:</strong> anything you send us through the contact, bulk-order or newsletter forms.</li>
              <li><strong>Technical data:</strong> basic information such as IP address and browser type, used for security and to prevent abuse.</li>
            </ul>
          ),
        },
        {
          heading: 'Payments',
          body: <p>Online payments are processed by Razorpay. We do not see or store your full card, UPI PIN or bank login details. Razorpay’s own privacy policy applies to the payment step.</p>,
        },
        {
          heading: 'How we use your information',
          body: (
            <ul>
              <li>To create and manage your account and verify your phone number or email (OTP).</li>
              <li>To process, ship and support your orders, returns and refunds.</li>
              <li>To reply to your enquiries and send bulk quotes.</li>
              <li>To send newsletters and offers only if you subscribed — you can unsubscribe at any time.</li>
              <li>To keep the website secure and prevent fraud.</li>
            </ul>
          ),
        },
        {
          heading: 'Sharing your information',
          body: <p>We do not sell your personal data. We share only what is needed with service providers that help us run the store — for example courier partners (to deliver your order), Razorpay (payments), SMS/email providers (OTP and notifications) and our hosting providers — or where required by law.</p>,
        },
        {
          heading: 'Data retention and security',
          body: <p>We keep order records for as long as required for accounting and legal purposes, and other data only as long as needed for the purposes above. We use reasonable technical measures such as encrypted connections and hashed passwords to protect your data.</p>,
        },
        {
          heading: 'Your choices and rights',
          body: <p>You can view and update your profile and addresses from <a href="/account">My Account</a>. To access, correct or delete your data, or to unsubscribe from emails, contact us using the details below.</p>,
        },
        {
          heading: 'Changes to this policy',
          body: <p>We may update this policy from time to time. The “Last updated” date above shows the latest version.</p>,
        },
      ]}
    />
  );
}
