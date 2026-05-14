'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const CATEGORIES = [
  { name: 'Silks', slug: 'silks', count: '120+ fabrics', image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&q=80', desc: 'Kanjivaram, Banarasi, Mysore & more' },
  { name: 'Cottons', slug: 'cottons', count: '200+ fabrics', image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&q=80', desc: 'Khadi, Dobby, Egyptian & more' },
  { name: 'Blends', slug: 'blends', count: '80+ fabrics', image: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=800&q=80', desc: 'Linen, Chanderi, Poly blends' },
  { name: 'Velvets', slug: 'velvets', count: '40+ fabrics', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80', desc: 'Italian, Micro & Embossed velvets' },
  { name: 'Chiffons', slug: 'chiffons', count: '60+ fabrics', image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80', desc: 'Georgette, Korean & French chiffon' },
  { name: 'Woolens', slug: 'woolens', count: '35+ fabrics', image: 'https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?w=800&q=80', desc: 'Tweed, Merino & Cashmere blends' },
];

export default function CategoryShowcase() {
  return (
    <section className="py-16 lg:py-24 bg-gray-50 dark:bg-dark-900/50">
      <div className="container-main">
        <div className="text-center">
          <span className="section-tag">🧵 Browse by Type</span>
          <h2 className="section-title mt-3 font-display">Shop by Category</h2>
          <p className="section-subtitle">From heritage silks to modern blends — find your perfect fabric</p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((cat, i) => (
            <motion.div key={cat.slug}
              initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }} transition={{ delay: i * 0.07 }}>
              <Link href={`/products?category=${cat.slug}`}
                className="group relative block overflow-hidden rounded-2xl">
                {/* Image */}
                <div className="relative h-52 overflow-hidden">
                  <img src={cat.image} alt={cat.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"/>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"/>
                </div>
                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-5">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-primary-300">{cat.count}</p>
                      <h3 className="font-display text-2xl font-bold text-white">{cat.name}</h3>
                      <p className="text-sm text-white/70">{cat.desc}</p>
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
        </div>
      </div>
    </section>
  );
}
