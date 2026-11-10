import type { Metadata } from 'next';
import { fetchApi, SITE_URL } from '@/lib/seo';
import { productDisplayName } from '@/lib/utils';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const res = await fetchApi<{ data?: any }>(`products/slug/${encodeURIComponent(params.slug)}`);
  const p = res?.data;
  if (!p) {
    return { title: 'Fabric', alternates: { canonical: `/products/${params.slug}` } };
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
