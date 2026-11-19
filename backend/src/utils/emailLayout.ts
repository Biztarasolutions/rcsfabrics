// Shared, email-client-safe layout for every RCS Fabrics email.
// Table-based with inline styles so it renders the same in Gmail, Outlook and Apple Mail.

export const BRAND = {
  name: 'RCS Fabrics',
  maroon: '#6b1219',
  gold: '#a07c3b',
  ink: '#2b2118',
  muted: '#7a6e62',
  line: '#ece3d4',
  cream: '#faf6ee',
  phone: '+91 98630 26598',
  whatsapp: 'https://wa.me/919863026598',
  email: 'support@rcsfabrics.com',
  city: 'Dimapur, Nagaland',
};

export const siteUrl = (): string =>
  ((process.env.FRONTEND_URL || '').split(',').map((s) => s.trim()).find((u) => u.startsWith('https://')) || 'https://rcsfabrics.com')
    .replace(/\/$/, '');

export const esc = (s: unknown): string =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

export const inr = (n: number): string => {
  const v = Math.round((Number(n) || 0) * 100) / 100;
  const d = Number.isInteger(v) ? 0 : 2;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: d, maximumFractionDigits: d }).format(v);
};

const FONT = `font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif`;

/** A square JPEG thumbnail that every mail client can show (Supabase WebP → JPEG via Netlify Image CDN). */
export const emailThumb = (url?: string | null, size = 72): string => {
  if (!url) return '';
  const pub = url.replace('/storage/v1/render/image/public/', '/storage/v1/object/public/').split('?')[0];
  if (!pub.includes('supabase.co/storage/v1/object/public/')) return pub;
  const p = new URLSearchParams({ url: pub, w: String(size * 2), h: String(size * 2), fit: 'cover', fm: 'jpg', q: '80' });
  return `${siteUrl()}/.netlify/images?${p.toString()}`;
};

export const button = (href: string, label: string): string => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 4px">
    <tr><td style="background:${BRAND.maroon};border-radius:10px">
      <a href="${esc(href)}" style="display:inline-block;padding:13px 26px;${FONT};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none">${esc(label)}</a>
    </td></tr>
  </table>`;

export const sectionTitle = (t: string): string =>
  `<p style="margin:28px 0 10px;${FONT};font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${BRAND.gold}">${esc(t)}</p>`;

/** Key/value rows, e.g. order number, date, payment */
export const detailsTable = (rows: [string, string][]): string => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${BRAND.line};border-radius:10px;border-collapse:separate">
    ${rows.map(([k, v], i) => `
    <tr>
      <td style="padding:11px 16px;${FONT};font-size:13px;color:${BRAND.muted};${i ? `border-top:1px solid ${BRAND.line};` : ''}width:42%">${esc(k)}</td>
      <td style="padding:11px 16px;${FONT};font-size:14px;color:${BRAND.ink};font-weight:600;${i ? `border-top:1px solid ${BRAND.line};` : ''}">${v}</td>
    </tr>`).join('')}
  </table>`;

export interface EmailItem { productName: string; productImage?: string | null; quantity: number; pricePerMeter?: number; total: number }

/** Line items with photo, metres × rate and amount */
export const itemsTable = (items: EmailItem[]): string => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse">
    ${items.map((i, idx) => {
      const img = emailThumb(i.productImage);
      return `
    <tr>
      <td width="72" style="padding:14px 0;${idx ? `border-top:1px solid ${BRAND.line};` : ''}vertical-align:top">
        ${img
          ? `<img src="${esc(img)}" width="64" height="64" alt="" style="display:block;width:64px;height:64px;border-radius:8px;object-fit:cover;background:${BRAND.cream}"/>`
          : `<div style="width:64px;height:64px;border-radius:8px;background:${BRAND.cream}"></div>`}
      </td>
      <td style="padding:14px 12px;${idx ? `border-top:1px solid ${BRAND.line};` : ''}vertical-align:top;${FONT}">
        <div style="font-size:15px;font-weight:600;color:${BRAND.ink};line-height:1.35">${esc(i.productName)}</div>
        <div style="margin-top:4px;font-size:13px;color:${BRAND.muted}">${i.quantity} m${i.pricePerMeter ? ` × ${inr(i.pricePerMeter)}/m` : ''}</div>
      </td>
      <td align="right" style="padding:14px 0;${idx ? `border-top:1px solid ${BRAND.line};` : ''}vertical-align:top;${FONT};font-size:15px;font-weight:600;color:${BRAND.ink};white-space:nowrap">${inr(i.total)}</td>
    </tr>`;
    }).join('')}
  </table>`;

/** Subtotal / discount / shipping / total */
export const totalsTable = (o: { subtotal: number; discountAmount?: number | null; couponCode?: string | null; shippingCost?: number | null; total: number }): string => {
  const row = (k: string, v: string, strong = false) => `
    <tr>
      <td style="padding:5px 0;${FONT};font-size:${strong ? 16 : 14}px;color:${strong ? BRAND.ink : BRAND.muted};${strong ? 'font-weight:700;' : ''}">${k}</td>
      <td align="right" style="padding:5px 0;${FONT};font-size:${strong ? 18 : 14}px;color:${strong ? BRAND.maroon : BRAND.ink};${strong ? 'font-weight:700;' : ''}white-space:nowrap">${v}</td>
    </tr>`;
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:2px solid ${BRAND.ink};margin-top:4px;padding-top:8px">
    <tr><td colspan="2" style="height:8px;line-height:8px">&nbsp;</td></tr>
    ${row('Subtotal', inr(o.subtotal))}
    ${o.discountAmount ? row(`Discount${o.couponCode ? ` (${esc(o.couponCode)})` : ''}`, `−${inr(o.discountAmount)}`) : ''}
    ${row('Shipping', o.shippingCost ? inr(o.shippingCost) : 'Free')}
    <tr><td colspan="2" style="padding-top:6px;border-bottom:1px solid ${BRAND.line};line-height:1px;font-size:1px">&nbsp;</td></tr>
    ${row('Total', inr(o.total), true)}
  </table>`;
};

