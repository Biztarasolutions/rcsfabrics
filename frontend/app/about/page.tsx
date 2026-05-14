'use client';
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const TEAM = [
  { name: 'Rajesh Choudhary', role: 'Founder & CEO', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80', bio: '25+ years in the textile industry' },
  { name: 'Sunita Choudhary', role: 'Head of Sourcing', image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&q=80', bio: 'Expert in premium fabric selection' },
  { name: 'Arjun Mehta', role: 'Quality Director', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&q=80', bio: 'ISO certified quality specialist' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-dark-950">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <img src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1600&q=80" alt="About RCS Fabrics" className="h-80 w-full object-cover object-center lg:h-[500px]"/>
        <div className="absolute inset-0 bg-gradient-to-r from-dark-900/80 via-dark-900/50 to-transparent"/>
        <div className="absolute inset-0 flex items-center">
          <div className="container-main">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur-sm">🏅 Since 2000</span>
              <h1 className="mt-4 font-display text-5xl font-bold text-white lg:text-6xl">Our Story</h1>
              <p className="mt-4 max-w-lg text-lg text-white/80">25 years of bringing premium fabrics from the world's finest mills to your doorstep.</p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Story */}
      <section id="story" className="py-16 lg:py-24">
        <div className="container-main grid gap-12 lg:grid-cols-2 items-center">
          <div>
            <span className="section-tag">🧵 Our Heritage</span>
            <h2 className="section-title mt-3 font-display">Born in the Heart of India's Textile Capital</h2>
            <p className="mt-5 text-gray-600 dark:text-gray-400 leading-relaxed">
              RCS Fabrics was founded in 2000 by Rajesh Choudhary in Surat, Gujarat — the fabric capital of India. What began as a small fabric trading business has grown into one of India's most trusted premium fabric platforms.
            </p>
            <p className="mt-4 text-gray-600 dark:text-gray-400 leading-relaxed">
              We work directly with master weavers in Varanasi, Kanchipuram, Mysore, and with international mills across Europe and Asia, eliminating middlemen to bring you authentic premium fabrics at fair prices.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-6">
              {[{ v: '25+', l: 'Years Experience' }, { v: '500+', l: 'Fabric Varieties' }, { v: '10K+', l: 'Happy Customers' }].map((s) => (
                <div key={s.l} className="text-center">
                  <p className="font-display text-3xl font-bold text-gradient">{s.v}</p>
                  <p className="mt-1 text-sm text-gray-500">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <img src="https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=500&q=80" alt="Fabric weaving" className="rounded-2xl object-cover h-48 w-full"/>
            <img src="https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=500&q=80" alt="Premium silk" className="rounded-2xl object-cover h-48 w-full mt-8"/>
            <img src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&q=80" alt="Velvet fabric" className="rounded-2xl object-cover h-48 w-full"/>
            <img src="https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=500&q=80" alt="Cotton rolls" className="rounded-2xl object-cover h-48 w-full mt-8"/>
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
              { icon: '🔍', title: 'Rigorous Testing', desc: 'Every batch undergoes GSM, colorfastness, and shrinkage testing before dispatch.' },
              { icon: '🤝', title: 'Direct Sourcing', desc: 'We source directly from weavers and mills — no middlemen, no markups.' },
              { icon: '🏅', title: 'Certified Quality', desc: 'ISO 9001 certified operations. All fabrics meet BIS standards.' },
              { icon: '♻️', title: 'Sustainable Practices', desc: 'Supporting eco-friendly dyeing and fair wages for all artisans.' },
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

      {/* Team */}
      <section className="py-16 lg:py-24">
        <div className="container-main text-center">
          <span className="section-tag">👥 Our Team</span>
          <h2 className="section-title mt-3 font-display">Meet the Experts</h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3 max-w-3xl mx-auto">
            {TEAM.map((member) => (
              <div key={member.name} className="text-center">
                <img src={member.image} alt={member.name} className="mx-auto h-24 w-24 rounded-full object-cover shadow-md"/>
                <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">{member.name}</h3>
                <p className="text-sm font-medium text-primary-600 dark:text-primary-400">{member.role}</p>
                <p className="mt-1 text-sm text-gray-500">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-primary-700 to-primary-800">
        <div className="container-main text-center">
          <h2 className="font-display text-3xl font-bold text-white lg:text-4xl">Ready to Experience Premium Fabrics?</h2>
          <p className="mt-4 text-white/80">Browse our collection of 500+ premium fabrics, sold by the meter.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/products" className="rounded-xl bg-white px-8 py-3.5 font-semibold text-primary-700 shadow-md hover:bg-gray-50 transition-colors">Shop Now</Link>
            <Link href="/contact" className="rounded-xl border border-white/40 px-8 py-3.5 font-semibold text-white backdrop-blur-sm hover:bg-white/10 transition-colors">Contact Us</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
