import React from 'react';
import Link from 'next/link';

export const BUSINESS = {
  legalName: 'Rajasthan Cloth Store',
  brand: 'RCS Fabrics',
  phone: '+91 98630 26598',
  email: 'info@rcsfabrics.com',
  whatsapp: 'https://wa.me/919863026598',
  lastUpdated: '10 November 2026',
};

export interface PolicySection {
  heading: string;
  body: React.ReactNode;
}

export default function PolicyPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: React.ReactNode;
  sections: PolicySection[];
}) {
  return (
    <div className="min-h-screen bg-white dark:bg-dark-950">
      <div className="bg-gray-50 py-12 dark:bg-dark-900">
        <div className="container-main">
          <nav className="text-sm text-gray-500 dark:text-gray-400">
            <Link href="/" className="hover:text-primary-600">Home</Link> <span className="mx-1">/</span> {title}
          </nav>
          <h1 className="mt-3 font-display text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">{title}</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Last updated: {BUSINESS.lastUpdated}</p>
        </div>
      </div>

      <div className="container-main py-10">
        <article className="prose prose-gray max-w-3xl dark:prose-invert prose-headings:font-display prose-a:text-primary-600">
          <div>{intro}</div>
          {sections.map((s) => (
            <section key={s.heading}>
              <h2>{s.heading}</h2>
              {s.body}
            </section>
          ))}
          <h2>Contact us</h2>
          <p>
            {BUSINESS.legalName} ({BUSINESS.brand})<br />
            Phone / WhatsApp: <a href={`tel:${BUSINESS.phone.replace(/\s/g, '')}`}>{BUSINESS.phone}</a> (Mon–Sat, 9am–6pm)<br />
            Email: <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>
          </p>
        </article>
      </div>
    </div>
  );
}
