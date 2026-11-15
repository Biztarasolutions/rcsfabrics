'use client';
import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { useAllProducts } from '@/hooks/useCollections';
import { supabaseImg, BLUR_PLACEHOLDER } from '@/lib/image';
import { productDisplayName } from '@/lib/utils';
import { SITE_URL } from '@/lib/seo';
import toast from 'react-hot-toast';

/**
 * Bulk enquiry fabric picker: choose a category, then tap the fabric (photo + name).
 * Calls onChange with a text summary (name, colour, category and link) for the enquiry.
 * "Something else" falls back to a free-text description.
 */
const MAX_PHOTOS = 3;
const OTHER_FALLBACK = 'Something else (see photos / notes)';

/** Resize a photo in the browser (max 1600px, JPEG) so it emails quickly; returns a data URL */
function shrinkPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('unreadable')); };
    img.src = url;
  });
}

export default function BulkFabricPicker({
  onChange,
  onImages,
}: {
  onChange: (fabric: string) => void;
  /** Reference photos as data URLs (only for "Something else"); emailed, not stored */
  onImages?: (photos: string[]) => void;
}) {
  const { data: products = [], isLoading } = useAllProducts();
  const [category, setCategory] = useState('');
  const [selected, setSelected] = useState<string>('');
  const [other, setOther] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const setPhotoList = (next: string[]) => { setPhotos(next); onImages?.(next); };

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    const room = MAX_PHOTOS - photos.length;
    const picked = Array.from(files).slice(0, room);
    if (files.length > room) toast.error(`You can add up to ${MAX_PHOTOS} photos`);
    setUploading(true);
    const added: string[] = [];
    for (const f of picked) {
      try {
        added.push(await shrinkPhoto(f));
      } catch {
        toast.error(`Could not read ${f.name}. Please use a JPG or PNG photo.`);
      }
    }
    setUploading(false);
    if (added.length) setPhotoList([...photos, ...added]);
  };

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    (products as any[]).forEach((p) => p?.category?.slug && map.set(p.category.slug, p.category.name));
    return Array.from(map, ([slug, name]) => ({ slug, name }));
  }, [products]);

  const list = (products as any[]).filter((p) => p?.category?.slug === category);

  const choose = (p: any) => {
    setSelected(p.id);
    onChange(`${productDisplayName(p)} (${p.category?.name || 'Fabric'}) — ${SITE_URL}/products/${p.slug}`);
  };

  const pickCategory = (slug: string) => {
    setCategory(slug);
    setSelected('');
    if (slug !== '__other' && photos.length) setPhotoList([]);
    onChange(slug === '__other' ? other.trim() || OTHER_FALLBACK : '');
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Fabric category</label>
        <select value={category} onChange={(e) => pickCategory(e.target.value)} required className="input-field">
          <option value="" disabled>{isLoading ? 'Loading fabrics…' : 'Choose a category'}</option>
          {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          <option value="__other">Something else / not listed</option>
        </select>
      </div>

      {category === '__other' ? (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Describe the fabric <span className="font-normal text-gray-400">(optional)</span></label>
          <input value={other} onChange={(e) => { setOther(e.target.value); onChange(e.target.value.trim() || OTHER_FALLBACK); }}
            className="input-field" placeholder="Fabric type, colour, weight…" />

          <div className="mt-3">
            <p className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
              Photos <span className="font-normal text-gray-400">(optional, up to {MAX_PHOTOS})</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {photos.map((u, i) => (
                <div key={i} className="relative h-20 w-20 overflow-hidden rounded-xl border border-gray-200 dark:border-dark-600">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={u} alt="Reference" className="h-full w-full object-cover" />
                  <button type="button" onClick={() => setPhotoList(photos.filter((_, j) => j !== i))} aria-label="Remove photo"
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white">×</button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <label className={`flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 text-center text-[11px] text-gray-500 hover:border-primary-700 hover:text-primary-700 dark:border-dark-600 ${uploading ? 'pointer-events-none opacity-60' : ''}`}>
                  <span className="text-xl leading-none">{uploading ? '…' : '+'}</span>
                  {uploading ? 'Adding' : 'Add photo'}
                  <input type="file" accept="image/*" multiple className="sr-only"
                    onChange={(e) => { addPhotos(e.target.files); e.target.value = ''; }} />
                </label>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">A photo of the fabric or design you want helps us quote faster. It’s sent to us with your enquiry.</p>
          </div>
        </div>
      ) : category ? (
        <div>
          <p className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Choose the fabric</p>
          <div role="radiogroup" aria-label="Fabric" className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {list.map((p) => {
              const img = p.images?.find((i: any) => i.isMain)?.url || p.images?.[0]?.url;
              const on = selected === p.id;
              return (
                <button key={p.id} type="button" role="radio" aria-checked={on} onClick={() => choose(p)}
                  className={`overflow-hidden rounded-xl border-2 text-left transition-all ${on ? 'border-primary-700 ring-2 ring-primary-700/20' : 'border-gray-200 hover:border-primary-300 dark:border-dark-600'}`}>
                  <div className="relative w-full bg-[#f4efe7] dark:bg-dark-700" style={{ aspectRatio: '1 / 1' }}>
                    {img && <Image src={supabaseImg(img, 200, 70, 'cover')} alt="" fill sizes="120px" placeholder="blur" blurDataURL={BLUR_PLACEHOLDER} className="object-cover" />}
                    {on && <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary-700 text-xs text-white">✓</span>}
                  </div>
                  <p className="px-2 py-1.5 text-xs font-medium leading-tight text-gray-800 dark:text-gray-200">{productDisplayName(p)}</p>
                </button>
              );
            })}
          </div>
          {/* keeps the form from submitting without a choice */}
          <input tabIndex={-1} aria-hidden="true" required value={selected} onChange={() => {}}
            className="pointer-events-none h-0 w-full opacity-0" />
        </div>
      ) : null}
    </div>
  );
}
