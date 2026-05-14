import type { Metadata } from 'next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Providers from '@/components/common/Providers';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import '@/styles/main.css';

export const metadata: Metadata = {
  title: 'RCS Fabrics — Premium Luxury Fabrics by the Meter',
  description: 'Shop premium quality fabrics — silks, cottons, velvets, chiffons and more. Sold by the meter with free shipping on orders above ₹2,000.',
  keywords: 'fabric, silk, cotton, velvet, premium fabric, fabric by meter, RCS Fabrics, luxury fabric, Indian fabric',
  authors: [{ name: 'RCS Fabrics' }],
  openGraph: {
    title: 'RCS Fabrics — Premium Luxury Fabrics by the Meter',
    description: 'Shop premium quality fabrics — silks, cottons, velvets and more. Sold by the meter.',
    url: 'https://rcsfabrics.com',
    siteName: 'RCS Fabrics',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
      </head>
      <body className="min-h-screen bg-white text-gray-900 dark:bg-dark-950 dark:text-white">
        <Providers>
          <Header />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
