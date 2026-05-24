'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import HeroBanner from '@/components/common/HeroBanner';
import FeaturedProducts from '@/components/products/FeaturedProducts';
import NewArrivals from '@/components/products/NewArrivals';
import BestSellers from '@/components/products/BestSellers';
import CategoryShowcase from '@/components/products/CategoryShowcase';
import FeaturedCollections from '@/components/products/FeaturedCollections';
import Testimonials from '@/components/common/Testimonials';
import NewsletterSignup from '@/components/common/NewsletterSignup';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="overflow-hidden">
      {/* 1. Full-screen Hero */}
      <HeroBanner />

      {/* 2. Trust Badges */}
      <div className="border-b border-gray-100 dark:border-dark-800 bg-white dark:bg-dark-900">
        <div className="container-main py-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { icon: '🚚', label: 'Free Shipping', sub: 'Orders above ₹2,000' },
              { icon: '🔄', label: 'Easy Returns', sub: '30-day return policy' },
              { icon: '⚡', label: 'Fast Delivery', sub: '2–5 business days' },
              { icon: '✅', label: 'Certified Quality', sub: 'Premium mills only' },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-3 py-2">
                <span className="text-xl">{b.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{b.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{b.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Featured Products */}
      <section className="py-16 lg:py-24">
        <div className="container-main">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} className="text-center">
            <span className="section-tag">⭐ Editor's Picks</span>
            <h2 className="section-title mt-3 font-display">Featured Fabrics</h2>
            <p className="section-subtitle">Hand-selected for exceptional quality and beauty</p>
          </motion.div>
          <FeaturedProducts />
        </div>
      </section>

      {/* 4. New Arrivals */}
      <NewArrivals />

      {/* 5. Promo Banner */}
      <section className="py-12 lg:py-16">
        <div className="container-main">
          <motion.div initial={{ opacity: 0, scale: 0.98 }} whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl h-64 lg:h-80">
            <Image src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1600&q=80"
              alt="Bulk Order Banner" fill sizes="100vw" className="object-cover object-top"/>
            <div className="absolute inset-0 bg-gradient-to-r from-dark-900/90 to-dark-900/40"/>
            <div className="absolute inset-0 flex items-center">
              <div className="container-main">
                <p className="text-sm font-semibold uppercase tracking-widest text-primary-400">Wholesale & Bulk</p>
                <h3 className="mt-2 font-display text-3xl font-bold text-white lg:text-4xl">
                  Need 50+ Meters?
                </h3>
                <p className="mt-2 max-w-md text-white/70">
                  Get special pricing for bulk orders. Trusted by garment manufacturers across India.
                </p>
                <Link href="/contact#bulk"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-500 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-400 transition-colors">
                  Get Bulk Quote
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                  </svg>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 6. Best Sellers */}
      <BestSellers />

      {/* 7. Category Showcase */}
      <CategoryShowcase />

      {/* 8. Featured Collections */}
      <FeaturedCollections />

      {/* 9. Testimonials */}
      <Testimonials />

      {/* 10. Swatch Request */}
      <section className="py-12 lg:py-16 bg-primary-50 dark:bg-primary-950/20">
        <div className="container-main">
          <div className="flex flex-col items-center gap-6 rounded-2xl border border-primary-200 dark:border-primary-800/50 bg-white dark:bg-dark-800 p-8 text-center lg:flex-row lg:text-left lg:justify-between">
            <div>
              <span className="text-2xl">🧵</span>
              <h3 className="mt-2 font-display text-2xl font-bold text-gray-900 dark:text-white">
                Not sure about the fabric? Request a Swatch!
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Get a physical sample delivered to your door before committing to a full order.
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <Link href="/contact#swatch" className="button-primary px-6 py-3 whitespace-nowrap">
                Request Swatch
              </Link>
              <Link href="/products" className="button-secondary px-6 py-3 whitespace-nowrap">
                Browse Fabrics
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 11. Newsletter */}
      <NewsletterSignup />
    </div>
  );
}
