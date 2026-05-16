import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
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
  login: (data: any) => api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
};

export const productApi = {
  getAll: (params?: any) => api.get('/products', { params }),
  getFeatured: () => api.get('/products/featured'),
  getNewArrivals: () => api.get('/products/new-arrivals'),
  getBySlug: (slug: string) => api.get(`/products/slug/${slug}`),
  getRelated: (id: string, categoryId: string) => api.get(`/products/related/${id}/${categoryId}`),
  search: (query: string) => api.get(`/products/search?q=${query}`),
};

export const orderApi = {
  create: (data: any) => api.post('/orders', data),
  verifyPayment: (id: string, data: any) => api.post(`/orders/${id}/verify`, data),
  getUserOrders: (params?: any) => api.get('/orders', { params }),
  getById: (id: string) => api.get(`/orders/${id}`),
  validateCoupon: (code: string, amount: number) => api.post('/orders/validate-coupon', { code, amount }),
};

export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getAdminProducts: (params?: any) => api.get('/admin/products', { params }),
  createProduct: (data: any) => api.post('/admin/products', data),
  updateProduct: (id: string, data: any) => api.put(`/admin/products/${id}`, data),
  deleteProduct: (id: string) => api.delete(`/admin/products/${id}`),
  getOrders: (params?: any) => api.get('/admin/orders', { params }),
  updateOrderStatus: (id: string, data: any) => api.patch(`/admin/orders/${id}/status`, data),
  getCustomers: (params?: any) => api.get('/admin/customers', { params }),
  getCoupons: () => api.get('/admin/coupons'),
  createCoupon: (data: any) => api.post('/admin/coupons', data),
  deleteCoupon: (id: string) => api.delete(`/admin/coupons/${id}`),
  getCategories: () => api.get('/admin/categories'),
  createCategory: (data: any) => api.post('/admin/categories', data),
  updateCategory: (id: string, data: any) => api.put(`/admin/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete(`/admin/categories/${id}`),
};

export default api;
