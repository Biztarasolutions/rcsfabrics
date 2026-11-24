import { prisma } from '@/index';
import { sendEmail, MAILBOX } from '@/utils/email';
import { BRAND, brandEmail, button, detailsTable, emailThumb, esc, note, para, siteUrl } from '@/utils/emailLayout';

const stars = (n: number) =>
  `<span style="color:#b8892f;font-size:18px;letter-spacing:2px">${'★'.repeat(n)}</span><span style="color:#d9cdb8;font-size:18px;letter-spacing:2px">${'★'.repeat(5 - n)}</span>`;

export interface ReviewMailInput {
  updated: boolean;
  rating: number;
  title?: string | null;
  comment?: string | null;
  customer: { email: string; firstName?: string | null; lastName?: string | null };
  product: { name: string; slug: string; image?: string | null };
}

const reviewBlock = (r: ReviewMailInput) => {
  const img = emailThumb(r.product.image);
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #eadfcc;border-radius:10px;border-collapse:separate">
      <tr>
        ${img ? `<td width="88" style="padding:16px 0 16px 16px;vertical-align:top"><img src="${esc(img)}" width="72" height="72" alt="" style="display:block;width:72px;height:72px;border-radius:8px;object-fit:cover"/></td>` : ''}
        <td style="padding:16px;vertical-align:top;font-family:Arial,Helvetica,sans-serif">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:16px;font-weight:600;color:#2b2118">${esc(r.product.name)}</div>
          <div style="margin-top:6px">${stars(r.rating)} <span style="font-size:13px;color:#7a6e62">${r.rating}/5</span></div>
          ${r.title ? `<div style="margin-top:8px;font-size:14px;font-weight:700;color:#2b2118">${esc(r.title)}</div>` : ''}
          ${r.comment ? `<div style="margin-top:4px;font-size:14px;line-height:1.6;color:#4a3f35">${esc(r.comment).replace(/\n/g, '<br/>')}</div>` : ''}
        </td>
      </tr>
    </table>`;
};

/** Customer "thank you" + team copy (pure: no sending) */
export function buildReviewEmails(r: ReviewMailInput) {
  const url = `${siteUrl()}/fabrics/${r.product.slug}#reviews`;
  const first = r.customer.firstName ? ` ${esc(r.customer.firstName)}` : '';
  const name = [r.customer.firstName, r.customer.lastName].filter(Boolean).join(' ') || r.customer.email;
  const customer = {
    mailbox: 'support' as const,
    to: [r.customer.email],
    subject: r.updated ? 'Your review was updated — thank you!' : 'Thank you for your review!',
    html: brandEmail({
      preheader: `Thank you for reviewing ${r.product.name}.`,
      eyebrow: r.updated ? 'Review updated' : 'Review received',
      title: 'Thank you for your review',
      contactEmail: MAILBOX.support(),
      body: `
        ${para(`Hi${first}, thank you for taking the time to share your thoughts. Your review is now live and helps other customers choose the right fabric.`)}
        ${reviewBlock(r)}
        <div style="height:10px"></div>
        ${button(url, 'See your review')}
        ${r.rating <= 3 ? note('<strong>Something not right?</strong> We would like to make it right — reply to this email or message us on WhatsApp.') : note('Made something with it? We would love to see it — send us a photo on WhatsApp.')}
        ${button(`${BRAND.whatsapp}?text=${encodeURIComponent(`Hi! About my review of ${r.product.name}:`)}`, 'Message us on WhatsApp')}`,
    }),
  };
  const team = {
    mailbox: 'support' as const,
    to: [MAILBOX.support()],
    replyTo: r.customer.email,
    subject: `[${r.rating}★ review${r.updated ? ' updated' : ''}] ${r.product.name} — ${name}`,
    html: brandEmail({
      preheader: `${name} rated ${r.product.name} ${r.rating}/5.`,
      eyebrow: r.updated ? 'Review updated' : 'New review',
      title: `${r.rating}★ review on ${r.product.name}`,
      team: true,
      body: `
        ${reviewBlock(r)}
        <div style="height:10px"></div>
        ${detailsTable([['Customer', esc(name)], ['Email', esc(r.customer.email)]])}
        <div style="height:10px"></div>
        ${button(url, 'Open on the website')}
        ${para('Reply to this email to write to the customer directly.', 'font-size:13px;color:#7a6e62')}`,
    }),
  };
  return { customer, team };
}

export async function notifyReview(reviewId: string, updated: boolean): Promise<void> {
  try {
    const r = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        user: { select: { email: true, firstName: true, lastName: true } },
        product: { select: { name: true, slug: true, images: { select: { url: true }, orderBy: { order: 'asc' }, take: 1 } } },
      },
    });
    if (!r?.user?.email) return;
    const { customer, team } = buildReviewEmails({
      updated, rating: r.rating, title: r.title, comment: r.comment,
      customer: r.user,
      product: { name: r.product.name, slug: r.product.slug, image: r.product.images[0]?.url },
    });
    const results = await Promise.allSettled([sendEmail(customer), sendEmail(team)]);
    results.forEach((x) => { if (x.status === 'rejected') console.error('[Review email] failed:', x.reason); });
  } catch (err) {
    console.error('[Review email] failed:', err);
  }
}
