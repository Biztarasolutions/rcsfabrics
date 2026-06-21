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

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const { data: ordersData = { orders: [], meta: { total: 0 } }, isLoading } = useQuery({
    queryKey: ['admin-orders', page, filterStatus, search],
    queryFn: () => adminApi.getOrders({ page, limit: 10, status: filterStatus, search }).then(res => res.data.data),
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Orders</h2>
          <p className="text-sm text-gray-500">{ordersData.total || 0} total orders</p>
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
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3.5">
                    {/* Product thumbnails */}
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
              className="relative ml-auto h-full w-full max-w-lg overflow-y-auto bg-white p-6 shadow-2xl dark:bg-dark-800">
              <div className="flex items-center justify-between sticky top-0 bg-white dark:bg-dark-800 py-2 z-10">
                <div>
                  <h3 className="font-display text-xl font-bold text-gray-900 dark:text-white">Order Details</h3>
                  <p className="font-mono text-xs text-primary-600 dark:text-primary-400">#{selectedOrder.orderNumber || selectedOrder.id.toUpperCase()}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl p-1">✕</button>
              </div>

              <div className="mt-4 space-y-5">
                {/* Date & Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-gray-50 p-3 dark:bg-dark-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Date</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                      {new Date(selectedOrder.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3 dark:bg-dark-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Payment</p>
                    <p className="mt-1 text-sm font-semibold">{METHOD_LABEL[selectedOrder.paymentMethod] || selectedOrder.paymentMethod || '—'}</p>
                    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${PAYMENT_COLORS[selectedOrder.paymentStatus]}`}>
                      {selectedOrder.paymentStatus}
                    </span>
                  </div>
                </div>

                {/* UTR reference for UPI orders */}
                {selectedOrder.utrReference && (
                  <div className="rounded-xl bg-green-50 border border-green-200 p-3 dark:bg-green-950/20 dark:border-green-900/40">
                    <p className="text-xs font-semibold text-green-700 dark:text-green-400">UPI Transaction Reference</p>
                    <p className="mt-1 font-mono text-sm text-green-900 dark:text-green-300">{selectedOrder.utrReference}</p>
                  </div>
                )}

                {/* Customer */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Customer</p>
                  <div className="rounded-xl border border-gray-100 p-4 dark:border-dark-700 space-y-1">
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedOrder.user?.firstName} {selectedOrder.user?.lastName}</p>
                    <p className="text-sm text-gray-500">{selectedOrder.user?.email}</p>
                    {selectedOrder.shippingAddress && (
                      <div className="mt-2 pt-2 border-t border-gray-100 dark:border-dark-700 text-sm text-gray-500">
                        <p>{selectedOrder.shippingAddress?.phone || selectedOrder.shippingAddress?.street}</p>
                        {selectedOrder.shippingAddress?.city && (
                          <p>{selectedOrder.shippingAddress.street}, {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} — {selectedOrder.shippingAddress.postalCode}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Items with images */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Items Ordered</p>
                  <div className="space-y-3">
                    {selectedOrder.items?.map((item: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 rounded-xl border border-gray-100 p-3 dark:border-dark-700">
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-dark-700">
                          {item.productImage ? (
                            <Image src={supabaseImg(item.productImage, 120)} alt={item.productName || ''} fill sizes="56px"
                              placeholder="blur" blurDataURL={BLUR_PLACEHOLDER} className="object-cover"/>
                          ) : (
                            <span className="flex h-full items-center justify-center text-2xl">🧵</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{item.productName}</p>
                          <p className="text-xs text-gray-500">{item.quantity}m × {formatPrice(item.pricePerMeter)}/m</p>
                        </div>
                        <p className="font-bold text-sm text-gray-900 dark:text-white shrink-0">{formatPrice(item.total)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Price breakdown */}
                <div className="rounded-xl bg-gray-50 p-4 dark:bg-dark-700 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Subtotal</span><span>{formatPrice(selectedOrder.subtotal)}</span>
                  </div>
                  {selectedOrder.shippingCost > 0 && (
                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                      <span>Shipping</span><span>{formatPrice(selectedOrder.shippingCost)}</span>
                    </div>
                  )}
                  {selectedOrder.discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount {selectedOrder.couponCode && `(${selectedOrder.couponCode})`}</span>
                      <span>-{formatPrice(selectedOrder.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-gray-200 pt-2 dark:border-dark-600 font-bold text-base text-gray-900 dark:text-white">
                    <span>Total</span><span>{formatPrice(selectedOrder.total)}</span>
                  </div>
                </div>

                {/* Tracking */}
                {selectedOrder.trackingNumber && (
                  <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 dark:bg-blue-950/20 dark:border-blue-900/40">
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">Tracking Number</p>
                    <p className="mt-1 font-mono text-sm text-blue-900 dark:text-blue-300">{selectedOrder.trackingNumber}</p>
                  </div>
                )}

                {/* Update Status */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Update Status</p>
                  <div className="grid grid-cols-2 gap-2">
                    {STATUS_OPTIONS.map((s) => (
                      <button key={s} onClick={() => updateStatusMutation.mutate({ orderId: selectedOrder.id, status: s })}
                        disabled={updateStatusMutation.isPending}
                        className={`rounded-xl border py-2 text-xs font-semibold transition-all ${selectedOrder.status === s ? 'border-primary-500 bg-primary-600 text-white' : 'border-gray-200 text-gray-600 hover:border-primary-400 dark:border-dark-600 dark:text-gray-400'}`}>
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
