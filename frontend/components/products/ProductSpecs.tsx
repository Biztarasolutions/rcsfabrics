'use client';

import React from 'react';
import { Product } from '@/types';

interface ProductSpecsProps {
  product: Product;
}

export default function ProductSpecs({ product }: ProductSpecsProps) {
  const specs = [
    { label: 'Best For', value: product.bestFor?.join(', ') || 'N/A' },
    { label: 'Properties', value: product.properties?.join(', ') || 'N/A' },
    { label: 'Weight (GSM)', value: product.gsm ? `${product.gsm} gsm` : 'N/A' },
    { label: 'Width', value: product.width ? `${product.width} cm` : 'N/A' },
    { label: 'Pattern', value: product.pattern || 'Plain' },
    { label: 'Color', value: product.color },
    { label: 'Stretchability', value: product.stretchability },
  ];

  return (
    <div className="mt-8 space-y-4">
      {specs.map((spec) => (
        <div
          key={spec.label}
          className="grid grid-cols-2 gap-4 border-b border-gray-200 pb-4 dark:border-dark-700"
        >
          <span className="font-semibold text-gray-900 dark:text-white">
            {spec.label}
          </span>
          <span className="text-gray-700 dark:text-gray-300">{spec.value}</span>
        </div>
      ))}
    </div>
  );
}
