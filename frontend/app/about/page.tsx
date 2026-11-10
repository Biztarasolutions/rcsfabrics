'use client';
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-dark-950">
      {/* Hero */}
      <div className="relative overflow-hidden h-80 lg:h-[500px]">
        <Image src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1600&q=80" alt="About RCS Fabrics" fill priority sizes="100vw" className="object-cover object-center"/>
        <div className="absolute inset-0 bg-gradient-to-r from-dark-900/80 via-dark-900/50 to-transparent"/>
        <div className="absolute inset-0 flex items-center">
          <div className="container-main">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur-sm">🧵 About Us</span>
              <h1 className="mt-4 font-display text-5xl font-bold text-white lg:text-6xl">Our Story</h1>
              <p className="mt-4 max-w-lg text-lg text-white/80">Quality fabrics by the metre from Rajasthan Cloth Store, delivered to your doorstep.</p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Story */}
      <section id="story" className="py-16 lg:py-24">
        <div className="container-main grid gap-12 lg:grid-cols-2 items-center">
          <div>
            <span className="section-tag">🧵 Who We Are</span>
            <h2 className="section-title mt-3 font-display">A Family Cloth Store, Now Online</h2>
            <p className="mt-5 text-gray-600 dark:text-gray-400 leading-relaxed">
              RCS Fabrics is the online store of Rajasthan Cloth Store. We sell dress fabrics — poplin, satin, rayon, cotton, stretchable and more — by the metre, so you buy exactly what your stitching project needs.
            </p>
            <p className="mt-4 text-gray-600 dark:text-gray-400 leading-relaxed">
              Whether you are a home stitcher, a boutique or a garment maker, we help you choose the right fabric. Message us on WhatsApp for photos, colour matching or bulk pricing.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-6">
              {[{ v: '0.5 m', l: 'Minimum Order' }, { v: '₹2,000+', l: 'Free Shipping' }, { v: '30 days', l: 'Easy Returns' }].map((s) => (
                <div key={s.l} className="text-center">
                  <p className="font-display text-3xl font-bold text-gradient">{s.v}</p>
                  <p className="mt-1 text-sm text-gray-500">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="relative h-48 rounded-2xl overflow-hidden"><Image src="https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=500&q=80" alt="Fabric weaving" fill sizes="(max-width: 768px) 100vw, 25vw" className="object-cover"/></div>
            <div className="relative h-48 rounded-2xl overflow-hidden mt-8"><Image src="https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=500&q=80" alt="Fabric close-up" fill sizes="(max-width: 768px) 100vw, 25vw" className="object-cover"/></div>
            <div className="relative h-48 rounded-2xl overflow-hidden"><Image src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&q=80" alt="Draped fabric" fill sizes="(max-width: 768px) 100vw, 25vw" className="object-cover"/></div>
            <div className="relative h-48 rounded-2xl overflow-hidden mt-8"><Image src="https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=500&q=80" alt="Cotton rolls" fill sizes="(max-width: 768px) 100vw, 25vw" className="object-cover"/></div>
          </div>
        </div>
      </section>

      {/* Quality */}
      <section id="quality" className="py-16 lg:py-24 bg-gray-50 dark:bg-dark-900/50">
        <div className="container-main text-center">
          <span className="section-tag">✅ Our Promise</span>
          <h2 className="section-title mt-3 font-display">Quality You Can Feel</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: '🔍', title: 'Checked Before Dispatch', desc: 'Every piece is checked for flaws and measured before it is packed.' },
              { icon: '📏', title: 'Cut to Your Length', desc: 'Order in 0.5 m steps — no need to buy a full roll.' },
              { icon: '💬', title: 'Real Help on WhatsApp', desc: 'Ask for extra photos, colour matching or fabric advice before you buy.' },
              { icon: '↩️', title: 'Easy Returns', desc: '30-day returns on unused, uncut fabric. See our Returns Policy.' },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-gray-200 bg-white p-6 text-left dark:border-dark-700 dark:bg-dark-800">
                <span className="text-3xl">{item.icon}</span>
                <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-primary-700 to-primary-800">
        <div className="container-main text-center">
          <h2 className="font-display text-3xl font-bold text-white lg:text-4xl">Find Your Next Fabric</h2>
          <p className="mt-4 text-white/80">Browse our latest fabrics, sold by the metre.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/products" className="rounded-xl bg-white px-8 py-3.5 font-semibold text-primary-700 shadow-md hover:bg-gray-50 transition-colors">Shop Now</Link>
            <Link href="/contact" className="rounded-xl border border-white/40 px-8 py-3.5 font-semibold text-white backdrop-blur-sm hover:bg-white/10 transition-colors">Contact Us</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
