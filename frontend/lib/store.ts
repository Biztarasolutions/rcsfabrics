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
        useWishlistStore.getState().setItems([]);
        useCartStore.setState({ items: [], isOpen: false });
      },
    }),
    { name: 'rcs-auth' }
  )
);

// ─── Cart Store ───────────────────────────────────────────────────────────────
interface CartStore {
  items: CartItem[];
  isOpen: boolean;
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
const syncCartQty = (productId: string, quantity: number) => {
  if (typeof window === 'undefined' || !localStorage.getItem('authToken')) return;
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
      setItems: (items) => set({ items }),
      addItem: (item) => {
        // one line per product, whatever id the caller used
        const exists = get().items.find((i) => i.productId === item.productId);
        const items = exists
          ? get().items.map((i) => (i.productId === item.productId ? { ...i, quantity: i.quantity + item.quantity } : i))
          : [...get().items, { ...item, id: item.productId }];
        set({ items });
        const line = items.find((i) => i.productId === item.productId);
        if (line) syncCartQty(line.productId, line.quantity);
      },
      removeItem: (id) => {
        const line = get().items.find((i) => i.id === id);
        set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
        if (line) syncCartQty(line.productId, 0);
      },
      updateQty: (id, qty) => {
        set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, quantity: qty } : i)) }));
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
    { name: 'rcs-cart', partialize: (s) => ({ items: s.items }) }
  )
);

// ─── Wishlist Store ───────────────────────────────────────────────────────────
interface WishlistStore {
  items: WishlistItem[];
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
      setItems: (items) => set({ items }),
      addItem: (item) => {
        if (get().items.some((i) => i.productId === item.productId)) return;
        set((s) => ({ items: [...s.items, item] }));
        syncWishlist('add', item.productId);
      },
      removeItem: (productId) => {
        set((s) => ({ items: s.items.filter((i) => i.productId !== productId) }));
        syncWishlist('remove', productId);
      },
      hasItem: (productId) => get().items.some((i) => i.productId === productId),
    }),
    { name: 'rcs-wishlist' }
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
    { name: 'rcs-theme' }
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
