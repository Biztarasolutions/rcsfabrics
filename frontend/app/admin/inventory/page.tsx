'use client';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import toast from 'react-hot-toast';
import Image from 'next/image';

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'low'>('all');
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [adjustValue, setAdjustValue] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [search, setSearch] = useState('');

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['admin-inventory', filter],
    queryFn: () => adminApi.getInventory({ lowStock: filter === 'low' }).then(r => r.data.data),
    refetchInterval: 30000,
  });

  const adjustMutation = useMutation({
    mutationFn: ({ id, delta, reason }: { id: string; delta: number; reason: string }) =>
      adminApi.adjustStock(id, delta, reason),
    onSuccess: (_, vars) => {
      toast.success(`Stock updated`);
      queryClient.invalidateQueries({ queryKey: ['admin-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setAdjustingId(null);
      setAdjustValue('');
      setAdjustReason('');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update stock'),
  });

  const filtered = products.filter((p: any) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku || '').toLowerCase().includes(search.toLowerCase())
  );

  const lowCount = products.filter((p: any) => p.totalStock <= 10).length;
  const outCount = products.filter((p: any) => p.totalStock <= 0).length;

  const handleAdjust = (product: any) => {
    const delta = parseFloat(adjustValue);
    if (isNaN(delta) || delta === 0) { toast.error('Enter a non-zero number'); return; }
    adjustMutation.mutate({ id: product.id, delta, reason: adjustReason });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Stock levels update automatically when orders are placed.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total SKUs', value: products.length, icon: '🧵', color: 'bg-blue-50 dark:bg-blue-950/20' },
          { label: 'Low Stock (≤10m)', value: lowCount, icon: '⚠️', color: lowCount > 0 ? 'bg-yellow-50 dark:bg-yellow-950/20' : 'bg-gray-50 dark:bg-dark-800' },
          { label: 'Out of Stock', value: outCount, icon: '🚫', color: outCount > 0 ? 'bg-red-50 dark:bg-red-950/20' : 'bg-gray-50 dark:bg-dark-800' },
          { label: 'Total Stock (m)', value: products.reduce((s: number, p: any) => s + p.totalStock, 0).toFixed(1), icon: '📦', color: 'bg-green-50 dark:bg-green-950/20' },
        ].map((c) => (
          <div key={c.label} className={`rounded-2xl border border-gray-100 dark:border-dark-700 p-4 ${c.color}`}>
            <p className="text-2xl">{c.icon}</p>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{c.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Filters & search */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search product or SKU..."
            className="input-field pl-9 py-2 text-sm w-full"/>
        </div>
        <div className="flex rounded-xl border border-gray-200 dark:border-dark-700 overflow-hidden">
          {(['all', 'low'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${filter === f ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 dark:bg-dark-800 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-700'}`}>
              {f === 'all' ? 'All Products' : `Low Stock (${lowCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-dark-700 dark:bg-dark-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="border-b border-gray-100 dark:border-dark-700 bg-gray-50 dark:bg-dark-700/50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Current Stock</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Recent Orders</th>
                <th className="px-4 py-3 text-right">Adjust Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-dark-700">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4 py-4">
                      <div className="h-4 w-full animate-pulse rounded bg-gray-100 dark:bg-dark-700"/>
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">No products found.</td>
                </tr>
              ) : (
                filtered.map((product: any) => {
                  const stock = product.totalStock;
                  const isOut = stock <= 0;
                  const isLow = stock > 0 && stock <= 10;
                  const isAdjusting = adjustingId === product.id;

                  return (
                    <tr key={product.id} className={`hover:bg-gray-50 dark:hover:bg-dark-700/30 transition-colors ${isOut ? 'bg-red-50/30 dark:bg-red-950/10' : isLow ? 'bg-yellow-50/30 dark:bg-yellow-950/10' : ''}`}>
                      {/* Product */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-dark-700">
                            {product.images?.[0]?.url ? (
                              <Image src={product.images[0].url} alt={product.name} fill sizes="40px" className="object-cover"/>
                            ) : <span className="flex h-full items-center justify-center text-lg">🧵</span>}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white text-sm">{product.name}</p>
                            {product.sku && <p className="text-xs text-gray-400">{product.sku}</p>}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">{product.category?.name || '—'}</td>

                      {/* Stock */}
                      <td className="px-4 py-3">
                        <span className={`text-lg font-bold ${isOut ? 'text-red-600 dark:text-red-400' : isLow ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-900 dark:text-white'}`}>
                          {stock}m
                        </span>
                      </td>

                      {/* Status badge */}
                      <td className="px-4 py-3">
                        {isOut ? (
                          <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 dark:bg-red-950/30 dark:text-red-400">Out of Stock</span>
                        ) : isLow ? (
                          <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-semibold text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400">Low Stock</span>
                        ) : (
                          <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700 dark:bg-green-950/30 dark:text-green-400">In Stock</span>
                        )}
                      </td>

                      {/* Recent deductions */}
                      <td className="px-4 py-3">
                        {product.orderItems?.length > 0 ? (
                          <div className="space-y-0.5">
                            {product.orderItems.slice(0, 3).map((item: any, i: number) => (
                              <p key={i} className="text-xs text-gray-500 dark:text-gray-400">
                                −{item.quantity}m · {item.order.orderNumber} · <span className="capitalize">{item.order.status.toLowerCase()}</span>
                              </p>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">No orders yet</span>
                        )}
                      </td>

                      {/* Adjust */}
                      <td className="px-4 py-3 text-right">
                        {isAdjusting ? (
                          <div className="flex items-center justify-end gap-2">
                            <div className="flex flex-col gap-1 items-end">
                              <input type="number" step="0.5" value={adjustValue}
                                onChange={(e) => setAdjustValue(e.target.value)}
                                placeholder="+10 or -5"
                                className="w-24 rounded-lg border border-gray-200 px-2 py-1 text-sm text-center dark:border-dark-600 dark:bg-dark-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                                autoFocus/>
                              <input type="text" value={adjustReason}
                                onChange={(e) => setAdjustReason(e.target.value)}
                                placeholder="Reason (optional)"
                                className="w-36 rounded-lg border border-gray-200 px-2 py-1 text-xs dark:border-dark-600 dark:bg-dark-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30"/>
                            </div>
                            <div className="flex flex-col gap-1">
                              <button onClick={() => handleAdjust(product)}
                                disabled={adjustMutation.isPending}
                                className="rounded-lg bg-primary-600 px-3 py-1 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
                                Save
                              </button>
                              <button onClick={() => { setAdjustingId(null); setAdjustValue(''); setAdjustReason(''); }}
                                className="rounded-lg border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 dark:border-dark-600 dark:text-gray-400">
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => setAdjustingId(product.id)}
                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-dark-600 dark:text-gray-300 dark:hover:bg-dark-700 transition-colors">
                            Adjust
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
        Stock auto-refreshes every 30 seconds. Use positive numbers to add stock (+10), negative to remove (−5).
      </p>
    </div>
  );
}
