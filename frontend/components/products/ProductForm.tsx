'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';

const ProductForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    basePrice: '',
    stretchability: '',
    stock: '',
    colors: [{ name: '', hexCode: '', folderUrl: '' }],
  });

const mutation = useMutation<any, Error, any>({
  mutationFn: adminApi.createProduct,
  onSuccess: () => {
    alert('Product created successfully!');
    setFormData({
      name: '',
      categoryId: '',
      basePrice: '',
      stretchability: '',
      stock: '',
      colors: [{ name: '', hexCode: '', folderUrl: '' }],
    });
  },
  onError: (error: any) => {
    alert(`Error: ${error.message}`);
  },
});



  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleColorChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updatedColors = [...formData.colors];
    updatedColors[index][name as keyof typeof updatedColors[number]] = value;
    setFormData((prev) => ({ ...prev, colors: updatedColors }));
  };

  const addColor = () => {
    setFormData((prev) => ({
      ...prev,
      colors: [...prev.colors, { name: '', hexCode: '', folderUrl: '' }],
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="Product Name"
        required
      />
      <input
        type="text"
        name="categoryId"
        value={formData.categoryId}
        onChange={handleChange}
        placeholder="Category ID"
        required
      />
      <input
        type="number"
        name="basePrice"
        value={formData.basePrice}
        onChange={handleChange}
        placeholder="Base Price"
        required
      />
      <input
        type="text"
        name="stretchability"
        value={formData.stretchability}
        onChange={handleChange}
        placeholder="Stretchability"
        required
      />
      <input
        type="number"
        name="stock"
        value={formData.stock}
        onChange={handleChange}
        placeholder="Stock"
        required
      />

      {formData.colors.map((color, index) => (
        <div key={index}>
          <input
            type="text"
            name="name"
            value={color.name}
            onChange={(e) => handleColorChange(index, e)}
            placeholder="Color Name"
            required
          />
          <input
            type="text"
            name="hexCode"
            value={color.hexCode}
            onChange={(e) => handleColorChange(index, e)}
            placeholder="Hex Code"
            required
          />
          <input
            type="text"
            name="folderUrl"
            value={color.folderUrl}
            onChange={(e) => handleColorChange(index, e)}
            placeholder="Google Drive Folder URL"
          />
        </div>
      ))}

      <button type="button" onClick={addColor}>
        Add Color
      </button>

      <button type="submit">Submit</button>
    </form>
  );
};

export default ProductForm;