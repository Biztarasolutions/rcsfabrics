'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import BrandLogo from '@/components/common/BrandLogo';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { queryClient } from '@/components/common/Providers';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { isStaff, isManager, ROLE_LABEL, type Role } from '@/lib/roles';
import { useStoresHydrated } from '@/lib/store';

// `insights: true` = only admins and the super admin (employees don't see revenue, orders or customers)
const NAV = [
  { label: 'Dashboard', href: '/admin', icon: '📊', insights: true },
  { label: 'Products', href: '/admin/products', icon: '🧵' },
  { label: 'Orders', href: '/admin/orders', icon: '📦', insights: true },
  { label: 'Customers', href: '/admin/customers', icon: '👥', insights: true },
  { label: 'Categories', href: '/admin/categories', icon: '🗂️' },
  { label: 'Banners', href: '/admin/banners', icon: '🖼️' },
  { label: 'Coupons', href: '/admin/coupons', icon: '🎟️' },
  { label: 'Analytics', href: '/admin/analytics', icon: '📈', insights: true },
  { label: 'Settings', href: '/admin/settings', icon: '⚙️' },
];

// Pages employees may not open (also covers pages not in the menu)
const INSIGHT_PATHS = ['/admin', '/admin/orders', '/admin/customers', '/admin/analytics', '/admin/reports', '/admin/cancelled-orders', '/admin/users'];

const SIDEBAR_COLLAPSED_KEY = 'admin-sidebar-collapsed';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const hydrated = useStoresHydrated();

  // Current role straight from the server, so changes by the super admin apply at once
  const { data: role, isLoading: roleLoading, isError: roleError } = useQuery({
    queryKey: ['admin-me', user?.id],
    queryFn: () => adminApi.getMyRole().then((r) => r.data?.data?.role as Role),
    enabled: hydrated && !!user,
    retry: false,
    staleTime: 60 * 1000,
  });
  const nav = NAV.filter((n) => !n.insights || isManager(role));
  const blockedHere = !!role && !isManager(role) && INSIGHT_PATHS.includes(pathname || '');

  useEffect(() => {
    if (!hydrated) return;
    if (!user) { router.replace('/auth?next=/admin'); return; }
    if (roleError || (role && !isStaff(role))) { router.replace('/'); return; }
    // Employees land on Products instead of the dashboard
    if (blockedHere) router.replace('/admin/products');
  }, [hydrated, user, role, roleError, blockedHere, router]);

  const handleLogout = () => {
    logout();
    queryClient.clear();
    router.push('/auth');
  };

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
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (stored === 'true') setCollapsed(true);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  };

  const currentLabel = NAV.find((n) => n.href === pathname)?.label || 'Admin';
  const homeHref = isManager(role) ? '/admin' : '/admin/products';

  const SidebarContent = ({ showLabels }: { showLabels: boolean }) => (
    <>
      <div className={`flex h-16 items-center border-b border-gray-200 dark:border-dark-800 ${showLabels ? 'justify-between px-4' : 'justify-center px-2'}`}>
        {showLabels ? (
          <Link href={homeHref} className="flex min-w-0 items-center gap-2">
            <BrandLogo height={34} />
            <span className="truncate rounded-md bg-primary-50 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-primary-700 dark:bg-primary-950/40 dark:text-primary-300">Admin</span>
          </Link>
        ) : (
          <Link href={homeHref} title="Admin home" className="flex h-8 w-8 items-center justify-center">
            <img src="/brand/icon-192.png" alt="RCS Fabrics" width={32} height={32} className="h-8 w-8 rounded-lg" />
          </Link>
        )}
        {showLabels && (
          <button
            type="button"
            onClick={toggleCollapsed}
            className="hidden rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 lg:inline-flex dark:text-gray-400 dark:hover:bg-dark-800"
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {nav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                showLabels ? '' : 'justify-center px-2'
              } ${
                active
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-800'
              }`}
            >
              <span className="shrink-0 text-base">{item.icon}</span>
              {showLabels && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-gray-200 p-2 dark:border-dark-800">
        <Link
          href="/"
          title="Back to Store"
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-dark-800 ${showLabels ? '' : 'justify-center px-2'}`}
        >
          <span className="shrink-0">←</span>
          {showLabels && <span>Back to Store</span>}
        </Link>
      </div>
    </>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50 dark:bg-dark-950">
      {/* Desktop sidebar */}
      <aside
        className={`hidden h-full shrink-0 flex-col border-r border-gray-200 bg-white transition-[width] duration-200 ease-in-out dark:border-dark-800 dark:bg-dark-900 lg:flex ${
          collapsed ? 'w-[72px]' : 'w-60'
        }`}
      >
        <div className="flex h-full min-h-0 flex-col">
          <SidebarContent showLabels={!collapsed} />
        </div>
        {collapsed && (
          <button
            type="button"
            onClick={toggleCollapsed}
            className="mx-auto mb-3 rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-dark-800"
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} aria-label="Close menu" />
          <aside className="relative z-50 flex h-full w-60 flex-col bg-white shadow-xl dark:bg-dark-900">
            <SidebarContent showLabels />
          </aside>
        </div>
      )}

      {/* Main content — scroll contained here, not the whole page */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 dark:border-dark-800 dark:bg-dark-900 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden dark:text-gray-300 dark:hover:bg-dark-800"
              aria-label="Open menu"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button
              type="button"
              onClick={toggleCollapsed}
              className="hidden rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:inline-flex dark:text-gray-300 dark:hover:bg-dark-800"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={collapsed ? 'M13 5l7 7-7 7M5 5l7 7-7 7' : 'M11 19l-7-7 7-7m8 14l-7-7 7-7'} />
              </svg>
            </button>
            <h1 className="truncate text-lg font-semibold text-gray-900 dark:text-white">{currentLabel}</h1>
          </div>
          <div ref={userMenuRef} className="relative flex shrink-0 items-center">
            <button
              type="button"
              onClick={() => setUserMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full border border-gray-200 pl-2 pr-3 py-1.5 text-sm font-medium hover:bg-gray-50 dark:border-dark-700 dark:hover:bg-dark-800 transition-colors"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
                {user?.firstName?.[0]?.toUpperCase() || 'A'}
              </div>
              <span className="hidden sm:block text-gray-700 dark:text-gray-200">
                {user?.firstName || 'Admin'}
              </span>
              <svg className="h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-gray-100 bg-white p-2 shadow-xl dark:border-dark-700 dark:bg-dark-800 z-50">
                <div className="px-3 py-2 mb-1 border-b border-gray-100 dark:border-dark-700">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                  {role && <p className="mt-1 inline-block rounded-md bg-primary-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-700 dark:bg-primary-950/40 dark:text-primary-300">{ROLE_LABEL[role] || role}</p>}
                </div>
                <Link href="/account" onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-dark-700 transition-colors">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                  My Account
                </Link>
                <Link href="/" onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-dark-700 transition-colors">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                  Back to Store
                </Link>
                <div className="my-1 border-t border-gray-100 dark:border-dark-700"/>
                <button onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20 transition-colors">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
          <div className="min-w-0 w-full max-w-full">
            {!hydrated || roleLoading || !role || !isStaff(role) || blockedHere ? (
              <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
              </div>
            ) : children}
          </div>
        </main>
      </div>
    </div>
  );
}
