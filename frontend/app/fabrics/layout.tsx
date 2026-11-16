import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'Shop Fabrics by the Metre', template: '%s | RCS Fabrics' },
  description: 'Browse poplin, satin, rayon, cotton, stretchable and more — sold by the metre in 0.5 m steps. Free shipping on orders of ₹2,000+.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
