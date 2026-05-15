'use client';

import React from 'react';

export default function RelatedProducts() {
  return (
    <section className="border-t border-gray-200 bg-gray-50 py-16 dark:border-dark-700 dark:bg-dark-800 lg:py-24">
      <div className="container-main">
        <h2 className="font-display text-4xl font-bold">Related Products</h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-lg border border-gray-200 bg-white p-4 dark:border-dark-700 dark:bg-dark-900"
            >
              <div className="h-48 animate-pulse rounded bg-gray-200 dark:bg-dark-700" />
              <div className="mt-4 space-y-2">
                <div className="h-4 animate-pulse rounded bg-gray-200 dark:bg-dark-700" />
                <div className="h-4 animate-pulse rounded bg-gray-200 w-3/4 dark:bg-dark-700" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
