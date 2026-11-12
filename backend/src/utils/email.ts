// src/utils/email.ts
//
// Sends email through Brevo's HTTPS API when BREVO_API_KEY is set (works on
// Render's free plan, which blocks SMTP ports), otherwise falls back to SMTP.
//
// Brevo env vars:
//   BREVO_API_KEY       API key from Brevo → SMTP & API → API keys (starts with "xkeysib-")
//   EMAIL_FROM          a sender email verified in Brevo → Senders
//   EMAIL_FROM_NAME     optional display name (default "RCS Fabrics")
//   EMAIL_REPLY_TO      optional reply-to address
import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string[]; // list of recipient emails
  subject: string;
  html: string;
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

async function sendViaBrevo(options: EmailOptions) {
  const apiKey = process.env.BREVO_API_KEY as string;
  const sender = fromEmail();
  if (!sender) throw new Error('EMAIL_FROM is not set (use a sender verified in Brevo)');

  const body: Record<string, unknown> = {
    sender: { email: sender, name: fromName() },
    to: options.to.filter(Boolean).map((email) => ({ email })),
    subject: options.subject,
    htmlContent: options.html,
    textContent: htmlToText(options.html),
  };
  if (process.env.EMAIL_REPLY_TO) body.replyTo = { email: process.env.EMAIL_REPLY_TO };

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
      replyTo: process.env.EMAIL_REPLY_TO || undefined,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: htmlToText(options.html),
    });
    console.log('Email sent via SMTP:', info.messageId);
    return info;
  } catch (err) {
    console.error('Error sending email:', err);
    throw err;
  }
};
