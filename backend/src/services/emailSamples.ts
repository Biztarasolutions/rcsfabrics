// Sample copies of every website email, for the super admin to check the design in a real inbox.
import { buildOrderEmails, buildStatusEmail, type FullOrder } from '@/services/orderNotifications';
import { brandEmail, button, codeBox, detailsTable, para, siteUrl } from '@/utils/emailLayout';

const IMG = 'https://eufihjcpdolquyxucnpf.supabase.co/storage/v1/object/public/product-images/';

export function sampleEmails(to: string): { subject: string; html: string }[] {
  const order = {
    id: 'sample', orderNumber: 'RCS-20261119-0042', subtotal: 2245, discountAmount: 224.5, couponCode: 'WELCOME10',
    shippingCost: 0, total: 2020.5, createdAt: new Date(), paymentMethod: 'COD', paymentStatus: 'PENDING',
    utrReference: null, trackingNumber: 'DTDC D12345678',
    shippingAddress: JSON.stringify({ firstName: 'Priya', lastName: 'Sharma', phone: '+91 9876543210', street: '12, Church Road', city: 'Dimapur', state: 'Nagaland', postalCode: '797112', country: 'India' }),
    items: [
      { productName: 'Polka Dot Poplin — White', productImage: `${IMG}1794943256880-Fabric-1.webp`, quantity: 2.5, pricePerMeter: 449, total: 1122.5 },
      { productName: 'Lachka Stretchable — Pink', productImage: `${IMG}1794943237477-Stretchable-1.webp`, quantity: 2.5, pricePerMeter: 449, total: 1122.5 },
    ],
    user: { email: to, firstName: 'Priya', lastName: 'Sharma', phone: '+91 9876543210' },
  } as unknown as FullOrder;
  const paid = { ...order, paymentMethod: 'CASHFREE', paymentStatus: 'PAID' } as unknown as FullOrder;

  const out: { subject: string; html: string }[] = [];
  out.push(...buildOrderEmails(order, 'placed'));
  out.push(...buildOrderEmails(paid, 'paid'));
  for (const s of ['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED']) {
    const m = buildStatusEmail(paid, s); if (m) out.push(m);
  }
  const c = buildStatusEmail(paid, 'CANCELLED', { byCustomer: true }); if (c) out.push(c);

  const small = 'font-size:13px;color:#7a6e62';
  out.push({ subject: '482913 is your RCS Fabrics verification code', html: brandEmail({ preheader: '482913 is your verification code.', eyebrow: 'Create your account', title: 'Verify your email',
    body: `${para('Hello Priya, welcome to RCS Fabrics! Enter this code to finish creating your account:')}${codeBox('482913')}${para('This code is valid for 10 minutes. If you did not try to sign up, you can safely ignore this email.', small)}` }) });
  out.push({ subject: '731406 is your RCS Fabrics login code', html: brandEmail({ preheader: '731406 is your login code.', eyebrow: 'Sign in', title: 'Your login code',
    body: `${para('Hello Priya, use this code to sign in to your RCS Fabrics account:')}${codeBox('731406')}${para('This code is valid for 10 minutes. Never share it with anyone — RCS Fabrics will never ask you for it.', small)}` }) });
  out.push({ subject: 'Reset your RCS Fabrics password', html: brandEmail({ preheader: '205518 is your password reset code.', eyebrow: 'Account security', title: 'Reset your password',
    body: `${para('Hello Priya, we received a request to reset your RCS Fabrics password. Enter this code to choose a new one:')}${codeBox('205518')}${para("This code is valid for 10 minutes. If you didn't ask to reset your password, you can ignore this email — your password will stay the same.", small)}` }) });
  const box = 'font-size:14px;line-height:1.7;background:#faf6ee;border-radius:10px;padding:14px 16px';
  out.push({ subject: 'New bulk quote request — 50 m Polka Dot Poplin from Anita Boutique', html: brandEmail({ team: true, preheader: 'Anita Boutique · 9876501234', eyebrow: 'Bulk quote request', title: '50 m Polka Dot Poplin from Anita Boutique',
    body: `${detailsTable([['Name', 'Anita Boutique'], ['Email', 'anita@example.com'], ['Phone', '9876501234']])}<div style="height:18px"></div>${para('Fabric: Polka Dot Poplin — White<br/>Quantity: 50 m<br/>Requested price: ₹380 per metre<br/>Required by: 2026-12-05', box)}${button('https://wa.me/919876501234', 'Reply on WhatsApp')}${para(`Enquiry ID: sample · <a href="${siteUrl()}/admin" style="color:#7a6e62">Open admin</a>`, 'font-size:12px;color:#7a6e62;margin-top:12px')}` }) });
  out.push({ subject: 'New website message — Delivery to Kohima (Rahul)', html: brandEmail({ team: true, preheader: 'Rahul · rahul@example.com', eyebrow: 'Website message', title: 'Delivery to Kohima (Rahul)',
    body: `${detailsTable([['Name', 'Rahul'], ['Email', 'rahul@example.com'], ['Phone', '—']])}<div style="height:18px"></div>${para('Delivery to Kohima<br/><br/>How many days does delivery to Kohima take?', box)}` }) });
  return out;
}
