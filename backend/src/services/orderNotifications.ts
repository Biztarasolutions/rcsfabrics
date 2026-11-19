import { prisma } from '@/index';
import { getCashfreePaymentStatus } from '@/utils/cashfree';
import { sendEmail, MAILBOX } from '@/utils/email';
import {
  brandEmail, button, detailsTable, esc, inr, itemsTable, note, para, progress, sectionTitle, siteUrl, totalsTable,
} from '@/utils/emailLayout';

const teamEmails = (): string[] => {
  const list = (process.env.ORDER_NOTIFY_EMAILS || '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);
  return list.length ? list : [MAILBOX.orders()];
};

const PAYMENT_LABEL: Record<string, string> = {
  COD: 'Cash on Delivery',
  UPI: 'UPI transfer',
  CASHFREE: 'Online payment',
  BANK_TRANSFER: 'Bank transfer',
};
const PAYMENT_STATUS: Record<string, string> = {
  PAID: 'Paid', PENDING: 'Pending', FAILED: 'Failed', REFUNDED: 'Refunded',
};

const dateIN = (d: Date): string =>
  new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });

const loadOrder = (orderId: string) =>
  prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, user: { select: { email: true, firstName: true, lastName: true, phone: true } } },
  });
export type FullOrder = NonNullable<Awaited<ReturnType<typeof loadOrder>>>;

function addressHtml(order: FullOrder): string {
  let a: any = {};
  try { a = JSON.parse(order.shippingAddress || '{}'); } catch { /* keep empty */ }
  const name = a.fullName || a.name || [a.firstName, a.lastName].filter(Boolean).join(' ');
  return [
    name ? `<strong>${esc(name)}</strong>` : '',
    esc(a.street || a.addressLine1 || a.line1 || a.address || ''),
    esc(a.addressLine2 || a.line2 || ''),
    esc([a.city, a.state].filter(Boolean).join(', ') + (a.postalCode || a.pincode ? ` – ${a.postalCode || a.pincode}` : '')),
    a.country && a.country !== 'India' ? esc(a.country) : '',
    a.phone ? `📞 ${esc(a.phone)}` : '',
  ].filter(Boolean).join('<br/>');
}

const paymentLine = (o: FullOrder): string =>
  `${esc(PAYMENT_LABEL[o.paymentMethod || ''] || o.paymentMethod || '—')} · ${esc(PAYMENT_STATUS[o.paymentStatus] || o.paymentStatus)}`;

const orderLink = (o: FullOrder): string => `${siteUrl()}/account/orders/${o.id}`;

/** Items + totals + delivery address, shared by the order emails */
function orderBody(o: FullOrder): string {
  const addr = addressHtml(o);
  return `
    ${sectionTitle('Your fabrics')}
    ${itemsTable(o.items)}
    ${totalsTable(o)}
    ${addr ? `${sectionTitle('Delivering to')}${para(addr, 'font-size:14px;line-height:1.7')}` : ''}`;
}

/**
 * Email the customer and the team about an order.
 * event 'placed'  — sent when a COD / manual-UPI order is created
 * event 'paid'    — sent when an online payment is verified
 * Never throws: email problems must not break checkout.
 */
export async function notifyOrder(orderId: string, event: 'placed' | 'paid'): Promise<void> {
  try {
    const order = await loadOrder(orderId);
    if (!order) return;
    const results = await Promise.allSettled(buildOrderEmails(order, event).map((m) => sendEmail(m)));
    results.forEach((r) => { if (r.status === 'rejected') console.error('[Order email] failed:', r.reason); });
  } catch (err) {
    console.error('[Order email] could not prepare notification:', err);
  }
}

type Mail = { to: string[]; subject: string; html: string; mailbox: 'orders'; replyTo?: string };
const ORDER_HELP = { contactEmail: MAILBOX.orders(), helpTitle: 'Questions about your order?' };

