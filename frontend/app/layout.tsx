import type { Metadata } from 'next';

import Providers from '@/components/common/Providers';
import SiteChrome from '@/components/layout/SiteChrome';
import '@/styles/main.css';

export const metadata: Metadata = {
  title: 'RCS Fabrics — Premium Luxury Fabrics by the Meter',
  description: 'Shop premium quality fabrics — rayon, cotton, linen, chiffon, crepe, satin and more. Sold by the meter with free shipping on orders above ₹2,000.',
  keywords: 'fabric, rayon, cotton, linen, chiffon, crepe, satin, premium fabric, fabric by meter, RCS Fabrics, luxury fabric, Indian fabric',
  authors: [{ name: 'RCS Fabrics' }],
  openGraph: {
    title: 'RCS Fabrics — Premium Luxury Fabrics by the Meter',
    description: 'Shop premium quality fabrics — rayon, cotton, linen, chiffon and more. Sold by the meter.',
    url: 'https://rcsfabrics.com',
    siteName: 'RCS Fabrics',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
        {/* Preconnect to Supabase CDN so image downloads start without a cold DNS+TLS round-trip */}
        {supabaseOrigin && <link rel="preconnect" href={supabaseOrigin}/>}
        {supabaseOrigin && <link rel="dns-prefetch" href={supabaseOrigin}/>}
      </head>
      <body className="min-h-screen overflow-x-hidden bg-white text-gray-900 dark:bg-dark-950 dark:text-white">
        <Providers>
          <SiteChrome>{children}</SiteChrome>
        </Providers>
      </body>
    </html>
  );
}
