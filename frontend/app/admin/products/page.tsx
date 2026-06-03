'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
import Image from 'next/image';
import Link from 'next/link';
import ProductFormAdvanced from '@/components/products/ProductFormAdvanced';

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: productsData = { products: [], total: 0, pages: 1 }, isLoading } = useQuery({
    queryKey: ['admin-products', search, page],
    queryFn: async () => {
        const response = await adminApi.getAdminProducts({ search, page, limit: 50 });
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

  const handleSyncSingle = (id: string) => {
    syncSingleMutation.mutate(id);
  };

  const handleSyncAll = () => {
    syncAllMutation.mutate();
  };



  return (
    <div className="min-w-0 w-full max-w-full space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h2>
          <p className="text-sm text-gray-500">{totalProducts} fabrics in catalog</p>
        </div>
        <div className="flex gap-3">
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

      {/* Products Table — horizontal scroll only inside this card */}
      <div className="min-w-0 w-full max-w-full rounded-2xl border border-gray-200 bg-white dark:border-dark-700 dark:bg-dark-800">
        <div className="w-full max-w-full overflow-x-auto overflow-y-visible overscroll-x-contain">
          <table className="w-max min-w-full text-sm whitespace-nowrap sm:min-w-[1080px]">
            <thead className="border-b border-gray-100 dark:border-dark-700 bg-gray-50 dark:bg-dark-700/50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    <th className="px-3 py-2.5 min-w-[120px]">Category</th>
                    <th className="px-3 py-2.5 min-w-[90px]">Price</th>
                    <th className="px-3 py-2.5 min-w-[80px]">Selling At</th>
                    <th className="px-3 py-2.5 min-w-[70px]">Total Stock</th>
                    <th className="px-3 py-2.5 min-w-[70px]">Colors</th>
                    <th className="px-3 py-2.5 min-w-[180px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-dark-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-500">
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-500">
                    No products found. Create your first product!
                  </td>
                </tr>
              ) : (
                products.map((product: any) => (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-dark-700/30 transition-colors">
                    {/* Product Name */}
                    <td className="px-3 py-2 text-xs">
                      <span className="block truncate max-w-[200px] text-gray-900 dark:text-white" title={product.category?.name || ''}>
                        {product.category?.name || '—'}
                      </span>
                    </td>

                    <td className="px-3 py-2 text-xs">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatPrice(product.basePrice)}
                      </span>
                    </td>

                    <td className="px-3 py-2 text-xs">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatPrice(product.discountPrice || product.basePrice)}
                      </span>
                    </td>

                    <td className="px-3 py-2 text-xs">
                      <span className={`font-semibold ${
                        product.totalStock <= 10 
                          ? 'text-red-600 dark:text-red-400' 
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                      >
                        {product.totalStock}m
                      </span>
                    </td>

                    <td className="px-3 py-2 text-xs">
                      {product.colors && product.colors.length > 0 ? (
                        <div className="flex gap-1">
                          {product.colors.map((color: any, idx: number) => (
                            <div
                              key={idx}
                              className="h-5 w-5 rounded-full border border-gray-300"
                              style={{ backgroundColor: color.hexCode }}
                              title={`${color.name} (${color.inventory || 0}m)`}
                            />
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
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
              <ProductFormAdvanced 
                initialData={editingProduct}
                onClose={() => { setShowModal(false); setEditingProduct(null); }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
