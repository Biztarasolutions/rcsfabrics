import type { Metadata } from 'next';
import { fetchApi, SITE_URL } from '@/lib/seo';
import { productDisplayName } from '@/lib/utils';

// Product pages are cached and refreshed hourly; all current products are pre-built at deploy time.
export const revalidate = 3600;

const IS_BUILD = process.env.NEXT_PHASE === 'phase-production-build';

export async function generateStaticParams() {
  const res = await fetchApi<{ data?: { products?: any[] } }>('products?limit=500', 60000);
  return (res?.data?.products || []).filter((p) => p?.slug).map((p) => ({ slug: p.slug }));
}

// "lachka-stretchable-p10002-pink" → "Lachka Stretchable Pink" (used if the API is slow)
function nameFromSlug(slug: string): string {
  return decodeURIComponent(slug)
    .split('-')
    .filter((w) => w && !/^p\d{3,}$/i.test(w))
    .filter((w, i, a) => a.indexOf(w) === i)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ') || 'Fabric';
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  // Short timeout: page titles must never hold up opening a product
  const res = await fetchApi<{ data?: any }>(`products/slug/${encodeURIComponent(params.slug)}`, IS_BUILD ? 60000 : 2500);
  const p = res?.data;
  if (!p) {
    return { title: `${nameFromSlug(params.slug)} — Fabric by the Metre`, alternates: { canonical: `/products/${params.slug}` } };
  }
  const name = productDisplayName(p);
  const price = p.discountPrice || p.basePrice;
  const bits = [
    p.category?.name,
    p.width ? `${p.width}" wide` : null,
    p.pattern,
    Array.isArray(p.bestFor) && p.bestFor.length ? `ideal for ${p.bestFor.slice(0, 3).join(', ').toLowerCase()}` : null,
  ].filter(Boolean).join(' · ');
  const description = (p.description?.trim() ||
    `${name} fabric${price ? ` at ₹${price}/metre` : ''}. ${bits}. Sold by the metre in 0.5 m steps.`).slice(0, 160);
  const image = p.images?.find((i: any) => i.isMain)?.url || p.images?.[0]?.url;

  return {
    title: `${name} — ${p.category?.name ? `${p.category.name} ` : ''}Fabric by the Metre`,
    description,
    alternates: { canonical: `/products/${p.slug}` },
    openGraph: {
      title: name,
      description,
      url: `${SITE_URL}/products/${p.slug}`,
      type: 'website',
      ...(image ? { images: [{ url: image }] } : {}),
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
