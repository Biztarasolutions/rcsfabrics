'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import ProductCard from '@/components/products/ProductCard';
import ProductFilters from '@/components/products/ProductFilters';

const ALL_PRODUCTS = [
  { id: '1', name: 'Royal Banarasi Silk', slug: 'royal-banarasi-silk', basePrice: 1850, discountPrice: 1499, material: 'Silk', gsm: 120, color: 'Deep Maroon', stretchability: 'Non-Stretch', totalStock: 45, minOrderQty: 0.5, rating: 4.8, ratingCount: 124, isFeatured: true, isNew: false, isActive: true, createdAt: '2025-01-01', category: { name: 'Silks', slug: 'silks' }, images: [{ id: '1i', url: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&q=80', isMain: true, order: 1 }] },
  { id: '2', name: 'Premium Egyptian Cotton', slug: 'premium-egyptian-cotton', basePrice: 680, material: 'Cotton', gsm: 180, color: 'Ivory White', stretchability: 'Slight Stretch', totalStock: 200, minOrderQty: 1, rating: 4.6, ratingCount: 89, isFeatured: true, isNew: true, isActive: true, createdAt: '2025-02-01', category: { name: 'Cottons', slug: 'cottons' }, images: [{ id: '2i', url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&q=80', isMain: true, order: 1 }] },
  { id: '3', name: 'French Linen Blend', slug: 'french-linen-blend', basePrice: 1200, discountPrice: 980, material: 'Linen', gsm: 200, color: 'Natural Beige', stretchability: 'Non-Stretch', totalStock: 80, minOrderQty: 0.5, rating: 4.7, ratingCount: 56, isFeatured: true, isNew: true, isActive: true, createdAt: '2025-03-01', category: { name: 'Blends', slug: 'blends' }, images: [{ id: '3i', url: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=600&q=80', isMain: true, order: 1 }] },
  { id: '4', name: 'Italian Velvet', slug: 'italian-velvet', basePrice: 2400, material: 'Velvet', gsm: 350, color: 'Midnight Blue', stretchability: 'Slight Stretch', totalStock: 30, minOrderQty: 0.5, rating: 4.9, ratingCount: 38, isFeatured: true, isNew: false, isActive: true, createdAt: '2025-01-15', category: { name: 'Velvets', slug: 'velvets' }, images: [{ id: '4i', url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80', isMain: true, order: 1 }] },
  { id: '5', name: 'Pure Kanjivaram Silk', slug: 'pure-kanjivaram-silk', basePrice: 3200, discountPrice: 2750, material: 'Silk', gsm: 160, color: 'Emerald Green', stretchability: 'Non-Stretch', totalStock: 25, minOrderQty: 0.5, rating: 5.0, ratingCount: 234, isFeatured: true, isNew: false, isActive: true, createdAt: '2025-01-05', category: { name: 'Silks', slug: 'silks' }, images: [{ id: '5i', url: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=600&q=80', isMain: true, order: 1 }] },
  { id: '6', name: 'Georgette Chiffon', slug: 'georgette-chiffon', basePrice: 750, material: 'Chiffon', gsm: 80, color: 'Blush Pink', stretchability: 'Slight Stretch', totalStock: 150, minOrderQty: 0.5, rating: 4.7, ratingCount: 203, isFeatured: false, isNew: false, isActive: true, createdAt: '2025-02-10', category: { name: 'Chiffons', slug: 'chiffons' }, images: [{ id: '6i', url: 'https://images.unsplash.com/photo-1519659528534-7fd733a832a0?w=600&q=80', isMain: true, order: 1 }] },
  { id: '7', name: 'Satin Charmeuse', slug: 'satin-charmeuse', basePrice: 1100, discountPrice: 899, material: 'Satin', gsm: 100, color: 'Pearl White', stretchability: 'Slight Stretch', totalStock: 70, minOrderQty: 0.5, rating: 4.8, ratingCount: 156, isFeatured: false, isNew: true, isActive: true, createdAt: '2025-04-01', category: { name: 'Satins', slug: 'satins' }, images: [{ id: '7i', url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80', isMain: true, order: 1 }] },
  { id: '8', name: 'Handloom Khadi', slug: 'handloom-khadi', basePrice: 450, material: 'Khadi', gsm: 140, color: 'Off White', stretchability: 'Non-Stretch', totalStock: 300, minOrderQty: 1, rating: 4.5, ratingCount: 78, isFeatured: false, isNew: false, isActive: true, createdAt: '2025-01-20', category: { name: 'Cottons', slug: 'cottons' }, images: [{ id: '8i', url: 'https://images.unsplash.com/photo-1603251579431-8041402bdeda?w=600&q=80', isMain: true, order: 1 }] },
  { id: '9', name: 'Mysore Crepe Silk', slug: 'mysore-crepe-silk', basePrice: 1650, material: 'Silk', gsm: 130, color: 'Rose Gold', stretchability: 'Slight Stretch', totalStock: 60, minOrderQty: 0.5, rating: 4.7, ratingCount: 42, isFeatured: false, isNew: true, isActive: true, createdAt: '2025-05-01', category: { name: 'Silks', slug: 'silks' }, images: [{ id: '9i', url: 'https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?w=600&q=80', isMain: true, order: 1 }] },
];

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest First' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
];

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = React.useState<'grid' | 'list'>('grid');

  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'featured';
  const minPrice = Number(searchParams.get('minPrice') || 0);
  const maxPrice = Number(searchParams.get('maxPrice') || 10000);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    router.push(`/products?${params.toString()}`);
  };

  let filtered = ALL_PRODUCTS.filter((p) => {
    if (category && p.category.slug !== category) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.material.toLowerCase().includes(search.toLowerCase())) return false;
    const price = p.discountPrice || p.basePrice;
    if (minPrice && price < minPrice) return false;
    if (maxPrice && price > maxPrice) return false;
    return true;
  });

  if (sort === 'newest') filtered = [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  if (sort === 'price-asc') filtered = [...filtered].sort((a, b) => (a.discountPrice || a.basePrice) - (b.discountPrice || b.basePrice));
  if (sort === 'price-desc') filtered = [...filtered].sort((a, b) => (b.discountPrice || b.basePrice) - (a.discountPrice || a.basePrice));
  if (sort === 'rating') filtered = [...filtered].sort((a, b) => b.rating - a.rating);

  return (
    <div className="min-h-screen bg-white dark:bg-dark-950">
      {/* Page Header */}
      <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-primary-50/30 dark:border-dark-800 dark:bg-dark-900">
        <div className="container-main py-8">
          <h1 className="font-display text-4xl font-bold text-gray-900 dark:text-white">
            {category ? category.charAt(0).toUpperCase() + category.slice(1) : 'All Fabrics'}
          </h1>
          {search && <p className="mt-1 text-gray-600 dark:text-gray-400">Results for "<strong>{search}</strong>"</p>}
          <p className="mt-1 text-sm text-gray-500">{filtered.length} fabrics available</p>
        </div>
      </div>

      <div className="container-main py-8">
        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <aside className="hidden w-64 shrink-0 lg:block">
            <ProductFilters
              selectedCategory={category}
              onCategoryChange={(v) => updateParam('category', v)}
              onPriceChange={(min, max) => { updateParam('minPrice', String(min)); updateParam('maxPrice', String(max)); }}
            />
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="mb-6 flex items-center justify-between gap-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {filtered.length} results
                {category && <span className="ml-1">in <strong className="text-gray-700 dark:text-gray-300">{category}</strong></span>}
              </p>
              <div className="flex items-center gap-3">
                {/* Sort */}
                <select value={sort} onChange={(e) => updateParam('sort', e.target.value)}
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-dark-700 dark:bg-dark-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20">
                  {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {/* Grid/List toggle */}
                <div className="flex rounded-xl border border-gray-200 dark:border-dark-700 overflow-hidden">
                  <button onClick={() => setView('grid')} className={`p-2 transition-colors ${view === 'grid' ? 'bg-primary-600 text-white' : 'bg-white text-gray-500 dark:bg-dark-800 dark:text-gray-400'}`} aria-label="Grid view">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
                  </button>
                  <button onClick={() => setView('list')} className={`p-2 transition-colors ${view === 'list' ? 'bg-primary-600 text-white' : 'bg-white text-gray-500 dark:bg-dark-800 dark:text-gray-400'}`} aria-label="List view">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Active filters */}
            {(category || search) && (
              <div className="mb-4 flex flex-wrap gap-2">
                {category && (
                  <span className="flex items-center gap-1.5 rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                    {category}
                    <button onClick={() => updateParam('category', '')} className="ml-1 hover:text-primary-900">✕</button>
                  </span>
                )}
                {search && (
                  <span className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 dark:bg-dark-700 dark:text-gray-300">
                    "{search}"
                    <button onClick={() => updateParam('search', '')} className="ml-1 hover:text-gray-900">✕</button>
                  </span>
                )}
              </div>
            )}

            {/* Products */}
            {filtered.length === 0 ? (
              <div className="py-24 text-center">
                <p className="text-6xl">🧵</p>
                <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">No fabrics found</h3>
                <p className="mt-2 text-gray-500">Try adjusting your filters or search term.</p>
                <button onClick={() => router.push('/products')} className="button-primary mt-6 px-6 py-3">Clear Filters</button>
              </div>
            ) : (
              <motion.div
                className={view === 'grid' ? 'grid gap-5 sm:grid-cols-2 xl:grid-cols-3' : 'flex flex-col gap-4'}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                {filtered.map((product, i) => (
                  <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}>
                    <ProductCard product={product as any} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent"/></div>}>
      <ProductsContent />
    </Suspense>
  );
}
