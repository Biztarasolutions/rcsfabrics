import { prisma } from '@/index';
import { sendEmail } from '@/utils/email';

const DEFAULT_NOTIFY = ['rish6.jain@gmail.com', 'mayankjain23102000@gmail.com'];
const teamEmails = (): string[] => {
  const list = (process.env.ORDER_NOTIFY_EMAILS || process.env.ENQUIRY_NOTIFY_EMAILS || '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);
  return list.length ? list : DEFAULT_NOTIFY;
};

const esc = (s: unknown): string =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

const inr = (n: number): string => {
  const v = Math.round((Number(n) || 0) * 100) / 100;
  const d = Number.isInteger(v) ? 0 : 2;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: d, maximumFractionDigits: d }).format(v);
};

const PAYMENT_LABEL: Record<string, string> = {
  COD: 'Cash on Delivery',
  UPI: 'UPI',
  RAZORPAY: 'Online (Razorpay)',
  BANK_TRANSFER: 'Bank transfer',
};

/**
 * Email the customer and the team about an order.
 * event 'placed'  — sent when a COD / manual-UPI order is created
 * event 'paid'    — sent when an online payment is verified
 * Never throws: email problems must not break checkout.
 */
export async function notifyOrder(orderId: string, event: 'placed' | 'paid'): Promise<void> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, user: { select: { email: true, firstName: true, phone: true } } },
    });
    if (!order) return;

    let address: any = {};
    try { address = JSON.parse(order.shippingAddress || '{}'); } catch { /* keep empty */ }

    const rows = order.items
      .map((i) => `<tr><td style="padding:6px 0">${esc(i.productName)}</td><td style="padding:6px 8px;text-align:right">${i.quantity} m</td><td style="padding:6px 0;text-align:right">${inr(i.total)}</td></tr>`)
      .join('');
    const summary = `
      <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}
        <tr><td colspan="2" style="padding-top:10px">Subtotal</td><td style="padding-top:10px;text-align:right">${inr(order.subtotal)}</td></tr>
        ${order.discountAmount ? `<tr><td colspan="2">Discount${order.couponCode ? ` (${esc(order.couponCode)})` : ''}</td><td style="text-align:right">−${inr(order.discountAmount)}</td></tr>` : ''}
        <tr><td colspan="2">Shipping</td><td style="text-align:right">${order.shippingCost ? inr(order.shippingCost) : 'Free'}</td></tr>
        <tr><td colspan="2" style="font-weight:bold;padding-top:6px">Total</td><td style="font-weight:bold;padding-top:6px;text-align:right">${inr(order.total)}</td></tr>
      </table>
      <p style="font-size:14px"><strong>Payment:</strong> ${esc(PAYMENT_LABEL[order.paymentMethod || ''] || order.paymentMethod || '-')} — ${esc(order.paymentStatus)}
      ${order.utrReference ? `<br/><strong>UTR:</strong> ${esc(order.utrReference)}` : ''}</p>`;

    const fullName = address.fullName || address.name || [address.firstName, address.lastName].filter(Boolean).join(' ');
    const addressHtml = [fullName, address.phone, address.street || address.addressLine1 || address.line1 || address.address,
      address.addressLine2 || address.line2, [address.city, address.state, address.postalCode || address.pincode].filter(Boolean).join(', ')]
      .filter(Boolean).map(esc).join('<br/>');

    const customerSubject = event === 'paid'
      ? `Payment received — order ${order.orderNumber}`
      : `We've received your order ${order.orderNumber}`;
    const teamSubject = event === 'paid'
      ? `💰 Paid order ${order.orderNumber} — ${inr(order.total)}`
      : `🧵 New order ${order.orderNumber} — ${inr(order.total)} (${PAYMENT_LABEL[order.paymentMethod || ''] || order.paymentMethod})`;

    const jobs: Promise<unknown>[] = [];
    if (order.user?.email) {
      jobs.push(sendEmail({
        to: [order.user.email],
        subject: customerSubject,
        html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2>Thank you${order.user.firstName ? `, ${esc(order.user.firstName)}` : ''}!</h2>
          <p>${event === 'paid' ? 'Your payment was successful and your order is being prepared.' : 'Your order has been received. We will let you know when it ships.'}</p>
          <p><strong>Order:</strong> ${esc(order.orderNumber)}</p>${summary}
          ${addressHtml ? `<p style="font-size:14px"><strong>Delivering to:</strong><br/>${addressHtml}</p>` : ''}
          <p style="font-size:13px;color:#666">Questions? WhatsApp or call +91 98630 26598, or email biztarasolutions@gmail.com.</p></div>`,
      }));
    }
    jobs.push(sendEmail({
      to: teamEmails(),
      subject: teamSubject,
      html: `<div style="font-family:sans-serif;max-width:600px">
        <p><strong>Customer:</strong> ${esc(order.user?.firstName)} · ${esc(order.user?.email)} · ${esc(order.user?.phone)}</p>
        ${summary}
        ${addressHtml ? `<p style="font-size:14px"><strong>Ship to:</strong><br/>${addressHtml}</p>` : ''}</div>`,
    }));

    const results = await Promise.allSettled(jobs);
    results.forEach((r) => { if (r.status === 'rejected') console.error('[Order email] failed:', r.reason); });
  } catch (err) {
    console.error('[Order email] could not prepare notification:', err);
  }
}

/**
 * Online orders (Razorpay / UPI via Razorpay) that were never paid hold stock.
 * Cancel them after UNPAID_ORDER_TIMEOUT_MINUTES (default 30) and put the stock back.
 * Manual UPI orders with a UTR reference are left for the admin to verify.
 */
export async function releaseUnpaidOrders(): Promise<number> {
  const minutes = Number(process.env.UNPAID_ORDER_TIMEOUT_MINUTES || 30);
  const cutoff = new Date(Date.now() - minutes * 60 * 1000);
  const stale = await prisma.order.findMany({
    where: {
      status: 'PENDING',
      paymentStatus: 'PENDING',
      paymentMethod: { in: ['RAZORPAY', 'UPI'] },
      razorpayOrderId: { not: null },
      utrReference: null,
      createdAt: { lt: cutoff },
    },
    select: { id: true },
    take: 100,
  });

  let released = 0;
  for (const { id } of stale) {
    try {
      await prisma.$transaction(async (tx) => {
        // Conditional update: only one process can cancel it, and never a paid order
        const res = await tx.order.updateMany({
          where: { id, status: 'PENDING', paymentStatus: 'PENDING' },
          data: { status: 'CANCELLED', paymentStatus: 'FAILED', cancelledBy: 'SYSTEM_UNPAID_TIMEOUT' },
        });
        if (res.count === 0) return;
        const items = await tx.orderItem.findMany({ where: { orderId: id } });
        for (const item of items) {
          await tx.product.update({ where: { id: item.productId }, data: { totalStock: { increment: item.quantity } } });
        }
        released++;
      });
    } catch (err) {
      console.error('[Unpaid orders] failed to release', id, err);
    }
  }
  if (released) console.log(`[Unpaid orders] released stock for ${released} unpaid order(s)`);
  return released;
}

export function startUnpaidOrderSweeper(): void {
  const run = () => { releaseUnpaidOrders().catch((e) => console.error('[Unpaid orders] sweep failed:', e)); };
  setTimeout(run, 60 * 1000);
  setInterval(run, 5 * 60 * 1000).unref();
}
