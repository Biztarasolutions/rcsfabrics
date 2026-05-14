'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const COLLECTIONS = [
  {
    slug: 'summer-2025',
    title: 'Summer 2025',
    subtitle: 'Bridal & Festive',
    desc: 'Ethereal silks and organzas for the most special moments of your life.',
    image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1000&q=80',
    products: 48,
    wide: true,
  },
  {
    slug: 'everyday-cotton',
    title: 'Everyday Comfort',
    subtitle: 'Cotton Essentials',
    desc: 'Soft, breathable cottons for daily wear.',
    image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&q=80',
    products: 62,
    wide: false,
  },
  {
    slug: 'heritage-handloom',
    title: 'Heritage Handloom',
    subtitle: 'Artisan Crafted',
    desc: 'Supporting Indian weavers with each purchase.',
    image: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=800&q=80',
    products: 34,
    wide: false,
  },
];

export default function FeaturedCollections() {
  return (
    <section className="py-16 lg:py-24">
      <div className="container-main">
        <div className="text-center">
          <span className="section-tag">🎨 Curated for You</span>
          <h2 className="section-title mt-3 font-display">Featured Collections</h2>
          <p className="section-subtitle">Thoughtfully curated for every occasion and style</p>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-3 lg:grid-rows-2">
          {/* Wide card */}
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} className="lg:col-span-2 lg:row-span-2">
            <Link href={`/collections/${COLLECTIONS[0].slug}`}
              className="group relative block h-80 overflow-hidden rounded-2xl lg:h-full">
              <img src={COLLECTIONS[0].image} alt={COLLECTIONS[0].title}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"/>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"/>
              <div className="absolute inset-0 flex flex-col justify-end p-8">
                <span className="mb-2 inline-block text-xs font-semibold uppercase tracking-wider text-primary-300">
                  {COLLECTIONS[0].subtitle} · {COLLECTIONS[0].products} fabrics
                </span>
                <h3 className="font-display text-4xl font-bold text-white">{COLLECTIONS[0].title}</h3>
                <p className="mt-2 text-white/70">{COLLECTIONS[0].desc}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white group-hover:text-primary-300 transition-colors">
                  Explore Collection
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                  </svg>
                </span>
              </div>
            </Link>
          </motion.div>

          {/* Tall cards */}
          {COLLECTIONS.slice(1).map((col, i) => (
            <motion.div key={col.slug}
              initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <Link href={`/collections/${col.slug}`}
                className="group relative block h-64 overflow-hidden rounded-2xl">
                <img src={col.image} alt={col.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"/>
                <div className="absolute inset-0 flex flex-col justify-end p-6">
                  <span className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary-300">
                    {col.subtitle} · {col.products} fabrics
                  </span>
                  <h3 className="font-display text-2xl font-bold text-white">{col.title}</h3>
                  <p className="mt-1 text-sm text-white/70">{col.desc}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
