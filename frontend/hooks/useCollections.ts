'use client';
import { useQuery } from '@tanstack/react-query';
import { productApi } from '@/lib/api';
import { collectionsWithProducts } from '@/lib/collections';

/** All active products, shared by the collections pages and the homepage strip */
export const useAllProducts = () =>
  useQuery({
    queryKey: ['all-products'],
    queryFn: () => productApi.getAll({ limit: 500 }).then((res) => (res.data?.data?.products || []) as any[]),
    staleTime: 1000 * 60 * 5,
  });

export const useCollections = () => {
  const q = useAllProducts();
  return { ...q, collections: q.data ? collectionsWithProducts(q.data) : [] };
};
