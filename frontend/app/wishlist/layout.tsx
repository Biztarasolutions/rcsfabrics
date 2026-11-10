import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Your Wishlist',
  description: 'Fabrics you saved for later.',
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
