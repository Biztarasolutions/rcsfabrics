// Official business details. GSTIN and proprietor name are for invoices/bills only —
// do not show them on website pages.
export const BUSINESS = {
  brand: 'RCS Fabrics',
  tradeName: 'M/S Rajasthan Cloth Store',
  legalName: 'Rajesh Kumar Jain', // proprietor, as registered for GST
  gstin: '13ACAPJ9647E1ZS', // Nagaland
  city: 'Dimapur, Nagaland',
  phone: '+91 98630 26598',
  email: 'biztarasolutions@gmail.com',
  whatsapp: 'https://wa.me/919863026598',
  lastUpdated: '15 November 2026', // shown on policy pages — update when you change a policy
};

/** Default WhatsApp opener for general questions */
export const WHATSAPP_QUERY = 'Hi! I have a few queries about RCS Fabrics.';

/** wa.me link with a ready-typed message */
export const waLink = (text: string = WHATSAPP_QUERY): string =>
  `${BUSINESS.whatsapp}?text=${encodeURIComponent(text)}`;

export const telLink = (): string => `tel:${BUSINESS.phone.replace(/\s/g, '')}`;
