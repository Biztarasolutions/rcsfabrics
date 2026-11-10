import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Your Cart',
  description: 'Your RCS Fabrics shopping cart.',
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
