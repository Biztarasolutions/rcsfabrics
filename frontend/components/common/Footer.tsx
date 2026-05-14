'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const FOOTER_SECTIONS = [
  {
    title: 'Shop',
    links: [
      { label: 'All Fabrics', href: '/products' },
      { label: 'Silks', href: '/products?category=silks' },
      { label: 'Cottons', href: '/products?category=cottons' },
      { label: 'Blends', href: '/products?category=blends' },
      { label: 'New Arrivals', href: '/products?sort=newest' },
      { label: 'Best Sellers', href: '/products?sort=bestsellers' },
    ],
  },
  {
    title: 'Customer Care',
    links: [
      { label: 'Contact Us', href: '/contact' },
      { label: 'FAQs', href: '/contact#faq' },
      { label: 'Shipping Policy', href: '/shipping' },
      { label: 'Return Policy', href: '/returns' },
      { label: 'Sample Request', href: '/contact#swatch' },
      { label: 'Bulk Orders', href: '/contact#bulk' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About RCS', href: '/about' },
      { label: 'Our Story', href: '/about#story' },
      { label: 'Quality Promise', href: '/about#quality' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-dark-950 text-gray-300">
      {/* Main footer */}
      <div className="container-main py-16">
        <div className="grid gap-12 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-luxury">
                <span className="text-xl font-black text-white">R</span>
              </div>
              <div className="leading-none">
                <span className="font-display text-2xl font-bold text-gradient">RCS</span>
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-gray-500">Fabrics</p>
              </div>
            </Link>
            <p className="mt-5 text-sm leading-relaxed text-gray-400">
              Premium luxury fabrics sourced from the finest mills across India and the world. Sold by the meter, crafted for those who value quality.
            </p>

            {/* Contact */}
            <div className="mt-6 space-y-2 text-sm text-gray-400">
              <p className="flex items-center gap-2">
                <svg className="h-4 w-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                info@rcsfabrics.com
              </p>
              <p className="flex items-center gap-2">
                <svg className="h-4 w-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
                +91 98765 43210
              </p>
            </div>

            {/* Social */}
            <div className="mt-6 flex gap-3">
              {[
                { label: 'Instagram', href: '#', icon: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' },
                { label: 'Facebook', href: '#', icon: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' },
              ].map((social) => (
                <a key={social.label} href={social.href} aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-dark-700 bg-dark-800 text-gray-400 transition-colors hover:border-primary-600 hover:text-primary-400">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d={social.icon}/></svg>
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">{section.title}</h3>
              <ul className="mt-4 space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href}
                      className="text-sm text-gray-400 transition-colors hover:text-primary-400">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="mt-12 grid grid-cols-2 gap-6 border-t border-dark-800 pt-12 sm:grid-cols-4">
          {[
            { icon: '🚚', title: 'Free Shipping', desc: 'Orders above ₹2,000' },
            { icon: '↩️', title: 'Easy Returns', desc: '30-day return policy' },
            { icon: '🔒', title: 'Secure Payment', desc: '100% safe checkout' },
            { icon: '⭐', title: 'Quality Assured', desc: 'Premium certified fabrics' },
          ].map((badge) => (
            <div key={badge.title} className="flex items-center gap-3">
              <span className="text-2xl">{badge.icon}</span>
              <div>
                <p className="text-sm font-semibold text-white">{badge.title}</p>
                <p className="text-xs text-gray-500">{badge.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-dark-800">
        <div className="container-main flex flex-col items-center justify-between gap-2 py-6 sm:flex-row">
          <p className="text-xs text-gray-500">© {new Date().getFullYear()} RCS Fabrics. All rights reserved.</p>
          <div className="flex items-center gap-4">
            {['Privacy', 'Terms', 'Cookies'].map((item) => (
              <Link key={item} href={`/${item.toLowerCase()}`}
                className="text-xs text-gray-500 transition-colors hover:text-primary-400">
                {item}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Payments:</span>
            <span className="font-semibold text-gray-400">Razorpay · UPI · Cards</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
