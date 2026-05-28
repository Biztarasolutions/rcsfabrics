'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Product } from '@/types';
import { formatPrice, calculateDiscount } from '@/lib/utils';
import toast from 'react-hot-toast';

interface ProductInfoProps {
  product: Product;
  quantity: number;
  onQuantityChange: (qty: number) => void;
  onAddToCart: () => void;
}

export default function ProductInfo({
  product,
  quantity,
  onQuantityChange,
  onAddToCart,
}: ProductInfoProps) {
  const discountPercent = product.discountPrice
    ? calculateDiscount(product.basePrice, product.discountPrice)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Title and Rating */}
      <div>
        <h1 className="font-display text-4xl font-bold">{product.name}</h1>
        <div className="mt-4 flex items-center gap-4">
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                className={`text-lg ${
                  i < Math.round(product.rating)
                    ? 'text-yellow-400'
                    : 'text-gray-300'
                }`}
              >
                ★
              </span>
            ))}
          </div>
          <span className="text-gray-600 dark:text-gray-400">
            {product.ratingCount} reviews
          </span>
        </div>
      </div>

      {/* Price */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-4xl font-bold text-primary">
            {formatPrice(product.discountPrice || product.basePrice)}
          </span>
          {product.discountPrice && (
            <span className="text-xl line-through text-gray-500">
              {formatPrice(product.basePrice)}
            </span>
          )}
        </div>
        {discountPercent > 0 && (
          <p className="text-green-600 font-semibold">
            Save {discountPercent}% - Limited Time
          </p>
        )}
      </div>

      {/* Description */}
      <p className="text-gray-700 dark:text-gray-300 text-lg">
        {product.description}
      </p>

      {/* Quantity Selector */}
      <div className="space-y-2">
        <label className="text-sm font-semibold">Quantity (in meters)</label>
        <div className="flex items-center gap-4">
          <input
            type="number"
            min={product.minOrderQty || 0.5}
            step="0.5"
            value={quantity}
            onChange={(e) => onQuantityChange(parseFloat(e.target.value))}
            className="w-24 rounded-lg border border-gray-300 px-4 py-2 dark:border-dark-700 dark:bg-dark-800"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {quantity * (product.discountPrice || product.basePrice) >
            999999 ? '₹' + (quantity * (product.discountPrice || product.basePrice)).toLocaleString('en-IN', {maximumFractionDigits: 2}) : formatPrice(quantity * (product.discountPrice || product.basePrice))}
          </span>
        </div>
        <p className="text-xs text-gray-500">
          Minimum order: {product.minOrderQty} meter(s)
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={onAddToCart}
          className="button-primary flex-1 px-6 py-3 text-lg"
        >
          Add to Cart
        </button>
        <button
          className="button-secondary px-6 py-3 text-lg"
          onClick={() => toast.success('Added to wishlist!')}
        >
          ♡ Wishlist
        </button>
      </div>

      {/* Stock Status */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-dark-700 dark:bg-dark-800">
        <p className="text-sm">
          <span className="font-semibold">Stock Available:</span>{' '}
          {(product.totalStock ?? 0) > 10
            ? `${product.totalStock ?? 0} meters`
            : `Only ${product.totalStock ?? 0} meters left!`}
        </p>
      </div>

      {/* Trust Badges */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-dark-700">
        <div className="text-center">
          <p className="text-2xl">✓</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Free Shipping
          </p>
        </div>
        <div className="text-center">
          <p className="text-2xl">✓</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            30-Day Returns
          </p>
        </div>
        <div className="text-center">
          <p className="text-2xl">✓</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            100% Authentic
          </p>
        </div>
      </div>
    </motion.div>
  );
}
