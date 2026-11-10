import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In or Create Account',
  description: 'Sign in to RCS Fabrics to track orders and save addresses.',
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
