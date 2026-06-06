'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore, useAuthStore, useThemeStore, useWishlistStore, useUIStore } from '@/lib/store';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Fabrics', href: '/products' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export default function Header() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { items: cartItems, toggleCart } = useCartStore();
  const { items: wishlistItems } = useWishlistStore();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const { isSearchOpen, openSearch, closeSearch, isMobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useUIStore();

  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0);
  const wishlistCount = wishlistItems.length;

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (isSearchOpen) setTimeout(() => searchRef.current?.focus(), 100);
  }, [isSearchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      closeSearch();
    }
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    router.push('/');
  };

  return (
    <>
      {/* Announcement bar */}
      <div className="bg-gradient-to-r from-primary-700 via-primary-600 to-primary-700 py-2 text-center text-xs font-medium text-white tracking-wider">
        🎁 Free shipping on orders above ₹2,000 &nbsp;|&nbsp; Premium fabrics by the meter
      </div>

      {/* Main header */}
      <header className={`sticky top-0 z-50 transition-all duration-300 border-b border-gray-100 dark:border-dark-800 ${
        scrolled ? 'bg-white/95 shadow-md backdrop-blur-md dark:bg-dark-900/95' : 'bg-white dark:bg-dark-900'
      }`}>
        <div className="container-main">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0" onClick={closeMobileMenu}>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 shadow-md">
                <span className="text-lg font-black text-white">R</span>
              </div>
              <div className="leading-none">
                <span className="font-display text-xl font-bold text-gradient">RCS</span>
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-gray-400">Fabrics</p>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden items-center gap-6 lg:flex">
              {NAV_LINKS.map((link) => (
                <Link key={link.href} href={link.href}
                  className="text-sm font-medium text-gray-600 transition-colors hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400">
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {/* Search */}
              <button id="header-search-btn" onClick={openSearch}
                className="button-ghost rounded-full p-2" aria-label="Search">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* Dark mode */}
              <button id="theme-toggle" onClick={toggleTheme}
                className="button-ghost rounded-full p-2" aria-label="Toggle theme">
                {isDark ? (
                  <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
                  </svg>
                )}
              </button>

              {/* Wishlist */}
              <Link href="/wishlist" className="button-ghost relative rounded-full p-2" aria-label="Wishlist">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                </svg>
                {wishlistCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <button id="cart-toggle" onClick={toggleCart}
                className="button-ghost relative rounded-full p-2" aria-label="Cart">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                </svg>
                {cartCount > 0 && (
                  <motion.span key={cartCount} initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white">
                    {cartCount}
                  </motion.span>
                )}
              </button>

              {/* User */}
              {isAuthenticated ? (
                <div ref={userMenuRef} className="relative">
                  <button id="user-menu-btn" onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-sm font-medium dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
                      {user?.firstName?.[0] || 'U'}
                    </div>
                    <span className="hidden sm:block">{user?.firstName || 'Account'}</span>
                    <svg className="h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>
                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }} transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-gray-100 bg-white p-2 shadow-xl dark:border-dark-700 dark:bg-dark-800">
                        <div className="border-b border-gray-100 px-3 py-2 dark:border-dark-700">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.firstName} {user?.lastName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                        </div>
                        <div className="mt-1 space-y-0.5">
                          <Link href="/account" onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-dark-700 transition-colors">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                            My Account
                          </Link>
                          <Link href="/account/orders" onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-dark-700 transition-colors">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                            My Orders
                          </Link>
                          {user?.role === 'ADMIN' && (
                            <Link href="/admin" onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-950 transition-colors">
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
                              Admin Panel
                            </Link>
                          )}
                          <button onClick={handleLogout}
                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 transition-colors">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                            Logout
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link href="/auth" className="button-primary hidden px-4 py-2 text-sm sm:inline-flex">
                  Login
                </Link>
              )}

              {/* Mobile menu */}
              <button onClick={toggleMobileMenu} className="button-ghost rounded-full p-2 lg:hidden" aria-label="Menu">
                {isMobileMenuOpen ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-t border-gray-100 bg-white dark:border-dark-800 dark:bg-dark-900 lg:hidden">
              <div className="container-main py-4 space-y-1">
                {NAV_LINKS.map((link) => (
                  <Link key={link.href} href={link.href} onClick={closeMobileMenu}
                    className="flex items-center rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-dark-800 transition-colors">
                    {link.label}
                  </Link>
                ))}
                {!isAuthenticated && (
                  <div className="pt-2 border-t border-gray-100 dark:border-dark-800">
                    <Link href="/auth" onClick={closeMobileMenu} className="button-primary block w-full py-3 text-center">
                      Login / Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-start justify-center bg-black/60 backdrop-blur-sm pt-20 px-4"
            onClick={(e) => e.target === e.currentTarget && closeSearch()}>
            <motion.div initial={{ opacity: 0, y: -20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }} transition={{ duration: 0.15 }}
              className="w-full max-w-2xl rounded-2xl bg-white p-4 shadow-2xl dark:bg-dark-800">
              <form onSubmit={handleSearch} className="flex gap-3">
                <div className="relative flex-1">
                  <svg className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                  <input ref={searchRef} id="search-input" type="text" value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search fabrics, materials, collections..."
                    className="input-field pl-12"/>
                </div>
                <button type="submit" className="button-primary px-6 py-3">Search</button>
                <button type="button" onClick={closeSearch} className="button-ghost rounded-xl px-4 py-3">✕</button>
              </form>
              <div className="mt-3 flex flex-wrap gap-2">
                {['Silk', 'Cotton', 'Linen', 'Chiffon', 'Velvet'].map((tag) => (
                  <button key={tag} onClick={() => { router.push(`/products?search=${tag}`); closeSearch(); }}
                    className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:border-primary-400 hover:text-primary-600 dark:border-dark-600 dark:text-gray-400 transition-colors">
                    {tag}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
