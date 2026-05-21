'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, uploadCategoryImage } from '@/lib/api';
import { toast } from 'react-hot-toast';

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    isActive: true,
    gender: 'women',
    bestFor: '',
    properties: '',
    imageLink: '', // Google Drive share link for category image
  });

  const { data: cats = [], isLoading: loading, error, isError } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => adminApi.getCategories().then(res => res.data.data || []),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => adminApi.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['admin-categories-list'] });
      toast.success('Category created');
      setShowModal(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => adminApi.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['admin-categories-list'] });
      toast.success('Category updated');
      setShowModal(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteCategory(id),
    onSuccess: (_, deletedId) => {
      // Instantly filter out deleted category from the React Query cache
      queryClient.setQueryData(['admin-categories'], (old: any[] | undefined) => {
        if (!old) return [];
        return old.filter((c: any) => c.id !== deletedId);
      });
      // Invalidate all related categories lists in background
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['admin-categories-list'] });
      toast.success('Category deleted');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const openAdd = () => {
    setForm({
      name: '',
      slug: '',
      description: '',
      isActive: true,
      gender: 'women',
      bestFor: '',
      properties: '',
      imageLink: '',
    });
    setEditId(null);
    setShowModal(true);
  };

  const openEdit = (c: any) => {
    setForm({
      name: c.name,
      slug: c.slug || '',
      description: c.description || '',
      isActive: c.isActive,
      gender: c.gender || 'women',
      bestFor: Array.isArray(c.bestFor) ? c.bestFor.join(', ') : '',
      properties: Array.isArray(c.properties) ? c.properties.join(', ') : '',
      imageLink: c.imageUrl || '',
    });
    setEditId(c.id);
    setShowModal(true);
  };
  
  const handleSave = async () => {
    const generatedSlug = form.name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    let baseData: any = {
      name: form.name,
      slug: generatedSlug,
      description: form.description,
      isActive: form.isActive,
      gender: form.gender,
      bestFor: form.bestFor ? form.bestFor.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
      properties: form.properties ? form.properties.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
    };

    // If an image link is provided, upload it to Supabase first (or pass Google Drive link directly to backend)
    if (form.imageLink) {
      const isDriveLink = form.imageLink.includes('drive.google.com');
      if (isDriveLink) {
        baseData['imageUrl'] = form.imageLink;
      } else {
        try {
          const imageUrl = await uploadCategoryImage(form.imageLink);
          baseData['imageUrl'] = imageUrl;
        } catch (err:any) {
          toast.error(`Image upload failed: ${err.message}`);
          return;
        }
      }
    }

    if (editId) {
      updateMutation.mutate({ id: editId, data: baseData });
    } else {
      createMutation.mutate(baseData);
    }
  };

  const toggleActive = (cat: any) => {
    const updatedData = {
      isActive: !cat.isActive
    };
    updateMutation.mutate({ id: cat.id, data: updatedData });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure? This will not delete products in this category but might affect their display.')) return;
    deleteMutation.mutate(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Categories</h2>
          <p className="text-sm text-gray-500">{cats.length} categories · {cats.reduce((s: number, c: any) => s + (c._count?.products || 0), 0)} products total</p>
        </div>
        <button onClick={openAdd} className="button-primary flex items-center gap-2 px-5 py-2.5">
          <span className="text-lg">+</span> Add Category
        </button>
      </div>

      {loading ? (
        <div className="p-10 text-center text-gray-500">Loading categories...</div>
      ) : isError ? (
        <div className="p-10 text-center text-red-500 bg-red-50 rounded-xl">Failed to load categories: {(error as any)?.message}</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cats.map((cat: any, i: number) => (
            <motion.div key={cat.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-dark-700 dark:bg-dark-800 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{cat.name}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cat.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-dark-700 dark:text-gray-400'}`}>
                        {cat.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400`}>
                        {cat.gender || 'women'}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{cat.description}</p>
                  </div>
                </div>

                {/* Best For Tags */}
                {cat.bestFor && cat.bestFor.length > 0 && (
                  <div>
                    <span className="text-[11px] font-semibold text-gray-400 dark:text-dark-500 uppercase tracking-wider block mb-1">Best For</span>
                    <div className="flex flex-wrap gap-1">
                      {cat.bestFor.map((bf: string) => (
                        <span key={bf} className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-600 dark:bg-blue-900/10 dark:text-blue-400 rounded-md font-medium border border-blue-100 dark:border-blue-900/20">
                          {bf}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Properties Tags */}
                {cat.properties && cat.properties.length > 0 && (
                  <div>
                    <span className="text-[11px] font-semibold text-gray-400 dark:text-dark-500 uppercase tracking-wider block mb-1">Properties</span>
                    <div className="flex flex-wrap gap-1">
                      {cat.properties.map((prop: string) => (
                        <span key={prop} className="text-[11px] px-2 py-0.5 bg-amber-50 text-amber-600 dark:bg-amber-900/10 dark:text-amber-400 rounded-md font-medium border border-amber-100 dark:border-amber-900/20">
                          {prop}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-dark-700">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{cat._count?.products || 0} products</span>
                <div className="flex gap-2">
                  <button onClick={() => toggleActive(cat)} disabled={updateMutation.isPending}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-dark-600 dark:text-gray-400 transition-colors">
                    {cat.isActive ? 'Disable' : 'Enable'}
                  </button>
                  <button onClick={() => openEdit(cat)}
                    className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-400 transition-colors">Edit</button>
                  <button onClick={() => handleDelete(cat.id)} disabled={deleteMutation.isPending}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 transition-colors">Delete</button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-dark-800">
              <h3 className="font-display text-xl font-bold text-gray-900 dark:text-white mb-5">{editId ? 'Edit Category' : 'Add Category'}</h3>
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">Name</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="Solids"/>
                </div>
                
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">Gender Target</label>
                  <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="input-field bg-white dark:bg-dark-900">
                    <option value="women">Women</option>
                    <option value="men">Men</option>
                    <option value="unisex">Unisex</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field h-20 resize-none py-2" placeholder="Describe the category fabric properties..."/>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">Best For</label>
                  <input value={form.bestFor} onChange={(e) => setForm({ ...form, bestFor: e.target.value })} className="input-field" placeholder="e.g. Kurtis, Tops, Bottom wear"/>
                  <span className="text-[10px] text-gray-400 block mt-1">Separate options with commas</span>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">Properties</label>
                  <input value={form.properties} onChange={(e) => setForm({ ...form, properties: e.target.value })} className="input-field" placeholder="e.g. Skin friendly, Breathable"/>
                  <span className="text-[10px] text-gray-400 block mt-1">Separate properties with commas</span>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">Image Link</label>
                  <input value={form.imageLink} onChange={(e) => setForm({ ...form, imageLink: e.target.value })} className="input-field" placeholder="https://..."/>
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-2">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="accent-primary-600 h-4 w-4"/>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Active (visible on storefront)</span>
                </label>
              </div>
              <div className="mt-5 flex gap-3">
                <button onClick={() => setShowModal(false)} className="button-secondary flex-1 py-3">Cancel</button>
                <button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending} className="button-primary flex-1 py-3">
                  {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : (editId ? 'Save Changes' : 'Add Category')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
