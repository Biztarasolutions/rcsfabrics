import React from 'react';
import Image from 'next/image';

export default function WhyChoose() {
  const items = [
    'Premium Quality Fabrics',
    'Wide Color Selection',
    'Fast Shipping',
    'Secure Payments',
    'Trusted By Boutiques',
    'Bulk Order Support',
  ];
  return (
    <section className="why-choose container-main py-12">
      <h2 className="section-title text-center font-display text-3xl mb-6">Why Thousands Choose RCS Fabrics</h2>
      <p className="section-subtitle text-center text-lg mb-8">Premium fabrics curated for designers, boutiques, resellers, and creators.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {items.map((text, i) => (
          <div key={i} className="flex items-center gap-3 p-4 bg-white dark:bg-dark-800 rounded-xl shadow-sm">
            <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium text-gray-900 dark:text-white">{text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
