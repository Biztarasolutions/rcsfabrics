'use client';

import React from 'react';
import Link from 'next/link';

export default function EmptyCart() {
  return (
    <div className="text-center py-16">
      <svg
        className="w-24 h-24 mx-auto text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
        />
      </svg>
      <h2 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">
        Your cart is empty
      </h2>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        Start shopping to add items to your cart
      </p>
      <Link href="/products">
        <button className="button-primary mt-8 px-8 py-3">
          Continue Shopping
        </button>
      </Link>
    </div>
  );
}
