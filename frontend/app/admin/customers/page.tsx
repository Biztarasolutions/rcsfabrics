'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function AdminCustomersPage() {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('spent');

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['admin-customers'],
    queryFn: () => adminApi.getCustomers().then(res => res.data.data || []),
  });

  let filtered = customers.filter((c: any) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );
  if (sort === 'spent') filtered = [...filtered].sort((a, b) => b.spent - a.spent);
  if (sort === 'orders') filtered = [...filtered].sort((a, b) => b.orders - a.orders);
  if (sort === 'newest') filtered = [...filtered].sort((a, b) => new Date(b.joined).getTime() - new Date(a.joined).getTime());

  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce((s: number, c: any) => s + (c.spent || 0), 0);
  const avgOrderValue = totalRevenue / (customers.reduce((s: number, c: any) => s + (c.orders || 0), 0) || 1);

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
