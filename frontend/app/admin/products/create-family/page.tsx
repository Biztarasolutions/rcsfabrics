'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { buildStyleCode } from '@/lib/utils';

const EMPTY_FORM = {
  name: '',
  categoryId: '',
  code: '',
  basePrice: '',
  description: '',
  minOrderQty: '0.5',
  variants: [{ color: '', inventory: '' }],
};

export default function CreateProductFamilyPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<any>(EMPTY_FORM);
  const [styleCode, setStyleCode] = useState('');

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories-list'],
    queryFn: () => adminApi.getCategories().then(res => res.data.data || []),
  });

  const selectedCategory = categories.find((c: any) => c.id === form.categoryId);

  useEffect(() => {
    if (form.name && form.categoryId && form.code && selectedCategory) {
      setStyleCode(buildStyleCode(form.name, selectedCategory.name, form.code));
      return;
    }
    setStyleCode('');
  }, [form.name, form.categoryId, form.code, selectedCategory]);

  const createGroupMutation = useMutation({
    mutationFn: (data: any) => adminApi.createProductGroup(data),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'], exact: false });
      toast.success(data?.message || 'Product family created successfully!');
      router.push('/admin/products');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleVariantChange = (index: number, field: string, value: string) => {
    const updatedVariants = [...form.variants];
    updatedVariants[index][field] = value;
    setForm((prev: any) => ({ ...prev, variants: updatedVariants }));
  };

  const addVariant = () => {
    setForm((prev: any) => ({
      ...prev,
      variants: [...prev.variants, { color: '', inventory: '' }],
    }));
  };

  const removeVariant = (index: number) => {
    setForm((prev: any) => ({
      ...prev,
      variants: prev.variants.filter((_: any, i: number) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      styleCode,
    };
    createGroupMutation.mutate(payload);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-20 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Create Product Family</h2>
        <button onClick={() => router.back()} className="text-sm font-medium text-gray-500 hover:text-gray-900">
          Cancel & Go Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold">Parent Details</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium">Design Name *</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Polka Dot" className="input-field w-full" required />
            </div>
            
            <div>
              <label className="mb-1.5 block text-sm font-medium">Category *</label>
              <select name="categoryId" value={form.categoryId} onChange={handleChange} className="input-field w-full" required>
                <option value="">Select Category</option>
                {categories.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="mb-1.5 block text-sm font-medium">Code *</label>
              <input name="code" type="number" value={form.code} onChange={handleChange} placeholder="e.g. 10001" className="input-field w-full" required />
            </div>
            
            <div>
              <label className="mb-1.5 block text-sm font-medium">Base Price (₹/m) *</label>
              <input name="basePrice" type="number" step="0.01" value={form.basePrice} onChange={handleChange} className="input-field w-full" required />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium">Style Code (Auto-generated)</label>
              <input type="text" value={styleCode} readOnly className="input-field w-full bg-gray-50" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold">Color Variants</h3>
            <button type="button" onClick={addVariant} className="rounded border px-3 py-1 text-sm font-medium hover:bg-gray-50">
              + Add Variant
            </button>
          </div>
          
          <div className="space-y-4">
            {form.variants.map((variant: any, index: number) => (
              <div key={index} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="mb-3 flex justify-between">
                  <span className="font-semibold text-gray-700">Variant {index + 1}</span>
                  {form.variants.length > 1 && (
                    <button type="button" onClick={() => removeVariant(index)} className="text-sm text-red-600 hover:text-red-700">
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Color *</label>
                    <input value={variant.color} onChange={(e) => handleVariantChange(index, 'color', e.target.value)} placeholder="e.g. White" className="input-field w-full" required />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Inventory (m) *</label>
                    <input type="number" value={variant.inventory} onChange={(e) => handleVariantChange(index, 'inventory', e.target.value)} placeholder="e.g. 15" className="input-field w-full" required />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" disabled={createGroupMutation.isPending} className="w-full rounded-xl bg-black py-4 text-center font-bold text-white hover:bg-gray-900 disabled:opacity-50">
          {createGroupMutation.isPending ? 'Saving...' : 'Save Product Family'}
        </button>
      </form>
    </div>
  );
}
