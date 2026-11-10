'use client';
import React from 'react';
import { useWishlistStore } from '@/lib/store';
import WishlistGrid from '@/components/wishlist/WishlistGrid';

export default function WishlistPage() {
  const count = useWishlistStore((s) => s.items.length);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 py-10">
      <div className="container-main">
        <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">My Wishlist</h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">{count} {count === 1 ? 'item' : 'items'} saved</p>
        <WishlistGrid />
      </div>
    </div>
  );
}
