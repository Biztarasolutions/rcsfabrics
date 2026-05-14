'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { formatPrice } from '@/lib/utils';

const STATS = [
  { label: 'Total Revenue', value: formatPrice(847500), change: '+18.2%', up: true, icon: '💰', sub: 'This month' },
  { label: 'Total Orders', value: '342', change: '+12.5%', up: true, icon: '📦', sub: 'This month' },
  { label: 'Active Customers', value: '1,284', change: '+8.1%', up: true, icon: '👥', sub: 'All time' },
  { label: 'Products', value: '89', change: '+3 new', up: true, icon: '🧵', sub: 'In catalog' },
  { label: 'Avg Order Value', value: formatPrice(2478), change: '+5.3%', up: true, icon: '📊', sub: 'This month' },
  { label: 'Low Stock Items', value: '7', change: 'Action needed', up: false, icon: '⚠️', sub: 'Below 10m' },
];

const RECENT_ORDERS = [
  { id: 'RCS-2025-342', customer: 'Priya Sharma', fabric: 'Royal Banarasi Silk × 3m', total: 4497, status: 'DELIVERED', date: '12 May 2025' },
  { id: 'RCS-2025-341', customer: 'Rahul Mehta', fabric: 'Italian Velvet × 2m', total: 4800, status: 'PROCESSING', date: '12 May 2025' },
  { id: 'RCS-2025-340', customer: 'Sunita Iyer', fabric: 'French Linen × 5m', total: 4900, status: 'SHIPPED', date: '11 May 2025' },
  { id: 'RCS-2025-339', customer: 'Ananya Roy', fabric: 'Georgette Chiffon × 4m', total: 3000, status: 'PENDING', date: '11 May 2025' },
  { id: 'RCS-2025-338', customer: 'Kiran Patel', fabric: 'Pure Kanjivaram × 2m', total: 5500, status: 'DELIVERED', date: '10 May 2025' },
];

const LOW_STOCK = [
  { name: 'Italian Velvet', stock: 8, category: 'Velvets' },
  { name: 'Pure Kanjivaram Silk', stock: 5, category: 'Silks' },
  { name: 'French Lace Organza', stock: 3, category: 'Sheers' },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  PROCESSING: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  SHIPPED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  DELIVERED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Good morning, Admin! 👋</h2>
        <p className="mt-1 text-gray-500 dark:text-gray-400">Here's what's happening with RCS Fabrics today.</p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {STATS.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-dark-700 dark:bg-dark-800">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              </div>
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className={`text-xs font-semibold ${stat.up ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                {stat.up ? '↑' : '↓'} {stat.change}
              </span>
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
            <a href="/admin/orders" className="text-sm font-medium text-primary-600 hover:underline dark:text-primary-400">View All</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-dark-700 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <th className="pb-3">Order</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3 hidden sm:table-cell">Fabric</th>
                  <th className="pb-3">Total</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-dark-700">
                {RECENT_ORDERS.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-dark-700/50 transition-colors">
                    <td className="py-3 font-mono text-xs text-gray-600 dark:text-gray-400">{order.id}</td>
                    <td className="py-3 font-medium text-gray-900 dark:text-white">{order.customer}</td>
                    <td className="py-3 hidden sm:table-cell text-gray-500 dark:text-gray-400 text-xs">{order.fabric}</td>
                    <td className="py-3 font-semibold text-gray-900 dark:text-white">{formatPrice(order.total)}</td>
                    <td className="py-3"><span className={`badge ${STATUS_COLORS[order.status]}`}>{order.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 dark:border-red-900/30 dark:bg-red-950/20">
          <h3 className="font-semibold text-red-800 dark:text-red-400 flex items-center gap-2">
            <span>⚠️</span> Low Stock Alerts
          </h3>
          <div className="mt-4 space-y-3">
            {LOW_STOCK.map((item) => (
              <div key={item.name} className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm dark:bg-dark-800">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.category}</p>
                </div>
                <span className="text-sm font-bold text-red-600 dark:text-red-400">{item.stock}m left</span>
              </div>
            ))}
          </div>
          <a href="/admin/products" className="mt-4 block w-full rounded-xl border border-red-200 py-2 text-center text-sm font-medium text-red-700 hover:bg-red-100 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30 transition-colors">
            Manage Inventory →
          </a>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Add Product', href: '/admin/products', icon: '➕', color: 'from-primary-500 to-primary-700' },
          { label: 'View Orders', href: '/admin/orders', icon: '📋', color: 'from-blue-500 to-blue-700' },
          { label: 'Add Coupon', href: '/admin/coupons', icon: '🎟️', color: 'from-purple-500 to-purple-700' },
          { label: 'Add Banner', href: '/admin/banners', icon: '🖼️', color: 'from-emerald-500 to-emerald-700' },
        ].map((action) => (
          <a key={action.label} href={action.href}
            className={`flex items-center gap-3 rounded-2xl bg-gradient-to-r ${action.color} p-4 text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg`}>
            <span className="text-2xl">{action.icon}</span>
            <span className="font-semibold">{action.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
