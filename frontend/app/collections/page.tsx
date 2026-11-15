'use client';
import React from 'react';
import Link from 'next/link';
import { useCollections } from '@/hooks/useCollections';
import CollectionCard from '@/components/collections/CollectionCard';

export default function CollectionsPage() {
  const { collections, isLoading } = useCollections();

  return (
    <div className="min-h-screen bg-white dark:bg-dark-950">
      <header className="border-b border-[#e6dccb] bg-[#faf6ee] dark:border-dark-800 dark:bg-dark-900">
        <div className="container-main py-12 sm:py-16">
          <nav aria-label="Breadcrumb" className="text-sm text-gray-500 dark:text-gray-400">
            <Link href="/" className="hover:text-primary-700">Home</Link><span className="mx-2 text-gray-300">/</span>Collections
          </nav>
          <p className="mt-6 section-tag">Curated by the family</p>
          <h1 className="mt-3 font-display text-4xl text-gray-900 dark:text-white sm:text-5xl">Collections</h1>
          <p className="mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
            Fabrics grouped by what you want to make — so you can find the right one faster.
          </p>
        </div>
      </header>
      <div className="container-main py-12 sm:py-16">
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => <div key={i} className="h-72 animate-pulse rounded-2xl bg-gray-100 dark:bg-dark-800" />)}
          </div>
        ) : collections.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((c) => <CollectionCard key={c.slug} c={c} />)}
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">New collections are coming soon. <Link href="/products" className="font-semibold text-primary-700">Browse all fabrics →</Link></p>
        )}
      </div>
    </div>
  );
}
