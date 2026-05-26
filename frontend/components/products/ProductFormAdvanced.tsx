'use client';
import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { buildStyleCode, extractDesignName } from '@/lib/utils';

const COLOR_NAME_TO_HEX: Record<string, string> = {
  RED: '#FF0000',
  PINK: '#FFC0CB',
  ORANGE: '#FFA500',
  YELLOW: '#FFFF00',
  GREEN: '#008000',
  BLUE: '#0000FF',
  PURPLE: '#800080',
  MAGENTA: '#FF00FF',
  CYAN: '#00FFFF',
  TEAL: '#008080',
  BROWN: '#A52A2A',
  BLACK: '#000000',
  WHITE: '#FFFFFF',
  GRAY: '#808080',
  NAVY: '#000080',
  BEIGE: '#F5F5DC',
  CORAL: '#FF7F50',
  GOLD: '#FFD700',
  SILVER: '#C0C0C0',
  LAVENDER: '#E6E6FA',
  MINT: '#98FF98',
  MAROON: '#800000',
};

const HEX_TO_COLOR_NAME = Object.fromEntries(
  Object.entries(COLOR_NAME_TO_HEX).map(([name, hex]) => [hex.toUpperCase(), name])
);

const normalizeHex = (value: string) => {
  const cleaned = value.trim();
  if (!cleaned) return '#000000';
  return cleaned.startsWith('#') ? cleaned.toUpperCase() : `#${cleaned.toUpperCase()}`;
};

const EMPTY_FORM = {
  name: '',
  categoryId: '',
  code: '',
  basePrice: '',
  discountType: 'percentage',
  discountValue: '',
  width: '',
  pattern: '',
  workType: 'Plain',
  stretchability: 'Non-Stretch',
  minOrderQty: '0.5',
  colors: [{ name: '', hexCode: '#000000', inventory: '' }],
};

interface ProductFormAdvancedProps {
  /** When provided, the form works in edit mode */
  initialData?: any;
  /** Called after successful save (create or edit) to close modal */
  onClose?: () => void;
}

