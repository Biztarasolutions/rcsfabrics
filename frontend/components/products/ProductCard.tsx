'use client';

import React, { useRef, useState } from 'react';
import { customerImages, isCloseupPhoto, plannedPhotos } from '@/lib/rawPhoto';
import { Product } from '@/types';
import { formatPrice, calculateDiscount, productDisplayName, productBaseName } from '@/lib/utils';
import { useCartStore, useWishlistStore } from '@/lib/store';
import { cartAddedToast } from '@/lib/cartToast';
import toast from 'react-hot-toast';
import Image from 'next/image';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { BLUR_PLACEHOLDER, supabaseImg } from '@/lib/image';

interface ProductCardProps { product: Product; priority?: boolean; }

const SIZES = '(max-width: 767px) 50vw, (max-width: 1535px) 33vw, 25vw';
const validHex = (v?: string | null) => {
  const h = (v || '').replace('#', '').trim();
  return /^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(h) ? `#${h}` : null;
};

/** Product card: photos (swipe) · fabric type · name · colour · rating · price · Add to Cart */
const ProductCard = React.memo(function ProductCard({ product: base, priority = false }: ProductCardProps) {
  const queryClient = useQueryClient();
  // Colour dots: every live colour of this design (from the API); tapping one shows that colour here
  const variants: any[] = (base as any).variants || [];
  const [selId, setSelId] = useState(base.id);
  const product: Product = (() => {
    if (selId === base.id) return base;
    const v = variants.find((x) => x.id === selId);
    return v ? ({ ...base, ...v, name: base.name, category: base.category, colors: v.hexCode ? [{ name: v.color, hexCode: v.hexCode }] : base.colors } as any) : base;
  })();
  // Fabric-1 → Close-up → Fabric-2 → Fabric-3 → …  (no Raw photos)
  const ordered = plannedPhotos(customerImages(product.images), (i) => i.url).slice(0, 6);
  const closeup = ordered.find((img, i) => i > 0 && isCloseupPhoto(img.url));
  const [hovering, setHovering] = useState(false);
  const [active, setActive] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const track = useRef<HTMLDivElement>(null);

  const discountPercent = product.discountPrice ? calculateDiscount(product.basePrice, product.discountPrice) : 0;
  const price = product.discountPrice || product.basePrice;
  const inStock = (product.totalStock ?? 0) > 0;

  const { addItem: addWish, removeItem: removeWish, hasItem } = useWishlistStore();
  const isWishlisted = hasItem(product.id);
  const { items: cartItems, addItem: addToCart } = useCartStore();

  const stop = (e: React.SyntheticEvent) => { e.preventDefault(); e.stopPropagation(); };

  const handleWishlist = (e: React.MouseEvent) => {
    stop(e);
    if (isWishlisted) { removeWish(product.id); toast('Removed from wishlist'); }
    else { addWish({ id: `w-${product.id}`, productId: product.id, product, createdAt: new Date().toISOString() }); toast.success('Added to wishlist!'); }
  };

  const handleAdd = (e: React.MouseEvent) => {
    stop(e);
    if (!inStock) return;
    if (cartItems.some((i) => i.productId === product.id)) { cartAddedToast(`${productDisplayName(product)} is already in your bag`); return; }
    // 1 metre to start (or the minimum, if higher); the quantity can be changed in the bag
    const qty = Math.min(Math.max(1, product.minOrderQty || 0), product.totalStock || 1);
    addToCart({ id: product.id, productId: product.id, product: product as any, quantity: qty });
    cartAddedToast(`${qty} m of ${productDisplayName(product)} added to your bag`);
  };

  const onScroll = () => {
    const el = track.current;
    if (!el) return;
    setActive(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
  };
  const pickColour = (e: React.MouseEvent, id: string) => {
    stop(e);
    setSelId(id);
    setActive(0);
    track.current?.scrollTo({ left: 0 });
  };
  const goTo = (e: React.MouseEvent, i: number) => {
    stop(e);
    track.current?.scrollTo({ left: i * (track.current?.clientWidth || 0), behavior: 'smooth' });
  };

  // One colour per card (each colour is its own product); fall back to the colour list
  const colours = (product.colors?.length ? product.colors : product.color ? [{ name: product.color, hexCode: product.color }] : [])
    .slice(0, 1).map((c: any) => ({ name: product.color || c.name, hex: validHex(c.hexCode) }));

  return (
    <Link
      href={`/fabrics/${product.slug}`}
      prefetch
      onClick={() => queryClient.setQueryData(['product-preview', product.slug], product)}
      className="block h-full cursor-pointer rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
    >
      <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow duration-300 sm:hover:shadow-product dark:border-dark-700 dark:bg-dark-800">
        {/* Photos — 4:3, close to the photos' own 3:2 shape, so the fabric is barely cropped */}
        <div className="relative m-2 overflow-hidden rounded-xl bg-[#f4efe7] dark:bg-dark-700" style={{ aspectRatio: '4/3' }}
          onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}>
          {!loaded && ordered.length > 0 && <div className="absolute inset-0 animate-pulse bg-gray-100 dark:bg-dark-700" />}
          {ordered.length ? (
            <div ref={track} onScroll={onScroll}
              className="flex h-full w-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {ordered.map((img, i) => (
                <div key={img.id || i} className="relative h-full w-full shrink-0 snap-center">
                  <Image
                    src={supabaseImg(img.url, 400)}
                    alt={i === 0 ? productDisplayName(product) : ''}
                    fill
                    priority={priority && i === 0}
                    loading={priority && i === 0 ? undefined : 'lazy'}
                    sizes={SIZES}
                    placeholder="blur"
                    blurDataURL={BLUR_PLACEHOLDER}
                    onLoad={i === 0 ? () => setLoaded(true) : undefined}
                    className="object-cover object-center"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center"><span className="text-4xl">🧵</span></div>
          )}

          {/* Close-up on hover (mouse users); on phones it is the 2nd photo when swiping */}
          {closeup && hovering && active === 0 && (
            <div className="pointer-events-none absolute inset-0 hidden sm:block">
              <Image src={supabaseImg(closeup.url, 400)} alt="" fill sizes={SIZES} className="object-cover object-center animate-fadeIn" />
              <span className="absolute bottom-2 right-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">Close-up</span>
            </div>
          )}

          {/* Badges */}
          <div className="pointer-events-none absolute left-2 top-2 flex flex-col items-start gap-1">
            {product.isNew && <span className="badge-new">New</span>}
            {(base as any).isBestSeller && <span className="rounded-full bg-[#c9a24e] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">Best seller</span>}
            {discountPercent > 0 && <span className="badge-sale">{discountPercent}% OFF</span>}
          </div>

          {/* Wishlist — always visible (phones have no hover) */}
          <button
            onClick={handleWishlist}
            className={`absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full shadow-sm backdrop-blur-sm transition-colors ${isWishlisted ? 'bg-white text-primary-700' : 'bg-white/85 text-gray-600 hover:text-primary-700 dark:bg-dark-800/85 dark:text-gray-300'}`}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'} aria-pressed={isWishlisted}
          >
            <svg className="h-[18px] w-[18px]" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>

          {/* Arrows for mouse users (phones swipe) */}
          {ordered.length > 1 && (
            <>
              {active > 0 && (
                <button type="button" onClick={(e) => goTo(e, active - 1)} aria-label="Previous photo"
                  className="absolute left-2 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-gray-700 shadow opacity-0 transition-opacity group-hover:opacity-100 sm:flex dark:bg-dark-800/85 dark:text-gray-200">‹</button>
              )}
              {active < ordered.length - 1 && (
                <button type="button" onClick={(e) => goTo(e, active + 1)} aria-label="Next photo"
                  className="absolute right-2 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-gray-700 shadow opacity-0 transition-opacity group-hover:opacity-100 sm:flex dark:bg-dark-800/85 dark:text-gray-200">›</button>
              )}
            </>
          )}

          {/* Photo dots */}
          {ordered.length > 1 && (
            <div className="absolute inset-x-0 bottom-1.5 flex justify-center gap-1">
              {ordered.map((_, i) => (
                <button key={i} type="button" onClick={(e) => goTo(e, i)} aria-label={`Photo ${i + 1}`}
                  className="flex h-4 w-4 items-center justify-center">
                  <span className={`block rounded-full transition-all ${i === active ? 'h-1.5 w-3 bg-white' : 'h-1.5 w-1.5 bg-white/60'}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-1 flex-col px-3 pb-3 pt-1 sm:px-4 sm:pb-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-700 sm:text-[11px] dark:text-primary-400">
            {product.category?.name || 'Fabric'}
          </p>
          <h3 className="mt-0.5 line-clamp-1 font-bold text-gray-900 sm:text-[17px] dark:text-white">{productBaseName(product)}</h3>
          {colours.map((c, idx) => (
            <p key={idx} className="mt-1 flex min-w-0 items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
              {c.hex && <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/10" style={{ backgroundColor: c.hex }} aria-hidden="true" />}
              <span className="truncate capitalize">{c.name}</span>
            </p>
          ))}
          {variants.length > 1 && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1" aria-label={`${variants.length} colours`}>
              {variants.slice(0, 7).map((v) => {
                const hex = validHex(v.hexCode) || '#d8d2c8';
                const on = v.id === product.id;
                return (
                  <button key={v.id} type="button" onClick={(e) => pickColour(e, v.id)} title={v.color} aria-label={`Show ${v.color}`} aria-pressed={on}
                    className={`flex h-6 w-6 items-center justify-center rounded-full ${on ? 'ring-1 ring-primary-700 ring-offset-1 dark:ring-primary-400 dark:ring-offset-dark-800' : ''}`}>
                    <span className="h-4 w-4 rounded-full border border-black/10" style={{ backgroundColor: hex }} />
                  </button>
                );
              })}
              {variants.length > 7 && <span className="text-[11px] text-gray-500">+{variants.length - 7}</span>}
            </div>
          )}
          {product.ratingCount > 0 && (
            <div className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <svg className="h-3.5 w-3.5 stars-filled" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="font-medium text-gray-700 dark:text-gray-200">{Number(product.rating).toFixed(1)}</span>
              <span>({product.ratingCount})</span>
            </div>
          )}

          <div className="mt-auto pt-2">
            <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
              <span className="whitespace-nowrap text-base font-bold text-primary-700 sm:text-lg dark:text-primary-400">
                {formatPrice(price)}<span className="text-xs font-normal text-gray-400">/m</span>
              </span>
              {product.discountPrice && product.discountPrice < product.basePrice && (
                <span className="text-xs text-gray-400 line-through sm:text-sm">{formatPrice(product.basePrice)}</span>
              )}
              {discountPercent > 0 && <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">{discountPercent}% off</span>}
            </div>
            <button type="button" onClick={handleAdd} disabled={!inStock}
              className={`mt-2.5 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl text-sm font-semibold transition-colors ${inStock ? 'bg-primary-700 text-white hover:bg-primary-800 active:bg-primary-900' : 'cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-dark-700'}`}>
              {inStock ? (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                  Add to Cart
                </>
              ) : 'Out of stock'}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
});

export default ProductCard;
