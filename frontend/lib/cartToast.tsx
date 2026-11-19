'use client';

import React from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

/**
 * "Added to cart" pop-up with buttons to go straight to the cart or checkout,
 * shown at the bottom of the screen so customers don't have to scroll up to the
 * header cart icon.
 */
export function cartAddedToast(message: string) {
  toast.custom(
    (t) => (
      <div
        className={`pointer-events-auto w-[calc(100vw-32px)] max-w-sm rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl transition-all dark:border-dark-700 dark:bg-dark-800 ${
          t.visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
        }`}
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
          </span>
          <p className="flex-1 text-sm font-medium text-gray-900 dark:text-white">{message}</p>
          <button onClick={() => toast.dismiss(t.id)} aria-label="Close" className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="rounded-xl border border-gray-300 px-3 py-2.5 text-sm font-semibold text-gray-700 hover:border-primary-700 dark:border-dark-600 dark:text-gray-200"
          >
            Keep shopping
          </button>
          <Link
            href="/cart"
            onClick={() => toast.dismiss(t.id)}
            className="button-primary justify-center px-3 py-2.5 text-center text-sm"
          >
            Go to cart →
          </Link>
        </div>
      </div>
    ),
    { id: 'cart-added', duration: 6000, position: 'bottom-center' }
  );
}
