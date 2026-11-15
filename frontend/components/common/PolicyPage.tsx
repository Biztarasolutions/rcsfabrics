import React from 'react';
import Link from 'next/link';

import { BUSINESS as B } from '@/lib/business';

// Policy text refers to the business by its registered trade name
export const BUSINESS = { ...B, legalName: B.tradeName };

export interface PolicySection {
  heading: string;
  body: React.ReactNode;
}

export interface PolicyHighlight {
  value: string;
  label: string;
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export default function PolicyPage({
  title,
  intro,
  sections,
  highlights,
}: {
  title: string;
  intro: React.ReactNode;
  sections: PolicySection[];
  /** Optional key facts shown as cards under the title */
  highlights?: PolicyHighlight[];
}) {
  const waNumber = BUSINESS.whatsapp.split('/').pop();

  return (
    <div className="min-h-screen bg-white dark:bg-dark-950">
      {/* Header */}
      <header className="border-b border-[#e6dccb] bg-[#faf6ee] dark:border-dark-800 dark:bg-dark-900">
        <div className="container-main py-12 sm:py-16">
          <nav aria-label="Breadcrumb" className="text-sm text-gray-500 dark:text-gray-400">
            <Link href="/" className="hover:text-primary-700">Home</Link>
            <span className="mx-2 text-gray-300">/</span>
            <span className="text-gray-700 dark:text-gray-300">{title}</span>
          </nav>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-[#a07c3b]">Customer care</p>
          <h1 className="mt-3 max-w-3xl font-display text-3xl leading-tight text-gray-900 dark:text-white sm:text-5xl">{title}</h1>
          <div className="mt-5 max-w-2xl text-base leading-relaxed text-gray-600 dark:text-gray-300 sm:text-lg">{intro}</div>
          <p className="mt-5 text-sm text-gray-500 dark:text-gray-400">Last updated: {BUSINESS.lastUpdated}</p>

          {highlights && highlights.length > 0 && (
            <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[#e6dccb] bg-[#e6dccb] dark:border-dark-700 dark:bg-dark-700 lg:grid-cols-4">
              {highlights.map((h) => (
                <div key={h.label} className="bg-white p-5 dark:bg-dark-800 sm:p-6">
                  <dt className="sr-only">{h.label}</dt>
                  <dd className="font-display text-2xl text-primary-700 dark:text-primary-300 sm:text-3xl">{h.value}</dd>
                  <dd className="mt-1 text-sm leading-snug text-gray-600 dark:text-gray-400">{h.label}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </header>

      <div className="container-main grid gap-12 py-12 sm:py-16 lg:grid-cols-12">
        {/* Contents */}
        <aside className="lg:col-span-3">
          <div className="lg:sticky lg:top-28">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">On this page</p>
            <ol className="mt-4 space-y-2 border-l border-gray-200 text-sm dark:border-dark-700">
              {sections.map((s, i) => (
                <li key={s.heading}>
                  <a href={`#${slug(s.heading)}`} className="-ml-px block border-l border-transparent pl-4 text-gray-600 hover:border-primary-700 hover:text-primary-700 dark:text-gray-400 dark:hover:text-primary-300">
                    {i + 1}. {s.heading}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </aside>

        {/* Sections */}
        <article className="lg:col-span-9">
          <div className="max-w-3xl divide-y divide-gray-100 dark:divide-dark-800">
            {sections.map((s, i) => (
              <section key={s.heading} id={slug(s.heading)} className="scroll-mt-28 py-8 first:pt-0">
                <h2 className="flex items-baseline gap-3 font-display text-2xl text-gray-900 dark:text-white">
                  <span className="text-base text-[#a07c3b]">{String(i + 1).padStart(2, '0')}</span>
                  {s.heading}
                </h2>
                <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-gray-700 dark:text-gray-300 [&_a]:font-medium [&_a]:text-primary-700 dark:[&_a]:text-primary-300 [&_li]:pl-1 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_strong]:text-gray-900 dark:[&_strong]:text-white [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
                  {s.body}
                </div>
              </section>
            ))}
          </div>

          {/* Help card */}
          <div className="mt-6 max-w-3xl rounded-2xl border border-[#e6dccb] bg-[#faf6ee] p-6 dark:border-dark-700 dark:bg-dark-900 sm:p-8">
            <h2 className="font-display text-2xl text-gray-900 dark:text-white">Need help?</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {BUSINESS.tradeName} ({BUSINESS.brand}), {BUSINESS.city}. We reply Monday to Saturday, 9am–6pm.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center rounded-xl bg-[#25D366] px-5 py-3 text-sm font-semibold text-white hover:bg-[#1fb658]">
                WhatsApp {BUSINESS.phone}
              </a>
              <a href={`tel:${BUSINESS.phone.replace(/\s/g, '')}`}
                className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-800 hover:border-primary-700 dark:border-dark-600 dark:bg-dark-800 dark:text-gray-200">
                Call us
              </a>
              <a href={`mailto:${BUSINESS.email}`}
                className="inline-flex items-center break-all rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-800 hover:border-primary-700 dark:border-dark-600 dark:bg-dark-800 dark:text-gray-200">
                {BUSINESS.email}
              </a>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
