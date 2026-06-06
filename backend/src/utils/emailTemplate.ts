// src/utils/emailTemplate.ts
import type { BulkEnquiry } from '@/services/bulkOrderService';

/**
 * Generates a premium HTML email for a bulk enquiry.
 * Uses Inter font, a clean layout, and includes the selected product image if provided.
 */
export const generateBulkEnquiryEmail = (enquiry: BulkEnquiry & { productImage?: string }) => {
  const {
    name,
    company,
    email,
    phone,
    fabric,
    quantity,
    deadline,
    notes,
    productImage,
  } = enquiry;

  const formattedDate = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const imgTag = productImage
    ? `<img src="${productImage}" alt="Product" style="max-width:200px;border-radius:8px;margin-bottom:12px;" />`
    : '';

  return `
<!DOCTYPE html>
<html lang="en" style="font-family: 'Inter', sans-serif; background:#f5f5f5; padding:20px;">
<head>
  <meta charset="UTF-8" />
  <title>New Bulk Quote Request</title>
</head>
<body style="margin:0;">
  <div style="max-width:600px;margin:auto;background:#fff;padding:24px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
    <h2 style="color:#2c3e50;margin-top:0;">📦 New Bulk Quote Request</h2>
    <p style="color:#555;margin:8px 0;">Received on <strong>${formattedDate}</strong></p>
    ${imgTag}
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:4px 0;font-weight:600;">Name</td><td>${name}</td></tr>
      ${company ? `<tr><td style="padding:4px 0;font-weight:600;">Company</td><td>${company}</td></tr>` : ''}
      <tr><td style="padding:4px 0;font-weight:600;">Email</td><td>${email}</td></tr>
      <tr><td style="padding:4px 0;font-weight:600;">Phone</td><td>${phone}</td></tr>
      <tr><td style="padding:4px 0;font-weight:600;">Fabric Required</td><td>${fabric}</td></tr>
      <tr><td style="padding:4px 0;font-weight:600;">Quantity (m)</td><td>${quantity}</td></tr>
      ${deadline ? `<tr><td style="padding:4px 0;font-weight:600;">Required By</td><td>${deadline}</td></tr>` : ''}
      ${notes ? `<tr><td style="padding:4px 0;font-weight:600;">Additional Notes</td><td>${notes}</td></tr>` : ''}
    </table>
    <p style="margin-top:16px;color:#777;font-size:0.9em;">
      This email was generated automatically. <a href="${process.env.NEXT_PUBLIC_ADMIN_URL || '#'}" style="color:#3498db;">View in admin panel</a>
    </p>
  </div>
</body>
</html>
`;
};
