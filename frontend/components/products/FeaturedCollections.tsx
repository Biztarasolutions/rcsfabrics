'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useHomepageData } from '@/hooks/useHomepageData';

export default function FeaturedCollections() {
  const { data: homepageData, isLoading } = useHomepageData();
  const collections = homepageData?.collections || [];
  return (
    <section className="py-16 lg:py-24">
      <div className="container-main">
        <div className="text-center">
          <span className="section-tag">🎨 Curated for You</span>
          <h2 className="section-title mt-3 font-display">Featured Collections</h2>
          <p className="section-subtitle">Thoughtfully curated for every occasion and style</p>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-3 lg:grid-rows-2">
          {isLoading ? (
            <>
              <div className="lg:col-span-2 lg:row-span-2 h-80 lg:h-full animate-pulse rounded-2xl bg-gray-100 dark:bg-dark-800" />
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-48 animate-pulse rounded-2xl bg-gray-100 dark:bg-dark-800" />
              ))}
            </>
          ) : (
            <>
              {/* Wide card */}
              {collections.length > 0 && (
                <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }} className="lg:col-span-2 lg:row-span-2">
                  <Link href={`/collections/${collections[0].slug}`}
                    className="group relative block h-80 overflow-hidden rounded-2xl lg:h-full">
                    <img src={collections[0].image} alt={collections[0].name}
                      className="h-full w-full object-contain bg-white dark:bg-dark-800 transition-transform duration-700 group-hover:scale-105"/>
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/30 to-transparent"/>
                    <div className="absolute inset-0 flex flex-col justify-end p-8">
                      <h3 className="font-display text-4xl font-bold text-white">{collections[0].name}</h3>
                      {collections[0].description && (
                        <p className="mt-2 text-white/70">{collections[0].description}</p>
                      )}
                      <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white group-hover:text-primary-300 transition-colors">
                        Explore Collection
                        <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                        </svg>
                      </span>
                    </div>
                  </Link>
                </motion.div>
              )}

              {/* Tall cards */}
              {collections.slice(1, 3).map((col: any, i: number) => (
                <motion.div key={col.id}
                  initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                  <Link href={`/collections/${col.slug}`}
                    className="group relative block h-64 overflow-hidden rounded-2xl">
                    <img src={col.image} alt={col.name}
                      className="h-full w-full object-contain bg-white dark:bg-dark-800 transition-transform duration-700 group-hover:scale-105"/>
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/30 to-transparent"/>
                    <div className="absolute inset-0 flex flex-col justify-end p-6">
                      <h3 className="font-display text-2xl font-bold text-white">{col.name}</h3>
                      {col.description && (
                        <p className="mt-1 text-sm text-white/70">{col.description.substring(0, 50)}...</p>
                      )}
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
