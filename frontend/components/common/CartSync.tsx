'use client';
import { useEffect, useRef } from 'react';
import { useAuthStore, useCartStore } from '@/lib/store';
import { cartApi } from '@/lib/api';

/**
 * When a user logs in: add anything they put in the cart as a guest to their
 * account cart, then load the account cart so it is the same on every device.
 */
export default function CartSync() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userId = useAuthStore((s) => s.user?.id);
  const token = useAuthStore((s) => s.token);
  const syncedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !userId || syncedFor.current === userId) return;
    if (!token && (typeof window === 'undefined' || !localStorage.getItem('authToken'))) return;
    syncedFor.current = userId;

    (async () => {
      try {
        const res = await cartApi.list();
        const server: any[] = res.data?.data?.items ?? [];
        const byProduct = new Map(server.map((c) => [c.productId, c]));

        // Guest items → account (keep the larger quantity if both have it)
        const local = useCartStore.getState().items;
        const uploads = local
          .filter((i) => !byProduct.has(i.productId) || byProduct.get(i.productId).quantity < i.quantity)
          .map((i) => cartApi.setQuantity(i.productId, i.quantity));
        await Promise.allSettled(uploads);

        const merged = new Map<string, any>();
        for (const c of server) merged.set(c.productId, { id: c.productId, productId: c.productId, product: c.product, quantity: c.quantity });
        for (const i of local) {
          const cur = merged.get(i.productId);
          if (!cur || cur.quantity < i.quantity) merged.set(i.productId, { ...i, id: i.productId });
        }
        useCartStore.getState().setItems([...merged.values()]);
      } catch (err: any) {
        syncedFor.current = null; // retry on next change
        console.error('[Cart] sync failed:', err?.message || err);
      }
    })();
  }, [isAuthenticated, userId, token]);

  return null;
}
