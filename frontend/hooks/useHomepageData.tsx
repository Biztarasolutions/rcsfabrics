'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { productApi } from '@/lib/api';

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
