'use client';
import React, { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { ROLE_LABEL, type Role } from '@/lib/roles';

// Everything that happens in the shop and the admin panel, newest first.
const FILTERS = [
  { key: 'ALL', label: 'Everything' },
  { key: 'Order', label: 'Orders & payments' },
  { key: 'Product', label: 'Products & stock' },
  { key: 'Category', label: 'Categories' },
  { key: 'Banner', label: 'Banners' },
  { key: 'Coupon', label: 'Coupons' },
  { key: 'User', label: 'Customers & roles' },
];

const ACTION_STYLE: Record<string, { dot: string; label: string }> = {
  ORDER_PLACED: { dot: 'bg-emerald-500', label: 'Order placed' },
  PAYMENT_RECEIVED: { dot: 'bg-emerald-600', label: 'Payment' },
  ORDER_UPDATED: { dot: 'bg-sky-500', label: 'Order update' },
  ORDER_CANCELLED: { dot: 'bg-red-500', label: 'Cancelled' },
  PRODUCT_ADDED: { dot: 'bg-primary-600', label: 'Product added' },
  PRODUCT_UPDATED: { dot: 'bg-amber-500', label: 'Product edited' },
  PRODUCT_REMOVED: { dot: 'bg-red-500', label: 'Product removed' },
  STOCK_ADJUSTED: { dot: 'bg-amber-600', label: 'Stock' },
  ROLE_CHANGED: { dot: 'bg-violet-500', label: 'Role change' },
  CUSTOMER_SIGNED_UP: { dot: 'bg-teal-500', label: 'New customer' },
};
const styleFor = (a: string) =>
  ACTION_STYLE[a] || { dot: a.endsWith('_REMOVED') ? 'bg-red-500' : a.endsWith('_ADDED') ? 'bg-primary-600' : 'bg-gray-400', label: a.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase()) };

const dayKey = (d: string) => new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const time = (d: string) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

export default function AdminHistoryPage() {
  const [entity, setEntity] = useState('ALL');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['admin-history', entity, search],
    queryFn: ({ pageParam }) =>
      adminApi.getHistory({ page: pageParam, limit: 50, entity, q: search || undefined }).then((r) => r.data.data),
    initialPageParam: 1,
    getNextPageParam: (last: any) => (last.page < last.pages ? last.page + 1 : undefined),
    refetchInterval: 60 * 1000,
  });

  const items: any[] = data?.pages.flatMap((p: any) => p.items) || [];
  const total = data?.pages[0]?.total ?? 0;

  // group by day
  const groups: { day: string; rows: any[] }[] = [];
  for (const it of items) {
    const day = dayKey(it.createdAt);
    const g = groups[groups.length - 1];
    if (g && g.day === day) g.rows.push(it);
    else groups.push({ day, rows: [it] });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">History</h2>
        <p className="text-sm text-gray-500">
          Everything happening in the shop — orders, payments, products, stock and team changes — with date and time.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button key={f.key} type="button" onClick={() => setEntity(f.key)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${entity === f.key ? 'border-primary-700 bg-primary-700 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-primary-300 dark:border-dark-600 dark:bg-dark-800 dark:text-gray-300'}`}>
            {f.label}
          </button>
        ))}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); setSearch(q.trim()); }} className="flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search: product name, order number, customer or team member…"
          className="input-field flex-1 py-2.5" />
        <button type="submit" className="button-primary px-5 py-2.5 text-sm">Search</button>
        {search && <button type="button" onClick={() => { setQ(''); setSearch(''); }} className="rounded-xl px-4 text-sm text-gray-500 hover:text-gray-800">Clear</button>}
      </form>

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-dark-700 dark:bg-dark-800">
        {isLoading ? (
          <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" /></div>
        ) : isError ? (
          <p className="py-16 text-center text-sm text-red-600">Could not load history. Please refresh.</p>
        ) : items.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-semibold text-gray-900 dark:text-white">Nothing recorded yet</p>
            <p className="mt-1 text-sm text-gray-500">New orders, payments and changes made in the admin panel will show up here.</p>
          </div>
        ) : (
          <div>
            <p className="border-b border-gray-100 px-5 py-3 text-xs text-gray-500 dark:border-dark-700">{total} {total === 1 ? 'event' : 'events'}</p>
            {groups.map((g) => (
              <section key={g.day}>
                <h3 className="sticky top-0 z-[1] border-b border-gray-100 bg-gray-50 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-dark-700 dark:bg-dark-900 dark:text-gray-400">{g.day}</h3>
                <ul className="divide-y divide-gray-50 dark:divide-dark-700">
                  {g.rows.map((it) => {
                    const st = styleFor(it.action);
                    return (
                      <li key={it.id} className="flex gap-4 px-5 py-3.5">
                        <div className="w-14 shrink-0 pt-0.5 text-xs font-medium tabular-nums text-gray-500">{time(it.createdAt)}</div>
                        <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${st.dot}`} aria-hidden="true" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-gray-900 dark:text-gray-100">{it.summary}</p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            <span className="font-medium">{st.label}</span>
                            {it.actorName && <> · by {it.actorName}{it.actorRole ? ` (${ROLE_LABEL[it.actorRole as Role] || it.actorRole})` : ''}</>}
                            {' · '}{new Date(it.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
            {hasNextPage && (
              <div className="border-t border-gray-100 p-4 text-center dark:border-dark-700">
                <button type="button" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}
                  className="rounded-xl border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-700 hover:border-primary-700 hover:text-primary-700 disabled:opacity-50 dark:border-dark-600 dark:text-gray-200">
                  {isFetchingNextPage ? 'Loading…' : 'Show older'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
