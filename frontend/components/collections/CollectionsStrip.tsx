'use client';
import React from 'react';
import Link from 'next/link';
import { useCollections } from '@/hooks/useCollections';
import CollectionCard from './CollectionCard';

/** Homepage: up to three curated collections */
export default function CollectionsStrip() {
  const { collections } = useCollections();
  if (!collections.length) return null;
  return (
    <section className="py-16 lg:py-20">
      <div className="container-main">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="section-tag">Curated collections</span>
            <h2 className="section-title mt-3 font-display">Shop by what you’re making</h2>
          </div>
          <Link href="/collections" className="text-sm font-semibold text-primary-700 hover:underline dark:text-primary-300">All collections →</Link>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {collections.slice(0, 3).map((c) => <CollectionCard key={c.slug} c={c} large />)}
        </div>
      </div>
    </section>
  );
}
