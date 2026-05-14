'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import ProductCard from './ProductCard';

const BEST_SELLERS = [
  { id: 'b1', name: 'Pure Kanjivaram Silk', slug: 'pure-kanjivaram-silk', basePrice: 3200, discountPrice: 2750, material: 'Silk', color: 'Emerald Green', stretchability: 'Non-Stretch', totalStock: 25, minOrderQty: 0.5, rating: 5.0, ratingCount: 234, isFeatured: true, isNew: false, isActive: true, createdAt: '', category: { name: 'Silks', slug: 'silks' }, images: [{ id: 'b1i', url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80', isMain: true, order: 1 }] },
  { id: 'b2', name: 'Dobby Cotton Print', slug: 'dobby-cotton-print', basePrice: 520, material: 'Cotton', color: 'Floral Blue', stretchability: 'Non-Stretch', totalStock: 350, minOrderQty: 1, rating: 4.6, ratingCount: 189, isFeatured: false, isNew: false, isActive: true, createdAt: '', category: { name: 'Cottons', slug: 'cottons' }, images: [{ id: 'b2i', url: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=600&q=80', isMain: true, order: 1 }] },
  { id: 'b3', name: 'Satin Charmeuse', slug: 'satin-charmeuse', basePrice: 1100, discountPrice: 899, material: 'Satin', color: 'Pearl White', stretchability: 'Slight Stretch', totalStock: 70, minOrderQty: 0.5, rating: 4.8, ratingCount: 156, isFeatured: false, isNew: false, isActive: true, createdAt: '', category: { name: 'Satins', slug: 'satins' }, images: [{ id: 'b3i', url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80', isMain: true, order: 1 }] },
  { id: 'b4', name: 'Georgette Chiffon', slug: 'georgette-chiffon', basePrice: 750, material: 'Chiffon', color: 'Blush Pink', stretchability: 'Slight Stretch', totalStock: 150, minOrderQty: 0.5, rating: 4.7, ratingCount: 203, isFeatured: false, isNew: false, isActive: true, createdAt: '', category: { name: 'Chiffons', slug: 'chiffons' }, images: [{ id: 'b4i', url: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=600&q=80', isMain: true, order: 1 }] },
];

export default function BestSellers() {
  return (
    <section className="py-16 lg:py-24">
      <div className="container-main">
        <div className="flex items-end justify-between">
          <div>
            <span className="section-tag">🏆 Most Loved</span>
            <h2 className="section-title mt-3 font-display">Best Sellers</h2>
            <p className="section-subtitle">Customer favourites — ordered again and again</p>
          </div>
          <Link href="/products?sort=bestsellers"
            className="hidden text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 sm:block">
            View All →
          </Link>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {BEST_SELLERS.map((product, i) => (
            <motion.div key={product.id}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="relative">
              {/* Rank badge */}
              <div className="absolute -left-2 -top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-xs font-bold text-white shadow-md">
                #{i + 1}
              </div>
              <ProductCard product={product as any} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
