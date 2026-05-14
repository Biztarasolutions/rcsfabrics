'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    toast.success('🎉 Welcome! 10% off coupon sent to your inbox.');
    setEmail('');
    setLoading(false);
  };

  return (
    <section className="relative overflow-hidden py-16 lg:py-24">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-950/30 dark:to-dark-900"/>
      <div className="absolute inset-0 texture-overlay"/>

      <div className="container-main relative z-10">
        <div className="mx-auto max-w-2xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <span className="section-tag">💌 Join the Club</span>
            <h2 className="section-title mt-3 font-display">Get 10% Off Your First Order</h2>
            <p className="section-subtitle">
              Subscribe to receive exclusive offers, fabric launches, and styling inspiration.
              Unsubscribe anytime.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 flex gap-3">
              <input type="email" id="newsletter-email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required className="input-field flex-1" />
              <button type="submit" disabled={loading}
                className="button-luxury shrink-0 px-6 py-3 text-sm font-semibold">
                {loading ? (
                  <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                ) : 'Subscribe'}
              </button>
            </form>

            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              By subscribing you agree to our Privacy Policy. No spam, ever.
            </p>

            {/* Perks */}
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              {['10% Off First Order', 'Early Access to New Arrivals', 'Exclusive Member Deals'].map((perk) => (
                <span key={perk}
                  className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <svg className="h-4 w-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                  </svg>
                  {perk}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
