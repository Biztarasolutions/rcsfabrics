'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';

const SLIDES = [
  {
    id: 1,
    tag: 'New Collection 2025',
    headline: 'Discover Luxury\nFabrics',
    sub: 'Premium quality fabrics imported from the finest mills. Sold by the meter, crafted for perfection.',
    cta: { label: 'Shop Collection', href: '/products' },
    ctaSecondary: { label: 'View Lookbook', href: '/collections/summer-2025' },
    image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1200&q=80',
    accent: 'from-primary-900/80 to-primary-800/40',
  },
  {
    id: 2,
    tag: 'Premium Silks',
    headline: 'Timeless Silk\nElegance',
    sub: 'Hand-picked silk fabrics from Varanasi and Mysore. Every thread tells a story of heritage.',
    cta: { label: 'Explore Silks', href: '/products?category=silks' },
    ctaSecondary: { label: 'About Us', href: '/about' },
    image: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=1200&q=80',
    accent: 'from-secondary-900/80 to-secondary-800/40',
  },
  {
    id: 3,
    tag: 'Summer Essentials',
    headline: 'Light Cotton\nBreathing Easy',
    sub: 'Lightweight, breathable cottons for the warm season. Comfort meets style in every weave.',
    cta: { label: 'Shop Cottons', href: '/products?category=cottons' },
    ctaSecondary: { label: 'Request Swatch', href: '/contact#swatch' },
    image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=1200&q=80',
    accent: 'from-dark-900/80 to-dark-800/40',
  },
];

export default function HeroBanner() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrent((c) => (c + 1) % SLIDES.length), 5500);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[current];

  return (
    <section className="relative h-[90vh] min-h-[600px] max-h-[900px] overflow-hidden">
      {/* Background image with ken-burns */}
      {SLIDES.map((s, i: number) => (
        <div key={s.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${i === current ? 'opacity-100' : 'opacity-0'}`}>
          <Image src={s.image} alt={s.tag} fill priority={i === 0} sizes="100vw"
            className="object-cover scale-105 animate-float" style={{ animationDuration: '8s' }}/>
          <div className={`absolute inset-0 bg-gradient-to-r ${s.accent}`}/>
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"/>
        </div>
      ))}

      {/* Decorative fabric texture */}
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='1'%3E%3Cpath d='M0 0h1v1H0V0zm2 0h1v1H2V0zm2 0h1v1H4V0zm2 0h1v1H6V0zm2 0h1v1H8V0zm2 0h1v1h-1V0zm2 0h1v1h-1V0zm2 0h1v1h-1V0zm2 0h1v1h-1V0zm2 0h1v1h-1V0z'/%3E%3C/g%3E%3C/svg%3E\")" }}/>

      {/* Content */}
      <div className="relative z-10 flex h-full items-center">
        <div className="container-main">
          <div className="max-w-2xl">
            <motion.div key={`tag-${current}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-primary-400"/>
                {slide.tag}
              </span>
            </motion.div>

            <motion.h1 key={`title-${current}`} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-6 font-display text-5xl font-bold leading-tight text-white lg:text-7xl"
              style={{ whiteSpace: 'pre-line' }}>
              {slide.headline}
            </motion.h1>

            <motion.p key={`sub-${current}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 max-w-lg text-lg text-white/85 leading-relaxed">
              {slide.sub}
            </motion.p>

            <motion.div key={`cta-${current}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-10 flex flex-wrap items-center gap-4">
              <Link href={slide.cta.href}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-700 px-8 py-4 text-base font-semibold text-white shadow-luxury transition-all hover:shadow-[0_20px_60px_rgba(212,175,55,0.5)] hover:-translate-y-0.5 active:scale-95">
                {slide.cta.label}
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                </svg>
              </Link>
              <Link href={slide.ctaSecondary.href}
                className="inline-flex items-center gap-2 rounded-xl border border-white/40 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/15">
                {slide.ctaSecondary.label}
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div key={`stats-${current}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-12 flex gap-8">
              {[
                { value: '500+', label: 'Fabric Types' },
                { value: '10K+', label: 'Happy Customers' },
                { value: '15+', label: 'Years Experience' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-bold text-white font-display">{stat.value}</p>
                  <p className="text-sm text-white/70">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {SLIDES.map((_, i: number) => (
          <button key={i} onClick={() => setCurrent(i)}
            className={`rounded-full transition-all duration-300 ${i === current ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'} h-2`}
            aria-label={`Slide ${i + 1}`}/>
        ))}
      </div>

      {/* Scroll indicator */}
      <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }}
        className="absolute bottom-8 right-8 z-10 hidden text-white/60 lg:flex flex-col items-center gap-2">
        <span className="text-xs font-medium tracking-widest uppercase">Scroll</span>
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
        </svg>
      </motion.div>
    </section>
  );
}
