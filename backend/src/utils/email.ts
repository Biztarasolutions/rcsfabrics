// src/utils/email.ts
//
// Sends email through Brevo's HTTPS API when BREVO_API_KEY is set (works on
// Render's free plan, which blocks SMTP ports), otherwise falls back to SMTP.
//
// Brevo env vars:
//   BREVO_API_KEY       API key from Brevo → SMTP & API → API keys (starts with "xkeysib-")
//   EMAIL_FROM          a sender email verified in Brevo → Senders
//   EMAIL_FROM_NAME     optional display name (default "RCS Fabrics")
//   EMAIL_REPLY_TO      optional reply-to address (used when an email has no mailbox)
//   EMAIL_ORDERS / EMAIL_SUPPORT / EMAIL_ENQUIRY   override the three shop mailboxes
//
// Each email can name a mailbox (orders, support, enquiry). It is sent from that
// address (falls back to EMAIL_FROM if Brevo has not verified it) and replies go there.
import nodemailer from 'nodemailer';

export type Mailbox = 'orders' | 'support' | 'enquiry';
export const MAILBOX: Record<Mailbox, () => string> = {
  orders: () => process.env.EMAIL_ORDERS || 'orders@rcsfabrics.com',
  support: () => process.env.EMAIL_SUPPORT || 'support@rcsfabrics.com',
  enquiry: () => process.env.EMAIL_ENQUIRY || 'enquiry@rcsfabrics.com',
};

export interface EmailOptions {
  to: string[]; // list of recipient emails
  subject: string;
  html: string;
  /** Optional files, base64-encoded */
  attachments?: { name: string; content: string }[];
  /** Which shop mailbox this email is from; replies go there too */
  mailbox?: Mailbox;
  /** Overrides where replies go (e.g. the customer, on internal enquiry alerts) */
  replyTo?: string;
}

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

const fromEmail = (): string =>
  process.env.EMAIL_FROM || process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || '';
const fromName = (): string => process.env.EMAIL_FROM_NAME || 'RCS Fabrics';

const htmlToText = (html: string): string =>
  html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h\d|tr|li)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

// Mailbox senders Brevo refused (not verified yet) — skip them until restart
const unverified = new Set<string>();

async function sendViaBrevo(options: EmailOptions): Promise<any> {
  const box = options.mailbox ? MAILBOX[options.mailbox]() : '';
  const useBox = !!box && !unverified.has(box);
  const sender = useBox ? box : fromEmail();
  if (!sender) throw new Error('EMAIL_FROM is not set (use a sender verified in Brevo)');
  try {
    return await brevoRequest(options, sender, options.replyTo || box || process.env.EMAIL_REPLY_TO || '');
  } catch (err: any) {
    // Mailbox address not verified in Brevo yet: send from the default sender instead
    if (useBox && fromEmail() && /\b400\b/.test(String(err?.message)) && /sender/i.test(String(err?.message))) {
      console.warn(`[Email] ${box} is not a verified Brevo sender yet — using ${fromEmail()} (replies still go to ${box})`);
      unverified.add(box);
      return brevoRequest(options, fromEmail(), options.replyTo || box);
    }
    throw err;
  }
}

async function brevoRequest(options: EmailOptions, sender: string, replyTo: string) {
  const apiKey = process.env.BREVO_API_KEY as string;
  const body: Record<string, unknown> = {
    sender: { email: sender, name: fromName() },
    to: options.to.filter(Boolean).map((email) => ({ email })),
    subject: options.subject,
    htmlContent: options.html,
    textContent: htmlToText(options.html),
  };
  if (replyTo) body.replyTo = { email: replyTo };
  if (options.attachments?.length) body.attachment = options.attachments;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(BREVO_URL, {
      method: 'POST',
      headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const text = await res.text();
    if (!res.ok) {
      // Common: 401 wrong key / unauthorised IP, 400 sender not verified
      throw new Error(`Brevo ${res.status}: ${text.slice(0, 300)}`);
    }
    const data = text ? JSON.parse(text) : {};
    console.log('Email sent via Brevo:', data.messageId || '(no id)');
    return data;
  } finally {
    clearTimeout(timer);
  }
}

let smtpTransport: nodemailer.Transporter | null = null;
function getSmtp() {
  if (!smtpTransport) {
    const port = Number(process.env.SMTP_PORT) || 587;
    smtpTransport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || '',
      port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASSWORD || process.env.SMTP_PASS || '',
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
    });
  }
  return smtpTransport;
}

export const emailConfigured = (): boolean =>
  !!process.env.BREVO_API_KEY || !!(process.env.SMTP_HOST && process.env.SMTP_USER);

if (!emailConfigured()) {
  console.warn('Email is not configured (set BREVO_API_KEY + EMAIL_FROM). Emails will fail.');
}

export const sendEmail = async (options: EmailOptions) => {
  try {
    if (process.env.BREVO_API_KEY) return await sendViaBrevo(options);
    const info = await getSmtp().sendMail({
      from: `"${fromName()}" <${fromEmail()}>`,
      replyTo: options.replyTo || (options.mailbox && MAILBOX[options.mailbox]()) || process.env.EMAIL_REPLY_TO || undefined,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: htmlToText(options.html),
      attachments: options.attachments?.map((a) => ({ filename: a.name, content: Buffer.from(a.content, 'base64') })),
    });
    console.log('Email sent via SMTP:', info.messageId);
    return info;
  } catch (err) {
    console.error('Error sending email:', err);
    throw err;
  }
};
