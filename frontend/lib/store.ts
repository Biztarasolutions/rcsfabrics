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

export const useCartStore = create<CartStore>()((set, get) => ({
  items: [],
  isOpen: false,
  setItems: (items) => set({ items }),
  addItem: (item) =>
    set((s) => {
      const exists = s.items.find((i) => i.id === item.id);
      if (exists) {
        return {
          items: s.items.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
          ),
        };
      }
      return { items: [...s.items, item] };
    }),
  removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
  updateQty: (id, qty) =>
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? { ...i, quantity: qty } : i)),
    })),
  clearCart: () => set({ items: [] }),
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
  totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
  totalPrice: () =>
    get().items.reduce(
      (sum, i) => sum + (i.product.discountPrice || i.product.basePrice) * i.quantity,
      0
    ),
}));

// ─── Wishlist Store ───────────────────────────────────────────────────────────
interface WishlistStore {
  items: WishlistItem[];
  setItems: (items: WishlistItem[]) => void;
  addItem: (item: WishlistItem) => void;
  removeItem: (productId: string) => void;
  hasItem: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      setItems: (items) => set({ items }),
      addItem: (item) => set((s) => ({ items: [...s.items, item] })),
      removeItem: (productId) =>
        set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),
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
