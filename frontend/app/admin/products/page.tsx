'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

const EMPTY_FORM = { name: '', categoryId: '', material: '', basePrice: '', discountPrice: '', gsm: '', width: '', color: '', pattern: '', stretchability: 'Non-Stretch', usage: '', washCare: '', totalStock: '', minOrderQty: '0.5', description: '', folderUrl: '' };

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: productsData = { products: [] }, isLoading } = useQuery({
    queryKey: ['admin-products', search],
    queryFn: () => adminApi.getAdminProducts({ search }).then(res => res.data.data),
  });
  const products = productsData.products;

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories-list'],
    queryFn: () => adminApi.getCategories().then(res => res.data.data || []),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => adminApi.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product created successfully');
      setShowModal(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => adminApi.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product updated successfully');
      setShowModal(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product deleted');
      setDeleteConfirm(null);
    },
  });

  const openAdd = () => { setForm(EMPTY_FORM); setEditId(null); setShowModal(true); };
  const openEdit = (p: any) => {
    setForm({
      ...p,
      basePrice: String(p.basePrice),
      discountPrice: p.discountPrice ? String(p.discountPrice) : '',
      totalStock: String(p.totalStock),
      gsm: p.gsm ? String(p.gsm) : '',
      width: p.width ? String(p.width) : '',
      minOrderQty: String(p.minOrderQty),
      folderUrl: '', // Reset folder url on edit
    });
    setEditId(p.id);
    setShowModal(true);
  };

  const handleSave = () => {
    const payload = {
      ...form,
      basePrice: Number(form.basePrice),
      discountPrice: form.discountPrice ? Number(form.discountPrice) : undefined,
      totalStock: Number(form.totalStock),
      gsm: form.gsm ? Number(form.gsm) : undefined,
      width: form.width ? Number(form.width) : undefined,
      minOrderQty: Number(form.minOrderQty),
      folderUrl: form.folderUrl || undefined,
    };

    if (editId) {
      updateMutation.mutate({ id: editId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h2>
          <p className="text-sm text-gray-500">{products.length} fabrics in catalog</p>
        </div>
        <button onClick={openAdd} className="button-primary flex items-center gap-2 px-5 py-2.5">
          <span className="text-lg">+</span> Add Product
        </button>
      </div>

      {/* Search bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..."
            className="input-field pl-9 py-2.5"/>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-dark-700 dark:bg-dark-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 dark:border-dark-700 bg-gray-50 dark:bg-dark-700/50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <th className="px-5 py-4">Product</th>
                <th className="px-5 py-4 hidden sm:table-cell">Category</th>
                <th className="px-5 py-4">Price/m</th>
                <th className="px-5 py-4 hidden md:table-cell">Stock</th>
                <th className="px-5 py-4 hidden lg:table-cell">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-dark-700">
              {isLoading ? (
                <tr><td colSpan={6} className="py-10 text-center">Loading...</td></tr>
              ) : products.map((product: any) => (
                <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-dark-700/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <img src={product.images?.[0]?.url || 'https://via.placeholder.com/40'} alt={product.name} className="h-10 w-10 rounded-xl object-cover"/>
                      <a href={`/product/${product.slug}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 hover:underline">
                        {product.name}
                      </a>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell text-gray-600 dark:text-gray-400">{product.category?.name}</td>
                  <td className="px-5 py-4 font-semibold text-gray-900 dark:text-white">
                    {product.discountPrice ? (
                      <span>{formatPrice(product.discountPrice)} <span className="text-xs text-gray-400 line-through">{formatPrice(product.basePrice)}</span></span>
                    ) : formatPrice(product.basePrice)}
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className={`font-semibold ${product.totalStock <= 10 ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>{product.totalStock}m</span>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <span className={`badge ${product.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>{product.isActive ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(product)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-dark-600 dark:text-gray-300 dark:hover:bg-dark-700 transition-colors">Edit</button>
                      <button onClick={() => setDeleteConfirm(product.id)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30 transition-colors">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-dark-800">
              <h3 className="font-display text-xl font-bold mb-6">{editId ? 'Edit Product' : 'Add New Product'}</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { key: 'name', label: 'Product Name', placeholder: 'Royal Banarasi Silk', full: true },
                  { key: 'categoryId', label: 'Category', type: 'select', options: categories },
                  { key: 'material', label: 'Material', placeholder: 'Silk' },
                  { key: 'color', label: 'Color', placeholder: 'Deep Maroon' },
                  { key: 'basePrice', label: 'Base Price (₹/m)', placeholder: '1850' },
                  { key: 'discountPrice', label: 'Discount Price (₹/m)', placeholder: '1499' },
                  { key: 'gsm', label: 'GSM', placeholder: '120' },
                  { key: 'width', label: 'Width (inches)', placeholder: '44' },
                  { key: 'pattern', label: 'Pattern', placeholder: 'Zari Brocade' },
                  { key: 'totalStock', label: 'Stock (meters)', placeholder: '50' },
                  { key: 'minOrderQty', label: 'Min Order (m)', placeholder: '0.5' },
                  { key: 'folderUrl', label: 'Google Drive Folder URL (Auto-imports images)', placeholder: 'https://drive.google.com/drive/folders/...', full: true },
                ].map((f) => (
                  <div key={f.key} className={f.full ? 'sm:col-span-2' : ''}>
                    <label className="mb-1.5 block text-sm font-medium">{f.label}</label>
                    {f.type === 'select' ? (
                      <select value={form[f.key] || ''} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                        className="input-field">
                        <option value="">Select Category</option>
                        {f.options.map((opt: any) => (
                          <option key={opt.id} value={opt.id}>{opt.name}</option>
                        ))}
                      </select>
                    ) : (
                      <input value={form[f.key] || ''} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                        placeholder={f.placeholder} className="input-field"/>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-6 flex gap-3">
                <button onClick={() => setShowModal(false)} className="button-secondary flex-1 py-3">Cancel</button>
                <button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}
                  className="button-primary flex-1 py-3">
                  {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : (editId ? 'Save Changes' : 'Add Product')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div className="w-full max-w-sm rounded-2xl bg-white p-6 dark:bg-dark-800">
              <h3 className="font-bold">Delete Product?</h3>
              <p className="mt-2 text-sm text-gray-500">This action cannot be undone.</p>
              <div className="mt-5 flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="button-secondary flex-1">Cancel</button>
                <button onClick={() => deleteMutation.mutate(deleteConfirm)} className="flex-1 rounded-xl bg-red-600 py-2.5 text-white">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
