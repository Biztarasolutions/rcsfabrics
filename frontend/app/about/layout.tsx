import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'RCS Fabrics is the online store of Rajasthan Cloth Store — quality dress fabrics sold by the metre.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
