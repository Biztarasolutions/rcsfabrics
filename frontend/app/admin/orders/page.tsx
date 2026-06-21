'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { BLUR_PLACEHOLDER, supabaseImg } from '@/lib/image';

const STATUS_OPTIONS = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  PROCESSING: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  SHIPPED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  DELIVERED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};
const PAYMENT_COLORS: Record<string, string> = {
  PAID: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  REFUNDED: 'bg-gray-100 text-gray-700 dark:bg-dark-700 dark:text-gray-400',
  FAILED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};
const METHOD_LABEL: Record<string, string> = {
  UPI: '📲 UPI',
  COD: '💵 COD',
  RAZORPAY: '💳 Razorpay',
  STRIPE: '💳 Stripe',
  BANK_TRANSFER: '🏦 Bank Transfer',
};

function parseAddress(raw: any) {
  if (!raw) return null;
  if (typeof raw === 'object') return raw;
  try { return JSON.parse(raw); } catch { return null; }
}

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const { data: ordersData = { orders: [], total: 0, pages: 1 }, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['admin-orders', page, filterStatus, search],
    queryFn: () => adminApi.getOrders({ page, limit: 10, status: filterStatus, search }).then(res => res.data.data),
    refetchInterval: 30 * 1000,
    refetchIntervalInBackground: false,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      adminApi.updateOrderStatus(orderId, status),
    onSuccess: (_, { orderId, status }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Order status updated');
      if (selectedOrder?.id === orderId) setSelectedOrder((o: any) => o ? { ...o, status } : o);
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update status'),
  });

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Orders</h2>
          <p className="text-sm text-gray-500">{ordersData.total || 0} active orders</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">Updated {lastUpdated}</span>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-orders'] })}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-dark-600 dark:bg-dark-800 dark:text-gray-300 dark:hover:bg-dark-700 transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by order ID or customer..." className="input-field pl-9 py-2.5"/>
        </div>
        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="input-field w-44 py-2.5">
          <option value="">All Status</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {(filterStatus || search) && (
          <button onClick={() => { setFilterStatus(''); setSearch(''); setPage(1); }}
            className="button-ghost rounded-xl px-4 py-2.5 text-sm">Clear</button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-dark-700 dark:bg-dark-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 dark:border-dark-700 bg-gray-50 dark:bg-dark-700/50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <th className="px-5 py-4">Order</th>
                <th className="px-5 py-4">Customer</th>
                <th className="px-5 py-4 hidden md:table-cell">Date</th>
                <th className="px-5 py-4">Items</th>
                <th className="px-5 py-4">Total</th>
                <th className="px-5 py-4">Payment</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-dark-700">
              {isLoading ? (
                <tr><td colSpan={8} className="py-20 text-center text-gray-500">Loading orders...</td></tr>
              ) : ordersData.orders?.map((order: any) => (
                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-dark-700/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-mono text-xs font-semibold text-primary-700 dark:text-primary-400">
                      #{order.orderNumber || order.id.slice(-8).toUpperCase()}
                    </p>
                    {order.utrReference && (
                      <p className="text-xs text-gray-400 mt-0.5">UTR: {order.utrReference}</p>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-gray-900 dark:text-white">{order.user?.firstName} {order.user?.lastName}</p>
                    <p className="text-xs text-gray-500">{order.user?.email}</p>
                    {order.user?.phone && <p className="text-xs text-gray-400">{order.user.phone}</p>}
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell text-gray-500 dark:text-gray-400 text-xs">
                    <p>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    <p className="text-gray-400 dark:text-gray-500">{new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex -space-x-2">
                      {order.items?.slice(0, 3).map((item: any, i: number) => (
                        <div key={i} className="relative h-8 w-8 overflow-hidden rounded-full border-2 border-white dark:border-dark-800 bg-gray-100">
                          {item.productImage ? (
                            <Image src={supabaseImg(item.productImage, 64)} alt={item.productName || ''} fill sizes="32px"
                              placeholder="blur" blurDataURL={BLUR_PLACEHOLDER} className="object-cover"/>
                          ) : <span className="flex h-full items-center justify-center text-xs">🧵</span>}
                        </div>
                      ))}
                      {order.items?.length > 3 && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gray-200 text-xs font-semibold dark:border-dark-800 dark:bg-dark-700 dark:text-white">
                          +{order.items.length - 3}
                        </div>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}</p>
                  </td>
                  <td className="px-5 py-3.5 font-bold text-gray-900 dark:text-white">{formatPrice(order.total)}</td>
                  <td className="px-5 py-3.5">
                    <div className="space-y-1">
                      <span className={`badge text-xs ${PAYMENT_COLORS[order.paymentStatus]}`}>{order.paymentStatus}</span>
                      {order.paymentMethod && (
                        <p className="text-xs text-gray-500">{METHOD_LABEL[order.paymentMethod] || order.paymentMethod}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <select value={order.status} onChange={(e) => updateStatusMutation.mutate({ orderId: order.id, status: e.target.value })}
                      disabled={updateStatusMutation.isPending}
                      className={`rounded-lg border px-2 py-1 text-xs font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${STATUS_COLORS[order.status]}`}>
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button onClick={() => setSelectedOrder(order)}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-dark-600 dark:text-gray-300 dark:hover:bg-dark-700 transition-colors">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isLoading && (!ordersData.orders || ordersData.orders.length === 0) && (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">No orders found.</div>
        )}
      </div>

      {/* Pagination */}
      {ordersData.pages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {[...Array(ordersData.pages)].map((_: any, i: number) => (
            <button key={i} onClick={() => setPage(i + 1)}
              className={`h-9 w-9 rounded-xl text-sm font-semibold transition-all ${page === i + 1 ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Order Detail Drawer */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex" onClick={(e) => e.target === e.currentTarget && setSelectedOrder(null)}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"/>
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="relative ml-auto h-full w-full max-w-lg overflow-y-auto bg-white shadow-2xl dark:bg-dark-800">

              {/* Sticky header */}
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4 dark:border-dark-700 dark:bg-dark-800">
                <div>
                  <h3 className="font-display text-lg font-bold text-gray-900 dark:text-white">Order Details</h3>
                  <p className="font-mono text-xs text-primary-600 dark:text-primary-400">#{selectedOrder.orderNumber || selectedOrder.id.slice(-8).toUpperCase()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge text-xs ${STATUS_COLORS[selectedOrder.status]}`}>{selectedOrder.status}</span>
                  <button onClick={() => setSelectedOrder(null)} className="ml-2 flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-dark-700 dark:hover:text-gray-200">✕</button>
                </div>
              </div>

              <div className="p-6 space-y-6">

                {/* ── Order Meta ── */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-gray-50 p-3 dark:bg-dark-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Order Date</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                      {new Date(selectedOrder.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(selectedOrder.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3 dark:bg-dark-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Payment Method</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{METHOD_LABEL[selectedOrder.paymentMethod] || selectedOrder.paymentMethod || '—'}</p>
                    <span className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${PAYMENT_COLORS[selectedOrder.paymentStatus]}`}>
                      {selectedOrder.paymentStatus}
                    </span>
                  </div>
                </div>

                {/* ── Payment References ── */}
                {(selectedOrder.utrReference || selectedOrder.razorpayPaymentId || selectedOrder.razorpayOrderId) && (
                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/30 dark:bg-blue-950/20 space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">Payment Reference</p>
                    {selectedOrder.utrReference && (
                      <div>
                        <p className="text-xs text-blue-600 dark:text-blue-400">UTR / Transaction ID</p>
                        <p className="font-mono text-sm font-semibold text-blue-900 dark:text-blue-200 break-all">{selectedOrder.utrReference}</p>
                      </div>
                    )}
                    {selectedOrder.razorpayPaymentId && (
                      <div>
                        <p className="text-xs text-blue-600 dark:text-blue-400">Razorpay Payment ID</p>
                        <p className="font-mono text-xs text-blue-900 dark:text-blue-200 break-all">{selectedOrder.razorpayPaymentId}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Customer ── */}
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Customer</p>
                  <div className="rounded-xl border border-gray-100 p-4 dark:border-dark-700 space-y-1.5">
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedOrder.user?.firstName} {selectedOrder.user?.lastName}</p>
                    {selectedOrder.user?.email && <p className="text-sm text-gray-500">{selectedOrder.user.email}</p>}
                    {selectedOrder.user?.phone && <p className="text-sm text-gray-500">📞 {selectedOrder.user.phone}</p>}
                  </div>
                </div>

                {/* ── Shipping Address ── */}
                {(() => {
                  const addr = parseAddress(selectedOrder.shippingAddress);
                  if (!addr) return null;
                  return (
                    <div>
                      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Shipping Address</p>
                      <div className="rounded-xl border border-gray-100 p-4 dark:border-dark-700 space-y-1 text-sm">
                        {(addr.firstName || addr.lastName) && (
                          <p className="font-semibold text-gray-900 dark:text-white">{addr.firstName} {addr.lastName}</p>
                        )}
                        {addr.phone && <p className="text-gray-500">📞 {addr.phone}</p>}
                        {addr.street && <p className="text-gray-600 dark:text-gray-400">{addr.street}</p>}
                        {(addr.city || addr.state || addr.postalCode) && (
                          <p className="text-gray-600 dark:text-gray-400">
                            {[addr.city, addr.state, addr.postalCode].filter(Boolean).join(', ')}
                          </p>
                        )}
                        {addr.country && addr.country !== 'India' && <p className="text-gray-500">{addr.country}</p>}
                      </div>
                    </div>
                  );
                })()}

                {/* ── Items ── */}
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Items Ordered</p>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item: any, i: number) => (
                      <div key={i} className="flex items-start gap-3 rounded-xl border border-gray-100 p-3 dark:border-dark-700">
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-dark-700">
                          {item.productImage ? (
                            <Image src={supabaseImg(item.productImage, 120)} alt={item.productName || ''} fill sizes="56px"
                              placeholder="blur" blurDataURL={BLUR_PLACEHOLDER} className="object-cover"/>
                          ) : (
                            <span className="flex h-full items-center justify-center text-2xl">🧵</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900 dark:text-white">{item.productName}</p>
                          {(item.product?.sku || item.product?.code) && (
                            <p className="text-[10px] font-mono bg-gray-100 dark:bg-dark-600 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded inline-block mt-0.5">
                              {item.product?.sku || `Code: ${item.product?.code}`}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">{item.quantity}m × {formatPrice(item.pricePerMeter)}/m</p>
                        </div>
                        <p className="font-bold text-sm text-gray-900 dark:text-white shrink-0">{formatPrice(item.total)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Price Breakdown ── */}
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Price Breakdown</p>
                  <div className="rounded-xl border border-gray-100 dark:border-dark-700 overflow-hidden">
                    <div className="space-y-0 divide-y divide-gray-50 dark:divide-dark-700 text-sm">
                      <div className="flex justify-between px-4 py-3 text-gray-600 dark:text-gray-400">
                        <span>Items subtotal</span>
                        <span className="font-medium text-gray-900 dark:text-white">{formatPrice(selectedOrder.subtotal)}</span>
                      </div>
                      {selectedOrder.discountAmount > 0 && (
                        <div className="flex justify-between px-4 py-3 bg-green-50 dark:bg-green-950/20">
                          <span className="text-green-700 dark:text-green-400 flex items-center gap-1.5">
                            🎟️ Coupon discount
                            {selectedOrder.couponCode && (
                              <span className="font-mono text-xs bg-green-100 dark:bg-green-900/40 px-1.5 py-0.5 rounded border border-green-200 dark:border-green-800">
                                {selectedOrder.couponCode}
                              </span>
                            )}
                          </span>
                          <span className="font-semibold text-green-700 dark:text-green-400">−{formatPrice(selectedOrder.discountAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between px-4 py-3 text-gray-600 dark:text-gray-400">
                        <span>Shipping</span>
                        <span className={selectedOrder.shippingCost > 0 ? 'font-medium text-gray-900 dark:text-white' : 'font-medium text-green-600 dark:text-green-400'}>
                          {selectedOrder.shippingCost > 0 ? formatPrice(selectedOrder.shippingCost) : 'Free'}
                        </span>
                      </div>
                      {selectedOrder.tax > 0 && (
                        <div className="flex justify-between px-4 py-3 text-gray-600 dark:text-gray-400">
                          <span>Tax</span>
                          <span className="font-medium text-gray-900 dark:text-white">{formatPrice(selectedOrder.tax)}</span>
                        </div>
                      )}
                      <div className="flex justify-between px-4 py-3 bg-gray-50 dark:bg-dark-700 font-bold text-base text-gray-900 dark:text-white">
                        <span>Total</span>
                        <span className="text-primary-600 dark:text-primary-400">{formatPrice(selectedOrder.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Tracking ── */}
                {selectedOrder.trackingNumber && (
                  <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 dark:bg-blue-950/20 dark:border-blue-900/40">
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">Tracking Number</p>
                    <p className="mt-1 font-mono text-sm text-blue-900 dark:text-blue-300">{selectedOrder.trackingNumber}</p>
                  </div>
                )}

                {/* ── Update Status ── */}
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Update Status</p>
                  <div className="grid grid-cols-2 gap-2">
                    {STATUS_OPTIONS.map((s) => (
                      <button key={s} onClick={() => updateStatusMutation.mutate({ orderId: selectedOrder.id, status: s })}
                        disabled={updateStatusMutation.isPending}
                        className={`rounded-xl border py-2.5 text-xs font-semibold transition-all disabled:opacity-50 ${selectedOrder.status === s ? 'border-primary-500 bg-primary-600 text-white' : 'border-gray-200 text-gray-600 hover:border-primary-400 dark:border-dark-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-700'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
