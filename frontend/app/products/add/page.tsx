'use client';

import ProductFormAdvanced from '@/components/products/ProductFormAdvanced';

export default function AddProductPage() {
  return (
    <section className="flex flex-col items-center min-h-screen bg-gray-50 py-8">
      <div className="w-full max-w-4xl bg-white p-6 rounded-lg shadow-md">
        <ProductFormAdvanced />
      </div>
    </section>
  );
}
