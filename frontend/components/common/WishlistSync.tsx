'use client';
import { useEffect, useRef } from 'react';
import { useAuthStore, useWishlistStore } from '@/lib/store';
import { wishlistApi } from '@/lib/api';

/**
 * When a user is logged in: upload any items they saved as a guest, then load
 * the account's wishlist from the server so it matches on every device.
 */
export default function WishlistSync() {
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
        const res = await wishlistApi.list();
        const server: any[] = res.data?.data ?? [];
        const serverIds = new Set(server.map((w) => w.productId));

        // Guest items not yet on the server → upload them
        // Only items a guest added recently in this browser are moved into the account
        const st = useWishlistStore.getState();
        const GUEST_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
        const local = st.owner === 'guest' && Date.now() - (st.guestAt || 0) < GUEST_MAX_AGE ? st.items : [];
        const missing = local.filter((i) => !serverIds.has(i.productId));
        await Promise.allSettled(missing.map((i) => wishlistApi.add(i.productId)));

        const merged = [
          ...server.map((w) => ({ id: w.id, productId: w.productId, product: w.product, createdAt: w.createdAt })),
          ...missing,
        ];
        useWishlistStore.setState({ items: merged, owner: userId, guestAt: 0 });
      } catch (err: any) {
        syncedFor.current = null; // retry on next change
        console.error('[Wishlist] sync failed:', err?.message || err);
      }
    })();
  }, [isAuthenticated, userId, token]);

  return null;
}
