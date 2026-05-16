'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { label: 'Dashboard', href: '/admin', icon: '📊' },
  { label: 'Products', href: '/admin/products', icon: '🧵' },
  { label: 'Orders', href: '/admin/orders', icon: '📦' },
  { label: 'Customers', href: '/admin/customers', icon: '👥' },
  { label: 'Categories', href: '/admin/categories', icon: '🗂️' },
  { label: 'Banners', href: '/admin/banners', icon: '🖼️' },
  { label: 'Coupons', href: '/admin/coupons', icon: '🎟️' },
  { label: 'Reports', href: '/admin/reports', icon: '📈' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-dark-950">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-gray-200 bg-white dark:border-dark-800 dark:bg-dark-900 lg:block">
        <div className="flex h-16 items-center border-b border-gray-200 px-5 dark:border-dark-800">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-600 to-primary-800">
              <span className="text-sm font-black text-white">R</span>
            </div>
            <span className="font-display text-lg font-bold text-gradient">Admin Panel</span>
          </Link>
        </div>
        <nav className="space-y-1 p-3">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                pathname === item.href
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-800'
              }`}>
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-gray-200 p-3 dark:border-dark-800">
          <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-dark-800">
            ← Back to Store
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 dark:border-dark-800 dark:bg-dark-900">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            {NAV.find((n) => n.href === pathname)?.label || 'Admin'}
          </h1>
          <div className="flex items-center gap-4">
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">● Live</span>
            <button 
              onClick={() => {
                localStorage.removeItem('authToken');
                window.location.href = '/auth';
              }}
              className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400"
            >
              Logout
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">A</div>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
