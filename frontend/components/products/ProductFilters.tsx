'use client';
import React, { useEffect, useState } from 'react';
import { useHomepageData } from '@/hooks/useHomepageData';

export interface FilterValues {
  category: string;
  color: string[];
  pattern: string[];
  stretch: string[];
  maxPrice: number | null;
  inStock: boolean;
}

export interface Facets {
  colors: string[];
  patterns: string[];
  stretch: string[];
  maxPrice: number;
}

/**
 * Sidebar filters. Every option comes from real products (fabric type = category,
 * colour, pattern, stretch and price), so each one actually narrows the list.
 */
export default function ProductFilters({
  values,
  facets,
  onChange,
}: {
  values: FilterValues;
  facets?: Facets;
  onChange: (patch: Partial<Record<'category' | 'color' | 'pattern' | 'stretch' | 'maxPrice' | 'inStock', string>>) => void;
}) {
  const { data: homepageData } = useHomepageData();
  const categories = [{ name: 'All fabrics', slug: '' }, ...(homepageData?.categories || [])];
  const ceiling = Math.max(100, facets?.maxPrice || 1000);

  // Slider moves freely; the list updates once the customer stops dragging
  const [price, setPrice] = useState<number>(values.maxPrice ?? ceiling);
  useEffect(() => setPrice(values.maxPrice ?? ceiling), [values.maxPrice, ceiling]);
  useEffect(() => {
    const current = values.maxPrice ?? ceiling;
    if (price === current) return;
    const t = setTimeout(() => onChange({ maxPrice: price >= ceiling ? '' : String(price) }), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [price]);

  const toggle = (key: 'color' | 'pattern' | 'stretch', v: string) => {
    const cur = values[key];
    const next = cur.some((x) => x.toLowerCase() === v.toLowerCase()) ? cur.filter((x) => x.toLowerCase() !== v.toLowerCase()) : [...cur, v];
    onChange({ [key]: next.join(',') });
  };

  const active = !!values.category || values.color.length + values.pattern.length + values.stretch.length > 0 || values.maxPrice !== null || values.inStock;

  const Chips = ({ title, keyName, options }: { title: string; keyName: 'color' | 'pattern' | 'stretch'; options: string[] }) =>
    options.length ? (
      <div className="border-t border-gray-100 pt-6 dark:border-dark-700">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">{title}</h3>
        <div className="flex flex-wrap gap-2">
          {options.map((o) => {
            const on = values[keyName].some((x) => x.toLowerCase() === o.toLowerCase());
            return (
              <button key={o} type="button" onClick={() => toggle(keyName, o)} aria-pressed={on}
                className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors ${on ? 'border-primary-600 bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300' : 'border-gray-200 text-gray-600 hover:border-primary-400 dark:border-dark-600 dark:text-gray-400'}`}>
                {o}
              </button>
            );
          })}
        </div>
      </div>
    ) : null;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">Fabric type</h3>
        {categories.map((cat: any) => (
          <button key={cat.slug} type="button" onClick={() => onChange({ category: cat.slug })}
            className={`flex w-full items-center rounded-xl px-3 py-2.5 text-sm transition-colors ${values.category === cat.slug ? 'bg-primary-600 font-semibold text-white' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-700'}`}>
            {cat.name}
          </button>
        ))}
      </div>

      <Chips title="Colour" keyName="color" options={facets?.colors || []} />
      <Chips title="Pattern" keyName="pattern" options={facets?.patterns || []} />
      <Chips title="Stretch" keyName="stretch" options={facets?.stretch || []} />

      <div className="border-t border-gray-100 pt-6 dark:border-dark-700">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">Price / Metre</h3>
        <div className="mb-2 flex justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>₹0</span><span>{price >= ceiling ? `Up to ₹${ceiling}+` : `Up to ₹${price}`}</span>
        </div>
        <input type="range" min={0} max={ceiling} step={ceiling > 1000 ? 100 : 25} value={Math.min(price, ceiling)}
          onChange={(e) => setPrice(Number(e.target.value))} aria-label="Maximum price per metre"
          className="w-full accent-primary-600" />
      </div>

      <div className="border-t border-gray-100 pt-6 dark:border-dark-700">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">Availability</h3>
        <label className="flex cursor-pointer items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
          <input type="checkbox" checked={values.inStock} onChange={(e) => onChange({ inStock: e.target.checked ? '1' : '' })}
            className="h-5 w-5 rounded border-gray-300 accent-primary-700" />
          In stock only
        </label>
      </div>

      {active && (
        <div className="border-t border-gray-100 pt-4 dark:border-dark-700">
          <button type="button" onClick={() => onChange({ category: '', color: '', pattern: '', stretch: '', maxPrice: '', inStock: '' })}
            className="w-full rounded-xl border border-red-200 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400">
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
