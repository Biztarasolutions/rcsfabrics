import { Request, Response } from 'express';
import { prisma } from '@/index';
import { ApiError } from '@/middleware/errorHandler';
import { ApiResponse } from '@/types';
import { sendEmail } from '@/utils/email';

const DEFAULT_NOTIFY = ['rish6.jain@gmail.com', 'mayankjain23102000@gmail.com'];
const notifyEmails = (): string[] => {
  const list = (process.env.ENQUIRY_NOTIFY_EMAILS || '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);
  return list.length ? list : DEFAULT_NOTIFY;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+\d][\d\s-]{6,19}$/;

const clean = (v: unknown, max: number): string =>
  typeof v === 'string' ? v.trim().slice(0, max) : '';

const escapeHtml = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

/**
 * Public: save a Contact or Bulk-order enquiry and email the team.
 * POST /api/enquiries  { type: 'contact' | 'bulk', ... }
 */
export const createEnquiry = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body || {};

    // Honeypot: real users never fill this hidden field
    if (clean(body.website, 200)) {
      res.status(201).json({ success: true, message: 'Thanks! We will get back to you soon.', statusCode: 201 } as ApiResponse);
      return;
    }

    const type = body.type === 'bulk' ? 'bulk' : 'contact';
    const name = clean(body.name, 200);
    const email = clean(body.email, 255).toLowerCase();
    const phone = clean(body.phone, 20);
    const company = clean(body.company, 255);

    if (name.length < 2) throw new ApiError(400, 'Please enter your name');
    if (!EMAIL_RE.test(email)) throw new ApiError(400, 'Please enter a valid email address');
    if (phone && !PHONE_RE.test(phone)) throw new ApiError(400, 'Please enter a valid phone number');

    let details: string;
    let subjectLine: string;

    if (type === 'bulk') {
      const fabric = clean(body.fabric, 300);
      const quantity = Number(body.quantity);
      const deadline = clean(body.deadline, 20);
      const notes = clean(body.notes, 3000);
      if (!phone) throw new ApiError(400, 'Phone number is required for bulk quotes');
      if (fabric.length < 2) throw new ApiError(400, 'Please tell us which fabric you need');
      if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 1_000_000) {
        throw new ApiError(400, 'Please enter the quantity in metres');
      }
      details = [
        '[Bulk order]',
        `Fabric: ${fabric}`,
        `Quantity: ${quantity} m`,
        deadline ? `Required by: ${deadline}` : '',
        notes ? `Notes: ${notes}` : '',
      ].filter(Boolean).join('\n');
      subjectLine = `New bulk quote request — ${quantity} m ${fabric} from ${name}`;
    } else {
      const subject = clean(body.subject, 200);
      const message = clean(body.message, 5000);
      if (subject.length < 2) throw new ApiError(400, 'Please add a subject');
      if (message.length < 5) throw new ApiError(400, 'Please write a message');
      details = `[Contact] ${subject}\n\n${message}`;
      subjectLine = `New website message — ${subject} (${name})`;
    }

    const saved = await prisma.bulkOrderInquiry.create({
      data: { name, email, phone: phone || '-', company: company || null, inquiryDetails: details },
    });

    // Email is best-effort: the enquiry is already saved for the admin.
    try {
      await sendEmail({
        to: notifyEmails(),
        subject: subjectLine,
        html: `
          <h2>${escapeHtml(subjectLine)}</h2>
          <p><strong>Name:</strong> ${escapeHtml(name)}<br/>
          <strong>Email:</strong> ${escapeHtml(email)}<br/>
          <strong>Phone:</strong> ${escapeHtml(phone || '-')}<br/>
          ${company ? `<strong>Company:</strong> ${escapeHtml(company)}<br/>` : ''}</p>
          <pre style="font-family:inherit;white-space:pre-wrap">${escapeHtml(details)}</pre>
          <p style="color:#888">Enquiry ID: ${saved.id}</p>`,
      });
    } catch (mailErr) {
      console.error('[Enquiry] Saved but email notification failed:', mailErr);
    }

    res.status(201).json({
      success: true,
      message: type === 'bulk'
        ? "Thanks! We've received your bulk request and will send a quote soon."
        : "Thanks! Your message has been sent. We'll reply within 24 hours.",
      data: { id: saved.id },
      statusCode: 201,
    } as ApiResponse);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ success: false, message: error.message, statusCode: error.statusCode } as ApiResponse);
    } else {
      console.error('[Enquiry] Failed to save:', error);
      res.status(500).json({ success: false, message: 'Could not send your message. Please call or WhatsApp us.', statusCode: 500 } as ApiResponse);
    }
  }
};
