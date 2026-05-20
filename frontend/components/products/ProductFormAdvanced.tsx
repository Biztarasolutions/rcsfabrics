'use client';
import React, { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  name: '',
  categoryId: '',
  code: '',
  basePrice: '',
  discountType: 'percentage',
  discountValue: '',
  material: '',
  gsm: '',
  width: '',
  pattern: '',
  occasion: '',
  workType: 'Plain',
  color: '',
  stretchability: 'Non-Stretch',
  usage: '',
  washCare: '',
  totalStock: '',
  minOrderQty: '0.5',
  description: '',
  colors: [{ name: '', hexCode: '#000000', folderUrl: '', productCode: '' }],
};

export default function ProductFormAdvanced() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<any>(EMPTY_FORM);
  const [styleCode, setStyleCode] = useState('');

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories-list'],
    queryFn: () => adminApi.getCategories().then(res => res.data.data || []),
  });

  // Auto-generate style code when name or category changes
  useMemo(() => {
    if (form.name && form.categoryId) {
      const selectedCategory = categories.find((c: any) => c.id === form.categoryId);
      if (selectedCategory) {
        const code = `${form.name.substring(0, 3).toUpperCase()}-${selectedCategory.name.substring(0, 3).toUpperCase()}`;
        setStyleCode(code);
      }
    }
  }, [form.name, form.categoryId, categories]);

  const mutation = useMutation({
    mutationFn: (data: any) => adminApi.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product created successfully!');
      setForm(EMPTY_FORM);
      setStyleCode('');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleColorChange = (index: number, field: string, value: string) => {
    const updatedColors = [...form.colors];
    updatedColors[index] = { ...updatedColors[index], [field]: value };
    setForm((prev: any) => ({ ...prev, colors: updatedColors }));
  };

  const addColor = () => {
    setForm((prev: any) => ({
      ...prev,
      colors: [...prev.colors, { name: '', hexCode: '#000000', folderUrl: '', productCode: '' }],
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
      totalStock: Number(form.totalStock),
      gsm: form.gsm ? Number(form.gsm) : undefined,
      width: form.width ? Number(form.width) : undefined,
      code: form.code ? Number(form.code) : undefined,
      minOrderQty: Number(form.minOrderQty),
      styleCode,
      folderUrl: undefined,
    };
    mutation.mutate(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-dark-700 dark:bg-dark-800">
        <h3 className="mb-6 text-lg font-bold">Product Information</h3>
        
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Name */}
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium">Product Name *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g., Royal Banarasi Silk"
              className="input-field"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">Category *</label>
            <select name="categoryId" value={form.categoryId} onChange={handleChange} className="input-field" required>
              <option value="">Select Category</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Code */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">Code (Number)</label>
            <input
              name="code"
              type="number"
              value={form.code}
              onChange={handleChange}
              placeholder="e.g., 101"
              className="input-field"
            />
          </div>

          {/* Style Code Display */}
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium">Style Code (Auto-generated)</label>
            <input
              type="text"
              value={styleCode}
              readOnly
              placeholder="Generated automatically"
              className="input-field bg-gray-50 dark:bg-dark-700"
            />
            <p className="mt-1 text-xs text-gray-500">Format: Name-Category</p>
          </div>

          {/* Material */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">Material *</label>
            <input
              name="material"
              value={form.material}
              onChange={handleChange}
              placeholder="e.g., Silk"
              className="input-field"
              required
            />
          </div>

          {/* Pattern */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">Pattern</label>
            <input
              name="pattern"
              value={form.pattern}
              onChange={handleChange}
              placeholder="e.g., Zari Brocade"
              className="input-field"
            />
          </div>

          {/* Occasion */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">Occasion</label>
            <input
              name="occasion"
              value={form.occasion}
              onChange={handleChange}
              placeholder="e.g., Wedding, Party"
              className="input-field"
            />
          </div>

          {/* Width */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">Width (inches)</label>
            <input
              name="width"
              type="number"
              step="0.1"
              value={form.width}
              onChange={handleChange}
              placeholder="e.g., 44"
              className="input-field"
            />
          </div>

          {/* GSM */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">GSM</label>
            <input
              name="gsm"
              type="number"
              value={form.gsm}
              onChange={handleChange}
              placeholder="e.g., 120"
              className="input-field"
            />
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
            <input
              name="basePrice"
              type="number"
              step="0.01"
              value={form.basePrice}
              onChange={handleChange}
              placeholder="e.g., 1850"
              className="input-field"
              required
            />
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
            <input
              name="discountValue"
              type="number"
              step="0.01"
              value={form.discountValue}
              onChange={handleChange}
              placeholder={form.discountType === 'percentage' ? 'e.g., 20' : 'e.g., 300'}
              className="input-field"
            />
          </div>

          {/* Stock */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">Total Stock (meters) *</label>
            <input
              name="totalStock"
              type="number"
              step="0.5"
              value={form.totalStock}
              onChange={handleChange}
              placeholder="e.g., 50"
              className="input-field"
              required
            />
          </div>

          {/* Min Order */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">Min Order (m)</label>
            <input
              name="minOrderQty"
              type="number"
              step="0.5"
              value={form.minOrderQty}
              onChange={handleChange}
              placeholder="e.g., 0.5"
              className="input-field"
            />
          </div>

          {/* Usage */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">Usage</label>
            <input
              name="usage"
              value={form.usage}
              onChange={handleChange}
              placeholder="e.g., Sarees, Dupattas"
              className="input-field"
            />
          </div>

          {/* Wash Care */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">Wash Care</label>
            <textarea
              name="washCare"
              value={form.washCare}
              onChange={handleChange}
              placeholder="e.g., Dry clean only"
              className="input-field"
              rows={2}
            />
          </div>

          {/* Description */}
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Product description..."
              className="input-field"
              rows={3}
            />
          </div>

        </div>
      </div>

      {/* Colors Section */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-dark-700 dark:bg-dark-800">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">Color Variants</h3>
          <button
            type="button"
            onClick={addColor}
            className="button-secondary px-3 py-1.5 text-sm"
          >
            + Add Color
          </button>
        </div>

        <div className="space-y-4">
          {form.colors.map((color: any, index: number) => (
            <div key={index} className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-dark-700 dark:bg-dark-700/50">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium">Color {index + 1}</span>
                {form.colors.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeColor(index)}
                    className="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium">Color Name *</label>
                  <input
                    type="text"
                    value={color.name}
                    onChange={(e) => handleColorChange(index, 'name', e.target.value)}
                    placeholder="e.g., Red"
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium">Hex Code</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={color.hexCode}
                      onChange={(e) => handleColorChange(index, 'hexCode', e.target.value)}
                      className="h-10 w-12 rounded-lg border border-gray-200 dark:border-dark-600"
                    />
                    <input
                      type="text"
                      value={color.hexCode}
                      onChange={(e) => handleColorChange(index, 'hexCode', e.target.value)}
                      placeholder="#000000"
                      className="input-field flex-1"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium">Product Code (Editable) *</label>
                  <input
                    type="text"
                    value={color.productCode || `${styleCode}-${color.name.substring(0, 3).toUpperCase()}`}
                    onChange={(e) => handleColorChange(index, 'productCode', e.target.value)}
                    placeholder={`e.g., ${styleCode}-RED`}
                    className="input-field"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">Edit to customize the product code for this color variant. Default: StyleCode-ColorCode</p>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium">Google Drive Folder URL (Images for this color) *</label>
                  <input
                    type="text"
                    value={color.folderUrl}
                    onChange={(e) => handleColorChange(index, 'folderUrl', e.target.value)}
                    placeholder="https://drive.google.com/drive/folders/..."
                    className="input-field"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">Upload folder URL with images for this color variant</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <button type="submit" disabled={mutation.isPending} className="button-primary flex-1 py-3">
          {mutation.isPending ? 'Creating...' : 'Create Product'}
        </button>
      </div>
    </form>
  );
}
