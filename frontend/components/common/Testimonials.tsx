'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

const TESTIMONIALS = [
  { id: 1, name: 'Priya Sharma', role: 'Fashion Designer, Mumbai', avatar: 'PS', rating: 5, text: 'RCS Fabrics has been my go-to source for over 3 years. The Kanjivaram silks are absolutely authentic — my clients always notice the quality difference. Fast shipping and excellent customer service too!', product: 'Pure Kanjivaram Silk' },
  { id: 2, name: 'Rahul Mehta', role: 'Boutique Owner, Delhi', avatar: 'RM', rating: 5, text: 'I order in bulk for my boutique every month. The quality is consistently premium and the variety is unmatched. The meter-wise selling is perfect for our customized garment needs.', product: 'Banarasi Brocade' },
  { id: 3, name: 'Ananya Iyer', role: 'Home Décor Enthusiast, Bangalore', avatar: 'AI', rating: 5, text: 'Ordered velvet for my home project and was blown away. The color accuracy in photos matches perfectly. The swatches helped me decide before committing to a full order.', product: 'Italian Velvet' },
  { id: 4, name: 'Kavitha Nair', role: 'Wedding Planner, Kerala', avatar: 'KN', rating: 5, text: 'Sourced bridal fabrics for 12 weddings this season. Every bride was happy with the quality. RCS is my secret weapon for sourcing premium fabrics at fair prices.', product: 'French Lace Organza' },
];

export default function Testimonials() {
  const [active, setActive] = useState(0);

  return (
    <section className="py-16 lg:py-24 bg-gradient-to-br from-primary-950 via-dark-900 to-dark-950 overflow-hidden">
      <div className="container-main">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary-700/50 bg-primary-900/30 px-4 py-1.5 text-sm font-semibold text-primary-300">
            ⭐ Customer Stories
          </span>
          <h2 className="mt-3 font-display text-4xl font-bold text-white lg:text-5xl">
            Loved by Creators
          </h2>
          <p className="mt-4 text-gray-400">Join thousands of designers and makers who trust RCS Fabrics</p>
        </div>

        {/* Main testimonial */}
        <div className="mt-12 relative">
          <motion.div key={active}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mx-auto max-w-3xl rounded-2xl border border-primary-800/30 bg-white/5 p-8 backdrop-blur-sm lg:p-12">
            {/* Stars */}
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="h-5 w-5 text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              ))}
            </div>
            <blockquote className="mt-6 text-lg text-white/90 leading-relaxed lg:text-xl">
              "{TESTIMONIALS[active].text}"
            </blockquote>
            <div className="mt-8 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-sm font-bold text-white">
                {TESTIMONIALS[active].avatar}
              </div>
              <div>
                <p className="font-semibold text-white">{TESTIMONIALS[active].name}</p>
                <p className="text-sm text-gray-400">{TESTIMONIALS[active].role}</p>
              </div>
              <div className="ml-auto">
                <span className="rounded-full border border-primary-700/50 bg-primary-900/30 px-3 py-1 text-xs font-medium text-primary-300">
                  Purchased: {TESTIMONIALS[active].product}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Selector dots */}
          <div className="mt-8 flex justify-center gap-3">
            {TESTIMONIALS.map((t, i) => (
              <button key={t.id} onClick={() => setActive(i)}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-all ${
                  i === active
                    ? 'border-primary-500 bg-primary-900/50 text-primary-300'
                    : 'border-dark-700 text-gray-500 hover:border-dark-500'
                }`}>
                <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  i === active ? 'bg-primary-500 text-white' : 'bg-dark-700 text-gray-400'
                }`}>
                  {t.avatar}
                </div>
                <span className="hidden sm:block">{t.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-16 grid grid-cols-3 gap-8 border-t border-white/10 pt-12 text-center">
          {[
            { value: '10,000+', label: 'Happy Customers' },
            { value: '4.9/5', label: 'Average Rating' },
            { value: '98%', label: 'Recommend Us' },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="font-display text-3xl font-bold text-gradient lg:text-4xl">{stat.value}</p>
              <p className="mt-1 text-sm text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
