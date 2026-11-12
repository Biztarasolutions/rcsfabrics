import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, CartItem, WishlistItem } from '@/types';

// ─── Auth Store ───────────────────────────────────────────────────────────────
interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),
      logout: () => {
        if (typeof window !== 'undefined') localStorage.removeItem('authToken');
        set({ user: null, token: null, isAuthenticated: false });
        // The account's cart and wishlist live on the server; don't leave them on a shared device
        useWishlistStore.setState({ items: [], owner: null, guestAt: 0 });
        useCartStore.setState({ items: [], isOpen: false, owner: null, guestAt: 0 });
      },
    }),
    { name: 'rcs-auth', skipHydration: true }
  )
);

// ─── Cart Store ───────────────────────────────────────────────────────────────
/** 'guest' = added while logged out (eligible to merge on login), a user id = that account's copy, null = unknown/old data (never merged) */
export type ListOwner = string | null;

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  owner: ListOwner;
  guestAt: number;
  setItems: (items: CartItem[]) => void;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

// Logged-in carts are saved per account in the database; guests keep theirs in
// the browser and it is merged into their account on login (see CartSync).
const cartTimers: Record<string, ReturnType<typeof setTimeout>> = {};
const loggedIn = (): boolean => typeof window !== 'undefined' && !!localStorage.getItem('authToken');
/** owner fields to set after a change: guests' changes are marked as guest items */
const guestMark = (): { owner?: ListOwner; guestAt?: number } => (loggedIn() ? {} : { owner: 'guest', guestAt: Date.now() });

const syncCartQty = (productId: string, quantity: number) => {
  if (!loggedIn()) return;
  clearTimeout(cartTimers[productId]);
  // debounce rapid +/- clicks into one request per product
  cartTimers[productId] = setTimeout(() => {
    import('@/lib/api')
      .then(({ cartApi }) => cartApi.setQuantity(productId, Math.max(0, quantity)))
      .catch((err) => console.error('[Cart] sync failed:', err?.message || err));
  }, 400);
};
const syncCartClear = () => {
  if (typeof window === 'undefined' || !localStorage.getItem('authToken')) return;
  Object.values(cartTimers).forEach(clearTimeout);
  import('@/lib/api')
    .then(({ cartApi }) => cartApi.clear())
    .catch((err) => console.error('[Cart] clear failed:', err?.message || err));
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      owner: null,
      guestAt: 0,
      setItems: (items) => set({ items }),
      addItem: (item) => {
        // one line per product, whatever id the caller used
        const exists = get().items.find((i) => i.productId === item.productId);
        const items = exists
          ? get().items.map((i) => (i.productId === item.productId ? { ...i, quantity: i.quantity + item.quantity } : i))
          : [...get().items, { ...item, id: item.productId }];
        set({ items, ...guestMark() });
        const line = items.find((i) => i.productId === item.productId);
        if (line) syncCartQty(line.productId, line.quantity);
      },
      removeItem: (id) => {
        const line = get().items.find((i) => i.id === id);
        set((s) => ({ items: s.items.filter((i) => i.id !== id), ...guestMark() }));
        if (line) syncCartQty(line.productId, 0);
      },
      updateQty: (id, qty) => {
        set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, quantity: qty } : i)), ...guestMark() }));
        const line = get().items.find((i) => i.id === id);
        if (line) syncCartQty(line.productId, qty);
      },
      clearCart: () => {
        set({ items: [] });
        syncCartClear();
      },
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      totalPrice: () =>
        get().items.reduce(
          (sum, i) => sum + (i.product.discountPrice || i.product.basePrice) * i.quantity,
          0
        ),
    }),
    { name: 'rcs-cart', partialize: (s) => ({ items: s.items, owner: s.owner, guestAt: s.guestAt }), skipHydration: true }
  )
);

// ─── Wishlist Store ───────────────────────────────────────────────────────────
interface WishlistStore {
  items: WishlistItem[];
  owner: ListOwner;
  guestAt: number;
  setItems: (items: WishlistItem[]) => void;
  addItem: (item: WishlistItem) => void;
  removeItem: (productId: string) => void;
  hasItem: (productId: string) => boolean;
}

// Logged-in wishlists are saved in the database; guests keep theirs in the browser
// and it is merged into their account when they log in (see WishlistSync).
const isLoggedIn = (): boolean =>
  typeof window !== 'undefined' && !!localStorage.getItem('authToken');

const syncWishlist = (action: 'add' | 'remove', productId: string) => {
  if (!isLoggedIn()) return;
  import('@/lib/api')
    .then(({ wishlistApi }) => (action === 'add' ? wishlistApi.add(productId) : wishlistApi.remove(productId)))
    .catch((err) => console.error(`[Wishlist] could not ${action} ${productId}:`, err?.message || err));
};

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      owner: null,
      guestAt: 0,
      setItems: (items) => set({ items }),
      addItem: (item) => {
        if (get().items.some((i) => i.productId === item.productId)) return;
        set((s) => ({ items: [...s.items, item], ...guestMark() }));
        syncWishlist('add', item.productId);
      },
      removeItem: (productId) => {
        set((s) => ({ items: s.items.filter((i) => i.productId !== productId), ...guestMark() }));
        syncWishlist('remove', productId);
      },
      hasItem: (productId) => get().items.some((i) => i.productId === productId),
    }),
    { name: 'rcs-wishlist', skipHydration: true }
  )
);

// ─── Theme Store ──────────────────────────────────────────────────────────────
interface ThemeStore {
  isDark: boolean;
  toggleTheme: () => void;
  setDark: (val: boolean) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      isDark: false,
      setDark: (val) => set({ isDark: val }),
      toggleTheme: () =>
        set((state) => {
          const next = !state.isDark;
          if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark', next);
          }
          return { isDark: next };
        }),
    }),
    { name: 'rcs-theme', skipHydration: true }
  )
);

// ─── UI Store ─────────────────────────────────────────────────────────────────
interface UIStore {
  isSearchOpen: boolean;
  isMobileMenuOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
}

export const useUIStore = create<UIStore>()((set) => ({
  isSearchOpen: false,
  isMobileMenuOpen: false,
  openSearch: () => set({ isSearchOpen: true }),
  closeSearch: () => set({ isSearchOpen: false }),
  toggleMobileMenu: () => set((s) => ({ isMobileMenuOpen: !s.isMobileMenuOpen })),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
}));

// ─── Hydration ────────────────────────────────────────────────────────────────
// Saved stores (login, cart, wishlist, theme) are loaded from the browser right
// AFTER the first render, so the first render matches the server HTML (no React
// hydration errors). Components that must wait can use useStoresHydrated().
export const useHydrationStore = create<{ hydrated: boolean }>(() => ({ hydrated: false }));
export const useStoresHydrated = (): boolean => useHydrationStore((s) => s.hydrated);

let hydrating: Promise<void> | null = null;
export function rehydrateStores(): Promise<void> {
  if (!hydrating) {
    hydrating = Promise.all([
      useAuthStore.persist.rehydrate(),
      useCartStore.persist.rehydrate(),
      useWishlistStore.persist.rehydrate(),
      useThemeStore.persist.rehydrate(),
    ]).then(() => {
      useHydrationStore.setState({ hydrated: true });
    });
  }
  return hydrating;
}
