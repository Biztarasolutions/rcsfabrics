'use client';
import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import ProductCard from '@/components/products/ProductCard';

const COLLECTIONS: Record<string, {
  title: string; subtitle: string; description: string;
  image: string; color: string; products: any[];
}> = {
  'summer-2025': {
    title: 'Summer 2025',
    subtitle: 'Bridal & Festive Collection',
    description: 'Our most luxurious curation of silks, organzas, and chiffons — designed for the most special celebrations. Each fabric in this collection has been hand-selected for its luminosity, drape, and occasion-perfect finish.',
    image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1600&q=80',
    color: 'from-rose-900/80 via-primary-900/60 to-transparent',
    products: [
      { id: 'c1', name: 'Royal Banarasi Silk', slug: 'royal-banarasi-silk', basePrice: 1850, discountPrice: 1499, material: 'Silk', color: 'Deep Maroon', stretchability: 'Non-Stretch', totalStock: 45, minOrderQty: 0.5, rating: 4.8, ratingCount: 124, isFeatured: true, isNew: false, isActive: true, createdAt: '', category: { name: 'Silks', slug: 'silks' }, images: [{ id: '1', url: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&q=80', isMain: true, order: 1 }] },
      { id: 'c2', name: 'Mysore Crepe Silk', slug: 'mysore-crepe-silk', basePrice: 1650, material: 'Silk', color: 'Rose Gold', stretchability: 'Slight Stretch', totalStock: 60, minOrderQty: 0.5, rating: 4.7, ratingCount: 42, isFeatured: false, isNew: true, isActive: true, createdAt: '', category: { name: 'Silks', slug: 'silks' }, images: [{ id: '2', url: 'https://images.unsplash.com/photo-1519659528534-7fd733a832a0?w=600&q=80', isMain: true, order: 1 }] },
      { id: 'c3', name: 'Organza Sheer', slug: 'organza-sheer', basePrice: 890, discountPrice: 749, material: 'Organza', color: 'Champagne', stretchability: 'Non-Stretch', totalStock: 90, minOrderQty: 0.5, rating: 4.6, ratingCount: 21, isFeatured: false, isNew: true, isActive: true, createdAt: '', category: { name: 'Sheers', slug: 'sheers' }, images: [{ id: '3', url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80', isMain: true, order: 1 }] },
      { id: 'c4', name: 'Pure Kanjivaram Silk', slug: 'pure-kanjivaram-silk', basePrice: 3200, discountPrice: 2750, material: 'Silk', color: 'Emerald Green', stretchability: 'Non-Stretch', totalStock: 25, minOrderQty: 0.5, rating: 5.0, ratingCount: 234, isFeatured: true, isNew: false, isActive: true, createdAt: '', category: { name: 'Silks', slug: 'silks' }, images: [{ id: '4', url: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=600&q=80', isMain: true, order: 1 }] },
      { id: 'c5', name: 'French Lace Organza', slug: 'french-lace-organza', basePrice: 2200, material: 'Organza', color: 'Ivory', stretchability: 'Non-Stretch', totalStock: 20, minOrderQty: 0.5, rating: 4.9, ratingCount: 18, isFeatured: true, isNew: false, isActive: true, createdAt: '', category: { name: 'Sheers', slug: 'sheers' }, images: [{ id: '5', url: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=600&q=80', isMain: true, order: 1 }] },
      { id: 'c6', name: 'Georgette Chiffon', slug: 'georgette-chiffon', basePrice: 750, material: 'Chiffon', color: 'Blush Pink', stretchability: 'Slight Stretch', totalStock: 150, minOrderQty: 0.5, rating: 4.7, ratingCount: 203, isFeatured: false, isNew: false, isActive: true, createdAt: '', category: { name: 'Chiffons', slug: 'chiffons' }, images: [{ id: '6', url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&q=80', isMain: true, order: 1 }] },
    ],
  },
  'everyday-cotton': {
    title: 'Everyday Comfort',
    subtitle: 'Cotton Essentials',
    description: 'Soft, breathable, and endlessly versatile. Our cotton collection is sourced from the finest Indian and Egyptian mills, perfect for daily wear, home textiles, and everything in between.',
    image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=1600&q=80',
    color: 'from-blue-900/80 via-dark-900/60 to-transparent',
    products: [
      { id: 'd1', name: 'Premium Egyptian Cotton', slug: 'premium-egyptian-cotton', basePrice: 680, material: 'Cotton', color: 'Ivory White', stretchability: 'Slight Stretch', totalStock: 200, minOrderQty: 1, rating: 4.6, ratingCount: 89, isFeatured: true, isNew: true, isActive: true, createdAt: '', category: { name: 'Cottons', slug: 'cottons' }, images: [{ id: 'd1i', url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&q=80', isMain: true, order: 1 }] },
      { id: 'd2', name: 'Handloom Khadi', slug: 'handloom-khadi', basePrice: 450, material: 'Khadi', color: 'Off White', stretchability: 'Non-Stretch', totalStock: 300, minOrderQty: 1, rating: 4.5, ratingCount: 78, isFeatured: false, isNew: false, isActive: true, createdAt: '', category: { name: 'Cottons', slug: 'cottons' }, images: [{ id: 'd2i', url: 'https://images.unsplash.com/photo-1603251579431-8041402bdeda?w=600&q=80', isMain: true, order: 1 }] },
    ],
  },
  'heritage-handloom': {
    title: 'Heritage Handloom',
    subtitle: 'Artisan Crafted',
    description: 'Every thread tells a story. Our Heritage Handloom collection celebrates India\'s master weavers — from the khadi artisans of Gujarat to the jamdani weavers of Bengal. Buying this collection directly supports livelihoods.',
    image: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=1600&q=80',
    color: 'from-amber-900/80 via-dark-900/60 to-transparent',
    products: [
      { id: 'h1', name: 'Handloom Khadi', slug: 'handloom-khadi', basePrice: 450, material: 'Khadi', color: 'Off White', stretchability: 'Non-Stretch', totalStock: 300, minOrderQty: 1, rating: 4.5, ratingCount: 78, isFeatured: false, isNew: false, isActive: true, createdAt: '', category: { name: 'Cottons', slug: 'cottons' }, images: [{ id: 'h1i', url: 'https://images.unsplash.com/photo-1603251579431-8041402bdeda?w=600&q=80', isMain: true, order: 1 }] },
      { id: 'h2', name: 'Chanderi Silk Cotton', slug: 'chanderi-silk-cotton', basePrice: 780, material: 'Chanderi', color: 'Pastel Pink', stretchability: 'Slight Stretch', totalStock: 120, minOrderQty: 0.5, rating: 4.4, ratingCount: 9, isFeatured: false, isNew: true, isActive: true, createdAt: '', category: { name: 'Blends', slug: 'blends' }, images: [{ id: 'h2i', url: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=600&q=80', isMain: true, order: 1 }] },
    ],
  },
};

const ALL_COLLECTIONS = Object.entries(COLLECTIONS).map(([slug, data]) => ({
  slug, title: data.title, subtitle: data.subtitle, image: data.image,
}));

export default function CollectionPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const collection = COLLECTIONS[slug];

  if (!collection) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center py-24 text-center">
        <p className="text-6xl">🧵</p>
        <h2 className="mt-4 font-display text-3xl font-bold text-gray-900 dark:text-white">Collection Not Found</h2>
        <p className="mt-2 text-gray-500">This collection doesn't exist or has been removed.</p>
        <Link href="/products" className="button-primary mt-6 px-8 py-3">Browse All Fabrics</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-dark-950">
      {/* Hero */}
      <div className="relative h-[50vh] min-h-80 overflow-hidden">
        <img src={collection.image} alt={collection.title} className="h-full w-full object-cover object-center"/>
        <div className={`absolute inset-0 bg-gradient-to-r ${collection.color}`}/>
        <div className="absolute inset-0 flex items-center">
          <div className="container-main">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur-sm">
                🎨 Curated Collection
              </span>
              <h1 className="mt-4 font-display text-5xl font-bold text-white lg:text-6xl">{collection.title}</h1>
              <p className="mt-2 text-xl font-light text-white/80">{collection.subtitle}</p>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="container-main py-12">
        {/* Description */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-16">
          <div className="lg:max-w-xl">
            <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">{collection.description}</p>
          </div>
          <div className="flex flex-wrap gap-6 lg:ml-auto">
            {[
              { label: 'Fabrics', value: collection.products.length },
              { label: 'Starting From', value: `₹${Math.min(...collection.products.map((p) => p.discountPrice || p.basePrice))}` },
              { label: 'Min Order', value: '0.5m' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-bold text-primary-700 dark:text-primary-400 font-display">{s.value}</p>
                <p className="text-sm text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Products */}
        <div className="mt-12">
          <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white">
            Fabrics in this Collection
          </h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {collection.products.map((product, i) => (
              <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.07 }}>
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Other collections */}
        <div className="mt-20 border-t border-gray-100 dark:border-dark-800 pt-12">
          <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white">More Collections</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {ALL_COLLECTIONS.filter((c) => c.slug !== slug).map((col) => (
              <Link key={col.slug} href={`/collections/${col.slug}`}
                className="group relative h-40 overflow-hidden rounded-2xl">
                <img src={col.image} alt={col.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"/>
                <div className="absolute bottom-0 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary-300">{col.subtitle}</p>
                  <p className="font-display text-lg font-bold text-white">{col.title}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
