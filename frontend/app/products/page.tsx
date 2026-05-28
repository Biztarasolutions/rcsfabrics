'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { productApi } from '@/lib/api';
import ProductCard from '@/components/products/ProductCard';
import ProductFilters from '@/components/products/ProductFilters';

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
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const page = searchParams.get('page') || '1';

  const { data, isLoading, isError } = useQuery({
    queryKey: ['products', { search, category, sort, minPrice, maxPrice, page }],
    queryFn: () => productApi.getAll({
      search, category, sort,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      page: Number(page),
      limit: 12,
    }).then(res => res.data.data),
  });

  const products = data?.products || [];
  const pagination = data;

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    if (key !== 'page') params.delete('page'); // Reset page on filter change
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-dark-950">
      {/* Page Header */}
      <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-primary-50/30 dark:border-dark-800 dark:bg-dark-900">
        <div className="container-main py-8">
          <h1 className="font-display text-4xl font-bold text-gray-900 dark:text-white">
            {category ? category.charAt(0).toUpperCase() + category.slice(1) : 'All Fabrics'}
          </h1>
          {search && <p className="mt-1 text-gray-600 dark:text-gray-400">Results for "<strong>{search}</strong>"</p>}
          <p className="mt-1 text-sm text-gray-500">
            {isLoading ? 'Loading fabrics...' : `${pagination?.total || 0} fabrics available`}
          </p>
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
                {isLoading ? '...' : pagination?.total || 0} results
                {category && <span className="ml-1">in <strong className="text-gray-700 dark:text-gray-300">{category}</strong></span>}
              </p>
              <div className="flex items-center gap-3">
                <select value={sort} onChange={(e) => updateParam('sort', e.target.value)}
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-dark-700 dark:bg-dark-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20">
                  {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
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

            {/* Loading / Error States */}
            {isLoading && (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-gray-100 dark:bg-dark-800" />
                ))}
              </div>
            )}

            {isError && (
              <div className="py-24 text-center text-red-500">
                <p>Failed to load fabrics. Please try again later.</p>
              </div>
            )}

            {/* Products Grid */}
            {!isLoading && products.length === 0 ? (
              <>
                {(() => { console.log('No products found. Data:', data, 'Products:', products); return null; })()}
                <div className="py-24 text-center">
                  <p className="text-6xl">🧵</p>
                  <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">No fabrics found</h3>
                  <button onClick={() => router.push('/products')} className="button-primary mt-6 px-6 py-3">Clear Filters</button>
                </div>
              </>
            ) : (
              <>
                <motion.div
                  className={view === 'grid' ? 'grid gap-5 sm:grid-cols-2 xl:grid-cols-3' : 'flex flex-col gap-4'}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                  {products.map((product: any, i: number) => (
                    <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}>
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
                </motion.div>

                {/* Pagination */}
                {pagination && pagination.pages > 1 && (
                  <div className="mt-12 flex justify-center gap-2">
                    {[...Array(pagination.pages)].map((_, i) => (
                      <button key={i} onClick={() => updateParam('page', String(i + 1))}
                        className={`h-10 w-10 rounded-xl font-semibold transition-colors ${Number(page) === i + 1 ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-dark-800 dark:text-gray-400 dark:hover:bg-dark-700 border border-gray-100 dark:border-dark-700'}`}>
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </>
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
