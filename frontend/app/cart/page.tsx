'use client';
import React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/lib/store';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function CartPage() {
  const { items, removeItem, updateQty, clearCart, totalPrice } = useCartStore();
  const subtotal = totalPrice();
  const shipping = subtotal >= 2000 ? 0 : 150;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white py-24 text-center dark:bg-dark-950">
        <p className="text-7xl">🛒</p>
        <h2 className="mt-5 font-display text-3xl font-bold text-gray-900 dark:text-white">Your cart is empty</h2>
        <p className="mt-2 text-gray-500 dark:text-gray-400">Explore our premium fabric collection and fill it up!</p>
        <Link href="/products" className="button-primary mt-8 px-10 py-3.5">Browse Fabrics</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      <div className="border-b border-gray-100 bg-white dark:border-dark-800 dark:bg-dark-900">
        <div className="container-main py-8">
          <h1 className="font-display text-4xl font-bold text-gray-900 dark:text-white">Shopping Cart</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">{items.length} {items.length === 1 ? 'item' : 'items'}</p>
        </div>
      </div>

      <div className="container-main py-10">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence>
              {items.map((item) => {
                const price = item.product.discountPrice || item.product.basePrice;
                const lineTotal = price * item.quantity;
                return (
                  <motion.div key={item.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }} layout
                    className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-dark-700 dark:bg-dark-800 sm:p-5">
                    {/* Image */}
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-50 dark:bg-dark-700 sm:h-28 sm:w-28">
                      {item.product.images?.[0] && (
                        <img src={item.product.images[0].url} alt={item.product.name}
                          className="h-full w-full object-cover"/>
                      )}
                    </div>
                    {/* Details */}
                    <div className="flex flex-1 flex-col gap-2 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wider text-primary-600 dark:text-primary-400">{item.product.bestFor?.join(', ') || item.product.category?.name}</p>
                          <h3 className="font-semibold text-gray-900 dark:text-white leading-tight">{item.product.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{formatPrice(price)}/m</p>
                        </div>
                        <button onClick={() => { removeItem(item.id); toast('Item removed'); }}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                      </div>
                      <div className="flex items-center justify-between gap-3 mt-auto">
                        {/* Quantity */}
                        <div className="flex items-center overflow-hidden rounded-lg border border-gray-200 dark:border-dark-600">
                          <button onClick={() => updateQty(item.id, Math.max(item.product.minOrderQty || 0.5, item.quantity - 0.5))}
                            className="flex h-8 w-8 items-center justify-center text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-700 transition-colors font-bold">−</button>
                          <span className="w-12 text-center text-sm font-semibold text-gray-900 dark:text-white">{item.quantity}m</span>
                          <button onClick={() => updateQty(item.id, item.quantity + 0.5)}
                            className="flex h-8 w-8 items-center justify-center text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-700 transition-colors font-bold">+</button>
                        </div>
                        <span className="font-bold text-gray-900 dark:text-white">{formatPrice(lineTotal)}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Clear cart */}
            <div className="flex justify-end">
              <button onClick={() => { clearCart(); toast('Cart cleared'); }}
                className="text-sm font-medium text-red-500 hover:text-red-600 hover:underline dark:text-red-400">
                Clear Cart
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="sticky top-24 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-dark-700 dark:bg-dark-800">
              <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white">Order Summary</h2>

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Subtotal ({items.length} items)</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Shipping</span>
                  <span className={shipping === 0 ? 'font-medium text-green-600 dark:text-green-400' : 'font-medium text-gray-900 dark:text-white'}>
                    {shipping === 0 ? '🎁 Free' : formatPrice(shipping)}
                  </span>
                </div>
                {subtotal < 2000 && (
                  <p className="rounded-lg bg-primary-50 px-3 py-2 text-xs text-primary-700 dark:bg-primary-950/30 dark:text-primary-400">
                    Add {formatPrice(2000 - subtotal)} more for free shipping!
                  </p>
                )}
                <div className="flex justify-between border-t border-gray-100 pt-4 dark:border-dark-700">
                  <span className="text-base font-bold text-gray-900 dark:text-white">Total</span>
                  <span className="text-xl font-bold text-primary-700 dark:text-primary-400">{formatPrice(total)}</span>
                </div>
              </div>

              <Link href="/checkout" className="button-luxury mt-5 block w-full py-4 text-center font-semibold text-base">
                🔒 Proceed to Checkout
              </Link>
              <Link href="/products" className="mt-3 block text-center text-sm font-medium text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors">
                ← Continue Shopping
              </Link>

              {/* Trust row */}
              <div className="mt-5 flex flex-col gap-1.5 border-t border-gray-100 pt-4 dark:border-dark-700">
                {['🔒 Secure 256-bit SSL checkout', '✅ 100% authentic fabrics', '↩️ 30-day hassle-free returns'].map((t) => (
                  <span key={t} className="text-xs text-gray-500 dark:text-gray-400">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
