'use client';
import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 text-center dark:bg-dark-950">
      <div className="animate-float">
        <p className="text-9xl font-black text-gradient font-display">404</p>
      </div>
      <h1 className="mt-4 font-display text-3xl font-bold text-gray-900 dark:text-white">
        Page Not Found
      </h1>
      <p className="mt-3 max-w-md text-gray-500 dark:text-gray-400">
        Looks like this thread led nowhere. The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="button-primary px-8 py-3">
          ← Back to Home
        </Link>
        <Link href="/products" className="button-secondary px-8 py-3">
          Browse Fabrics
        </Link>
      </div>
      <p className="mt-8 text-sm text-gray-400">
        Need help? <Link href="/contact" className="text-primary-600 hover:underline dark:text-primary-400">Contact us</Link>
      </p>
    </div>
  );
}