const STEPS = ['Placed', 'Preparing', 'Shipped', 'Delivered'];
/** Progress bar: Placed → Preparing → Shipped → Delivered */
export const progress = (reached: number): string => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 4px">
    <tr>${STEPS.map((s, i) => `
      <td width="25%" style="padding:0 2px">
        <div style="height:6px;border-radius:3px;background:${i <= reached ? BRAND.maroon : BRAND.line}"></div>
        <div style="margin-top:8px;${FONT};font-size:12px;font-weight:${i === reached ? 700 : 500};color:${i <= reached ? BRAND.ink : BRAND.muted}">${s}</div>
      </td>`).join('')}
    </tr>
  </table>`;

/** Big one-time code */
export const codeBox = (code: string): string => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:18px 0">
    <tr><td align="center" style="background:${BRAND.cream};border:1px dashed ${BRAND.gold};border-radius:12px;padding:22px 10px;${FONT};font-size:34px;font-weight:700;letter-spacing:10px;color:${BRAND.ink}">${esc(code)}</td></tr>
  </table>`;

export const para = (html: string, style = ''): string =>
  `<p style="margin:0 0 14px;${FONT};font-size:15px;line-height:1.6;color:${BRAND.ink};${style}">${html}</p>`;

export const note = (html: string): string => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:18px 0 4px">
    <tr><td style="background:${BRAND.cream};border-radius:10px;padding:14px 16px;${FONT};font-size:14px;line-height:1.55;color:${BRAND.ink}">${html}</td></tr>
  </table>`;

/**
 * Wrap content in the branded shell: logo header, white card, help footer.
 * `team: true` uses a compact footer for internal notifications.
 */
export function brandEmail(opts: { preheader: string; eyebrow?: string; title: string; body: string; team?: boolean }): string {
  const site = siteUrl();
  const footer = opts.team
    ? `<p style="margin:0;${FONT};font-size:12px;color:${BRAND.muted}">Internal notification from the ${BRAND.name} website · <a href="${site}/admin" style="color:${BRAND.maroon}">Open admin</a></p>`
    : `
      <p style="margin:0 0 8px;${FONT};font-size:14px;font-weight:600;color:${BRAND.ink}">Need help with your order?</p>
      <p style="margin:0 0 16px;${FONT};font-size:13px;line-height:1.6;color:${BRAND.muted}">
        <a href="${BRAND.whatsapp}" style="color:${BRAND.maroon};font-weight:600;text-decoration:none">WhatsApp us</a> &nbsp;·&nbsp;
        Call ${BRAND.phone} &nbsp;·&nbsp;
        <a href="mailto:${BRAND.email}" style="color:${BRAND.maroon};text-decoration:none">${BRAND.email}</a><br/>
        We reply Monday to Saturday, 9am–6pm.
      </p>
      <p style="margin:0;${FONT};font-size:12px;color:${BRAND.muted}">${BRAND.name} · ${BRAND.city} · Since 1958 &nbsp;|&nbsp; <a href="${site}" style="color:${BRAND.muted}">rcsfabrics.com</a></p>`;

  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>${esc(opts.title)}</title></head>
<body style="margin:0;padding:0;background:${BRAND.cream}">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(opts.preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.cream}">
    <tr><td align="center" style="padding:28px 12px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px">
        <tr><td align="center" style="padding:0 0 20px">
          <a href="${site}"><img src="${site}/brand/logo.png" width="150" alt="${BRAND.name}" style="display:block;width:150px;height:auto;border:0"/></a>
        </td></tr>
        <tr><td style="background:#ffffff;border:1px solid ${BRAND.line};border-radius:16px;overflow:hidden">
          <div style="height:4px;background:${BRAND.maroon};line-height:4px;font-size:4px">&nbsp;</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="padding:32px 32px 30px">
              ${opts.eyebrow ? `<p style="margin:0 0 8px;${FONT};font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${BRAND.gold}">${esc(opts.eyebrow)}</p>` : ''}
              <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.25;font-weight:normal;color:${BRAND.ink}">${esc(opts.title)}</h1>
              ${opts.body}
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:24px 8px 0;text-align:center">${footer}</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
