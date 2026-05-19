'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { productApi } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Hook to fetch all homepage data in a single optimized request
 * Reduces API calls from 5+ to 1 network round trip
 */
export const useHomepageData = () => {
  return useQuery({
    queryKey: ['homepage-data'],
    queryFn: () => productApi.getHomepageData().then(res => res.data.data),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
};

/**
 * Provider component to load all homepage data at once
 * Wrap your homepage components with this
 */
export function HomepageDataProvider({ children }: { children: React.ReactNode }) {
  // Pre-load the data
  useHomepageData();
  
  return <>{children}</>;
}

/**
 * Hook to add a new category and invalidate cache
 */
export const useAddCategory = () => {
  const queryClient = useQueryClient();

  return useMutation(productApi.createCategory, {
    onSuccess: () => {
      // Invalidate homepage data cache
      queryClient.invalidateQueries(['homepage-data']);
    },
  });
};
