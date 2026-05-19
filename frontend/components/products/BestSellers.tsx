'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useHomepageData } from '@/hooks/useHomepageData';
import ProductCard from './ProductCard';

export default function BestSellers() {
  const { data: homepageData, isLoading } = useHomepageData();
  const products = homepageData?.bestSellers || [];
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

        {isLoading ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-gray-100 dark:bg-dark-800" />
            ))}
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product: any, i) => (
            <motion.div key={product.id}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="relative">
              {/* Rank badge */}
              <div className="absolute -left-2 -top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-xs font-bold text-white shadow-md">
                #{i + 1}
              </div>
              <ProductCard product={product} />
            </motion.div>
          ))}
          </div>
        )}
      </div>
    </section>
  );
}
