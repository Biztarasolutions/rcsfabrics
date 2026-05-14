'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';

const CUSTOMERS = [
  { id: '1', name: 'Priya Sharma', email: 'priya@example.com', phone: '+91 98765 43210', orders: 8, spent: 42500, joined: '2024-01-15', status: 'Active' },
  { id: '2', name: 'Rahul Mehta', email: 'rahul@example.com', phone: '+91 87654 32109', orders: 24, spent: 128000, joined: '2023-06-10', status: 'Active' },
  { id: '3', name: 'Sunita Iyer', email: 'sunita@example.com', phone: '+91 76543 21098', orders: 3, spent: 12500, joined: '2025-02-20', status: 'Active' },
  { id: '4', name: 'Ananya Roy', email: 'ananya@example.com', phone: '+91 65432 10987', orders: 1, spent: 3000, joined: '2025-05-11', status: 'Active' },
  { id: '5', name: 'Kiran Patel', email: 'kiran@example.com', phone: '+91 54321 09876', orders: 15, spent: 78500, joined: '2023-11-05', status: 'Active' },
  { id: '6', name: 'Meera Joshi', email: 'meera@example.com', phone: '+91 43210 98765', orders: 2, spent: 5500, joined: '2024-09-01', status: 'Inactive' },
];

const { formatPrice } = require('@/lib/utils');

export default function AdminCustomersPage() {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('spent');

  let filtered = CUSTOMERS.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );
  if (sort === 'spent') filtered = [...filtered].sort((a, b) => b.spent - a.spent);
  if (sort === 'orders') filtered = [...filtered].sort((a, b) => b.orders - a.orders);
  if (sort === 'newest') filtered = [...filtered].sort((a, b) => new Date(b.joined).getTime() - new Date(a.joined).getTime());

  const totalCustomers = CUSTOMERS.length;
  const totalRevenue = CUSTOMERS.reduce((s, c) => s + c.spent, 0);
  const avgOrderValue = totalRevenue / CUSTOMERS.reduce((s, c) => s + c.orders, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Customers</h2>
        <p className="text-sm text-gray-500">{totalCustomers} registered customers</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total Customers', value: totalCustomers, icon: '👥' },
          { label: 'Total Revenue', value: formatPrice(totalRevenue), icon: '💰' },
          { label: 'Avg Order Value', value: formatPrice(Math.round(avgOrderValue)), icon: '📊' },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-dark-700 dark:bg-dark-800">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{s.label}</p>
              <span className="text-2xl">{s.icon}</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customers..."
            className="input-field pl-9 py-2.5"/>
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="input-field w-44 py-2.5">
          <option value="spent">Sort: Top Spenders</option>
          <option value="orders">Sort: Most Orders</option>
          <option value="newest">Sort: Newest First</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-dark-700 dark:bg-dark-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 dark:border-dark-700 bg-gray-50 dark:bg-dark-700/50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <th className="px-5 py-4">Customer</th>
                <th className="px-5 py-4 hidden sm:table-cell">Phone</th>
                <th className="px-5 py-4">Orders</th>
                <th className="px-5 py-4">Total Spent</th>
                <th className="px-5 py-4 hidden md:table-cell">Joined</th>
                <th className="px-5 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-dark-700">
              {filtered.map((customer, i) => (
                <motion.tr key={customer.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="hover:bg-gray-50 dark:hover:bg-dark-700/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-sm font-bold text-white">
                        {customer.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{customer.name}</p>
                        <p className="text-xs text-gray-500">{customer.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell text-gray-600 dark:text-gray-400 text-xs">{customer.phone}</td>
                  <td className="px-5 py-4 font-semibold text-gray-900 dark:text-white">{customer.orders}</td>
                  <td className="px-5 py-4 font-bold text-primary-700 dark:text-primary-400">{formatPrice(customer.spent)}</td>
                  <td className="px-5 py-4 hidden md:table-cell text-xs text-gray-500 dark:text-gray-400">
                    {new Date(customer.joined).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`badge ${customer.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-dark-700 dark:text-gray-400'}`}>
                      {customer.status}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
