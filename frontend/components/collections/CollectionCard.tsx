import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabaseImg, BLUR_PLACEHOLDER } from '@/lib/image';
import { coverImage } from '@/lib/collections';

export default function CollectionCard({ c, large = false }: { c: any; large?: boolean }) {
  const img = coverImage(c.products);
  return (
    <Link href={`/collections/${c.slug}`}
      className={`group relative block overflow-hidden rounded-2xl bg-[#2b2118] ${large ? 'h-80 sm:h-96' : 'h-72'}`}>
      {img && (
        <Image src={supabaseImg(img, 900, 75, 'cover')} alt="" fill sizes="(max-width: 768px) 100vw, 33vw"
          placeholder="blur" blurDataURL={BLUR_PLACEHOLDER}
          className="object-cover transition-transform duration-700 group-hover:scale-105" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#1d150e]/90 via-[#1d150e]/30 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#dcbf7c]">
          {c.products.length} {c.products.length === 1 ? 'fabric' : 'fabrics'}
        </p>
        <h3 className="mt-2 font-display text-2xl text-white sm:text-3xl">{c.title}</h3>
        <p className="mt-1 text-sm text-white/80">{c.tagline}</p>
        <span className="mt-4 inline-block text-sm font-semibold text-white underline-offset-4 group-hover:underline">Explore →</span>
      </div>
    </Link>
  );
}
