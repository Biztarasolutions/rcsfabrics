// Trigger Netlify Build - Proxies configured
import { supabase } from '@/lib/supabase';
import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
// Ensure API_URL ends with a slash
const normalizedBaseURL = API_URL.endsWith('/') ? API_URL : `${API_URL}/`;

const api = axios.create({
  baseURL: normalizedBaseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Request interceptor — attach token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — normalize errors
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError<{ message?: string }>) => {
    const message =
      error.response?.data?.message || error.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

export const authApi = {
  login: (data: any) => api.post('auth/login', data),
  register: (data: any) => api.post('auth/register', data),
  sendOTP: (data: any) => api.post('auth/send-otp', data),
  verifyOTP: (data: any) => api.post('auth/verify-otp', data),
  sendLoginOTP: (data: any) => api.post('auth/login-otp/send', data),
  getProfile: () => api.get('auth/me'),
  updateProfile: (data: any) => api.put('users/profile', data),
};

export const userApi = {
  getAddresses: () => api.get('users/addresses'),
  addAddress: (data: any) => api.post('users/addresses', data),
  updateAddress: (id: string, data: any) => api.put(`users/addresses/${id}`, data),
  deleteAddress: (id: string) => api.delete(`users/addresses/${id}`),
};

export const productApi = {
  getAll: (params?: any) => api.get('products', { params }),
  getFeatured: () => api.get('products/featured'),
  getNewArrivals: () => api.get('products/new-arrivals'),
  getHomepageData: () => api.get('products/batch/homepage'),
  getBySlug: (slug: string) => api.get(`products/slug/${slug}`),
  getGroup: (styleCode: string) => api.get(`products/group/${styleCode}`),
  getRelated: (id: string, categoryId: string) => api.get(`products/related/${id}/${categoryId}`),
  search: (query: string) => api.get(`products/search?q=${query}`),
  submitReview: (productId: string, data: { rating: number; title?: string; comment?: string }) =>
    api.post(`products/${productId}/reviews`, data),
};

export const orderApi = {
  create: (data: any) => api.post('orders', data),
  verifyPayment: (id: string, data: any) => api.post(`orders/${id}/verify`, data),
  getUserOrders: (params?: any) => api.get('orders', { params }),
  getById: (id: string) => api.get(`orders/${id}`),
  validateCoupon: (code: string, amount: number) => api.post('orders/validate-coupon', { code, amount }),
};

export const adminApi = {
  getStats: () => api.get('admin/dashboard/stats'),
  getAdminProducts: (params?: any) => api.get('admin/products', { params }),
  createProductGroup: async (data: any) => {
    const res = await api.post('admin/products/group', data);
    return res.data;
  },
  createProduct: async (data: any) => {
    const res = await api.post('admin/products', data);
    return res.data;
  },
  updateProduct: (id: string, data: any) => api.put(`admin/products/${id}`, data),
  deleteProduct: (id: string) => api.delete(`admin/products/${id}`),
  syncProduct: (id: string) => api.post(`admin/products/${id}/sync`, {}, { timeout: 120000 }),
  syncAllProducts: () => api.post('admin/products/sync-all', {}, { timeout: 300000 }),
  getOrders: (params?: any) => api.get('admin/orders', { params }),
  updateOrderStatus: (id: string, status: string) => api.put(`admin/orders/${id}`, { status }),
  getCustomers: (params?: any) => api.get('admin/customers', { params }),
  getCoupons: () => api.get('admin/coupons'),
  createCoupon: (data: any) => api.post('admin/coupons', data),
  deleteCoupon: (id: string) => api.delete(`admin/coupons/${id}`),
  getCategories: () => api.get('admin/categories'),
  createCategory: (data: any) => api.post('admin/categories', data),
  updateCategory: (id: string, data: any) => api.put(`admin/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete(`admin/categories/${id}`),
  getBanners: () => api.get('admin/banners'),
  createBanner: (data: any) => api.post('admin/banners', data),
  updateBanner: (id: string, data: any) => api.put(`admin/banners/${id}`, data),
  deleteBanner: (id: string) => api.delete(`admin/banners/${id}`),
};

// Upload an image from a URL (e.g., Google Drive share link) to Supabase storage and return its public URL.
export const uploadCategoryImage = async (fileUrl: string): Promise<string> => {
  // Support Google Drive share links
  let downloadUrl = fileUrl;
  const driveRegex = /(?:https?:\/\/)?(?:drive\.google\.com\/file\/d\/|drive\.google\.com\/open\?id=)([^\/\?]+)/;
  const match = fileUrl.match(driveRegex);
  if (match && match[1]) {
    const fileId = match[1];
    downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
  }

  // Fetch the image binary.
  const response = await fetch(downloadUrl);
  if (!response.ok) {
    throw new Error('Failed to fetch image from the provided URL');
  }
  const blob = await response.blob();
  // Generate a unique filename.
  const filename = `${Date.now()}-${Math.random().toString(36).substring(2)}.${blob.type.split('/')[1] || 'jpg'}`;

  const { data, error } = await supabase.storage
    .from('category-images')
    .upload(filename, blob, {
      contentType: blob.type || 'image/jpeg',
      upsert: true,
    });

  if (error) {
    console.error('[Supabase] Upload error:', error);
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage.from('category-images').getPublicUrl(data.path);
  const publicUrl = publicUrlData.publicUrl;
  return publicUrl;
};
export default api;
