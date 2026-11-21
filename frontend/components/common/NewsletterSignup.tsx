'use client';

import React from 'react';
import { BUSINESS } from '@/lib/business';

// "RCS Fabrics Club" — customers ask to join the WhatsApp group; the request
// arrives in the shop's WhatsApp as a ready-typed message.
const JOIN_MESSAGE =
  'Hi! I would like to join the WhatsApp group to get updated with latest stock and pricing.';

const PERKS = [
  { title: 'New stock first', text: 'Photos of fresh arrivals the day they land in the shop.' },
  { title: 'Latest pricing', text: 'Current rates and any special offers, shared directly with members.' },
  { title: 'Ask anytime', text: 'Reply in the chat to check a colour, length or availability.' },
];

const WaIcon = ({ className = 'h-5 w-5' }: { className?: string }) => (
  <svg className={`${className} fill-current`} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export default function NewsletterSignup() {
  const href = `${BUSINESS.whatsapp}?text=${encodeURIComponent(JOIN_MESSAGE)}`;

  return (
    <section id="club" className="scroll-mt-24 bg-[#faf6ee] py-16 dark:bg-dark-900 lg:py-24" aria-labelledby="club-title">
      <div className="container-main">
        <div className="grid items-center gap-10 overflow-hidden rounded-3xl border border-[#e6dccb] bg-white p-8 dark:border-dark-700 dark:bg-dark-800 sm:p-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <span className="section-tag">RCS Fabrics Club · on WhatsApp</span>
            <h2 id="club-title" className="mt-3 font-display text-3xl leading-tight text-gray-900 dark:text-white sm:text-4xl">
              Join the RCS Fabrics Club
            </h2>
            <p className="mt-4 text-base leading-relaxed text-gray-600 dark:text-gray-300 sm:text-lg">
              Get our latest stock and pricing straight on WhatsApp. Tap the button to send a request — we'll add you
              to the club group.
            </p>

            <a href={href} target="_blank" rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2.5 rounded-xl bg-[#25D366] px-7 py-4 text-base font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#1fb658] active:scale-95">
              <WaIcon />
              Request to join on WhatsApp
            </a>
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              Opens WhatsApp with your request ready to send. Free to join — leave the group anytime.
            </p>
          </div>

          <div className="space-y-4">
            {/* What the request looks like */}
            <div className="rounded-2xl bg-[#ece5dd] p-4 dark:bg-dark-900">
              <p className="text-center text-[11px] font-medium uppercase tracking-wider text-gray-500">Your request</p>
              <div className="ml-auto mt-3 max-w-[90%] rounded-xl rounded-tr-sm bg-[#d9fdd3] px-4 py-2.5 text-sm text-gray-800 shadow-sm">
                {JOIN_MESSAGE}
              </div>
            </div>

            <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-100 dark:divide-dark-700 dark:border-dark-700">
              {PERKS.map((p) => (
                <li key={p.title} className="flex gap-3 px-5 py-4">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#c9a24e]" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{p.title}</p>
                    <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">{p.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