/** Customer + team emails for a new / paid order (pure: no sending) */
export function buildOrderEmails(order: FullOrder, event: 'placed' | 'paid'): Mail[] {
  {
    const first = order.user?.firstName ? esc(order.user.firstName) : '';
    const jobs: Mail[] = [];

    if (order.user?.email) {
      const title = event === 'paid' ? 'Payment received — thank you!' : 'Thank you for your order!';
      jobs.push(({
        mailbox: 'orders',
        to: [order.user.email],
        subject: event === 'paid' ? `Payment received — order ${order.orderNumber}` : `Order confirmed — ${order.orderNumber}`,
        html: brandEmail({
          ...ORDER_HELP,
          preheader: `Order ${order.orderNumber} · ${inr(order.total)} · we'll email you when it ships.`,
          eyebrow: `Order ${order.orderNumber}`,
          title,
          body: `
            ${para(`Hi${first ? ` ${first}` : ''}, ${event === 'paid'
              ? 'your payment was successful. We are now cutting your fabric to length and packing it with care.'
              : 'we have received your order. We will cut your fabric to length, pack it with care and email you as soon as it ships.'}`)}
            ${progress(event === 'paid' ? 1 : 0)}
            <div style="height:18px"></div>
            ${detailsTable([
              ['Order number', esc(order.orderNumber)],
              ['Order date', esc(dateIN(order.createdAt))],
              ['Payment', paymentLine(order)],
            ])}
            ${orderBody(order)}
            <div style="height:10px"></div>
            ${button(orderLink(order), 'View your order')}
            ${note('Want to change something? You can cancel free of charge any time before your order is shipped, from <strong>My Orders</strong> or by messaging us on WhatsApp.')}`,
        }),
      }));
    }

    const customer = [order.user?.firstName, order.user?.lastName].filter(Boolean).join(' ') || 'Customer';
    jobs.push(({
      mailbox: 'orders',
      replyTo: order.user?.email || undefined,
      to: teamEmails(),
      subject: event === 'paid'
        ? `💰 Paid order ${order.orderNumber} — ${inr(order.total)}`
        : `🧵 New order ${order.orderNumber} — ${inr(order.total)} (${PAYMENT_LABEL[order.paymentMethod || ''] || order.paymentMethod})`,
      html: brandEmail({
        team: true,
        preheader: `${customer} · ${inr(order.total)} · ${order.items.length} item(s)`,
        eyebrow: event === 'paid' ? 'Online payment received' : 'New order',
        title: `${order.orderNumber} · ${inr(order.total)}`,
        body: `
          ${detailsTable([
            ['Customer', esc(customer)],
            ['Email', esc(order.user?.email || '—')],
            ['Phone', esc(order.user?.phone || '—')],
            ['Placed', esc(dateIN(order.createdAt))],
            ['Payment', paymentLine(order) + (order.utrReference ? `<br/><span style="font-weight:400">UTR ${esc(order.utrReference)}</span>` : '')],
          ])}
          ${orderBody(order).replace('Your fabrics', 'Items to cut').replace('Delivering to', 'Ship to')}
          <div style="height:10px"></div>
          ${button(`${siteUrl()}/admin/orders`, 'Open in admin')}`,
      }),
    }));

    return jobs;
  }
}

export const TRACK_URL = 'https://www.indiapost.gov.in/';

const STATUS_EMAIL: Record<string, { subject: (n: string) => string; eyebrow: string; title: string; text: string; step: number | null }> = {
  PROCESSING: {
    subject: (n) => `Your order ${n} is being prepared`,
    eyebrow: 'Preparing', title: 'We are preparing your order', step: 1,
    text: 'your fabric is being cut to length, checked and packed. We will email you again as soon as it ships.',
  },
  SHIPPED: {
    subject: (n) => `Your order ${n} has been shipped`,
    eyebrow: 'Shipped', title: 'Your order is on the way', step: 2,
    text: 'good news — your parcel has left our shop in Dimapur and is on its way to you.',
  },
  DELIVERED: {
    subject: (n) => `Your order ${n} has been delivered`,
    eyebrow: 'Delivered', title: 'Your order has been delivered', step: 3,
    text: 'your order has been delivered. We hope you love your fabric!',
  },
  CANCELLED: {
    subject: (n) => `Your order ${n} has been cancelled`,
    eyebrow: 'Cancelled', title: 'Your order has been cancelled', step: null,
    text: 'your order has been cancelled.',
  },
  RETURNED: {
    subject: (n) => `Your order ${n} has been returned`,
    eyebrow: 'Returned', title: 'Your order has been returned', step: null,
    text: 'your order has been returned to RCS Fabrics.',
  },
};

/**
 * Email the customer when their order status changes (preparing, shipped, delivered,
 * cancelled, returned). Never throws.
 */
export async function notifyOrderStatus(orderId: string, status: string, opts: { byCustomer?: boolean } = {}): Promise<void> {
  try {
    if (!STATUS_EMAIL[status]) return;
    const order = await loadOrder(orderId);
    if (!order?.user?.email) return;
    const mail = buildStatusEmail(order, status, opts);
    if (!mail) return;
    // Customer gets the update; support gets a copy for the record
    const results = await Promise.allSettled([
      sendEmail(mail),
      sendEmail({ ...mail, replyTo: order.user.email, to: teamEmails(), subject: `[${STATUS_EMAIL[status].eyebrow}] ${order.orderNumber} — copy of customer email to ${order.user.email}` }),
    ]);
    results.forEach((r) => { if (r.status === 'rejected') console.error('[Order status email] failed:', r.reason); });
  } catch (err) {
    console.error('[Order status email] failed:', err);
  }
}

