'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import ProductCard from './ProductCard';

const SAMPLE_PRODUCTS = [
  { id: '1', name: 'Royal Banarasi Silk', slug: 'royal-banarasi-silk', basePrice: 1850, discountPrice: 1499, material: 'Silk', gsm: 120, color: 'Deep Maroon', stretchability: 'Non-Stretch', totalStock: 45, minOrderQty: 0.5, rating: 4.8, ratingCount: 124, isFeatured: true, isNew: false, isActive: true, createdAt: '', category: { name: 'Silks', slug: 'silks' }, images: [{ id: '1', url: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&q=80', isMain: true, order: 1 }] },
  { id: '2', name: 'Premium Egyptian Cotton', slug: 'premium-egyptian-cotton', basePrice: 680, material: 'Cotton', gsm: 180, color: 'Ivory White', stretchability: 'Slight Stretch', totalStock: 200, minOrderQty: 1, rating: 4.6, ratingCount: 89, isFeatured: true, isNew: true, isActive: true, createdAt: '', category: { name: 'Cottons', slug: 'cottons' }, images: [{ id: '2', url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&q=80', isMain: true, order: 1 }] },
  { id: '3', name: 'French Linen Blend', slug: 'french-linen-blend', basePrice: 1200, discountPrice: 980, material: 'Linen', gsm: 200, color: 'Natural Beige', stretchability: 'Non-Stretch', totalStock: 80, minOrderQty: 0.5, rating: 4.7, ratingCount: 56, isFeatured: true, isNew: true, isActive: true, createdAt: '', category: { name: 'Blends', slug: 'blends' }, images: [{ id: '3', url: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=600&q=80', isMain: true, order: 1 }] },
  { id: '4', name: 'Italian Velvet', slug: 'italian-velvet', basePrice: 2400, material: 'Velvet', gsm: 350, color: 'Midnight Blue', stretchability: 'Slight Stretch', totalStock: 30, minOrderQty: 0.5, rating: 4.9, ratingCount: 38, isFeatured: true, isNew: false, isActive: true, createdAt: '', category: { name: 'Velvets', slug: 'velvets' }, images: [{ id: '4', url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80', isMain: true, order: 1 }] },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function FeaturedProducts() {
  return (
    <div className="mt-12">
      <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {SAMPLE_PRODUCTS.map((product) => (
          <motion.div key={product.id} variants={item}>
            <ProductCard product={product as any} />
          </motion.div>
        ))}
      </motion.div>
      <div className="mt-10 text-center">
        <Link href="/products" className="button-secondary inline-flex items-center gap-2 px-8 py-3">
          View All Fabrics
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
          </svg>
        </Link>
      </div>
    </div>
  );
}
