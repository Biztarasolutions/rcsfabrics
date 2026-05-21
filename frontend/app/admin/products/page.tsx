'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
import ProductFormAdvanced from '@/components/products/ProductFormAdvanced';

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: productsData = { products: [] }, isLoading } = useQuery({
    queryKey: ['admin-products', search],
    queryFn: () => adminApi.getAdminProducts({ search }).then(res => res.data.data),
  });
  const products = productsData.products;

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Sync completed!');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const syncAllMutation = useMutation({
    mutationFn: () => adminApi.syncAllProducts(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('All products synced!');
    },
  });

  const handleSyncSingle = (id: string) => {
    syncSingleMutation.mutate(id);
  };

  const handleSyncAll = () => {
    syncAllMutation.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h2>
          <p className="text-sm text-gray-500">{products.length} fabrics in catalog</p>
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
          <button onClick={() => setShowModal(true)} className="button-primary flex items-center gap-2 px-5 py-2.5">
            <span className="text-lg">+</span> Add Product
          </button>
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
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Search products..."
            className="input-field pl-9 py-2.5"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-dark-700 dark:bg-dark-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 dark:border-dark-700 bg-gray-50 dark:bg-dark-700/50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3 hidden lg:table-cell">Style Code</th>
                <th className="px-4 py-3 hidden sm:table-cell">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3 hidden xl:table-cell">Work Type</th>
                <th className="px-4 py-3 hidden md:table-cell">Stock</th>
                <th className="px-4 py-3 hidden lg:table-cell">Colors</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-dark-700">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-gray-500">
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-gray-500">
                    No products found. Create your first product!
                  </td>
                </tr>
              ) : (
                products.map((product: any) => (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-dark-700/30 transition-colors">
                    {/* Product Name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 min-w-fit">
                        <img 
                          src={product.images?.[0]?.url || 'https://via.placeholder.com/40'} 
                          alt={product.name} 
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm">
                            {product.name}
                          </div>
                          {product.code && (
                            <div className="text-xs text-gray-500">Code: {product.code}</div>
                          )}
                          {product.description && (
                            <div className="mt-1 text-xs text-gray-500 line-clamp-2">{product.description}</div>
                          )}
                          {product.bestFor && product.bestFor.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1 text-[11px] text-gray-600 dark:text-gray-400">
                              {product.bestFor.map((item: string) => (
                                <span key={item} className="rounded-full bg-yellow-100 px-2 py-0.5 dark:bg-yellow-900/30">{item}</span>
                              ))}
                            </div>
                          )}
                          {product.properties && product.properties.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1 text-[11px] text-gray-600 dark:text-gray-400">
                              {product.properties.map((prop: string) => (
                                <span key={prop} className="rounded-full bg-gray-100 px-2 py-0.5 dark:bg-gray-900/30">{prop}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Style Code */}
                    <td className="px-4 py-3 hidden lg:table-cell text-xs sm:text-sm">
                      <span className="inline-block rounded-full bg-blue-100 px-2 py-1 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        {product.styleCode || '—'}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3 hidden sm:table-cell text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      {product.category?.name}
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3 text-xs sm:text-sm">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {formatPrice(product.discountPrice || product.basePrice)}
                      </div>
                      {product.discountPrice && (
                        <div className="text-xs text-gray-400 line-through">
                          {formatPrice(product.basePrice)}
                        </div>
                      )}
                    </td>

                    {/* Work Type */}
                    <td className="px-4 py-3 hidden xl:table-cell text-xs">
                      <span className={`inline-block rounded-full px-2 py-1 ${
                        product.workType === 'Printed' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                        product.workType === 'Embroidered' ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                      }`}>
                        {product.workType || 'Plain'}
                      </span>
                    </td>

                    {/* Stock */}
                    <td className="px-4 py-3 hidden md:table-cell text-xs sm:text-sm">
                      <span className={`font-semibold ${
                        product.totalStock <= 10 
                          ? 'text-red-600 dark:text-red-400' 
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {product.totalStock}m
                      </span>
                    </td>

                    {/* Colors */}
                    <td className="px-4 py-3 hidden lg:table-cell text-xs">
                      {product.colors && product.colors.length > 0 ? (
                        <div className="flex gap-1">
                          {product.colors.map((color: any, idx: number) => (
                            <div
                              key={idx}
                              className="h-5 w-5 rounded-full border border-gray-300"
                              style={{ backgroundColor: color.hexCode }}
                              title={color.name}
                            />
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(product.folderUrl || product.colors?.some((c: any) => c.folderUrl)) && (
                          <button 
                            onClick={() => handleSyncSingle(product.id)} 
                            disabled={syncSingleMutation.isPending}
                            className="rounded-lg border border-blue-200 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-400 dark:hover:bg-blue-950/30 transition-colors flex items-center gap-1 active:scale-[0.97]"
                          >
                            <svg className={`h-3 w-3 ${syncSingleMutation.variables === product.id && syncSingleMutation.isPending ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.228 5.6M22 7h-6v6" />
                            </svg>
                          </button>
                        )}
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
      </div>

      {/* Add Product Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-dark-800"
            >
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-2xl font-bold">Add New Product</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-dark-700"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <ProductFormAdvanced />
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
