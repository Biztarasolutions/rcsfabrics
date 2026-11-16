import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Collections',
  description: 'Curated fabric collections from RCS Fabrics — kurtis, body-fit and activewear, shirts, prints and more. Sold by the metre.',
  robots: { index: false, follow: true }, // hidden until collections are decided
};

export default function CollectionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
