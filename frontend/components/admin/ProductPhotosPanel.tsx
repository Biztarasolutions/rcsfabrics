'use client';
import React, { useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { supabaseImg } from '@/lib/image';

/**
 * Edit Product → Photos. For every colour: the admin-only Raw original first,
 * then the customer photos (Image 1, 2, 3…) in the order customers see them.
 * View-only: photos come from the Google Drive folder via Sync.
 */
export default function ProductPhotosPanel({ variants }: { variants: any[] }) {
  const [big, setBig] = useState<string | null>(null);
  const results = useQueries({
    queries: variants.map((v) => ({
      queryKey: ['admin-product-photos', v.id],
      queryFn: () => adminApi.getProductPhotos(v.id).then((r) => r.data.data),
      staleTime: 30 * 1000,
    })),
  });

  const Tile = ({ url, label, raw = false }: { url?: string; label: string; raw?: boolean }) => (
    <div className="w-28 shrink-0">
      <button type="button" disabled={!url} onClick={() => url && setBig(url)}
        className={`relative block h-28 w-28 overflow-hidden rounded-xl border-2 ${raw ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30' : 'border-gray-200 bg-gray-50 dark:border-dark-600 dark:bg-dark-800'} ${url ? 'cursor-zoom-in' : 'cursor-default'}`}>
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={supabaseImg(url, 240, 75, 'cover')} alt={label} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <span className="flex h-full items-center justify-center px-2 text-center text-[11px] text-gray-400">Not in Drive yet</span>
        )}
      </button>
      <p className={`mt-1 text-[11px] font-semibold leading-tight ${raw ? 'text-amber-700 dark:text-amber-400' : 'text-gray-600 dark:text-gray-400'}`}>{label}</p>
    </div>
  );

  return (
    <div className="mb-6 rounded-2xl border border-gray-200 p-4 dark:border-dark-700">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="text-base font-bold text-gray-900 dark:text-white">Photos</h4>
      </div>

      <div className="mt-4 space-y-5">
        {variants.map((v, i) => {
          const q = results[i];
          const data: any = q?.data;
          const imgs: any[] = data?.images || [];
          return (
            <div key={v.id}>
              {variants.length > 1 && <p className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-200">{v.color || v.name}</p>}
              {q?.isLoading ? (
                <div className="flex gap-3">{[0, 1, 2, 3].map((k) => <div key={k} className="h-28 w-28 animate-pulse rounded-xl bg-gray-100 dark:bg-dark-700" />)}</div>
              ) : q?.isError ? (
                <p className="text-sm text-red-600">Could not load photos.</p>
              ) : (
                <div className="flex gap-3 overflow-x-auto pb-1">
                  <Tile url={data?.rawImage?.url} label="Original / Raw Image · admin only" raw />
                  <div className="w-px shrink-0 self-stretch bg-gray-200 dark:bg-dark-600" aria-hidden="true" />
                  {(imgs.length ? imgs : [{}, {}, {}]).map((im: any, k: number) => (
                    <Tile key={im.id || k} url={im.url} label={`Image ${k + 1}${k === 0 && im.url ? ' · main' : ''} · customers`} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {big && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-3" onClick={() => setBig(null)} role="dialog" aria-modal="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={supabaseImg(big, 2000, 85)} alt="" className="max-h-full max-w-full object-contain" />
          <button type="button" onClick={() => setBig(null)} aria-label="Close" className="absolute right-4 top-4 h-10 w-10 rounded-full bg-white/15 text-2xl text-white">×</button>
        </div>
      )}
    </div>
  );
}
