// Custom hooks for frontend
import { useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Product, CartItem, WishlistItem, Order, ApiResponse } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Get auth token from localStorage
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  return null;
};

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const useProducts = (filters?: any) => {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<{ products: Product[] }>>(
        '/products',
        { params: filters }
      );
      return data.data?.products || [];
    },
  });
};

export const useProduct = (idOrSlug: string) => {
  return useQuery({
    queryKey: ['product', idOrSlug],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Product>>(
        `/products/slug/${idOrSlug}`
      );
      return response.data.data;
    },
    enabled: !!idOrSlug,
  });
};

export const useCart = () => {
  return useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<{ items: CartItem[] }>>(
        '/cart'
      );
      return data.data?.items || [];
    },
  });
};

export const useAddToCart = () => {
  return useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      const { data } = await api.post<ApiResponse<CartItem>>('/cart', {
        productId,
        quantity,
      });
      return data.data;
    },
  });
};

export const useWishlist = () => {
  return useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<WishlistItem[]>>('/wishlist');
      return data.data || [];
    },
  });
};

export const useAddToWishlist = () => {
  return useMutation({
    mutationFn: async (productId: string) => {
      const { data } = await api.post<ApiResponse<WishlistItem>>(
        '/wishlist',
        { productId }
      );
      return data.data;
    },
  });
};

export const useOrders = () => {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<{ orders: Order[] }>>(
        '/orders'
      );
      return data.data?.orders || [];
    },
  });
};

export const useAuth = () => {
  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.data?.token) {
      localStorage.setItem('authToken', data.data.token);
    }
    return data.data;
  }, []);

  const register = useCallback(
    async (email: string, password: string, firstName?: string, lastName?: string) => {
      const { data } = await api.post('/auth/register', {
        email,
        password,
        firstName,
        lastName,
      });
      if (data.data?.token) {
        localStorage.setItem('authToken', data.data.token);
      }
      return data.data;
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
  }, []);

  return { login, register, logout };
};
