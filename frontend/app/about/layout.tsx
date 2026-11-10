import type { Metadata } from 'next';
import { ABOUT } from '@/content/about';

export const metadata: Metadata = {
  title: ABOUT.meta.title,
  description: ABOUT.meta.description,
  alternates: { canonical: '/about' },
  openGraph: { title: ABOUT.meta.title, description: ABOUT.meta.description, url: '/about', type: 'website' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
