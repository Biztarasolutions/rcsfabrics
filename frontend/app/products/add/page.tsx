import React from "react";
import ProductForm from "@/components/products/ProductForm";

// This page renders the ProductForm component for adding a new product.
// It follows the Next.js App Router conventions: the file is placed at
// `app/products/add/page.tsx`, which maps to the `/products/add` route.

export default function AddProductPage() {
  return (
    <section className="flex flex-col items-center min-h-screen bg-gray-50 py-8">
      {/* You can wrap the form in a container with some styling */}
      <div className="w-full max-w-2xl bg-white p-6 rounded-lg shadow-md">
        <ProductForm />
      </div>
    </section>
  );
}
