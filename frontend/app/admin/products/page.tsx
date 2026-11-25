'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
// (removed unused Image import)
import Link from 'next/link';
import ProductFormAdvanced from '@/components/products/ProductFormAdvanced';
import ProductPhotosPanel from '@/components/admin/ProductPhotosPanel';
import { supabaseImg } from '@/lib/image';

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  // '' = all · live · draft · inactive
  const [status, setStatus] = useState('');

  const { data: productsData = { products: [], total: 0, pages: 1 }, isLoading, isError, error } = useQuery({
    queryKey: ['admin-products', search, page, status],
    queryFn: async () => {
        const response = await adminApi.getAdminProducts({ search, page, limit: 50, status: status || undefined });
        const data = response.data;
        // If the API returns an array directly, wrap it to match expected shape
        if (Array.isArray(data)) {
          return { products: data, total: data.length, pages: 1 };
        }
        // Otherwise assume it already contains { products, total }
        return data;
      },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
  const actualData = productsData?.data || productsData;
  const products = actualData?.products || [];
  const noPhotoCount = products.filter((p: any) => !p.images?.length).length;
  const [bigPhoto, setBigPhoto] = useState<string | null>(null);
  // Admin thumbnail: the Raw original if synced, else the main customer photo
  const thumbOf = (p: any): string | null => p.rawImage?.url || p.images?.[0]?.url || null;
  const totalProducts = actualData?.total ?? products.length;
  const totalPages = actualData?.pages ?? 1;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product deleted');
      setDeleteConfirm(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const syncSingleMutation = useMutation({
    mutationFn: (id: string) => adminApi.syncProduct(id),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(res?.data?.message || 'Images synced successfully!');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to sync images'),
  });

  const syncAllMutation = useMutation({
    mutationFn: () => adminApi.syncAllProducts(),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(res?.data?.message || 'All products synced!');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to sync all images'),
  });

  const importMutation = useMutation({
    mutationFn: () => adminApi.importFromDrive(),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      const d = res?.data?.data || {};
      toast.success(res?.data?.message || 'Import finished', { duration: 7000 });
      if (d.created?.length) setStatus('draft');
      if (d.notUnderstood?.length) toast(`Could not read the colour from: ${d.notUnderstood.slice(0, 5).join(', ')}${d.notUnderstood.length > 5 ? '…' : ''} — name the folder like "Polka Dot-White".`, { duration: 10000, icon: '⚠️' });
      if (d.waitingForPhotos?.length) toast(`${d.waitingForPhotos.length} folder(s) skipped — no Fabric photos in them yet.`, { duration: 7000, icon: 'ℹ️' });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Import failed'),
  });

  const liveMutation = useMutation({
    mutationFn: ({ id, live }: { id: string; live: boolean }) => adminApi.setProductLive(id, live),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(res?.data?.message || 'Updated');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message, { duration: 9000 }),
  });

  const handleSyncSingle = (id: string) => {
    syncSingleMutation.mutate(id);
  };

  const handleSyncAll = () => {
    syncAllMutation.mutate();
  };



  // Live: in the shop · Draft: imported, details missing · Inactive: switched off
  const statusOf = (p: any): 'live' | 'draft' | 'inactive' | 'partial' => {
    const vs = p.variants?.length ? p.variants : [p];
    if (vs.some((v: any) => v.isDraft)) return 'draft';
    const live = vs.filter((v: any) => v.isActive).length;
    return live === vs.length ? 'live' : live === 0 ? 'inactive' : 'partial';
  };
  const STATUS_BADGE: Record<string, [string, string]> = {
    live: ['Live', 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'],
    partial: ['Partly live', 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'],
    draft: ['Draft · add details', 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'],
    inactive: ['Inactive', 'bg-gray-100 text-gray-600 dark:bg-dark-700 dark:text-gray-400'],
  };
  const StatusBadge = ({ p }: { p: any }) => {
    const [label, cls] = STATUS_BADGE[statusOf(p)];
    return <span className={`inline-block w-fit rounded px-1.5 py-0.5 text-[10px] font-semibold ${cls}`}>{label}</span>;
  };
  const LiveButton = ({ p, className }: { p: any; className: string }) => {
    const st = statusOf(p);
    const goLive = st !== 'live';
    const busy = liveMutation.isPending && liveMutation.variables?.id === p.id;
    return (
      <button onClick={() => liveMutation.mutate({ id: p.id, live: goLive })} disabled={busy}
        title={goLive ? 'Show this design (all colours) in the shop' : 'Hide this design (all colours) from the shop'}
        className={`${className} ${goLive ? 'border-green-300 bg-green-600 text-white hover:bg-green-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-dark-600 dark:text-gray-300 dark:hover:bg-dark-700'}`}>
        {busy ? '…' : goLive ? 'Make live' : 'Make inactive'}
      </button>
    );
  };

  return (
    <div className="min-w-0 w-full max-w-full space-y-6">
      {/* API error banner */}
      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          Failed to load products: {(error as Error)?.message || 'Unknown error'}. Try refreshing the page.
        </div>
      )}
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h2>
          <p className="text-sm text-gray-500">{totalProducts} fabrics in catalog</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={handleSyncAll} 
            disabled={syncAllMutation.isPending}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-dark-700 dark:bg-dark-800 dark:text-gray-200 dark:hover:bg-dark-700 transition-all active:scale-[0.98]"
          >
            <svg className={`h-4 w-4 text-gray-500 dark:text-gray-400 ${syncAllMutation.isPending ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.228 5.6M22 7h-6v6" />
            </svg>
            {syncAllMutation.isPending ? 'Syncing...' : 'Sync All Images'}
          </button>
          <button onClick={() => importMutation.mutate()} disabled={importMutation.isPending}
            title="Add every new fabric folder from the Drive photoshoot folder (Category / Name-Colour) as a draft"
            className="flex items-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-4 py-2.5 text-sm font-semibold text-primary-700 hover:bg-primary-100 dark:border-primary-900 dark:bg-primary-950/30 dark:text-primary-300">
            {importMutation.isPending ? 'Importing… (can take a minute)' : '⤓ Import from Drive'}
          </button>
          <Link href="/admin/products/create-family" className="button-primary flex items-center gap-2 px-5 py-2.5">
            <span className="text-lg">+</span> Add Product Family
          </Link>
        </div>
      </div>

      {/* Search bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input 
            value={search} 
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} 
            placeholder="Search products..."
            className="input-field pl-9 py-2.5"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[['', 'All'], ['live', 'Live'], ['draft', 'Drafts'], ['inactive', 'Inactive']].map(([v, l]) => (
          <button key={v} onClick={() => { setStatus(v); setPage(1); }}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${status === v ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-200 text-gray-600 hover:border-primary-400 dark:border-dark-600 dark:text-gray-300'}`}>
            {l}
          </button>
        ))}
      </div>
      {status === 'draft' && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-200">
          Drafts were added from Google Drive and are hidden from customers. Press <strong>Edit</strong> to fill in pattern, width, price, discount and stock (and each colour&apos;s swatch), then press <strong>Make live</strong>.
        </p>
      )}

      {noPhotoCount > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-200">
          <strong>{noPhotoCount} {noPhotoCount === 1 ? 'product has' : 'products have'} no photos</strong> on this page and {noPhotoCount === 1 ? 'is' : 'are'} hidden from the shop.
          Check the Google Drive folder is named exactly like the product code and shared with the website, then press <strong>Sync</strong> on the product.
        </div>
      )}

      {/* Mobile: one card per fabric with a large, uncropped photo */}
      <div className="space-y-3 md:hidden">
        {isLoading ? (
          <p className="py-10 text-center text-gray-500">Loading products...</p>
        ) : products.length === 0 ? (
          <p className="py-10 text-center text-gray-500">No products found. Create your first product!</p>
        ) : products.map((product: any) => (
          <div key={product.id} className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-dark-700 dark:bg-dark-800">
            <div className="flex gap-3">
              <button type="button" onClick={() => thumbOf(product) && setBigPhoto(thumbOf(product))}
                className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-[#f4efe7] dark:border-dark-700 dark:bg-dark-700" aria-label="View photo">
                {thumbOf(product) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={supabaseImg(thumbOf(product)!, 300, 75)} alt={product.name} className="h-full w-full object-contain" loading="lazy" />
                )}
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-gray-900 dark:text-white">{product.name}</p>
                <StatusBadge p={product} />
                <p className="text-xs text-gray-500">{product.rcsCode ? `${product.rcsCode.split('-').slice(0, 3).join('-')} · ` : ''}{product.color || ''}{product.variants?.length > 1 ? ` +${product.variants.length - 1} colours` : ''} · {product.category?.name || '—'}</p>
                <p className="mt-1 text-sm">
                  <span className="font-semibold text-gray-900 dark:text-white">{formatPrice(product.discountPrice || product.basePrice)}</span>
                  {product.discountPrice && product.discountPrice < product.basePrice && <span className="ml-1.5 text-xs text-gray-400 line-through">{formatPrice(product.basePrice)}</span>}
                  <span className={`ml-2 text-xs font-semibold ${product.totalStock <= 10 ? 'text-red-600' : 'text-gray-600 dark:text-gray-300'}`}>{product.totalStock}m stock</span>
                </p>
                {product.colors?.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {product.colors.map((c: any, i: number) => (
                      <span key={i} title={c.name} className={`h-4 w-4 rounded-full border border-gray-300 ${(c.stock ?? 0) === 0 ? 'opacity-40' : ''}`} style={{ backgroundColor: c.hexCode }} />
                    ))}
                  </div>
                )}
                {!product.images?.length && (
                  <span className="mt-1.5 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">No photos · hidden from shop</span>
                )}
              </div>
            </div>
            <LiveButton p={product} className="mt-3 w-full rounded-lg border py-2 text-xs font-semibold" />
            <div className="mt-2 grid grid-cols-4 gap-2 text-xs font-medium">
              <button onClick={() => handleSyncSingle(product.id)} disabled={syncSingleMutation.isPending}
                className="rounded-lg border border-blue-200 py-2 text-blue-600 dark:border-blue-900 dark:text-blue-400">
                {syncSingleMutation.variables === product.id && syncSingleMutation.isPending ? 'Syncing…' : 'Sync'}
              </button>
              {product.slug ? (
                <a href={`/fabrics/${product.slug}?preview=1`} target="_blank" rel="noopener noreferrer"
                  className="rounded-lg border border-gray-200 py-2 text-center text-gray-700 dark:border-dark-600 dark:text-gray-300">Preview</a>
              ) : <span />}
              <button onClick={() => { setEditingProduct(product); setShowModal(true); }}
                className="rounded-lg border border-green-200 py-2 text-green-600 dark:border-green-900 dark:text-green-400">Edit</button>
              <button onClick={() => setDeleteConfirm(product.id)}
                className="rounded-lg border border-red-200 py-2 text-red-600 dark:border-red-900 dark:text-red-400">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table — horizontal scroll only inside this card */}
      <div className="hidden min-w-0 w-full max-w-full rounded-2xl border border-gray-200 bg-white dark:border-dark-700 dark:bg-dark-800 md:block">
        <div className="w-full max-w-full overflow-x-auto overflow-y-visible overscroll-x-contain">
          <table className="w-full min-w-[800px] table-fixed text-sm whitespace-nowrap sm:min-w-[1000px]">
            <thead className="border-b border-gray-100 dark:border-dark-700 bg-gray-50 dark:bg-dark-700/50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <th className="w-[22%] px-4 py-3 align-middle text-left">Product</th>
                <th className="w-[15%] px-4 py-3 align-middle text-left">Category</th>
                <th className="w-[10%] px-4 py-3 align-middle text-left">Price</th>
                <th className="w-[12%] px-4 py-3 align-middle text-left">Selling At</th>
                <th className="w-[10%] px-4 py-3 align-middle text-left">Total Stock</th>
                <th className="w-[11%] px-4 py-3 align-middle text-left">Colors</th>
                <th className="w-[20%] px-4 py-3 align-middle text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-dark-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-500">
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-500">
                    No products found. Create your first product!
                  </td>
                </tr>
              ) : (
                products.map((product: any) => (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-dark-700/30 transition-colors">
                    {/* Product Name */}
                    <td className="w-[22%] px-4 py-3.5 align-middle">
                      <div className="flex items-center space-x-2.5">
                        <button type="button" onClick={() => thumbOf(product) && setBigPhoto(thumbOf(product))}
                          title="View photo" className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-[#f4efe7] shadow-sm dark:border-dark-700 dark:bg-dark-700">
                          {thumbOf(product) && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={supabaseImg(thumbOf(product)!, 160, 75)} alt={product.name} className="h-full w-full object-contain" loading="lazy" />
                          )}
                        </button>
                        <div className="flex flex-col min-w-0 leading-tight">
                          <span className="font-bold text-gray-900 dark:text-white truncate block" title={product.name}>
                            {product.name}
                          </span>
                          <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                            {product.rcsCode ? product.rcsCode.split('-').slice(0, 3).join('-') : product.code ? `P${product.code}` : ''} · {product.variants?.length || 1} colour{(product.variants?.length || 1) > 1 ? 's' : ''}
                          </span>
                          <span className="mt-1"><StatusBadge p={product} /></span>
                          {!product.images?.length && (
                            <span className="mt-1 inline-block w-fit rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                              title="Hidden from the shop until photos sync. Check the Google Drive folder name matches the product code, then press Sync.">
                              No photos · hidden from shop
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="w-[15%] px-4 py-3.5 align-middle text-xs">
                      <span className="block truncate text-gray-900 dark:text-white" title={product.category?.name || ''}>
                        {product.category?.name || '—'}
                      </span>
                    </td>

                    <td className="w-[10%] px-4 py-3.5 align-middle text-xs font-semibold text-gray-900 dark:text-white">
                      {product.basePrice ? formatPrice(product.basePrice) : <span className="text-amber-600">Not set</span>}
                    </td>

                    <td className="w-[12%] px-4 py-3.5 align-middle text-xs font-semibold text-gray-900 dark:text-white">
                      {product.basePrice ? formatPrice(product.discountPrice || product.basePrice) : '—'}
                    </td>

                    <td className="w-[10%] px-4 py-3.5 align-middle text-xs font-semibold">
                      <span className={product.totalStock <= 10 ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}>
                        {product.totalStock}m
                      </span>
                    </td>

                    <td className="w-[11%] px-4 py-3.5 align-middle text-xs">
                      {product.colors && product.colors.length > 0 ? (
                        <div className="grid grid-cols-5 gap-2 w-max items-center justify-start">
                          {product.colors.map((color: any, idx: number) => (
                            <div key={idx} className="relative group/tooltip flex items-center justify-center">
                              <div
                                className={`h-5 w-5 rounded-full border border-gray-300 dark:border-dark-600 shadow-sm transition-all duration-200 hover:scale-110 cursor-pointer ${
                                  (color.stock ?? 0) === 0 ? 'opacity-40' : 'opacity-100'
                                }`}
                                style={{ backgroundColor: color.hexCode }}
                              />
                              <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30 opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-100 bg-gray-950 dark:bg-dark-900 text-white px-2.5 py-1.5 rounded-lg shadow-xl text-center flex flex-col items-center border border-gray-800 dark:border-dark-700 min-w-[100px]">
                                <span className="font-semibold text-xs leading-tight whitespace-nowrap">{color.name}</span>
                                {(() => { const v = product.variants?.find((x: any) => x.color === color.name); return v?.rcsCode ? <span className="text-[10px] text-gray-300 whitespace-nowrap">{v.rcsCode}</span> : null; })()}
                                <span className="text-[10px] text-gray-400 mt-0.5 leading-none whitespace-nowrap">
                                  {(color.stock ?? 0) > 0 ? `${color.stock}m Available` : 'Out of Stock'}
                                </span>
                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-950 dark:border-t-dark-900" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="w-[20%] px-4 py-3.5 align-middle text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <LiveButton p={product} className="rounded-lg border px-2 py-1 text-xs font-semibold transition-colors" />
                        <button
                          onClick={() => handleSyncSingle(product.id)}
                          disabled={syncSingleMutation.isPending}
                          title="Sync images from Google Drive"
                          className="rounded-lg border border-blue-200 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-400 dark:hover:bg-blue-950/30 transition-colors flex items-center gap-1 active:scale-[0.97]"
                        >
                          <svg className={`h-3 w-3 ${syncSingleMutation.variables === product.id && syncSingleMutation.isPending ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.228 5.6M22 7h-6v6" />
                          </svg>
                          Sync
                        </button>
                        {product.slug && (
                          <a href={`/fabrics/${product.slug}?preview=1`} target="_blank" rel="noopener noreferrer"
                            title="See this product exactly as customers do (opens a new tab)"
                            className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-dark-600 dark:text-gray-300 dark:hover:bg-dark-700 transition-colors">
                            Preview
                          </a>
                        )}
                        <button 
                          onClick={() => { setEditingProduct(product); setShowModal(true); }} 
                          className="rounded-lg border border-green-200 px-2 py-1 text-xs font-medium text-green-600 hover:bg-green-50 dark:border-green-900 dark:text-green-400 dark:hover:bg-green-950/30 transition-colors"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => setDeleteConfirm(product.id)} 
                          className="rounded-lg border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 bg-white px-4 py-3 sm:px-6 dark:border-dark-700 dark:bg-dark-800 rounded-b-2xl">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-dark-600 dark:bg-dark-700 dark:text-gray-200 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-dark-600 dark:bg-dark-700 dark:text-gray-200 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Showing page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 dark:ring-dark-600 dark:hover:bg-dark-700 disabled:opacity-50"
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 dark:ring-dark-600 dark:hover:bg-dark-700 disabled:opacity-50"
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Product Modal */}
      <AnimatePresence>
        {(showModal || editingProduct) && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && (setShowModal(false), setEditingProduct(null))}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-dark-800"
            >
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-2xl font-bold">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
                <button
                  onClick={() => { setShowModal(false); setEditingProduct(null); }}
                  className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-dark-700"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {editingProduct && (
                <ProductPhotosPanel variants={editingProduct.variants?.length ? editingProduct.variants : [editingProduct]} />
              )}
              <ProductFormAdvanced 
                initialData={editingProduct}
                onClose={() => { setShowModal(false); setEditingProduct(null); }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {bigPhoto && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-3" onClick={() => setBigPhoto(null)} role="dialog" aria-modal="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={supabaseImg(bigPhoto, 2000, 85)} alt="" className="max-h-full max-w-full object-contain" />
          <button type="button" onClick={() => setBigPhoto(null)} aria-label="Close" className="absolute right-4 top-4 h-10 w-10 rounded-full bg-white/15 text-2xl text-white">×</button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div className="w-full max-w-sm rounded-2xl bg-white p-6 dark:bg-dark-800">
              <h3 className="font-bold text-lg">Delete Product?</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">This action cannot be undone.</p>
              <div className="mt-6 flex gap-3">
                <button 
                  onClick={() => setDeleteConfirm(null)} 
                  className="button-secondary flex-1"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => deleteMutation.mutate(deleteConfirm)} 
                  disabled={deleteMutation.isPending}
                  className="flex-1 rounded-xl bg-red-600 py-2.5 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
