'use client';
import { useEffect } from 'react';
import { useAuthStore, useStoresHydrated } from '@/lib/store';
import { authApi } from '@/lib/api';

/**
 * Refreshes the signed-in user's details (role, Customer ID, name) from the server
 * when the site opens and whenever the tab comes back into focus, so a role change
 * by the super admin shows up without signing out and in again.
 */
export default function UserSync() {
  const hydrated = useStoresHydrated();
  const userId = useAuthStore((s) => s.user?.id);

  useEffect(() => {
    if (!hydrated || !userId) return;
    let last = 0;
    const refresh = async () => {
      if (Date.now() - last < 30_000) return; // at most every 30 s
      last = Date.now();
      try {
        const res = await authApi.getProfile();
        const fresh = res.data?.data;
        const { user, setUser } = useAuthStore.getState();
        if (fresh && user && fresh.id === user.id) setUser({ ...user, ...fresh });
      } catch {
        /* offline or token expired — the API layer handles sign-out */
      }
    };
    refresh();
    const onFocus = () => document.visibilityState === 'visible' && refresh();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [hydrated, userId]);

  return null;
}
