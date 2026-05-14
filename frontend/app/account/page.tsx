'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/lib/store';
import { formatPrice } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const MOCK_ORDERS = [
  { id: 'ORD-001', orderNumber: 'RCS-2025-001', status: 'DELIVERED', paymentStatus: 'PAID', total: 4497, createdAt: '2025-04-10', items: [{ productName: 'Royal Banarasi Silk', quantity: 3, pricePerMeter: 1499 }] },
  { id: 'ORD-002', orderNumber: 'RCS-2025-002', status: 'PROCESSING', paymentStatus: 'PAID', total: 1960, createdAt: '2025-05-01', items: [{ productName: 'French Linen Blend', quantity: 2, pricePerMeter: 980 }] },
  { id: 'ORD-003', orderNumber: 'RCS-2025-003', status: 'PENDING', paymentStatus: 'PENDING', total: 1360, createdAt: '2025-05-12', items: [{ productName: 'Georgette Chiffon', quantity: 2, pricePerMeter: 680 }] },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  PROCESSING: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  SHIPPED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  DELIVERED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const TABS = ['Overview', 'My Orders', 'Profile', 'Addresses'];

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [profile, setProfile] = useState({ firstName: 'Priya', lastName: 'Sharma', email: 'priya@example.com', phone: '+91 98765 43210' });
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => { logout(); router.push('/'); };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      <div className="container-main py-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">My Account</h1>
            <p className="mt-1 text-gray-500 dark:text-gray-400">Welcome back, {user?.firstName || profile.firstName}!</p>
          </div>
          <button onClick={handleLogout} className="button-secondary flex items-center gap-2 px-4 py-2 text-sm text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-900">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            Logout
          </button>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-4">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-dark-700 dark:bg-dark-800">
              <div className="mb-4 flex items-center gap-3 border-b border-gray-100 pb-4 dark:border-dark-700">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-lg font-bold text-white">
                  {(user?.firstName || profile.firstName)?.[0]}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{user?.firstName || profile.firstName} {user?.lastName || profile.lastName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email || profile.email}</p>
                </div>
              </div>
              <nav className="space-y-1">
                {TABS.map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${activeTab === tab ? 'bg-primary-600 text-white' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-700'}`}>
                    {tab === 'Overview' && '📊'}
                    {tab === 'My Orders' && '📦'}
                    {tab === 'Profile' && '👤'}
                    {tab === 'Addresses' && '📍'}
                    {tab}
                  </button>
                ))}
                <Link href="/wishlist" className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-700">
                  ❤️ Wishlist
                </Link>
              </nav>
            </div>
          </aside>

          {/* Content */}
          <main className="lg:col-span-3">
            {activeTab === 'Overview' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                {/* Stats */}
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    { label: 'Total Orders', value: MOCK_ORDERS.length, icon: '📦' },
                    { label: 'Total Spent', value: formatPrice(MOCK_ORDERS.reduce((s, o) => s + o.total, 0)), icon: '💰' },
                    { label: 'Wishlist Items', value: '3', icon: '❤️' },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-dark-700 dark:bg-dark-800">
                      <p className="text-2xl">{stat.icon}</p>
                      <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                    </div>
                  ))}
                </div>
                {/* Recent orders */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-dark-700 dark:bg-dark-800">
                  <h3 className="font-display text-lg font-bold text-gray-900 dark:text-white">Recent Orders</h3>
                  <div className="mt-4 space-y-3">
                    {MOCK_ORDERS.slice(0, 3).map((order) => (
                      <div key={order.id} className="flex items-center justify-between rounded-xl bg-gray-50 p-4 dark:bg-dark-700">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{order.orderNumber}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{order.items[0].productName} · {new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
                        </div>
                        <div className="text-right">
                          <span className={`badge ${STATUS_COLORS[order.status]}`}>{order.status}</span>
                          <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">{formatPrice(order.total)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setActiveTab('My Orders')} className="button-secondary mt-4 w-full py-2.5 text-sm">View All Orders</button>
                </div>
              </motion.div>
            )}

            {activeTab === 'My Orders' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-dark-700 dark:bg-dark-800">
                <h3 className="font-display text-xl font-bold text-gray-900 dark:text-white">My Orders</h3>
                <div className="mt-5 space-y-4">
                  {MOCK_ORDERS.map((order) => (
                    <div key={order.id} className="rounded-2xl border border-gray-100 p-5 dark:border-dark-700">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{order.orderNumber}</p>
                          <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                        <div className="flex gap-2">
                          <span className={`badge ${STATUS_COLORS[order.status]}`}>{order.status}</span>
                          <span className={`badge ${order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700'}`}>{order.paymentStatus}</span>
                        </div>
                      </div>
                      <div className="mt-3 space-y-1">
                        {order.items.map((item, i) => (
                          <p key={i} className="text-sm text-gray-700 dark:text-gray-300">
                            {item.productName} × {item.quantity}m @ {formatPrice(item.pricePerMeter)}/m
                          </p>
                        ))}
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-dark-700">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">Total: {formatPrice(order.total)}</p>
                        {order.status === 'DELIVERED' && (
                          <button className="text-sm font-medium text-primary-600 hover:underline dark:text-primary-400">Write Review</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'Profile' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-dark-700 dark:bg-dark-800">
                <h3 className="font-display text-xl font-bold text-gray-900 dark:text-white">Edit Profile</h3>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {[
                    { key: 'firstName', label: 'First Name' },
                    { key: 'lastName', label: 'Last Name' },
                    { key: 'email', label: 'Email' },
                    { key: 'phone', label: 'Phone' },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{f.label}</label>
                      <input value={(profile as any)[f.key]} onChange={(e) => setProfile({ ...profile, [f.key]: e.target.value })} className="input-field"/>
                    </div>
                  ))}
                </div>
                <button className="button-primary mt-5 px-8 py-3">Save Changes</button>
              </motion.div>
            )}

            {activeTab === 'Addresses' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-dark-700 dark:bg-dark-800">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xl font-bold text-gray-900 dark:text-white">Saved Addresses</h3>
                  <button className="button-primary px-4 py-2 text-sm">+ Add Address</button>
                </div>
                <div className="mt-5 rounded-xl border-2 border-dashed border-gray-200 p-6 text-center dark:border-dark-700">
                  <p className="text-4xl">📍</p>
                  <p className="mt-3 font-medium text-gray-700 dark:text-gray-300">No saved addresses yet</p>
                  <p className="text-sm text-gray-500">Add an address for faster checkout</p>
                </div>
              </motion.div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
