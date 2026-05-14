'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const INITIAL_CATS = [
  { id: '1', name: 'Silks', slug: 'silks', count: 48, description: 'Premium silk fabrics', isActive: true },
  { id: '2', name: 'Cottons', slug: 'cottons', count: 72, description: 'Natural cotton varieties', isActive: true },
  { id: '3', name: 'Blends', slug: 'blends', count: 35, description: 'Fabric blends', isActive: true },
  { id: '4', name: 'Velvets', slug: 'velvets', count: 18, description: 'Luxurious velvets', isActive: true },
  { id: '5', name: 'Chiffons', slug: 'chiffons', count: 24, description: 'Sheer chiffons', isActive: true },
  { id: '6', name: 'Woolens', slug: 'woolens', count: 14, description: 'Wool fabrics', isActive: false },
];

export default function AdminCategoriesPage() {
  const [cats, setCats] = useState(INITIAL_CATS);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '', isActive: true });

  const openAdd = () => { setForm({ name: '', slug: '', description: '', isActive: true }); setEditId(null); setShowModal(true); };
  const openEdit = (c: typeof INITIAL_CATS[0]) => { setForm({ name: c.name, slug: c.slug, description: c.description, isActive: c.isActive }); setEditId(c.id); setShowModal(true); };
  const handleSave = () => {
    if (editId) setCats((p) => p.map((c) => c.id === editId ? { ...c, ...form } : c));
    else setCats((p) => [...p, { id: Date.now().toString(), count: 0, ...form }]);
    setShowModal(false);
  };
  const toggleActive = (id: string) => setCats((p) => p.map((c) => c.id === id ? { ...c, isActive: !c.isActive } : c));
  const handleDelete = (id: string) => setCats((p) => p.filter((c) => c.id !== id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Categories</h2>
          <p className="text-sm text-gray-500">{cats.length} categories · {cats.reduce((s, c) => s + c.count, 0)} products total</p>
        </div>
        <button onClick={openAdd} className="button-primary flex items-center gap-2 px-5 py-2.5">
          <span className="text-lg">+</span> Add Category
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cats.map((cat, i) => (
          <motion.div key={cat.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-dark-700 dark:bg-dark-800">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{cat.name}</h3>
                  <span className={`badge ${cat.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-dark-700 dark:text-gray-400'}`}>
                    {cat.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{cat.description}</p>
                <p className="mt-2 text-xs font-mono text-gray-400 dark:text-dark-500">/{cat.slug}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-dark-700">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{cat.count} products</span>
              <div className="flex gap-2">
                <button onClick={() => toggleActive(cat.id)}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-dark-600 dark:text-gray-400 transition-colors">
                  {cat.isActive ? 'Disable' : 'Enable'}
                </button>
                <button onClick={() => openEdit(cat)}
                  className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-400 transition-colors">Edit</button>
                <button onClick={() => handleDelete(cat.id)}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 transition-colors">Delete</button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-dark-800">
              <h3 className="font-display text-xl font-bold text-gray-900 dark:text-white mb-5">{editId ? 'Edit Category' : 'Add Category'}</h3>
              <div className="space-y-4">
                <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} className="input-field" placeholder="Silks"/></div>
                <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Slug</label><input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="input-field" placeholder="silks"/></div>
                <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" placeholder="Category description"/></div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="accent-primary-600 h-4 w-4"/>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Active (visible on storefront)</span>
                </label>
              </div>
              <div className="mt-5 flex gap-3">
                <button onClick={() => setShowModal(false)} className="button-secondary flex-1 py-3">Cancel</button>
                <button onClick={handleSave} className="button-primary flex-1 py-3">{editId ? 'Save Changes' : 'Add Category'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
