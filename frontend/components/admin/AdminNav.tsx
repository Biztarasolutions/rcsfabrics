'use client';

import React from 'react';
import Link from 'next/link';

const adminLinks = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'Products', href: '/admin/products' },
  { label: 'Inventory', href: '/admin/inventory' },
  { label: 'Orders', href: '/admin/orders' },
  { label: 'Customers', href: '/admin/customers' },
  { label: 'Settings', href: '/admin/settings' },
];

export default function AdminNav() {
  return (
    <nav className="border-b border-gray-200 bg-white dark:border-dark-700 dark:bg-dark-900">
      <div className="container-main flex items-center justify-between py-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-gradient">
            RCS Admin
          </h1>
        </div>

        <div className="hidden gap-6 md:flex">
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-gray-600 hover:text-primary dark:text-gray-400 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <button className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-red-600 dark:text-gray-400">
          Logout
        </button>
      </div>
    </nav>
  );
}
