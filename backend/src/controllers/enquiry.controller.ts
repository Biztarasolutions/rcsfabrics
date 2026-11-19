import { Request, Response } from 'express';
import { prisma } from '@/index';
import { ApiError } from '@/middleware/errorHandler';
import { ApiResponse } from '@/types';
import { sendEmail } from '@/utils/email';
import { brandEmail, button, detailsTable, para, siteUrl } from '@/utils/emailLayout';

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

    const email = clean(body.email, 255).toLowerCase();

    // Newsletter: just an email, stored once
    if (body.type === 'newsletter') {
      if (!EMAIL_RE.test(email)) throw new ApiError(400, 'Please enter a valid email address');
      const existing = await prisma.bulkOrderInquiry.findFirst({
        where: { email, inquiryDetails: { startsWith: '[Newsletter]' } },
        select: { id: true },
      });
      if (!existing) {
        await prisma.bulkOrderInquiry.create({
          data: { name: 'Newsletter subscriber', email, phone: '-', inquiryDetails: '[Newsletter] Subscribed from website' },
        });
      }
      res.status(201).json({
        success: true,
        message: existing ? "You're already subscribed — thank you!" : "You're subscribed! We'll email you new arrivals and offers.",
        statusCode: 201,
      } as ApiResponse);
      return;
    }

    const type = body.type === 'bulk' ? 'bulk' : 'contact';
    const name = clean(body.name, 200);
    const phone = clean(body.phone, 20);
    const company = clean(body.company, 255);

    if (name.length < 2) throw new ApiError(400, 'Please enter your name');
    if (!EMAIL_RE.test(email)) throw new ApiError(400, 'Please enter a valid email address');
    if (phone && !PHONE_RE.test(phone)) throw new ApiError(400, 'Please enter a valid phone number');

    let details: string;
    let attachments: { name: string; content: string }[] = [];
    let subjectLine: string;

    if (type === 'bulk') {
      const fabric = clean(body.fabric, 300);
      const quantity = Number(body.quantity);
      const deadline = clean(body.deadline, 20);
      const notes = clean(body.notes, 3000);
      // Reference photos are only emailed (as attachments), never stored
      attachments = readPhotos(body.photos);
      // Optional price the customer is hoping for (₹ per metre)
      const targetPrice = body.targetPrice === undefined || body.targetPrice === '' ? null : Number(body.targetPrice);
      if (targetPrice !== null && (!Number.isFinite(targetPrice) || targetPrice <= 0 || targetPrice > 100000)) {
        throw new ApiError(400, 'Please enter a valid price per metre');
      }
      if (!phone) throw new ApiError(400, 'Phone number is required for bulk quotes');
      if (fabric.length < 2) throw new ApiError(400, 'Please tell us which fabric you need');
      if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 1_000_000) {
        throw new ApiError(400, 'Please enter the quantity in metres');
      }
      details = [
        '[Bulk order]',
        `Fabric: ${fabric}`,
        `Quantity: ${quantity} m`,
        targetPrice !== null ? `Requested price: ₹${targetPrice} per metre` : '',
        attachments.length ? `Reference photos: ${attachments.length} (attached to the email)` : '',
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
        html: brandEmail({
          team: true,
          preheader: `${name} · ${phone || email}`,
          eyebrow: type === 'bulk' ? 'Bulk quote request' : 'Website message',
          title: subjectLine.replace(/^New (bulk quote request|website message) — /, ''),
          body: `${detailsTable([
              ['Name', escapeHtml(name)],
              ['Email', `<a href="mailto:${escapeHtml(email)}" style="color:#6b1219">${escapeHtml(email)}</a>`],
              ['Phone', escapeHtml(phone || '—')],
              ...(company ? [['Business', escapeHtml(company)] as [string, string]] : []),
            ])}
            <div style="height:18px"></div>
            ${para(escapeHtml(details.replace(/^\[(Bulk order|Contact)\]\s*/, '')).replace(/\n/g, '<br/>'), 'font-size:14px;line-height:1.7;background:#faf6ee;border-radius:10px;padding:14px 16px')}
            ${attachments.length ? para(`📎 ${attachments.length} reference photo(s) attached to this email.`, 'font-size:13px;color:#7a6e62') : ''}
            ${phone ? button(`https://wa.me/${phone.replace(/\D/g, '').replace(/^(?=\d{10}$)/, '91')}`, 'Reply on WhatsApp') : ''}
            ${para(`Enquiry ID: ${saved.id} · <a href="${siteUrl()}/admin" style="color:#7a6e62">Open admin</a>`, 'font-size:12px;color:#7a6e62;margin-top:12px')}`,
        }),
        attachments,
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


// ── Reference photos (bulk enquiry) ─────────────────────────────────────────
const MAX_PHOTOS = 3;
const MAX_PHOTO_BYTES = 4 * 1024 * 1024;

const imageType = (buf: Buffer): 'jpg' | 'png' | 'webp' | null => {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.length > 12 && buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP') return 'webp';
  return null;
};

/** Accepts up to 3 base64 images (JPG/PNG/WebP, ≤4 MB each); anything else is rejected */
function readPhotos(input: unknown): { name: string; content: string }[] {
  if (input === undefined || input === null) return [];
  if (!Array.isArray(input)) throw new ApiError(400, 'Invalid photos');
  if (input.length > MAX_PHOTOS) throw new ApiError(400, `You can attach up to ${MAX_PHOTOS} photos`);
  return input.map((raw, i) => {
    const data = typeof raw === 'string' ? raw : typeof (raw as any)?.data === 'string' ? (raw as any).data : '';
    const b64 = data.replace(/^data:image\/[a-z+]+;base64,/i, '');
    const buf = Buffer.from(b64, 'base64');
    if (!buf.length || buf.length > MAX_PHOTO_BYTES) throw new ApiError(400, 'Each photo must be under 4 MB');
    const ext = imageType(buf);
    if (!ext) throw new ApiError(400, 'Photos must be JPG, PNG or WebP');
    return { name: `reference-photo-${i + 1}.${ext}`, content: buf.toString('base64') };
  });
}
