'use client';
import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { useAllProducts } from '@/hooks/useCollections';
import { supabaseImg, BLUR_PLACEHOLDER } from '@/lib/image';
import { productDisplayName } from '@/lib/utils';
import { SITE_URL } from '@/lib/seo';

/**
 * Bulk enquiry fabric picker: choose a category, then tap the fabric (photo + name).
 * Calls onChange with a text summary (name, colour, category and link) for the enquiry.
 * "Something else" falls back to a free-text description.
 */
export default function BulkFabricPicker({ onChange }: { onChange: (fabric: string) => void }) {
  const { data: products = [], isLoading } = useAllProducts();
  const [category, setCategory] = useState('');
  const [selected, setSelected] = useState<string>('');
  const [other, setOther] = useState('');

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
    onChange(slug === '__other' ? other : '');
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
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Describe the fabric</label>
          <input value={other} required onChange={(e) => { setOther(e.target.value); onChange(e.target.value); }}
            className="input-field" placeholder="Fabric type, colour, weight…" />
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
