'use client';

import React from 'react';
import Image from 'next/image';
import { CartItem } from '@/types';
import { formatPrice } from '@/lib/utils';

interface CartSummaryProps {
  items: CartItem[];
}

export default function CartSummary({ items }: CartSummaryProps) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex gap-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-dark-700 dark:bg-dark-800"
        >
          {/* Image */}
          <div className="relative w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg dark:bg-dark-700 overflow-hidden">
            {item.product.images[0] && (
              <Image
                src={item.product.images[0].url}
                alt={item.product.name}
                fill
                className="object-cover"
              />
            )}
          </div>

          {/* Details */}
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {item.product.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {item.product.material}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-lg font-bold text-primary">
                {formatPrice(
                  item.product.discountPrice || item.product.basePrice
                )}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                × {item.quantity} m
              </span>
            </div>
          </div>

          {/* Total */}
          <div className="flex flex-col items-end justify-between">
            <span className="text-lg font-bold">
              {formatPrice(
                (item.product.discountPrice || item.product.basePrice) *
                  item.quantity
              )}
            </span>
            <button className="text-red-500 hover:text-red-700 text-sm">
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