export default function ProductFormAdvanced({ initialData, onClose }: ProductFormAdvancedProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<any>(EMPTY_FORM);
  const [styleCode, setStyleCode] = useState('');

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories-list'],
    queryFn: () => adminApi.getCategories().then(res => res.data.data || []),
  });

  // Load initial data for edit mode
  useEffect(() => {
    if (initialData) {
      // Find the category to clean the name if needed
      const cat = categories.find((c: any) => c.id === initialData.categoryId);
      const catName = cat?.name || '';
      let cleanedName = initialData.name || '';
      if (catName && initialData.code) {
        cleanedName = extractDesignName(cleanedName, catName, initialData.code);
      }

      // Populate form with existing product fields (excluding read‑only derived fields)
      setForm({
        ...EMPTY_FORM,
        ...initialData,
        name: cleanedName,
        // Ensure colors array exists and includes productCode and inventory
        colors: initialData.colors?.map((c: any) => ({
          name: c.name,
          hexCode: c.hexCode,
          productCode: c.productCode,
          inventory: String(initialData.totalStock || ''),
        })) || [{ name: '', hexCode: '#000000', inventory: '' }],
      });
    }
  }, [initialData, categories]);

  const selectedCategory = categories.find((c: any) => c.id === form.categoryId);

  useEffect(() => {
    if (form.name && form.categoryId && form.code && selectedCategory) {
      setStyleCode(buildStyleCode(form.name, selectedCategory.name, form.code));
      return;
    }
    setStyleCode('');
  }, [form.name, form.categoryId, form.code, selectedCategory]);

  const createMutation = useMutation({
    mutationFn: (data: any) => adminApi.createProduct(data),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'], exact: false });
      toast.success(data?.message || 'Product created successfully!');
      setForm(EMPTY_FORM);
      setStyleCode('');
      onClose?.();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => adminApi.updateProduct(initialData?.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'], exact: false });
      toast.success('Product updated successfully!');
      setForm(EMPTY_FORM);
      setStyleCode('');
      onClose?.();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev: any) => ({ ...prev, [name]: value }));
  };
  const handleColorChange = (index: number, field: string, value: string) => {
    const updatedColors = [...form.colors];
    const currentColor = { ...updatedColors[index] };
    if (field === 'name') {
      currentColor.name = value;
      const normalizedName = value.trim().toUpperCase();
      const mappedHex = COLOR_NAME_TO_HEX[normalizedName];
      if (mappedHex) {
        currentColor.hexCode = mappedHex;
      }
    } else if (field === 'hexCode') {
      const normalizedHex = normalizeHex(value);
      currentColor.hexCode = normalizedHex;
      const mappedName = HEX_TO_COLOR_NAME[normalizedHex];
      if (mappedName) {
        currentColor.name = mappedName;
      }
    } else {
      currentColor[field] = value;
    }
    updatedColors[index] = currentColor;
    setForm((prev: any) => ({ ...prev, colors: updatedColors }));
  };

  const addColor = () => {
    setForm((prev: any) => ({
      ...prev,
      colors: [...prev.colors, { name: '', hexCode: '#000000', inventory: '' }],
    }));
  };

  const removeColor = (index: number) => {
    setForm((prev: any) => ({
      ...prev,
      colors: prev.colors.filter((_: any, i: number) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      basePrice: Number(form.basePrice),
      discountValue: form.discountValue ? Number(form.discountValue) : undefined,
      width: form.width ? Number(form.width) : undefined,
      code: form.code ? Number(form.code) : undefined,
      minOrderQty: Number(form.minOrderQty),
      styleCode,
    };
    if (initialData) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-dark-700 dark:bg-dark-800">
        <h3 className="mb-6 text-lg font-bold">Product Information</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Name */}
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium">Product Name *</label>
            <input name="name" value={form.name} onChange={handleChange} placeholder="e.g., Royal Banarasi Silk" className="input-field" required />
          </div>
          {/* Category */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">Category *</label>
            <select name="categoryId" value={form.categoryId} onChange={handleChange} className="input-field" required>
              <option value="">Select Category</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          {selectedCategory && (
            <div className="sm:col-span-2 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-dark-700 dark:bg-dark-700/40 dark:text-gray-300">
              <p className="font-semibold text-gray-800 dark:text-gray-100">Category details</p>
              <p className="mt-2"><span className="font-medium">Description:</span> {selectedCategory.description || 'No description available'}</p>
              <p className="mt-2"><span className="font-medium">Best For:</span> {selectedCategory.bestFor?.length ? selectedCategory.bestFor.join(', ') : 'Not set'}</p>
              <p className="mt-2"><span className="font-medium">Properties:</span> {selectedCategory.properties?.length ? selectedCategory.properties.join(', ') : 'Not set'}</p>
            </div>
          )}
          {/* Code */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">Code (Number) *</label>
            <input name="code" type="number" value={form.code} onChange={handleChange} placeholder="e.g., 101" className="input-field" required />
          </div>
          {/* Style Code Display */}
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium">Style Code (Auto-generated)</label>
            <input type="text" value={styleCode} readOnly placeholder="Generated automatically" className="input-field bg-gray-50 dark:bg-dark-700" />
            <p className="mt-1 text-xs text-gray-500">Format: Name-Category-Code (e.g. Polka Dot-Satin-P10001)</p>
          </div>
          {/* Pattern */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">Pattern</label>
            <input name="pattern" value={form.pattern} onChange={handleChange} placeholder="e.g., Zari Brocade" className="input-field" />
          </div>
          {/* Width */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">Width (inches)</label>
            <input name="width" type="number" step="0.1" value={form.width} onChange={handleChange} placeholder="e.g., 44" className="input-field" />
          </div>
          {/* Work Type */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">Work Type</label>
            <select name="workType" value={form.workType} onChange={handleChange} className="input-field">
              <option value="Plain">Plain</option>
              <option value="Printed">Printed</option>
              <option value="Embroidered">Embroidered</option>
            </select>
          </div>
          {/* Stretchability */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">Stretchability *</label>
            <select name="stretchability" value={form.stretchability} onChange={handleChange} className="input-field" required>
              <option value="Stretch">Stretch</option>
              <option value="Non-Stretch">Non-Stretch</option>
            </select>
          </div>
          {/* Base Price */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">Base Price (₹/m) *</label>
            <input name="basePrice" type="number" step="0.01" value={form.basePrice} onChange={handleChange} placeholder="e.g., 1850" className="input-field" required />
          </div>
          {/* Discount Type & Value */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">Discount Type</label>
            <select name="discountType" value={form.discountType} onChange={handleChange} className="input-field">
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed (₹)</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Discount Value</label>
            <input name="discountValue" type="number" step="0.01" value={form.discountValue} onChange={handleChange} placeholder={form.discountType === 'percentage' ? 'e.g., 20' : 'e.g., 300'} className="input-field" />
          </div>

          {/* Min Order */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">Min Order (m)</label>
            <input name="minOrderQty" type="number" step="0.5" value={form.minOrderQty} onChange={handleChange} placeholder="e.g., 0.5" className="input-field" />
          </div>
        </div>
      </div>

      {/* Colors Section */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-dark-700 dark:bg-dark-800">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold">Color Variants</h3>
            <p className="text-sm text-gray-500">
              {initialData ? "Editing the current variant." : "Add product colors after Name, Category, and Code are set."}
            </p>
          </div>
          {!initialData && (
            <button
              type="button"
              onClick={addColor}
              disabled={!form.name || !form.categoryId || !form.code}
              className="button-secondary px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              + Add Color
            </button>
          )}
        </div>
        <div className="space-y-4">
          {form.colors.map((color: any, index: number) => (
            <div key={index} className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-dark-700 dark:bg-dark-700/50">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium">Color {index + 1}</span>
                {form.colors.length > 1 && (
                  <button type="button" onClick={() => removeColor(index)} className="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400">
                    Remove
                  </button>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium">Color Name *</label>
                  <input type="text" value={color.name} onChange={(e) => handleColorChange(index, 'name', e.target.value)} placeholder="e.g., Red" className="input-field" required />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium">Hex Code</label>
                  <div className="flex gap-2">
                    <input type="color" value={color.hexCode} onChange={(e) => handleColorChange(index, 'hexCode', e.target.value)} className="h-10 w-12 rounded-lg border border-gray-200 dark:border-dark-600" />
                    <input type="text" value={color.hexCode} onChange={(e) => handleColorChange(index, 'hexCode', e.target.value)} placeholder="#000000" className="input-field flex-1" />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium">Inventory (m) *</label>
                  <input type="number" step="0.5" value={color.inventory || ''} onChange={(e) => handleColorChange(index, 'inventory', e.target.value)} placeholder="e.g., 25" className="input-field" required />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="button-primary flex-1 py-3">
          {createMutation.isPending || updateMutation.isPending ? (initialData ? 'Updating...' : 'Creating...') : (initialData ? 'Update Product' : 'Create Product')}
        </button>
      </div>
    </form>
  );
}
