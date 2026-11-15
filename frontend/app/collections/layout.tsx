import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Collections',
  description: 'Curated fabric collections from RCS Fabrics — kurtis, body-fit and activewear, shirts, prints and more. Sold by the metre.',
};

export default function CollectionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
