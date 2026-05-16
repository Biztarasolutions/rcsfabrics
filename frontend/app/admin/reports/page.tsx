'use client';
import React, { useState } from 'react';
import { formatPrice } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';

export default function AdminReportsPage() {
  const [period, setPeriod] = useState('thisMonth');

  const { data: stats = null, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.getStats().then(res => res.data.data),
  });

  const totalRevenue = stats?.totalRevenue || 0;
  const totalOrders = stats?.totalOrders || 0;
  const totalCustomers = stats?.totalCustomers || 0;
  const totalProducts = stats?.totalProducts || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h2>
          <p className="text-sm text-gray-500">Business performance overview</p>
        </div>
        <div className="flex gap-2">
          {[{ v: 'thisMonth', l: 'This Month' }, { v: 'last3', l: 'Last 3 Months' }, { v: 'ytd', l: 'YTD' }].map((p) => (
            <button key={p.v} onClick={() => setPeriod(p.v)}
              className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${period === p.v ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-950/30 dark:text-primary-400' : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-dark-700 dark:text-gray-400'}`}>
              {p.l}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Revenue', value: formatPrice(totalRevenue), change: '+18.2%', icon: '💰', up: true },
          { label: 'Total Orders', value: totalOrders, change: '+12.5%', icon: '📦', up: true },
          { label: 'Avg Order Value', value: formatPrice(Math.round(totalRevenue / totalOrders)), change: '+5.1%', icon: '📊', up: true },
          { label: 'New Customers', value: '284', change: '+8.3%', icon: '👥', up: true },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-dark-700 dark:bg-dark-800">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{kpi.label}</p>
              <span className="text-xl">{kpi.icon}</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{kpi.value}</p>
            <p className={`mt-1 text-xs font-semibold ${kpi.up ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
              ↑ {kpi.change} vs last period
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue chart */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-6 dark:border-dark-700 dark:bg-dark-800">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-6">Monthly Revenue</h3>
          <div className="flex items-end gap-3 h-48">
            {MONTHLY.map((m) => (
              <div key={m.month} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{formatPrice(m.revenue / 1000)}K</span>
                <div className="w-full rounded-t-lg bg-gradient-to-t from-primary-600 to-primary-400 transition-all duration-500"
                  style={{ height: `${(m.revenue / maxRevenue) * 160}px` }}/>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{m.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top products */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-dark-700 dark:bg-dark-800">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Top Products</h3>
          <div className="space-y-4">
            {TOP_PRODUCTS.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700 dark:bg-primary-950/30 dark:text-primary-400">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{p.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{p.orders} orders</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{formatPrice(p.revenue)}</p>
                  <p className="text-xs font-semibold text-green-600 dark:text-green-400">{p.change}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-dark-700 dark:bg-dark-800">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-5">Revenue by Category</h3>
        <div className="space-y-4">
          {[
            { name: 'Silks', revenue: 245000, percent: 42 },
            { name: 'Cottons', revenue: 118000, percent: 20 },
            { name: 'Velvets', revenue: 96000, percent: 16 },
            { name: 'Chiffons', revenue: 82000, percent: 14 },
            { name: 'Others', revenue: 47000, percent: 8 },
          ].map((cat) => (
            <div key={cat.name} className="flex items-center gap-4">
              <span className="w-20 text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0">{cat.name}</span>
              <div className="flex-1 overflow-hidden rounded-full bg-gray-100 h-2.5 dark:bg-dark-700">
                <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-700"
                  style={{ width: `${cat.percent}%` }}/>
              </div>
              <div className="flex gap-3 shrink-0 text-right">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatPrice(cat.revenue)}</span>
                <span className="text-xs text-gray-400 w-8">{cat.percent}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
