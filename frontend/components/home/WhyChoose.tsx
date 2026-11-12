import React from 'react';
import Link from 'next/link';

// Concrete promises the shop actually keeps — no generic claims.
const PROMISES = [
  {
    title: 'A family business since 1970',
    text: 'Three generations of the Kashliwal family in Dimapur, choosing every fabric we sell.',
    href: '/about',
    link: 'Our story',
  },
  {
    title: 'Cut to the length you need',
    text: 'Order from 0.5 metre, in half-metre steps — no fixed packs, no waste.',
    href: '/products',
    link: 'Shop fabrics',
  },
  {
    title: 'Talk to us before you buy',
    text: 'Unsure about colour or feel? Message us on WhatsApp for extra photos and advice.',
    href: 'https://wa.me/919863026598',
    link: 'Chat on WhatsApp',
  },
  {
    title: 'Simple, fair returns',
    text: 'Uncut fabric can be returned within 30 days. Free shipping on orders above ₹2,000.',
    href: '/returns',
    link: 'Return policy',
  },
];

export default function WhyChoose() {
  return (
    <section className="bg-[#faf6ee] py-16 dark:bg-dark-900 lg:py-20">
      <div className="container-main">
        <div className="mx-auto max-w-2xl text-center">
          <span className="section-tag">The RCS promise</span>
          <h2 className="section-title mt-3 font-display">Why shop with RCS Fabrics</h2>
        </div>
        <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-[#e6dccb] bg-[#e6dccb] sm:grid-cols-2 lg:grid-cols-4 dark:border-dark-700 dark:bg-dark-700">
          {PROMISES.map((p, i) => {
            const external = p.href.startsWith('http');
            return (
              <div key={p.title} className="flex flex-col bg-white p-6 dark:bg-dark-800">
                <span className="font-display text-sm text-[#a07c3b]">0{i + 1}</span>
                <h3 className="mt-3 font-display text-xl text-gray-900 dark:text-white">{p.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{p.text}</p>
                {external ? (
                  <a href={p.href} target="_blank" rel="noopener noreferrer" className="mt-4 text-sm font-semibold text-primary-700 hover:underline dark:text-primary-400">{p.link} →</a>
                ) : (
                  <Link href={p.href} className="mt-4 text-sm font-semibold text-primary-700 hover:underline dark:text-primary-400">{p.link} →</Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
