// Cashfree Payment Gateway (PG v3 REST API)
//
// Env (set in Render → Environment):
//   CASHFREE_APP_ID       App ID from Cashfree dashboard → Developers → API Keys
//   CASHFREE_SECRET_KEY   Secret Key from the same page (never sent to the browser)
//   CASHFREE_ENV          "production" (live) or "sandbox" (test). Default: production
import crypto from 'crypto';

const API_VERSION = '2025-01-01';

export const cashfreeEnv = (): 'production' | 'sandbox' =>
  (process.env.CASHFREE_ENV || 'production').toLowerCase() === 'sandbox' ? 'sandbox' : 'production';

const baseUrl = () => (cashfreeEnv() === 'sandbox' ? 'https://sandbox.cashfree.com/pg' : 'https://api.cashfree.com/pg');

export const cashfreeConfigured = (): boolean => !!(process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY);

async function cf<T = any>(path: string, init: { method?: string; body?: unknown; idempotencyKey?: string } = {}): Promise<T> {
  if (!cashfreeConfigured()) throw new Error('Cashfree is not configured');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(`${baseUrl()}${path}`, {
      method: init.method || 'GET',
      headers: {
        'x-client-id': process.env.CASHFREE_APP_ID as string,
        'x-client-secret': process.env.CASHFREE_SECRET_KEY as string,
        'x-api-version': API_VERSION,
        'content-type': 'application/json',
        accept: 'application/json',
        ...(init.idempotencyKey ? { 'x-idempotency-key': init.idempotencyKey } : {}),
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
      signal: ctrl.signal,
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    if (!res.ok) throw new Error(`Cashfree ${res.status}: ${data?.message || text.slice(0, 200)}`);
    return data as T;
  } finally {
    clearTimeout(timer);
  }
}

/** Indian mobile → 10 digits (Cashfree requires a phone) */
const tenDigits = (phone?: string | null) => {
  const d = String(phone || '').replace(/\D/g, '');
  return d.length >= 10 ? d.slice(-10) : '9999999999';
};

export async function createCashfreeOrder(opts: {
  cfOrderId: string;
  amount: number;
  customerId: string;
  name?: string;
  email?: string;
  phone?: string | null;
  returnUrl: string;
  notifyUrl: string;
  note?: string;
}): Promise<{ cfOrderId: string; paymentSessionId: string }> {
  const data = await cf('/orders', {
    method: 'POST',
    idempotencyKey: crypto.createHash('sha256').update(opts.cfOrderId).digest('hex').slice(0, 36),
    body: {
      order_id: opts.cfOrderId,
      order_amount: Math.round(opts.amount * 100) / 100,
      order_currency: 'INR',
      customer_details: {
        customer_id: opts.customerId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50) || 'customer',
        customer_phone: tenDigits(opts.phone),
        ...(opts.name && opts.name.trim().length >= 3 ? { customer_name: opts.name.trim().slice(0, 100) } : {}),
        ...(opts.email ? { customer_email: opts.email.slice(0, 100) } : {}),
      },
      order_meta: { return_url: opts.returnUrl.slice(0, 250), notify_url: opts.notifyUrl.slice(0, 250) },
      order_note: opts.note?.slice(0, 200),
    },
  });
  if (!data?.payment_session_id) throw new Error('Cashfree did not return a payment session');
  return { cfOrderId: data.order_id, paymentSessionId: data.payment_session_id };
}

/** Server-side truth: is this Cashfree order paid, and by which payment? */
export async function getCashfreePaymentStatus(cfOrderId: string): Promise<{ paid: boolean; amount: number; paymentId?: string; status: string }> {
  const order = await cf(`/orders/${encodeURIComponent(cfOrderId)}`);
  let paymentId: string | undefined;
  if (order?.order_status === 'PAID') {
    try {
      const payments: any[] = await cf(`/orders/${encodeURIComponent(cfOrderId)}/payments`);
      paymentId = payments.find((p) => p.payment_status === 'SUCCESS')?.cf_payment_id?.toString();
    } catch { /* payment id is nice-to-have */ }
  }
  return { paid: order?.order_status === 'PAID', amount: Number(order?.order_amount || 0), paymentId, status: order?.order_status || 'UNKNOWN' };
}

/** Webhook signature: base64(HMAC-SHA256(secret, timestamp + rawBody)) */
export function verifyCashfreeWebhook(rawBody: string, timestamp?: string, signature?: string): boolean {
  const secret = process.env.CASHFREE_SECRET_KEY;
  if (!secret || !timestamp || !signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(timestamp + rawBody).digest('base64');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
