'use client';
import React, { useState } from 'react';
import { useHomepageData } from '@/hooks/useHomepageData';

const MATERIALS = ['Silk','Cotton','Linen','Velvet','Chiffon','Satin','Wool','Khadi'];

interface ProductFiltersProps {
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  onPriceChange: (min: number, max: number) => void;
}

export default function ProductFilters({ selectedCategory, onCategoryChange, onPriceChange }: ProductFiltersProps) {
  const [maxPrice, setMaxPrice] = useState(5000);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const { data: homepageData } = useHomepageData();
  const categories = [{ name: 'All', slug: '' }, ...(homepageData?.categories || [])];

  const toggleMaterial = (m: string) => setSelectedMaterials((p) => p.includes(m) ? p.filter((x) => x !== m) : [...p, m]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">Category</h3>
        {categories.map((cat) => (
          <button key={cat.slug} onClick={() => onCategoryChange(cat.slug)}
            className={`flex w-full items-center rounded-xl px-3 py-2.5 text-sm transition-colors ${selectedCategory === cat.slug ? 'bg-primary-600 font-semibold text-white' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-700'}`}>
            {cat.name}
          </button>
        ))}
      </div>
      <div className="border-t border-gray-100 pt-6 dark:border-dark-700">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">Price / Meter</h3>
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2"><span>₹0</span><span>₹{maxPrice}</span></div>
        <input type="range" min={0} max={5000} step={100} value={maxPrice}
          onChange={(e) => { setMaxPrice(Number(e.target.value)); onPriceChange(0, Number(e.target.value)); }}
          className="w-full accent-primary-600"/>
      </div>
      <div className="border-t border-gray-100 pt-6 dark:border-dark-700">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">Material</h3>
        <div className="flex flex-wrap gap-2">
          {MATERIALS.map((m) => (
            <button key={m} onClick={() => toggleMaterial(m)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${selectedMaterials.includes(m) ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300' : 'border-gray-200 text-gray-600 hover:border-primary-400 dark:border-dark-600 dark:text-gray-400'}`}>
              {m}
            </button>
          ))}
        </div>
      </div>
      {(selectedCategory || selectedMaterials.length > 0) && (
        <div className="border-t border-gray-100 pt-4 dark:border-dark-700">
          <button onClick={() => { onCategoryChange(''); setSelectedMaterials([]); setMaxPrice(5000); onPriceChange(0, 5000); }}
            className="w-full rounded-xl border border-red-200 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400">
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
}
