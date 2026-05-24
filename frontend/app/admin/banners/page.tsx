'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
const EMPTY = { title: '', subtitle: '', link: '', image: '', isActive: true };
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import toast from 'react-hot-toast';
import Image from 'next/image';

export default function AdminBannersPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(EMPTY);

  const { data: banners = [] } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: () => adminApi.getBanners().then(res => res.data.data || []),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => adminApi.createBanner(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      toast.success('Banner created');
      setShowModal(false);
    },
    onError: (err: any) => toast.error(err.message || 'Failed to create banner'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => adminApi.updateBanner(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      toast.success('Banner updated');
      setShowModal(false);
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update banner'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteBanner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      toast.success('Banner deleted');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to delete banner'),
  });

  const openAdd = () => { setForm(EMPTY); setEditId(null); setShowModal(true); };
  const openEdit = (b: any) => {
    setForm({ title: b.title, subtitle: b.subtitle, link: b.link, image: b.image, isActive: b.isActive });
    setEditId(b.id); setShowModal(true);
  };
  const handleSave = () => {
    if (editId) updateMutation.mutate({ id: editId, data: form });
    else createMutation.mutate(form);
  };
  const toggleActive = (banner: any) => updateMutation.mutate({ id: banner.id, data: { isActive: !banner.isActive } });
  const handleDelete = (id: string) => { if (confirm('Are you sure?')) deleteMutation.mutate(id); };
  // Reordering logic can be added here in the future

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Hero Banners</h2>
          <p className="text-sm text-gray-500">{banners.filter((b: any) => b.isActive).length} active banners on homepage</p>
        </div>
        <button onClick={openAdd} className="button-primary flex items-center gap-2 px-5 py-2.5">
          <span className="text-lg">+</span> Add Banner
        </button>
      </div>

      <div className="space-y-4">
        {banners.map((banner: any, i: number) => (
          <motion.div key={banner.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`overflow-hidden rounded-2xl border bg-white dark:bg-dark-800 ${banner.isActive ? 'border-gray-200 dark:border-dark-700' : 'border-dashed border-gray-200 opacity-60 dark:border-dark-600'}`}>
            <div className="flex flex-col sm:flex-row">
              {/* Preview */}
              <div className="relative h-32 w-full overflow-hidden bg-gray-100 dark:bg-dark-700 sm:h-auto sm:w-48">
                <Image src={banner.image} alt={banner.title} fill sizes="192px" className="object-cover"/>
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent flex items-center px-4">
                  <span className="text-xs font-bold text-white bg-black/30 px-2 py-1 rounded-md">#{banner.order}</span>
                </div>
              </div>
              {/* Content */}
              <div className="flex flex-1 items-center justify-between gap-4 p-5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{banner.title}</h3>
                    <span className={`badge ${banner.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-dark-700 dark:text-gray-400'}`}>
                      {banner.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{banner.subtitle}</p>
                  <p className="mt-1 text-xs text-primary-600 dark:text-primary-400">→ {banner.link}</p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <button onClick={() => toggleActive(banner)}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-dark-600 dark:text-gray-400 transition-colors">
                    {banner.isActive ? 'Disable' : 'Enable'}
                  </button>
                  <button onClick={() => openEdit(banner)}
                    className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-400 transition-colors">Edit</button>
                  <button onClick={() => handleDelete(banner.id)}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 transition-colors">Delete</button>
                </div>
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
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-dark-800">
              <h3 className="font-display text-xl font-bold text-gray-900 dark:text-white mb-5">{editId ? 'Edit Banner' : 'Add Banner'}</h3>
              <div className="space-y-4">
                <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Headline</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" placeholder="Summer Sale — 30% Off"/></div>
                <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Subtitle</label><input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className="input-field" placeholder="Tagline text..."/></div>
                <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Link URL</label><input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} className="input-field" placeholder="/products?sale=true"/></div>
                <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Image URL</label><input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="input-field" placeholder="https://..."/></div>
                {form.image && <div className="relative h-32 w-full rounded-xl overflow-hidden"><Image src={form.image} alt="Preview" fill sizes="100vw" className="object-cover"/></div>}
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="accent-primary-600 h-4 w-4"/><span className="text-sm text-gray-700 dark:text-gray-300">Active</span></label>
              </div>
              <div className="mt-5 flex gap-3">
                <button onClick={() => setShowModal(false)} className="button-secondary flex-1 py-3">Cancel</button>
                <button onClick={handleSave} className="button-primary flex-1 py-3">{editId ? 'Save' : 'Add Banner'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
