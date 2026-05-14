'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatPrice } from '@/lib/utils';

const PRODUCTS = [
  { id: '1', name: 'Royal Banarasi Silk', category: 'Silks', material: 'Silk', basePrice: 1850, discountPrice: 1499, stock: 45, status: 'Active', image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=100&q=80' },
  { id: '2', name: 'Premium Egyptian Cotton', category: 'Cottons', material: 'Cotton', basePrice: 680, stock: 200, status: 'Active', image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=100&q=80' },
  { id: '3', name: 'French Linen Blend', category: 'Blends', material: 'Linen', basePrice: 1200, discountPrice: 980, stock: 80, status: 'Active', image: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=100&q=80' },
  { id: '4', name: 'Italian Velvet', category: 'Velvets', material: 'Velvet', basePrice: 2400, stock: 8, status: 'Low Stock', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=100&q=80' },
  { id: '5', name: 'Pure Kanjivaram Silk', category: 'Silks', material: 'Silk', basePrice: 3200, discountPrice: 2750, stock: 5, status: 'Low Stock', image: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=100&q=80' },
];

const EMPTY_FORM = { name: '', category: '', material: '', basePrice: '', discountPrice: '', gsm: '', width: '', color: '', pattern: '', stretchability: 'Non-Stretch', usage: '', washCare: '', totalStock: '', minOrderQty: '0.5', description: '' };

export default function AdminProductsPage() {
  const [products, setProducts] = useState(PRODUCTS);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<typeof EMPTY_FORM>(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setForm(EMPTY_FORM); setEditId(null); setShowModal(true); };
  const openEdit = (p: typeof PRODUCTS[0]) => {
    setForm({ ...EMPTY_FORM, name: p.name, category: p.category, material: p.material, basePrice: String(p.basePrice), discountPrice: String(p.discountPrice || ''), totalStock: String(p.stock) });
    setEditId(p.id); setShowModal(true);
  };
  const handleSave = () => {
    if (editId) {
      setProducts((prev) => prev.map((p) => p.id === editId ? { ...p, name: form.name, category: form.category, material: form.material, basePrice: Number(form.basePrice), discountPrice: form.discountPrice ? Number(form.discountPrice) : undefined, stock: Number(form.totalStock) } : p));
    } else {
      setProducts((prev) => [...prev, { id: Date.now().toString(), name: form.name, category: form.category, material: form.material, basePrice: Number(form.basePrice), stock: Number(form.totalStock), status: 'Active', image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=100&q=80' }]);
    }
    setShowModal(false);
  };
  const handleDelete = (id: string) => { setProducts((prev) => prev.filter((p) => p.id !== id)); setDeleteConfirm(null); };

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

      {/* Search & filters bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..."
            className="input-field pl-9 py-2.5"/>
        </div>
        <select className="input-field w-40 py-2.5">
          <option>All Categories</option>
          <option>Silks</option><option>Cottons</option><option>Blends</option><option>Velvets</option>
        </select>
        <select className="input-field w-36 py-2.5">
          <option>All Status</option>
          <option>Active</option><option>Low Stock</option><option>Inactive</option>
        </select>
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
              {filtered.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-dark-700/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <img src={product.image} alt={product.name} className="h-10 w-10 rounded-xl object-cover"/>
                      <span className="font-semibold text-gray-900 dark:text-white">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell text-gray-600 dark:text-gray-400">{product.category}</td>
                  <td className="px-5 py-4 font-semibold text-gray-900 dark:text-white">
                    {product.discountPrice ? (
                      <span>{formatPrice(product.discountPrice)} <span className="text-xs text-gray-400 line-through">{formatPrice(product.basePrice)}</span></span>
                    ) : formatPrice(product.basePrice)}
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className={`font-semibold ${product.stock <= 10 ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>{product.stock}m</span>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <span className={`badge ${product.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>{product.status}</span>
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
        {filtered.length === 0 && (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">No products found.</div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-dark-800">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display text-xl font-bold text-gray-900 dark:text-white">{editId ? 'Edit Product' : 'Add New Product'}</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">✕</button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { key: 'name', label: 'Product Name', placeholder: 'Royal Banarasi Silk', full: true },
                  { key: 'category', label: 'Category', placeholder: 'Silks' },
                  { key: 'material', label: 'Material', placeholder: 'Silk' },
                  { key: 'color', label: 'Color', placeholder: 'Deep Maroon' },
                  { key: 'basePrice', label: 'Base Price (₹/m)', placeholder: '1850' },
                  { key: 'discountPrice', label: 'Discount Price (₹/m)', placeholder: '1499 (optional)' },
                  { key: 'gsm', label: 'GSM', placeholder: '120' },
                  { key: 'width', label: 'Width (inches)', placeholder: '44' },
                  { key: 'pattern', label: 'Pattern', placeholder: 'Zari Brocade' },
                  { key: 'totalStock', label: 'Stock (meters)', placeholder: '50' },
                  { key: 'minOrderQty', label: 'Min Order (m)', placeholder: '0.5' },
                  { key: 'usage', label: 'Best For', placeholder: 'Bridal, Sarees...' },
                ].map((f) => (
                  <div key={f.key} className={f.full ? 'sm:col-span-2' : ''}>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{f.label}</label>
                    <input value={(form as any)[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      placeholder={f.placeholder} className="input-field"/>
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3} className="input-field resize-none" placeholder="Product description..."/>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button onClick={() => setShowModal(false)} className="button-secondary flex-1 py-3">Cancel</button>
                <button onClick={handleSave} className="button-primary flex-1 py-3">{editId ? 'Save Changes' : 'Add Product'}</button>
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
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-dark-800">
              <h3 className="font-bold text-gray-900 dark:text-white">Delete Product?</h3>
              <p className="mt-2 text-sm text-gray-500">This action cannot be undone.</p>
              <div className="mt-5 flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="button-secondary flex-1 py-2.5">Cancel</button>
                <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
