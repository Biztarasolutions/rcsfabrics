// Curated collections, built automatically from product details
// (Best for, pattern, properties, occasion, category). A collection only
// appears on the site once at least one active product matches it, so new
// collections switch on by themselves as you add stock.

export interface Collection {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  match: (p: any) => boolean;
}

const text = (p: any) =>
  [...(p?.bestFor || []), ...(p?.properties || []), p?.occasion, p?.pattern, p?.category?.name, p?.stretchability]
    .filter(Boolean)
    .join(' | ');

export const COLLECTIONS: Collection[] = [
  {
    slug: 'kurti-edit',
    title: 'The Kurti Edit',
    tagline: 'Everyday fabrics that sew up into easy kurtis',
    description: 'Breathable, easy-to-stitch fabrics our customers pick for kurtis — from crisp cottons to soft prints.',
    match: (p) => /kurt/i.test(text(p)),
  },
  {
    slug: 'body-fit-and-active',
    title: 'Body-fit & Active',
    tagline: 'Stretch fabrics that move with you',
    description: 'Four-way stretch fabrics for body-fit dresses, leggings, tops and activewear.',
    match: (p) => /stretch|active|body.?fit|legging/i.test(text(p)) && !/non.?stretch/i.test(p?.stretchability || ''),
  },
  {
    slug: 'shirts-and-uniforms',
    title: 'Shirts & Uniforms',
    tagline: 'Crisp, durable fabrics that hold their shape',
    description: 'Fabrics with a clean finish for shirts, school uniforms and workwear.',
    match: (p) => /shirt|uniform/i.test(text(p)),
  },
  {
    slug: 'prints-and-dots',
    title: 'Prints & Polka Dots',
    tagline: 'Playful prints for statement pieces',
    description: 'Polka dots, florals and printed fabrics for tops, dresses and kurtis that stand out.',
    match: (p) => /dot|print|floral|check|stripe/i.test(`${p?.pattern || ''} ${p?.name || ''}`),
  },
  {
    slug: 'summer-breathables',
    title: 'Summer Breathables',
    tagline: 'Light fabrics for hot days',
    description: 'Lightweight, breathable fabrics that stay comfortable through Indian summers.',
    match: (p) => /breathable|lightweight|cotton|linen/i.test(text(p)),
  },
  {
    slug: 'wedding-and-festive',
    title: 'Wedding & Festive',
    tagline: 'Fabrics for the season of celebrations',
    description: 'Rich satins, silks and embellished fabrics for weddings, festivals and parties.',
    match: (p) => /wedding|festive|party|bridal|silk|embroider|sequin|zari/i.test(`${text(p)} ${p?.name || ''}`),
  },
];

export const findCollection = (slug: string) => COLLECTIONS.find((c) => c.slug === slug);

/** Collections with at least one product, each with its products */
export function collectionsWithProducts(products: any[]) {
  return COLLECTIONS.map((c) => ({ ...c, products: products.filter((p) => p?.isActive !== false && c.match(p)) })).filter(
    (c) => c.products.length > 0
  );
}

export const coverImage = (products: any[]): string =>
  products.map((p) => p?.images?.find((i: any) => i.isMain)?.url || p?.images?.[0]?.url).find(Boolean) || '';
