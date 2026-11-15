import type { Metadata } from 'next';
import { COLLECTIONS, findCollection } from '@/lib/collections';

export function generateStaticParams() {
  return COLLECTIONS.map((c) => ({ slug: c.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const c = findCollection(params.slug);
  if (!c) return { title: 'Collection' };
  return {
    title: `${c.title} — Fabrics by the Metre`,
    description: c.description,
    alternates: { canonical: `/collections/${c.slug}` },
  };
}

export default function CollectionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
