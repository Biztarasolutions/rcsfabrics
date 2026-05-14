'use client';
import React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/lib/store';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function CartSidebar() {
  const { items, isOpen, closeCart, removeItem, updateQty, totalPrice } = useCartStore();
  const subtotal = totalPrice();
  const shipping = subtotal >= 2000 ? 0 : 150;
  const total = subtotal + shipping;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl dark:bg-dark-900"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-dark-800">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                </svg>
                <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white">Your Cart</h2>
                {items.length > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-[11px] font-bold text-white">
                    {items.length}
                  </span>
                )}
              </div>
              <button onClick={closeCart}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-dark-800 dark:hover:text-gray-200 transition-colors">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Items */}
            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-5 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-50 dark:bg-dark-800">
                  <svg className="h-10 w-10 text-gray-300 dark:text-dark-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Your cart is empty</p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Add fabrics you love to get started</p>
                </div>
                <Link href="/products" onClick={closeCart} className="button-primary px-8 py-3">
                  Browse Fabrics
                </Link>
              </div>
            ) : (
              <>
                {/* Cart Items List */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                  <AnimatePresence initial={false}>
                    {items.map((item) => {
                      const price = item.product.discountPrice || item.product.basePrice;
                      return (
                        <motion.div key={item.id}
                          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }} layout
                          className="flex gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-dark-700 dark:bg-dark-800">
                          {/* Thumbnail */}
                          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-dark-700">
                            {item.product.images?.[0] && (
                              <img src={item.product.images[0].url} alt={item.product.name}
                                className="h-full w-full object-cover"/>
                            )}
                          </div>
                          {/* Info */}
                          <div className="flex flex-1 flex-col justify-between min-w-0">
                            <div className="flex items-start justify-between gap-1">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{item.product.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{formatPrice(price)}/m</p>
                              </div>
                              <button onClick={() => { removeItem(item.id); toast('Removed from cart'); }}
                                className="ml-1 shrink-0 text-gray-300 hover:text-red-400 transition-colors">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                              </button>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              {/* Qty controls */}
                              <div className="flex items-center overflow-hidden rounded-lg border border-gray-200 dark:border-dark-600">
                                <button onClick={() => updateQty(item.id, Math.max(item.product.minOrderQty || 0.5, item.quantity - 0.5))}
                                  className="flex h-6 w-6 items-center justify-center text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-dark-700 transition-colors text-xs font-bold">
                                  −
                                </button>
                                <span className="w-10 text-center text-xs font-semibold text-gray-800 dark:text-white">
                                  {item.quantity}m
                                </span>
                                <button onClick={() => updateQty(item.id, item.quantity + 0.5)}
                                  className="flex h-6 w-6 items-center justify-center text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-dark-700 transition-colors text-xs font-bold">
                                  +
                                </button>
                              </div>
                              <span className="text-sm font-bold text-primary-700 dark:text-primary-400">
                                {formatPrice(price * item.quantity)}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-100 px-5 py-5 dark:border-dark-800 space-y-4">
                  {/* Free shipping progress */}
                  {subtotal < 2000 && (
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                        <span>Add {formatPrice(2000 - subtotal)} more for free shipping</span>
                        <span>{Math.round((subtotal / 2000) * 100)}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-dark-700 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500"
                          style={{ width: `${Math.min((subtotal / 2000) * 100, 100)}%` }}/>
                      </div>
                    </div>
                  )}
                  {subtotal >= 2000 && (
                    <p className="text-center text-xs font-semibold text-green-600 dark:text-green-400">🎁 You qualify for free shipping!</p>
                  )}

                  {/* Totals */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                      <span>Subtotal</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                      <span>Shipping</span>
                      <span className={`font-medium ${shipping === 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                        {shipping === 0 ? 'Free' : formatPrice(shipping)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-gray-100 pt-2 dark:border-dark-700 font-bold text-gray-900 dark:text-white">
                      <span>Total</span>
                      <span className="text-primary-700 dark:text-primary-400">{formatPrice(total)}</span>
                    </div>
                  </div>

                  {/* CTAs */}
                  <div className="space-y-2">
                    <Link href="/checkout" onClick={closeCart}
                      className="button-luxury block w-full py-3.5 text-center font-semibold">
                      🔒 Checkout · {formatPrice(total)}
                    </Link>
                    <Link href="/cart" onClick={closeCart}
                      className="block w-full py-2.5 text-center text-sm font-medium text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors">
                      View Full Cart
                    </Link>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
