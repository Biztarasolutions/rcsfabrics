'use client';
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, uploadBannerImage } from '@/lib/api';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { BLUR_PLACEHOLDER } from '@/lib/image';

const EMPTY = { title: '', subtitle: '', link: '', image: '', isActive: true };

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${checked ? 'bg-green-500' : 'bg-gray-200 dark:bg-dark-600'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}/>
    </button>
  );
}

export default function AdminBannersPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [uploading, setUploading] = useState(false);
  const [imageTab, setImageTab] = useState<'upload' | 'url'>('upload');
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: () => adminApi.getBanners().then(res => res.data.data || []),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: { id: string | null; data: any }) =>
      payload.id
        ? adminApi.updateBanner(payload.id, payload.data)
        : adminApi.createBanner(payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['homepage-data'] });
      toast.success(editId ? 'Banner updated' : 'Banner created');
      setShowModal(false);
    },
    onError: (err: any) => toast.error(err.message || 'Failed to save banner'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteBanner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['homepage-data'] });
      toast.success('Banner deleted');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to delete banner'),
  });

  const reorderMutation = useMutation({
    mutationFn: (updates: { id: string; order: number }[]) =>
      Promise.all(updates.map(u => adminApi.updateBanner(u.id, { order: u.order }))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['homepage-data'] });
    },
    onError: () => toast.error('Failed to reorder banners'),
  });

  const openAdd = () => {
    setForm({ ...EMPTY, order: banners.length });
    setEditId(null);
    setImageTab('upload');
    setShowModal(true);
  };

  const openEdit = (b: any) => {
    setForm({ title: b.title, subtitle: b.subtitle || '', link: b.link || '', image: b.image, isActive: b.isActive, order: b.order });
    setEditId(b.id);
    setImageTab(b.image?.startsWith('http') ? 'url' : 'upload');
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.title.trim()) { toast.error('Headline is required'); return; }
    if (!form.image.trim()) { toast.error('Banner image is required'); return; }
    saveMutation.mutate({ id: editId, data: form });
  };

  const toggleActive = (banner: any) => {
    adminApi.updateBanner(banner.id, { isActive: !banner.isActive }).then(() => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['homepage-data'] });
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this banner?')) return;
    deleteMutation.mutate(id);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    reorderMutation.mutate([
      { id: banners[index].id, order: banners[index - 1].order },
      { id: banners[index - 1].id, order: banners[index].order },
    ]);
  };

  const moveDown = (index: number) => {
    if (index === banners.length - 1) return;
    reorderMutation.mutate([
      { id: banners[index].id, order: banners[index + 1].order },
      { id: banners[index + 1].id, order: banners[index].order },
    ]);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadBannerImage(file);
      setForm((f: any) => ({ ...f, image: url }));
      toast.success('Image uploaded');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const activeCount = (banners as any[]).filter((b: any) => b.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Hero Banners</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            <span className="font-semibold text-green-600 dark:text-green-400">{activeCount} active</span>
            {' '}· {banners.length} total · drag rows to reorder or use ↑↓ arrows
          </p>
        </div>
        <button onClick={openAdd} className="button-primary flex items-center gap-2 px-5 py-2.5">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
          </svg>
          Add Banner
        </button>
      </div>

      {/* Live preview note */}
      <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm dark:border-blue-900/30 dark:bg-blue-950/10">
        <span className="text-lg">💡</span>
        <p className="text-blue-700 dark:text-blue-300">
          Active banners appear on the homepage hero in the order shown below. Toggle off to hide a banner without deleting it.
        </p>
      </div>

      {/* Banner list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-gray-100 dark:bg-dark-800"/>
          ))}
        </div>
      ) : banners.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-dark-700 py-16">
          <span className="text-5xl mb-3">🖼️</span>
          <p className="font-semibold text-gray-700 dark:text-gray-300">No banners yet</p>
          <p className="text-sm text-gray-500 mt-1">Add a banner to replace the default homepage slides</p>
          <button onClick={openAdd} className="button-primary mt-4 px-6 py-2.5 text-sm">Add First Banner</button>
        </div>
      ) : (
        <div className="space-y-3">
          {(banners as any[]).map((banner: any, i: number) => (
            <motion.div key={banner.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`overflow-hidden rounded-2xl border bg-white dark:bg-dark-800 transition-opacity ${banner.isActive ? 'border-gray-200 dark:border-dark-700' : 'border-dashed border-gray-200 dark:border-dark-600 opacity-55'}`}>
              <div className="flex items-stretch">
                {/* Order controls */}
                <div className="flex flex-col items-center justify-center gap-1 border-r border-gray-100 dark:border-dark-700 px-3 py-4">
                  <button onClick={() => moveUp(i)} disabled={i === 0 || reorderMutation.isPending}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-20 dark:hover:bg-dark-700 dark:hover:text-gray-200 transition-colors">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7"/>
                    </svg>
                  </button>
                  <span className="text-xs font-bold text-gray-400 dark:text-gray-500">{i + 1}</span>
                  <button onClick={() => moveDown(i)} disabled={i === banners.length - 1 || reorderMutation.isPending}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-20 dark:hover:bg-dark-700 dark:hover:text-gray-200 transition-colors">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>
                </div>

                {/* Image preview */}
                <div className="relative h-auto w-44 shrink-0 overflow-hidden bg-gray-100 dark:bg-dark-700">
                  {banner.image ? (
                    <Image src={banner.image} alt={banner.title} fill sizes="176px"
                      placeholder="blur" blurDataURL={BLUR_PLACEHOLDER} className="object-cover"/>
                  ) : (
                    <div className="flex h-full min-h-[88px] items-center justify-center text-2xl text-gray-300">🖼️</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex flex-1 flex-wrap items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">{banner.title}</p>
                    {banner.subtitle && (
                      <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400 truncate">{banner.subtitle}</p>
                    )}
                    {banner.link && (
                      <p className="mt-1 text-xs font-medium text-primary-600 dark:text-primary-400 truncate">→ {banner.link}</p>
                    )}
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                      <Toggle checked={banner.isActive} onChange={() => toggleActive(banner)}/>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-12">
                        {banner.isActive ? 'Live' : 'Off'}
                      </span>
                    </div>
                    <button onClick={() => openEdit(banner)}
                      className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:border-blue-300 hover:text-blue-600 dark:border-dark-600 dark:text-gray-400 transition-colors">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </svg>
                    </button>
                    <button onClick={() => handleDelete(banner.id)}
                      className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:border-red-300 hover:text-red-600 dark:border-dark-600 dark:text-gray-400 transition-colors">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-dark-800 overflow-hidden">
              {/* Modal header */}
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-dark-700 px-6 py-4">
                <h3 className="font-display text-xl font-bold text-gray-900 dark:text-white">
                  {editId ? 'Edit Banner' : 'Add Banner'}
                </h3>
                <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              <div className="space-y-5 p-6">
                {/* Image section */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Banner Image</label>

                  {/* Tab toggle */}
                  <div className="mb-3 flex rounded-xl border border-gray-200 dark:border-dark-700 overflow-hidden">
                    {(['upload', 'url'] as const).map((tab) => (
                      <button key={tab} onClick={() => setImageTab(tab)}
                        className={`flex-1 py-2 text-sm font-medium transition-colors ${imageTab === tab ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-dark-700'}`}>
                        {tab === 'upload' ? '📁 Upload File' : '🔗 Paste URL'}
                      </button>
                    ))}
                  </div>

                  {imageTab === 'upload' ? (
                    <div
                      onClick={() => fileRef.current?.click()}
                      className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-6 hover:border-primary-400 hover:bg-primary-50/50 dark:border-dark-600 dark:hover:border-primary-700 dark:hover:bg-primary-950/10 transition-colors">
                      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange}/>
                      {uploading ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent"/>
                          <p className="text-sm text-gray-500">Uploading…</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <svg className="h-8 w-8 text-gray-300 dark:text-dark-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                          </svg>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Click to upload image</p>
                          <p className="text-xs text-gray-400">JPG, PNG, WebP — recommended 1200×600px</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <input
                      value={form.image}
                      onChange={(e) => setForm({ ...form, image: e.target.value })}
                      className="input-field"
                      placeholder="https://images.unsplash.com/..."/>
                  )}

                  {/* Image preview */}
                  {form.image && (
                    <div className="relative mt-3 h-36 w-full overflow-hidden rounded-xl bg-gray-100 dark:bg-dark-700">
                      <Image src={form.image} alt="Preview" fill sizes="100vw"
                        placeholder="blur" blurDataURL={BLUR_PLACEHOLDER} className="object-cover"/>
                      <button onClick={() => setForm((f: any) => ({ ...f, image: '' }))}
                        className="absolute right-2 top-2 rounded-lg bg-black/50 p-1 text-white hover:bg-black/70">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {/* Text fields */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Headline <span className="text-red-500">*</span>
                  </label>
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="input-field" placeholder="Summer Sale — 30% Off"/>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Subtitle</label>
                  <input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                    className="input-field" placeholder="Shop the latest collection of premium fabrics…"/>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Button Link</label>
                  <input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })}
                    className="input-field" placeholder="/products?sale=true"/>
                  <p className="mt-1 text-xs text-gray-400">Where the "Shop Now" button points. Leave blank for /products.</p>
                </div>

                {/* Active toggle */}
                <div className="flex items-center justify-between rounded-xl border border-gray-100 dark:border-dark-700 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Show on homepage</p>
                    <p className="text-xs text-gray-400 mt-0.5">Toggle off to save as a draft</p>
                  </div>
                  <Toggle checked={form.isActive} onChange={() => setForm((f: any) => ({ ...f, isActive: !f.isActive }))}/>
                </div>
              </div>

              {/* Modal footer */}
              <div className="flex gap-3 border-t border-gray-100 dark:border-dark-700 px-6 py-4">
                <button onClick={() => setShowModal(false)} className="button-secondary flex-1 py-3">Cancel</button>
                <button onClick={handleSave} disabled={saveMutation.isPending || uploading}
                  className="button-primary flex-1 py-3 disabled:opacity-60">
                  {saveMutation.isPending ? 'Saving…' : editId ? 'Save Changes' : 'Add Banner'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
