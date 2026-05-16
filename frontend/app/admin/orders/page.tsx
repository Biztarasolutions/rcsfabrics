'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

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
    mutationFn: ({ orderId, status }: { orderId: string, status: string }) => 
      adminApi.updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Order status updated');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update status');
    }
  });

  const handleUpdateStatus = (orderId: string, status: string) => {
    updateStatusMutation.mutate({ orderId, status });
  };

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
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search by order ID or customer name..."
            className="input-field pl-9 py-2.5"/>
        </div>
        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="input-field w-44 py-2.5">
          <option value="">All Status</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {(filterStatus || search) && (
          <button onClick={() => { setFilterStatus(''); setSearch(''); setPage(1); }} className="button-ghost rounded-xl px-4 py-2.5 text-sm">Clear</button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-dark-700 dark:bg-dark-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 dark:border-dark-700 bg-gray-50 dark:bg-dark-700/50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <th className="px-5 py-4">Order ID</th>
                <th className="px-5 py-4">Customer</th>
                <th className="px-5 py-4 hidden md:table-cell">Date</th>
                <th className="px-5 py-4">Total</th>
                <th className="px-5 py-4">Payment</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-dark-700">
              {isLoading ? (
                 <tr><td colSpan={7} className="py-20 text-center text-gray-500">Loading orders...</td></tr>
              ) : ordersData.orders.map((order: any) => (
                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-dark-700/30 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs font-semibold text-primary-700 dark:text-primary-400">#{order.id.slice(-8).toUpperCase()}</td>
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-gray-900 dark:text-white">{order.user?.firstName} {order.user?.lastName}</p>
                    <p className="text-xs text-gray-500">{order.user?.email}</p>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell text-gray-500 dark:text-gray-400 text-xs">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3.5 font-bold text-gray-900 dark:text-white">{formatPrice(order.totalAmount)}</td>
                  <td className="px-5 py-3.5"><span className={`badge ${PAYMENT_COLORS[order.paymentStatus]}`}>{order.paymentStatus}</span></td>
                  <td className="px-5 py-3.5">
                    <select value={order.status} onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
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
        {!isLoading && ordersData.orders.length === 0 && (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">No orders found.</div>
        )}
      </div>

      {/* Pagination */}
      {ordersData.pages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
           {[...Array(ordersData.pages)].map((_, i) => (
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
              className="relative ml-auto h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl dark:bg-dark-800">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl font-bold text-gray-900 dark:text-white">Order Details</h3>
                <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl">✕</button>
              </div>
              <div className="mt-6 space-y-5">
                <div className="rounded-xl bg-gray-50 p-4 dark:bg-dark-700">
                  <p className="font-mono text-sm font-bold text-primary-600 dark:text-primary-400">#{selectedOrder.id.toUpperCase()}</p>
                  <p className="text-xs text-gray-500 mt-1">{new Date(selectedOrder.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Customer</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedOrder.user?.firstName} {selectedOrder.user?.lastName}</p>
                  <p className="text-sm text-gray-500">{selectedOrder.user?.email}</p>
                  <p className="text-sm text-gray-500 mt-2">{selectedOrder.shippingAddress?.street}, {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.postalCode}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Items</p>
                  {selectedOrder.items.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center rounded-xl border border-gray-100 p-3 dark:border-dark-700">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{item.product?.name}</p>
                        <p className="text-xs text-gray-500">{item.quantity}m × {formatPrice(item.priceAtPurchase)}/m</p>
                      </div>
                      <p className="font-bold text-gray-900 dark:text-white">{formatPrice(item.quantity * item.priceAtPurchase)}</p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center border-t border-gray-100 pt-4 dark:border-dark-700">
                  <p className="font-semibold text-gray-900 dark:text-white">Total</p>
                  <p className="text-xl font-bold text-primary-700 dark:text-primary-400">{formatPrice(selectedOrder.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Update Status</p>
                  <div className="grid grid-cols-2 gap-2">
                    {STATUS_OPTIONS.map((s) => (
                      <button key={s} onClick={() => handleUpdateStatus(selectedOrder.id, s)}
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
