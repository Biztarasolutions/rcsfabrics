'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ProductImage } from '@/types';

interface ProductImageGalleryProps {
  images: ProductImage[];
}

export default function ProductImageGallery({ images }: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = images[selectedIndex] || images[0];

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative bg-gray-100 dark:bg-dark-700 rounded-lg overflow-hidden aspect-square">
        {selected && (
          <Image
            src={selected.url}
            alt={selected.alt || 'Product image'}
            fill
            className="object-cover"
            priority
          />
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={`relative aspect-square rounded-lg overflow-hidden border-2 transition ${
                index === selectedIndex
                  ? 'border-primary'
                  : 'border-gray-200 dark:border-dark-700 hover:border-gray-300'
              }`}
            >
              <Image
                src={image.url}
                alt={`Thumbnail ${index}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
