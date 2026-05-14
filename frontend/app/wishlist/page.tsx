'use client';
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useWishlistStore, useCartStore } from '@/lib/store';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function WishlistPage() {
  const { items, removeItem } = useWishlistStore();
  const { addItem } = useCartStore();

  const handleMoveToCart = (item: typeof items[0]) => {
    addItem({ id: `${item.productId}-${Date.now()}`, productId: item.productId, product: item.product, quantity: 1 });
    removeItem(item.productId);
    toast.success(`${item.product.name} moved to cart!`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 py-10">
      <div className="container-main">
        <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">My Wishlist</h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">{items.length} {items.length === 1 ? 'item' : 'items'} saved</p>

        {items.length === 0 ? (
          <div className="mt-16 flex flex-col items-center justify-center py-12 text-center">
            <p className="text-7xl">❤️</p>
            <h3 className="mt-5 font-display text-2xl font-bold text-gray-900 dark:text-white">Your wishlist is empty</h3>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Save fabrics you love by clicking the heart icon on any product.</p>
            <Link href="/products" className="button-primary mt-6 px-8 py-3">Explore Fabrics</Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item, i) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-dark-700 dark:bg-dark-800">
                {/* Image */}
                <div className="relative overflow-hidden" style={{ aspectRatio: '4/5' }}>
                  <img src={item.product.images?.[0]?.url || ''} alt={item.product.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"/>
                  {/* Remove */}
                  <button onClick={() => { removeItem(item.productId); toast('Removed from wishlist'); }}
                    className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-red-500 shadow-sm backdrop-blur-sm transition-colors hover:bg-red-500 hover:text-white dark:bg-dark-800/90 dark:text-red-400">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                  </button>
                </div>
                {/* Content */}
                <div className="p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-primary-600 dark:text-primary-400">{item.product.material}</p>
                  <h3 className="mt-1 font-semibold text-gray-900 dark:text-white">{item.product.name}</h3>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-bold text-primary-700 dark:text-primary-400">
                      {formatPrice(item.product.discountPrice || item.product.basePrice)}<span className="text-xs font-normal text-gray-400">/m</span>
                    </span>
                    <span className={`text-xs font-medium ${item.product.totalStock > 10 ? 'text-green-600' : 'text-red-500'}`}>
                      {item.product.totalStock > 10 ? 'In Stock' : `Only ${item.product.totalStock}m left`}
                    </span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => handleMoveToCart(item)}
                      className="button-primary flex-1 py-2 text-sm">
                      Move to Cart
                    </button>
                    <Link href={`/products/${item.product.slug}`}
                      className="button-secondary px-3 py-2 text-sm">
                      View
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
