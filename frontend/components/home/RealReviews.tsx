'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { supabaseImg } from '@/lib/image';

/** Real customer reviews (4★ and up, with a comment). Hidden until there are at least 3. */
export default function RealReviews() {
  const { data = [] } = useQuery({
    queryKey: ['latest-reviews'],
    queryFn: async () => (await api.get('products/reviews/latest')).data?.data || [],
    staleTime: 10 * 60 * 1000,
  });
  if ((data as any[]).length < 3) return null;
  return (
    <section className="py-12 lg:py-20">
      <div className="container-main">
        <div className="text-center">
          <span className="section-tag">From our customers</span>
          <h2 className="section-title mt-3">What they made with it</h2>
        </div>
        <div className="-mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
          {(data as any[]).slice(0, 6).map((r) => (
            <figure key={r.id} className="w-[82%] shrink-0 snap-start rounded-2xl border border-[#e6dccb] bg-[#fcf9f4] p-5 sm:w-auto dark:border-dark-700 dark:bg-dark-800">
              <div className="text-[#c9a24e]" aria-label={`${r.rating} out of 5`}>{'★'.repeat(r.rating)}<span className="text-gray-300">{'★'.repeat(5 - r.rating)}</span></div>
              {r.title && <p className="mt-2 font-semibold text-gray-900 dark:text-white">{r.title}</p>}
              <blockquote className="mt-1 line-clamp-5 text-sm leading-relaxed text-gray-700 dark:text-gray-300">“{r.comment}”</blockquote>
              <figcaption className="mt-4 flex items-center gap-3 border-t border-[#e6dccb] pt-3 dark:border-dark-700">
                {r.product?.image && (
                  <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                    <Image src={supabaseImg(r.product.image, 120)} alt="" fill sizes="40px" className="object-cover" />
                  </span>
                )}
                <span className="min-w-0 text-xs">
                  <span className="block font-semibold text-gray-900 dark:text-white">{r.name}</span>
                  <Link href={`/fabrics/${r.product.slug}`} className="block truncate text-primary-700 hover:underline dark:text-primary-300">
                    {r.product.name}{r.product.color ? ` · ${r.product.color}` : ''}
                  </Link>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