/** Customer email for a status change (pure: no sending) */
export function buildStatusEmail(order: FullOrder, status: string, opts: { byCustomer?: boolean } = {}): Mail | null {
  {
    const tpl = STATUS_EMAIL[status];
    if (!tpl || !order.user?.email) return null;
    const first = order.user.firstName ? esc(order.user.firstName) : '';
    const paidOnline = order.paymentStatus === 'PAID' || order.paymentStatus === 'REFUNDED';

    let extra = '';
    if (status === 'SHIPPED') {
      extra = order.trackingNumber
        ? `${sectionTitle('Track your parcel')}
          ${detailsTable([
            ['Courier', 'India Post'],
            ['Tracking number', `<span style="font-family:Consolas,Menlo,monospace;font-size:15px;letter-spacing:.5px">${esc(order.trackingNumber)}</span>`],
            ['Expected delivery', 'Within 8–10 days of your order date'],
          ])}
          <div style="height:12px"></div>
          ${button(TRACK_URL, 'Track on India Post')}
          ${para(`On the India Post site, open <strong>Track &amp; Trace</strong> and enter the tracking number above.`, 'font-size:13px;color:#7a6e62;margin-top:6px')}`
        : note('Delivery usually takes 8–10 days from your order date, depending on your location. Message us on WhatsApp any time for an update.');
    }
    if (status === 'DELIVERED') {
      extra = note('<strong>Anything not right?</strong> If you received the wrong fabric or it arrived damaged, message us within <strong>48 hours of delivery</strong> with photos and we will replace it or refund you.');
    }
    if (status === 'CANCELLED') {
      extra = note(`${opts.byCustomer ? 'As you requested, we have cancelled this order.' : 'If you did not expect this, please contact us and we will help.'}${
        paidOnline ? '<br/><strong>Refund:</strong> your payment will be returned to the original payment method within 5–7 working days.' : ''}`);
    }
    if (status === 'RETURNED') {
      extra = note(paidOnline
        ? '<strong>Refund:</strong> any amount due will be returned to your original payment method within 5–7 working days.'
        : '<strong>Refund:</strong> if an amount is due, we will contact you for your UPI or bank details.');
    }

    return {
      mailbox: 'orders',
      to: [order.user.email],
      subject: tpl.subject(order.orderNumber),
      html: brandEmail({
        ...ORDER_HELP,
        preheader: `Order ${order.orderNumber} — ${tpl.title.toLowerCase()}.`,
        eyebrow: `Order ${order.orderNumber} · ${tpl.eyebrow}`,
        title: tpl.title,
        body: `
          ${para(`Hi${first ? ` ${first}` : ''}, ${tpl.text}`)}
          ${tpl.step !== null ? `${progress(tpl.step)}<div style="height:6px"></div>` : ''}
          ${extra}
          ${sectionTitle('Order summary')}
          ${detailsTable([
            ['Order number', esc(order.orderNumber)],
            ['Order date', esc(dateIN(order.createdAt))],
            ['Total', `<span style="color:#6b1219">${inr(order.total)}</span>`],
            ['Payment', paymentLine(order)],
          ])}
          <div style="height:6px"></div>
          ${itemsTable(order.items)}
          <div style="height:10px"></div>
          ${button(orderLink(order), 'View your order')}`,
      }),
    };
  }
}

/**
 * Online (Cashfree) orders that were never paid hold stock.
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
      paymentMethod: 'CASHFREE',
      cashfreeOrderId: { not: null },
      utrReference: null,
      createdAt: { lt: cutoff },
    },
    select: { id: true, cashfreeOrderId: true, total: true },
    take: 100,
  });

  let released = 0;
  for (const { id, cashfreeOrderId, total } of stale) {
    // Before cancelling, ask Cashfree whether it was actually paid (a missed notification)
    if (cashfreeOrderId) {
      try {
        const st = await getCashfreePaymentStatus(cashfreeOrderId);
        if (st.paid && Math.abs(st.amount - total) <= 0.5) {
          const r = await prisma.order.updateMany({
            where: { id, paymentStatus: { not: 'PAID' } },
            data: { paymentStatus: 'PAID', status: 'PROCESSING', cashfreePaymentId: st.paymentId, paidAt: new Date() },
          });
          if (r.count) void notifyOrder(id, 'paid');
          continue;
        }
      } catch (err) {
        console.error('[Cashfree] status check before release failed — keeping order for now:', err);
        continue;
      }
    }
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

/** Shipped orders are marked Delivered automatically 15 days after the order was placed. */
export const AUTO_DELIVER_DAYS = 15;
export async function autoDeliverOrders(): Promise<number> {
  const cutoff = new Date(Date.now() - AUTO_DELIVER_DAYS * 24 * 60 * 60 * 1000);
  const due = await prisma.order.findMany({
    where: { status: 'SHIPPED', createdAt: { lt: cutoff } },
    select: { id: true, orderNumber: true },
    take: 100,
  });
  for (const o of due) {
    const res = await prisma.order.updateMany({
      where: { id: o.id, status: 'SHIPPED' },
      data: { status: 'DELIVERED', deliveredAt: new Date() },
    });
    if (res.count) {
      console.log(`[Auto-deliver] ${o.orderNumber} marked delivered`);
      await notifyOrderStatus(o.id, 'DELIVERED');
    }
  }
  return due.length;
}

export function startUnpaidOrderSweeper(): void {
  const run = () => {
    releaseUnpaidOrders().catch((e) => console.error('[Unpaid orders] sweep failed:', e));
    autoDeliverOrders().catch((e) => console.error('[Auto-deliver] sweep failed:', e));
  };
  setTimeout(run, 60 * 1000);
  setInterval(run, 5 * 60 * 1000).unref();
}
