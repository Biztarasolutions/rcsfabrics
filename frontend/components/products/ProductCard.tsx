'use client';

import React, { useState } from 'react';
import { Product } from '@/types';
import { formatPrice, calculateDiscount } from '@/lib/utils';
import { useCartStore, useWishlistStore } from '@/lib/store';
import toast from 'react-hot-toast';
import Image from 'next/image';
import Link from 'next/link';

interface ProductCardProps { product: Product; }

const ProductCard = React.memo(function ProductCard({ product }: ProductCardProps) {
  const [hovered, setHovered] = useState(false);
  const [everHovered, setEverHovered] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [secondImgLoaded, setSecondImgLoaded] = useState(false);
  const mainImage = product.images?.find((img) => img.isMain) || product.images?.[0];
  const secondImage = product.images?.[1];
  const discountPercent = product.discountPrice ? calculateDiscount(product.basePrice, product.discountPrice) : 0;
  const price = product.discountPrice || product.basePrice;
  const { addItem } = useCartStore();
  const { addItem: addWish, removeItem: removeWish, hasItem } = useWishlistStore();
  const isWishlisted = hasItem(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({ id: `${product.id}-${Date.now()}`, productId: product.id, product, quantity: 0.5 });
    toast.success(`${product.name} added to cart!`);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isWishlisted) {
      removeWish(product.id);
      toast('Removed from wishlist');
    } else {
      addWish({ id: `w-${product.id}`, productId: product.id, product, createdAt: new Date().toISOString() });
      toast.success('Added to wishlist!');
    }
  };

  return (
    <Link href={`/products/${product.slug}`}>
      <div
        onMouseEnter={() => { setHovered(true); setEverHovered(true); }}
        onMouseLeave={() => setHovered(false)}
        className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-product dark:border-dark-700 dark:bg-dark-800"
      >
        {/* Image */}
        <div className={`relative overflow-hidden bg-gray-50 dark:bg-dark-700 ${!imgLoaded ? 'animate-pulse' : ''}`} style={{ aspectRatio: '4/5' }}>
          {mainImage ? (
            <Image
              src={mainImage.url}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              onLoad={() => setImgLoaded(true)}
              className={`object-cover transition-all duration-500 ${hovered && secondImage ? 'opacity-0' : 'opacity-100'} ${!imgLoaded ? 'scale-105 blur-sm' : 'scale-100 blur-0'}`}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-dark-600 dark:to-dark-700">
              <span className="text-4xl">🧵</span>
            </div>
          )}
          {secondImage && everHovered && (
            <Image
              src={secondImage.url}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              onLoad={() => setSecondImgLoaded(true)}
              className={`object-cover transition-all duration-500 ${hovered ? 'opacity-100' : 'opacity-0'} ${!secondImgLoaded ? 'scale-105 blur-sm' : 'scale-100 blur-0'}`}
            />
          )}
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            {discountPercent > 0 && <span className="badge-sale">{discountPercent}% OFF</span>}
            {product.isNew && <span className="badge-new">New</span>}
            {product.isFeatured && !product.isNew && <span className="badge-featured">Featured</span>}
          </div>
          <button
            onClick={handleWishlist}
            className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-200 ${isWishlisted ? 'border-red-200 bg-red-50 text-red-500 dark:border-red-900 dark:bg-red-950' : 'border-white/60 bg-white/80 text-gray-500 opacity-0 backdrop-blur-sm group-hover:opacity-100 dark:border-dark-600 dark:bg-dark-700/80 dark:text-gray-300'}`}
            aria-label="Wishlist"
          >
            <svg className="h-4 w-4" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
          <div className={`absolute bottom-0 left-0 right-0 p-3 transition-all duration-300 ${hovered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <button onClick={handleAddToCart} className="w-full rounded-xl bg-white/90 px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-md backdrop-blur-sm transition-colors hover:bg-primary-600 hover:text-white dark:bg-dark-800/90 dark:text-white">
              Quick Add — 0.5m
            </button>
          </div>
        </div>
        {/* Content */}
        <div className="flex flex-1 flex-col p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-primary-600 dark:text-primary-400">
            {product.category?.name} · {product.bestFor?.join(', ') || 'Fabric'}
          </p>
          <h3 className="mt-1 line-clamp-2 font-semibold text-gray-900 dark:text-white">{product.name}</h3>
          {product.colors && product.colors.length > 0 ? (
            <div className="flex gap-1 mt-0.5">
              {product.colors.map((c, idx) => {
                const bgColor = c.hexCode ? (c.hexCode.startsWith('#') ? c.hexCode : `#${c.hexCode}`) : c.name || '#CCC';
                return (
                  <div key={idx} className="h-4 w-4 rounded-full border border-gray-300" style={{ backgroundColor: bgColor }} title={c.name} />
                );
              })}
            </div>
          ) : product.color ? (
            <div className="h-4 w-4 rounded-full border border-gray-300" style={{ backgroundColor: product.color.startsWith('#') ? product.color : `#${product.color}` }} title={product.color} />
          ) : null}
          <div className="mt-auto pt-3">
            <div className="flex items-center gap-1.5">
              <div className="flex">{[...Array(5)].map((_, i) => (
                <svg key={i} className={`h-3.5 w-3.5 ${i < Math.round(product.rating) ? 'stars-filled' : 'stars-empty'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}</div>
              <span className="text-xs text-gray-500 dark:text-gray-400">({product.ratingCount})</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-lg font-bold text-primary-700 dark:text-primary-400 whitespace-nowrap">
                {formatPrice(price)}
                <span className="text-xs font-normal text-gray-400">/m</span>
              </span>
              {product.discountPrice && <span className="text-sm text-gray-400 line-through">{formatPrice(product.basePrice)}</span>}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
});

export default ProductCard;
