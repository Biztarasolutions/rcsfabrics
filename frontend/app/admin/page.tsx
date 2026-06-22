'use client';
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { useAuthStore } from '@/lib/store';
import Link from 'next/link';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  PROCESSING: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  SHIPPED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  DELIVERED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};
const STATUS_OPTIONS = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [statuses, setStatuses] = useState<string[]>([]);
  const toggleStatus = (s: string) =>
    setStatuses((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  const hasFilter = statuses.length > 0;

  // Catalog/customer totals (status-independent) from the stats endpoint.
  const { data: stats = null, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.getStats().then(res => res.data.data),
    refetchInterval: 30 * 1000,
    refetchIntervalInBackground: false,
  });

  // Fetch ALL orders (including cancelled) in a single call for client-side filtering.
  const { data: allOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-all-orders-merged'],
    queryFn: () =>
      adminApi.getOrders({ limit: 5000, status: 'ALL' }).then(r => r.data.data?.orders ?? r.data.data ?? []),
    refetchInterval: 30 * 1000,
    refetchIntervalInBackground: false,
  });

  const { filteredOrders, orderCount, orderRevenue, customerCount, productCount } = useMemo(() => {
    const orders = (allOrders as any[]).filter((o) => (hasFilter ? statuses.includes(o.status) : true));
    const sorted = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return {
      filteredOrders: sorted,
      orderCount: orders.length,
      orderRevenue: orders.reduce((s, o) => s + Number(o.total || 0), 0),
      customerCount: new Set(orders.map((o) => o.userId)).size,
      productCount: new Set(orders.flatMap((o) => (o.items || []).map((it: any) => it.productName))).size,
    };
  }, [allOrders, statuses, hasFilter]);

  const ordersData = { orders: filteredOrders.slice(0, 5) };

  const STAT_CARDS = stats ? [
    { label: 'Total Revenue', value: formatPrice(orderRevenue), icon: '💰', sub: hasFilter ? statuses.join(', ') : undefined },
    { label: 'Total Orders', value: String(orderCount), icon: '📦', sub: hasFilter ? statuses.join(', ') : undefined },
    { label: 'Total Customers', value: String(hasFilter ? customerCount : stats.totalCustomers), icon: '👥', sub: hasFilter ? 'In selection' : 'Registered users' },
    { label: 'Products', value: String(hasFilter ? productCount : stats.totalProducts), icon: '🧵', sub: hasFilter ? 'In selection' : 'In catalog' },
    { label: 'Avg Order Value', value: formatPrice(orderRevenue / (orderCount || 1)), icon: '📊', sub: hasFilter ? statuses.join(', ') : undefined },
    { label: 'Low Stock Items', value: String(stats.lowStockCount || 0), icon: '⚠️', sub: 'Below 10m', warning: (stats.lowStockCount || 0) > 0 },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{getGreeting()}, {user?.firstName || 'Admin'}! 👋</h2>
          <p className="mt-1 text-gray-500 dark:text-gray-400">Here&apos;s what&apos;s happening with RCS Fabrics today.</p>
        </div>
        {/* Multi-select status filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-gray-400">Status:</span>
          {STATUS_OPTIONS.map((s) => {
            const active = statuses.includes(s);
            return (
              <button key={s} onClick={() => toggleStatus(s)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${active ? 'border-primary-500 bg-primary-600 text-white' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-dark-700 dark:bg-dark-800 dark:text-gray-300'}`}>
                {s}
              </button>
            );
          })}
          {hasFilter && <button onClick={() => setStatuses([])} className="text-xs font-medium text-gray-400 hover:underline">Clear</button>}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {(statsLoading || ordersLoading) ? (
           [...Array(6)].map((_: any, i: number) => (
             <div key={i} className="h-32 animate-pulse rounded-2xl bg-gray-100 dark:bg-dark-800" />
           ))
        ) : STAT_CARDS.map((stat: any, i: number) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className={`rounded-2xl border p-5 bg-white dark:bg-dark-800 ${stat.warning ? 'border-red-200 dark:border-red-900/50' : 'border-gray-200 dark:border-dark-700'}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              </div>
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-gray-400">{stat.sub}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Orders */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-6 dark:border-dark-700 dark:bg-dark-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Recent Orders</h3>
            <Link href="/admin/orders" className="text-sm font-medium text-primary-600 hover:underline dark:text-primary-400">View All</Link>
          </div>
          <div className="overflow-x-auto">
            {ordersLoading ? (
               <div className="py-10 text-center text-gray-500">Loading orders...</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-dark-700 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    <th className="pb-3">Order ID</th>
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Total</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-dark-700">
                  {ordersData.orders.map((order: any) => (
                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-dark-700/50 transition-colors">
                      <td className="py-3 font-mono text-xs text-gray-600 dark:text-gray-400">#{order.orderNumber || order.id.slice(-8).toUpperCase()}</td>
                      <td className="py-3 font-medium text-gray-900 dark:text-white">{order.user?.firstName} {order.user?.lastName}</td>
                      <td className="py-3 font-semibold text-gray-900 dark:text-white">{formatPrice(order.total)}</td>
                      <td className="py-3"><span className={`badge ${STATUS_COLORS[order.status]}`}>{order.status}</span></td>
                    </tr>
                  ))}
                  {ordersData.orders.length === 0 && (
                    <tr><td colSpan={4} className="py-10 text-center text-gray-500">No orders found.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Inventory Quick Status */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-dark-700 dark:bg-dark-800">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span>📦</span> Quick Actions
          </h3>
          <div className="mt-6 space-y-3">
             {[
              { label: 'Add Product', href: '/admin/products', icon: '➕', color: 'bg-primary-500' },
              { label: 'Manage Orders', href: '/admin/orders', icon: '📋', color: 'bg-blue-500' },
              { label: 'Analytics', href: '/admin/analytics', icon: '📈', color: 'bg-violet-500' },
              { label: 'Settings', href: '/admin/settings', icon: '⚙️', color: 'bg-gray-500' },
            ].map((action: any) => (
              <Link key={action.label} href={action.href}
                className="flex items-center gap-3 rounded-xl border border-gray-100 p-3 hover:bg-gray-50 dark:border-dark-700 dark:hover:bg-dark-700 transition-colors">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${action.color} text-white`}>
                  <span className="text-sm">{action.icon}</span>
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
