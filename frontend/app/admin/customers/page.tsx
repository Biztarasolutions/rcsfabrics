'use client';
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/lib/store';
import { ROLE_LABEL, type Role } from '@/lib/roles';
import { adminApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';
import { BLUR_PLACEHOLDER, supabaseImg } from '@/lib/image';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  SHIPPED: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  RETURNED: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

// Order-status filter for the customer list
const ORDER_FILTERS: { key: string; label: string; statuses: string[] | null }[] = [
  { key: 'ALL', label: 'All orders', statuses: null },
  { key: 'DELIVERED', label: 'Delivered', statuses: ['DELIVERED'] },
  { key: 'OPEN', label: 'In progress', statuses: ['PENDING', 'PROCESSING', 'SHIPPED'] },
  { key: 'CANCELLED', label: 'Cancelled', statuses: ['CANCELLED'] },
  { key: 'RETURNED', label: 'Returned', statuses: ['RETURNED'] },
];

function statsFor(c: any, statuses: string[] | null) {
  if (!statuses) return { count: c.orders || 0, value: c.spent || 0 };
  const by = c.byStatus || {};
  return statuses.reduce((t, s) => ({ count: t.count + (by[s]?.count || 0), value: t.value + (by[s]?.value || 0) }), { count: 0, value: 0 });
}

function parseAddress(raw: any) {
  if (!raw) return null;
  if (typeof raw === 'object') return raw;
  try { return JSON.parse(raw); } catch { return null; }
}

function CustomerDrawer({ customer, onClose, initialFilter = 'ALL' }: { customer: any; onClose: () => void; initialFilter?: string }) {
  const [filter, setFilter] = useState(initialFilter);
  // Full history from the customer-detail endpoint — returns ALL orders including cancelled.
  const { data: detail, isLoading } = useQuery({
    queryKey: ['admin-customer-detail', customer.id],
    queryFn: () => adminApi.getCustomerDetail(customer.id).then(r => r.data.data),
  });

  const allOrders = useMemo(
    () => ((detail?.orders ?? []) as any[])
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [detail]
  );

  const fStatuses = (ORDER_FILTERS.find((f) => f.key === filter) || ORDER_FILTERS[0]).statuses;
  const orders = fStatuses ? allOrders.filter((o: any) => fStatuses.includes(o.status)) : allOrders;
  const countFor = (st: string[] | null) => (st ? allOrders.filter((o: any) => st.includes(o.status)).length : allOrders.length);

  const totalSpent = orders.reduce((s: number, o: any) => s + Number(o.total || 0), 0);
  const orderCount = orders.length;

  return (
    <div className="fixed inset-0 z-50 flex" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}/>
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25 }}
        className="relative ml-auto h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl dark:bg-dark-800">

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4 dark:border-dark-700 dark:bg-dark-800">
          <h3 className="font-display text-lg font-bold text-gray-900 dark:text-white">Customer Profile</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-dark-700">✕</button>
        </div>

        <div className="p-6 space-y-6">
          <>
              {/* Profile card */}
              <div className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-dark-700 dark:bg-dark-700/50">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-xl font-bold text-white">
                  {(customer.name || '??').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{customer.name}</p>
                  {(customer.customerId || detail?.customerId) && (
                    <p className="text-xs font-semibold tracking-wide text-primary-700 dark:text-primary-400">{customer.customerId || detail?.customerId}</p>
                  )}
                  <p className="text-sm text-gray-500">{customer.email}</p>
                  {customer.phone && customer.phone !== 'N/A' && <p className="text-sm text-gray-500">📞 {customer.phone}</p>}
                  {Array.isArray(detail?.phones) && detail.phones.length > 1 && (
                    <p className="text-xs text-gray-400">
                      Earlier numbers: {detail.phones.filter((p: any) => p.phone !== customer.phone).map((p: any) => p.phone).join(', ')}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    Joined {new Date(customer.joined).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <span className={`badge shrink-0 ${customer.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {customer.status}
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Orders', value: orderCount, icon: '📦' },
                  { label: 'Total Spent', value: formatPrice(totalSpent), icon: '💰' },
                  { label: 'Avg Order', value: formatPrice(orderCount ? Math.round(totalSpent / orderCount) : 0), icon: '📊' },
                ].map(s => (
                  <div key={s.label} className="rounded-xl border border-gray-100 bg-white p-3 text-center dark:border-dark-700 dark:bg-dark-800">
                    <p className="text-lg">{s.icon}</p>
                    <p className="mt-1 font-bold text-gray-900 dark:text-white text-sm">{s.value}</p>
                    <p className="text-[10px] text-gray-500">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Order history */}
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Order History ({orderCount})
                </p>
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {ORDER_FILTERS.map((f) => (
                    <button key={f.key} type="button" onClick={() => setFilter(f.key)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${filter === f.key ? 'border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900' : 'border-gray-200 text-gray-600 dark:border-dark-600 dark:text-gray-300'}`}>
                      {f.label} ({countFor(f.statuses)})
                    </button>
                  ))}
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="h-7 w-7 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"/>
                  </div>
                ) : orderCount === 0 ? (
                  <p className="rounded-xl border border-dashed border-gray-200 py-8 text-center text-sm text-gray-400 dark:border-dark-600">{allOrders.length ? 'No orders with this status' : 'No orders yet'}</p>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order: any) => {
                      const addr = parseAddress(order.shippingAddress);
                      return (
                        <div key={order.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden dark:border-dark-700 dark:bg-dark-800">
                          {/* Order header */}
                          <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-gray-50 px-4 py-3 dark:border-dark-700 dark:bg-dark-700/50">
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="font-mono text-xs font-bold text-primary-600 dark:text-primary-400">
                                #{order.orderNumber || order.id.slice(-8).toUpperCase()}
                              </span>
                              <span className={`badge text-[10px] ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>{order.status}</span>
                              <span className={`badge text-[10px] ${order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{order.paymentStatus}</span>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-bold text-sm text-gray-900 dark:text-white">{formatPrice(order.total)}</p>
                              <p className="text-[10px] text-gray-400">
                                {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                {' · '}
                                {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              {order.status === 'CANCELLED' && (
                                <p className="text-[10px] text-red-400">
                                  Cancelled {new Date(order.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                  {' · '}
                                  {new Date(order.updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Items */}
                          <div className="divide-y divide-gray-50 dark:divide-dark-700 px-4">
                            {order.items?.map((item: any, i: number) => (
                              <div key={i} className="flex items-center gap-3 py-3">
                                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-dark-700">
                                  {item.productImage ? (
                                    <Image src={supabaseImg(item.productImage, 80)} alt={item.productName || ''} fill sizes="40px"
                                      placeholder="blur" blurDataURL={BLUR_PLACEHOLDER} className="object-cover"/>
                                  ) : <span className="flex h-full items-center justify-center text-sm">🧵</span>}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{item.productName}</p>
                                  {(item.product?.sku || item.product?.code) && (
                                    <p className="text-[10px] font-mono text-gray-400">{item.product?.sku || `Code: ${item.product?.code}`}</p>
                                  )}
                                  <p className="text-xs text-gray-500">{item.quantity}m × {formatPrice(item.pricePerMeter)}/m</p>
                                </div>
                                <p className="shrink-0 text-sm font-bold text-gray-900 dark:text-white">{formatPrice(item.total)}</p>
                              </div>
                            ))}
                          </div>

                          {/* Price summary + address */}
                          <div className="border-t border-gray-100 dark:border-dark-700 px-4 py-3 bg-gray-50/50 dark:bg-dark-700/30 space-y-2">
                            {/* Price breakdown */}
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                              <span>Subtotal: <span className="font-medium text-gray-700 dark:text-gray-300">{formatPrice(order.subtotal)}</span></span>
                              {order.discountAmount > 0 && (
                                <span className="text-green-600">
                                  Coupon {order.couponCode && `(${order.couponCode})`}: −{formatPrice(order.discountAmount)}
                                </span>
                              )}
                              <span>Shipping: <span className="font-medium text-gray-700 dark:text-gray-300">{order.shippingCost > 0 ? formatPrice(order.shippingCost) : 'Free'}</span></span>
                              <span className="font-bold text-gray-900 dark:text-white">Total: {formatPrice(order.total)}</span>
                            </div>
                            {/* Payment ref */}
                            {(order.utrReference || order.cashfreePaymentId) && (
                              <p className="text-[10px] font-mono text-gray-400">
                                Ref: {order.utrReference || order.cashfreePaymentId}
                              </p>
                            )}
                            {/* Shipping address */}
                            {addr && (
                              <p className="text-xs text-gray-500">
                                📍 {[addr.street, addr.city, addr.state, addr.postalCode].filter(Boolean).join(', ')}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
          </>
        </div>
      </motion.div>
    </div>
  );
}

const ROLE_BADGE: Record<string, string> = {
  SUPER_ADMIN: 'bg-primary-100 text-primary-800 dark:bg-primary-950/50 dark:text-primary-300',
  ADMIN: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  EMPLOYEE: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
  CUSTOMER: 'bg-gray-100 text-gray-600 dark:bg-dark-700 dark:text-gray-400',
};
const ROLE_FILTERS: { key: string; label: string }[] = [
  { key: 'ALL', label: 'Everyone' },
  { key: 'CUSTOMER', label: 'Customers' },
  { key: 'EMPLOYEE', label: 'Employees' },
  { key: 'ADMIN', label: 'Admins' },
];

export default function AdminCustomersPage() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('spent');
  const [orderFilter, setOrderFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  const { data: myRole } = useQuery({
    queryKey: ['admin-me', userId],
    queryFn: () => adminApi.getMyRole().then((r) => r.data?.data?.role as Role),
    staleTime: 60 * 1000,
  });
  const isSuper = myRole === 'SUPER_ADMIN';

  const { data: allUsers = [] } = useQuery({
    queryKey: ['admin-customers'],
    queryFn: () => adminApi.getCustomers().then(res => res.data.data || []),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: 'ADMIN' | 'EMPLOYEE' | 'CUSTOMER' }) => adminApi.setUserRole(id, role),
    onSuccess: (_, { role }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
      toast.success(`Role changed to ${ROLE_LABEL[role]}`);
    },
    onError: (err: any) => toast.error(err?.message || 'Could not change the role'),
  });

  const changeRole = (c: any, role: 'ADMIN' | 'EMPLOYEE' | 'CUSTOMER') => {
    if (role === c.role) return;
    const what = role === 'ADMIN'
      ? 'Admins can see everything in the admin panel, including orders, customers and revenue.'
      : role === 'EMPLOYEE'
        ? 'Employees can manage products, stock, categories, banners and coupons, but cannot see orders, customers or revenue.'
        : 'Customers have no access to the admin panel.';
    if (!window.confirm(`Make ${c.name} (${c.email}) ${ROLE_LABEL[role].toLowerCase()}?\n\n${what}`)) return;
    roleMutation.mutate({ id: c.id, role });
  };

  const roleCount = (k: string) => (k === 'ALL' ? allUsers.length : allUsers.filter((c: any) => (c.role || 'CUSTOMER') === k || (k === 'ADMIN' && c.role === 'SUPER_ADMIN')).length);
  const customers = isSuper && roleFilter !== 'ALL'
    ? allUsers.filter((c: any) => (c.role || 'CUSTOMER') === roleFilter || (roleFilter === 'ADMIN' && c.role === 'SUPER_ADMIN'))
    : allUsers;

  const orderFilterDef = ORDER_FILTERS.find((f) => f.key === orderFilter) || ORDER_FILTERS[0];
  const view = (customers as any[])
    .map((c: any) => {
      const st = statsFor(c, orderFilterDef.statuses);
      return { ...c, fOrders: st.count, fSpent: st.value };
    })
    // with a status filter on, show only people who have such orders
    .filter((c: any) => !orderFilterDef.statuses || c.fOrders > 0);

  let filtered = view.filter((c: any) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    String(c.customerId || '').toLowerCase().includes(search.toLowerCase()) ||
    String(c.phone || '').includes(search)
  );
  if (sort === 'spent') filtered = [...filtered].sort((a: any, b: any) => b.fSpent - a.fSpent);
  if (sort === 'orders') filtered = [...filtered].sort((a: any, b: any) => b.fOrders - a.fOrders);
  if (sort === 'newest') filtered = [...filtered].sort((a: any, b: any) => new Date(b.joined).getTime() - new Date(a.joined).getTime());

  const totalCustomers = view.length;
  const totalRevenue = view.reduce((s: number, c: any) => s + (c.fSpent || 0), 0);
  const totalOrders = view.reduce((s: number, c: any) => s + (c.fOrders || 0), 0);
  const avgOrderValue = totalRevenue / (totalOrders || 1);
  const fLabel = orderFilterDef.statuses ? orderFilterDef.label : '';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Customers</h2>
        <p className="text-sm text-gray-500">
          {isSuper ? `${totalCustomers} ${roleFilter === 'ALL' ? 'accounts' : ROLE_FILTERS.find((r) => r.key === roleFilter)?.label.toLowerCase()} · you decide who is admin, employee or customer` : `${totalCustomers} registered customers`}
        </p>
      </div>

      {isSuper && (
        <div className="flex flex-wrap gap-2">
          {ROLE_FILTERS.map((r) => (
            <button key={r.key} type="button" onClick={() => setRoleFilter(r.key)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${roleFilter === r.key ? 'border-primary-700 bg-primary-700 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-primary-300 dark:border-dark-600 dark:bg-dark-800 dark:text-gray-300'}`}>
              {r.label} <span className="opacity-70">({roleCount(r.key)})</span>
            </button>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: isSuper && roleFilter !== 'CUSTOMER' ? 'Accounts' : 'Total Customers', value: totalCustomers, icon: '👥' },
          { label: fLabel ? `${fLabel} value · ${totalOrders} orders` : 'Total Revenue', value: formatPrice(totalRevenue), icon: '💰' },
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

      {/* Order status filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Orders:</span>
        {ORDER_FILTERS.map((f) => (
          <button key={f.key} type="button" onClick={() => setOrderFilter(f.key)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${orderFilter === f.key ? 'border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400 dark:border-dark-600 dark:bg-dark-800 dark:text-gray-300'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, phone or Customer ID..."
            className="input-field pl-9 py-2.5"/>
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="input-field py-2.5 sm:w-44">
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
                <th className="px-5 py-4">{fLabel ? `${fLabel} orders` : 'Orders'}</th>
                <th className="px-5 py-4">{fLabel ? `${fLabel} value` : 'Total Spent'}</th>
                <th className="px-5 py-4 hidden md:table-cell">Joined</th>
                <th className="px-5 py-4 hidden lg:table-cell">Last Order</th>
                {isSuper && <th className="px-5 py-4">Role</th>}
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-dark-700">
              {filtered.map((customer: any, i: number) => (
                <motion.tr key={customer.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="hover:bg-gray-50 dark:hover:bg-dark-700/30 transition-colors cursor-pointer"
                  onClick={() => setSelectedCustomer(customer)}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-sm font-bold text-white">
                        {customer.name.split(' ').map((n: any) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{customer.name}</p>
                        {customer.customerId && <p className="text-[11px] font-semibold tracking-wide text-primary-700 dark:text-primary-400">{customer.customerId}</p>}
                        <p className="text-xs text-gray-500">{customer.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell text-gray-600 dark:text-gray-400 text-xs">{customer.phone}</td>
                  <td className="px-5 py-4 font-semibold text-gray-900 dark:text-white">
                    {customer.fOrders}
                    {fLabel && <span className="block text-[10px] font-normal text-gray-400">of {customer.orders} total</span>}
                  </td>
                  <td className="px-5 py-4 font-bold text-primary-700 dark:text-primary-400">{formatPrice(customer.fSpent)}</td>
                  <td className="px-5 py-4 hidden md:table-cell text-xs text-gray-500 dark:text-gray-400">
                    {new Date(customer.joined).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell text-xs text-gray-500 dark:text-gray-400">
                    {customer.lastSeen ? (
                      <>
                        <p>{new Date(customer.lastSeen).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        <p className="text-gray-400 dark:text-gray-500">{new Date(customer.lastSeen).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                      </>
                    ) : '—'}
                  </td>
                  {isSuper && (
                    <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                      {customer.role === 'SUPER_ADMIN' ? (
                        <span className={`badge ${ROLE_BADGE.SUPER_ADMIN}`}>Super admin</span>
                      ) : (
                        <select
                          value={customer.role || 'CUSTOMER'}
                          disabled={roleMutation.isPending}
                          onChange={(e) => changeRole(customer, e.target.value as any)}
                          aria-label={`Role for ${customer.name}`}
                          className={`cursor-pointer rounded-lg border-0 px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500/30 ${ROLE_BADGE[customer.role || 'CUSTOMER']}`}>
                          <option value="CUSTOMER">Customer</option>
                          <option value="EMPLOYEE">Employee</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      )}
                    </td>
                  )}
                  <td className="px-5 py-4">
                    <span className={`badge ${customer.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-dark-700 dark:text-gray-400'}`}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedCustomer(customer); }}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-dark-600 dark:text-gray-300 dark:hover:bg-dark-700 transition-colors">
                      View
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-gray-500">{isSuper && roleFilter !== 'ALL' && roleFilter !== 'CUSTOMER' ? 'No one has this role yet' : 'No customers found'}</div>
        )}
      </div>

      {/* Customer Detail Drawer */}
      <AnimatePresence>
        {selectedCustomer && (
          <CustomerDrawer
            customer={selectedCustomer}
            onClose={() => setSelectedCustomer(null)}
            initialFilter={orderFilter}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
