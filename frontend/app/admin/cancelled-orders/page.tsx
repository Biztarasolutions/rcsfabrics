'use client';
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';
import { BLUR_PLACEHOLDER, supabaseImg } from '@/lib/image';

export default function CancelledOrdersPage() {
  const [page, setPage] = useState(1);

  const { data: ordersData = { orders: [], total: 0, pages: 1 }, isLoading } = useQuery({
    queryKey: ['admin-cancelled-orders', page],
    queryFn: () => adminApi.getCancelledOrders({ page, limit: 20 }).then(res => res.data.data),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Cancelled Orders</h2>
        <p className="text-sm text-gray-500">{ordersData.total || 0} cancelled orders</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-dark-700 dark:bg-dark-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 dark:border-dark-700 bg-gray-50 dark:bg-dark-700/50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <th className="px-5 py-4">Order</th>
                <th className="px-5 py-4">Customer</th>
                <th className="px-5 py-4">Products</th>
                <th className="px-5 py-4">Total</th>
                <th className="px-5 py-4">Payment</th>
                <th className="px-5 py-4">By</th>
                <th className="px-5 py-4">At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-dark-700">
              {isLoading ? (
                <tr><td colSpan={7} className="py-20 text-center text-gray-500">Loading...</td></tr>
              ) : ordersData.orders?.map((order: any) => (
                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-dark-700/30 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-mono text-xs font-semibold text-red-600 dark:text-red-400">
                      #{order.orderNumber || order.id.slice(-8).toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{order.paymentMethod || '—'}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-gray-900 dark:text-white">{order.user?.firstName} {order.user?.lastName}</p>
                    <p className="text-xs text-gray-500">{order.user?.email}</p>
                    {order.user?.phone && <p className="text-xs text-gray-400">{order.user.phone}</p>}
                  </td>
                  <td className="px-5 py-4">
                    <div className="space-y-2">
                      {order.items?.map((item: any, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-dark-700">
                            {item.productImage ? (
                              <Image src={supabaseImg(item.productImage, 64)} alt={item.productName || ''} fill sizes="32px"
                                placeholder="blur" blurDataURL={BLUR_PLACEHOLDER} className="object-cover"/>
                            ) : <span className="flex h-full items-center justify-center text-xs">🧵</span>}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-gray-800 dark:text-gray-200">{item.productName}</p>
                            {(item.product?.sku || item.product?.code) && (
                              <p className="text-[10px] font-mono text-gray-400">{item.product?.sku || `Code: ${item.product?.code}`}</p>
                            )}
                            <p className="text-[10px] text-gray-400">{item.quantity}m × {formatPrice(item.pricePerMeter)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4 font-bold text-gray-900 dark:text-white">{formatPrice(order.total)}</td>
                  <td className="px-5 py-4">
                    <span className="badge bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs">
                    {order.cancelledBy === 'CUSTOMER' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400">
                        👤 Customer
                      </span>
                    ) : order.cancelledBy ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400" title={order.cancelledBy}>
                        🛡️ {order.cancelledBy.includes('@') ? 'Admin' : order.cancelledBy}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-500 dark:text-gray-400">
                    <p>{new Date(order.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    <p className="mt-0.5">{new Date(order.updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isLoading && (!ordersData.orders || ordersData.orders.length === 0) && (
          <div className="py-12 text-center">
            <p className="text-3xl mb-2">✅</p>
            <p className="text-gray-500">No cancelled orders</p>
          </div>
        )}

      </div>

      {ordersData.pages > 1 && (
        <div className="flex justify-center gap-2">
          {[...Array(ordersData.pages)].map((_: any, i: number) => (
            <button key={i} onClick={() => setPage(i + 1)}
              className={`h-9 w-9 rounded-xl text-sm font-semibold ${page === i + 1 ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
