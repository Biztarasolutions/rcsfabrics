'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import ProductCard from './ProductCard';

const NEW_ARRIVALS = [
  { id: 'n1', name: 'Mysore Crepe Silk', slug: 'mysore-crepe-silk', basePrice: 1650, material: 'Silk', color: 'Rose Gold', stretchability: 'Slight Stretch', totalStock: 60, minOrderQty: 0.5, rating: 4.7, ratingCount: 12, isFeatured: false, isNew: true, isActive: true, createdAt: '', category: { name: 'Silks', slug: 'silks' }, images: [{ id: 'n1i', url: 'https://images.unsplash.com/photo-1519659528534-7fd733a832a0?w=600&q=80', isMain: true, order: 1 }] },
  { id: 'n2', name: 'Handloom Khadi', slug: 'handloom-khadi', basePrice: 450, material: 'Khadi', color: 'Off White', stretchability: 'Non-Stretch', totalStock: 300, minOrderQty: 1, rating: 4.5, ratingCount: 8, isFeatured: false, isNew: true, isActive: true, createdAt: '', category: { name: 'Cottons', slug: 'cottons' }, images: [{ id: 'n2i', url: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=600&q=80', isMain: true, order: 1 }] },
  { id: 'n3', name: 'Organza Sheer', slug: 'organza-sheer', basePrice: 890, discountPrice: 749, material: 'Organza', color: 'Champagne', stretchability: 'Non-Stretch', totalStock: 90, minOrderQty: 0.5, rating: 4.6, ratingCount: 21, isFeatured: false, isNew: true, isActive: true, createdAt: '', category: { name: 'Sheers', slug: 'sheers' }, images: [{ id: 'n3i', url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80', isMain: true, order: 1 }] },
  { id: 'n4', name: 'Wool Tweed Blend', slug: 'wool-tweed-blend', basePrice: 1980, material: 'Wool', color: 'Charcoal Grey', stretchability: 'Non-Stretch', totalStock: 40, minOrderQty: 0.5, rating: 4.8, ratingCount: 15, isFeatured: false, isNew: true, isActive: true, createdAt: '', category: { name: 'Woolens', slug: 'woolens' }, images: [{ id: 'n4i', url: 'https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?w=600&q=80', isMain: true, order: 1 }] },
  { id: 'n5', name: 'Chanderi Silk Cotton', slug: 'chanderi-silk-cotton', basePrice: 780, material: 'Chanderi', color: 'Pastel Pink', stretchability: 'Slight Stretch', totalStock: 120, minOrderQty: 0.5, rating: 4.4, ratingCount: 9, isFeatured: false, isNew: true, isActive: true, createdAt: '', category: { name: 'Blends', slug: 'blends' }, images: [{ id: 'n5i', url: 'https://images.unsplash.com/photo-1603251579431-8041402bdeda?w=600&q=80', isMain: true, order: 1 }] },
];

export default function NewArrivals() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === 'right' ? 320 : -320, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-16 lg:py-24 bg-gray-50 dark:bg-dark-900/50">
      <div className="container-main">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <span className="section-tag">✨ Just Arrived</span>
            <h2 className="section-title mt-3 font-display">New Arrivals</h2>
            <p className="section-subtitle">Fresh fabrics added this week</p>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <button onClick={() => scroll('left')}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition-all hover:border-primary-400 hover:text-primary-600 dark:border-dark-700 dark:bg-dark-800 dark:text-gray-400">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            </button>
            <button onClick={() => scroll('right')}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition-all hover:border-primary-400 hover:text-primary-600 dark:border-dark-700 dark:bg-dark-800 dark:text-gray-400">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>

        {/* Horizontal scroll */}
        <div ref={scrollRef}
          className="mt-8 flex gap-5 overflow-x-auto pb-4 scrollbar-hide"
          style={{ scrollSnapType: 'x mandatory' }}>
          {NEW_ARRIVALS.map((product, i) => (
            <motion.div key={product.id}
              initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="shrink-0 w-64" style={{ scrollSnapAlign: 'start' }}>
              <ProductCard product={product as any} />
            </motion.div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link href="/products?sort=newest" className="button-secondary inline-flex items-center gap-2 px-8 py-3">
            See All New Arrivals
          </Link>
        </div>
      </div>
    </section>
  );
}
