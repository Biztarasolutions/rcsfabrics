'use client';

import React from 'react';
import { motion } from 'framer-motion';

const stats = [
  {
    label: 'Total Orders',
    value: '1,234',
    change: '+12.5%',
    icon: '📦',
  },
  {
    label: 'Revenue',
    value: '₹54,321',
    change: '+8.2%',
    icon: '💰',
  },
  {
    label: 'Customers',
    value: '892',
    change: '+4.3%',
    icon: '👥',
  },
  {
    label: 'Products',
    value: '156',
    change: '+2.1%',
    icon: '📊',
  },
];

export default function DashboardStats() {
  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="rounded-lg border border-gray-200 bg-white p-6 dark:border-dark-700 dark:bg-dark-800"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {stat.label}
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm text-green-600 font-semibold">
                  {stat.change}
                </p>
              </div>
              <span className="text-3xl">{stat.icon}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Orders */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-gray-200 bg-white p-6 dark:border-dark-700 dark:bg-dark-800"
      >
        <h2 className="text-lg font-bold">Recent Orders</h2>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-dark-700">
                <th className="py-3 text-left font-semibold">Order ID</th>
                <th className="py-3 text-left font-semibold">Customer</th>
                <th className="py-3 text-left font-semibold">Amount</th>
                <th className="py-3 text-left font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((i) => (
                <tr
                  key={i}
                  className="border-b border-gray-200 dark:border-dark-700"
                >
                  <td className="py-3">ORD-2024-{String(i).padStart(5, '0')}</td>
                  <td className="py-3">Customer {i}</td>
                  <td className="py-3 font-semibold">₹{i * 500}</td>
                  <td className="py-3">
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900 dark:text-green-100">
                      Shipped
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
