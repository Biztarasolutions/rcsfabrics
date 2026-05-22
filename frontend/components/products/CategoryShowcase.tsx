'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useHomepageData } from '@/hooks/useHomepageData';

export default function CategoryShowcase() {
  const { data: homepageData, isLoading } = useHomepageData();
  const categories = homepageData?.categories || [];
  return (
    <section className="py-16 lg:py-24 bg-gray-50 dark:bg-dark-900/50">
      <div className="container-main">
        <div className="text-center">
          <span className="section-tag">🧵 Browse by Type</span>
          <h2 className="section-title mt-3 font-display">Shop by Category</h2>
          <p className="section-subtitle">From heritage silks to modern blends — find your perfect fabric</p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-52 animate-pulse rounded-2xl bg-gray-100 dark:bg-dark-800" />
              ))}
            </>
          ) : (
            <>
              {categories.map((cat: any, i: number) => (
                <motion.div key={cat.id}
                  initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.07 }}>
                  <Link href={`/products?category=${cat.slug}`}
                    className="group relative block overflow-hidden rounded-2xl">
                    {/* Image */}
                    <div className="relative h-52 overflow-hidden bg-white dark:bg-dark-800">
                      <img src={cat.imageUrl || cat.image} alt={cat.name}
                        className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"/>
                      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/30 to-transparent"/>
                    </div>
                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col justify-end p-5">
                      <div className="flex items-end justify-between">
                        <div>
                          <h3 className="font-display text-2xl font-bold text-white">{cat.name}</h3>
                        </div>
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-all group-hover:bg-primary-500 group-hover:scale-110">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                          </svg>
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
