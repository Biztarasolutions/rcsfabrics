'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { useAllProducts } from '@/hooks/useCollections';
import { collectionsWithProducts, coverImage, findCollection } from '@/lib/collections';
import { supabaseImg } from '@/lib/image';
import ProductCard from '@/components/products/ProductCard';
import CollectionCard from '@/components/collections/CollectionCard';

export default function CollectionPage({ params }: { params: { slug: string } }) {
  const def = findCollection(params.slug);
  if (!def) notFound();

  const { data: all, isLoading } = useAllProducts();
  const products = (all || []).filter((p: any) => p?.isActive !== false && def!.match(p));
  const others = all ? collectionsWithProducts(all).filter((c) => c.slug !== def!.slug).slice(0, 3) : [];
  const img = coverImage(products);

  return (
    <div className="min-h-screen bg-white dark:bg-dark-950">
      {/* Banner */}
      <section className="relative isolate overflow-hidden bg-[#2b2118]">
        {img && <Image src={supabaseImg(img, 1600, 75, 'cover')} alt="" fill priority sizes="100vw" className="-z-10 object-cover" />}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#1d150e]/90 via-[#1d150e]/60 to-[#1d150e]/20" />
        <div className="container-main py-16 sm:py-24">
          <nav aria-label="Breadcrumb" className="text-sm text-white/70">
            <Link href="/" className="hover:text-white">Home</Link><span className="mx-2">/</span>
            <Link href="/collections" className="hover:text-white">Collections</Link><span className="mx-2">/</span>
            <span className="text-white">{def!.title}</span>
          </nav>
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.22em] text-[#dcbf7c]">RCS Collection</p>
          <h1 className="mt-3 max-w-2xl font-display text-4xl leading-tight text-white sm:text-6xl">{def!.title}</h1>
          <p className="mt-4 max-w-xl text-lg text-white/85">{def!.description}</p>
          {!isLoading && (
            <p className="mt-6 text-sm text-white/70">{products.length} {products.length === 1 ? 'fabric' : 'fabrics'} · sold by the metre</p>
          )}
        </div>
      </section>

      {/* Products */}
      <div className="container-main py-12 sm:py-16">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => <div key={i} className="animate-pulse rounded-2xl bg-gray-100 dark:bg-dark-800" style={{ aspectRatio: '4/6' }} />)}
          </div>
        ) : products.length ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {products.map((p: any, i: number) => <ProductCard key={p.id} product={p} priority={i < 4} />)}
          </div>
        ) : (
          <div className="py-10 text-center">
            <p className="font-display text-2xl text-gray-900 dark:text-white">New fabrics for this collection are on the way.</p>
            <Link href="/fabrics" className="button-primary mt-6 inline-flex px-8 py-3">Browse all fabrics</Link>
          </div>
        )}

        {others.length > 0 && (
          <section className="mt-20">
            <h2 className="font-display text-3xl text-gray-900 dark:text-white">More collections</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((c) => <CollectionCard key={c.slug} c={c} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
