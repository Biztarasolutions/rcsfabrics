'use client';
import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useThemeStore } from '@/lib/store';
import CartSidebar from '@/components/common/CartSidebar';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 30, // 30 minutes - keep data fresh longer
      gcTime: 1000 * 60 * 60, // 1 hour - garbage collection time
      retry: 1,
      refetchOnWindowFocus: false, // Don't refetch when user returns to tab
      refetchOnReconnect: 'stale', // Only refetch if data is stale
    },
  },
});

function ThemeApplier() {
  const { isDark } = useThemeStore();
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);
  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeApplier />
      {children}
      <CartSidebar />
      <Toaster
        position="top-right"
        toastOptions={{
          style: { borderRadius: '12px', fontFamily: 'Inter, sans-serif', fontSize: '14px' },
          success: { iconTheme: { primary: '#b8926b', secondary: '#fff' } },
        }}
      />
    </QueryClientProvider>
  );
}

