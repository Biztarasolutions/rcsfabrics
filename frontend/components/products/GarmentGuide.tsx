'use client';
import React from 'react';
import { garmentsFor } from '@/lib/garments';

/** "What can I make?" — suggested lengths per garment, with one-tap add to cart. */
export default function GarmentGuide({
  bestFor,
  width,
  stock,
  onAdd,
}: {
  bestFor?: string[] | null;
  width?: number | null;
  stock: number;
  onAdd: (metres: number, garment: string) => void;
}) {
  const { items, widthLabel } = garmentsFor(bestFor, width);
  if (!items.length || stock <= 0) return null;

  return (
    <div className="rounded-2xl border border-[#e6dccb] bg-[#faf6ee] p-5 dark:border-dark-700 dark:bg-dark-900">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-lg text-gray-900 dark:text-white">What can I make?</h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">for {widthLabel} wide fabric</span>
      </div>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {items.map((g) => {
          const enough = stock >= g.metres;
          return (
            <li key={g.key} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3.5 py-2.5 dark:bg-dark-800">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{g.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">about {g.metres} m</p>
              </div>
              <button
                type="button"
                disabled={!enough}
                onClick={() => onAdd(g.metres, g.name)}
                title={enough ? `Add ${g.metres} m to cart` : `Only ${stock} m in stock`}
                className="shrink-0 rounded-lg border border-primary-700 px-3 py-1.5 text-xs font-semibold text-primary-700 transition-colors hover:bg-primary-700 hover:text-white disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400 disabled:hover:bg-transparent dark:border-primary-400 dark:text-primary-300"
              >
                {enough ? `Add ${g.metres} m` : 'Low stock'}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
        Approximate, for an average adult size with a simple design. Add about 0.5 m for larger sizes, long sleeves or
        flared styles — or ask your tailor or us on WhatsApp.
      </p>
    </div>
  );
}
