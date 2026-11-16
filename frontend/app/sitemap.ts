import type { MetadataRoute } from 'next';
import { fetchApi, SITE_URL } from '@/lib/seo';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = ['', '/products', '/about', '/contact', '/shipping', '/returns', '/privacy', '/terms', '/cookies']
    .map((path) => ({ url: `${SITE_URL}${path}`, lastModified: now, changeFrequency: path === '' || path === '/products' ? 'daily' : 'monthly', priority: path === '' ? 1 : path === '/products' ? 0.9 : 0.4 }));

  const res = await fetchApi<{ data?: { products?: any[] } }>('products?limit=1000', 8000);
  const products: MetadataRoute.Sitemap = (res?.data?.products || [])
    .filter((p) => p?.slug)
    .map((p) => ({
      url: `${SITE_URL}/products/${p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

  return [...staticPages, ...products];
}
