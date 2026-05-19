'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useHomepageData } from '@/hooks/useHomepageData';
import ProductCard from './ProductCard';

export default function NewArrivals() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: homepageData, isLoading } = useHomepageData();
  const products = homepageData?.newArrivals || [];

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
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="shrink-0 w-64 aspect-[4/5] animate-pulse rounded-2xl bg-gray-100 dark:bg-dark-800" />
            ))
          ) : (
            products.map((product: any, i: number) => (
              <motion.div key={product.id}
                initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="shrink-0 w-64" style={{ scrollSnapAlign: 'start' }}>
                <ProductCard product={product} />
              </motion.div>
            ))
          )}
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
