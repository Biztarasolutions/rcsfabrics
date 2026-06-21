'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { orderApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { Suspense } from 'react';
import Image from 'next/image';
import { BLUR_PLACEHOLDER, supabaseImg } from '@/lib/image';
import toast from 'react-hot-toast';

const STATUS_CONFIG: Record<string, { label: string; icon: string; badge: string; bar: string }> = {
  PENDING:    { label: 'Order Placed',  icon: '📋', badge: 'bg-yellow-100 text-yellow-800 border border-yellow-300 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-700', bar: 'bg-yellow-400' },
  PROCESSING: { label: 'Preparing',     icon: '⚙️', badge: 'bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700',          bar: 'bg-blue-500' },
  SHIPPED:    { label: 'On the Way',    icon: '🚚', badge: 'bg-purple-100 text-purple-800 border border-purple-300 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700', bar: 'bg-purple-500' },
  DELIVERED:  { label: 'Delivered',     icon: '✅', badge: 'bg-green-100 text-green-800 border border-green-300 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700',     bar: 'bg-green-500' },
  CANCELLED:  { label: 'Cancelled',     icon: '✕',  badge: 'bg-red-100 text-red-800 border border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700',                 bar: 'bg-red-400' },
};

const TIMELINE_STEPS = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

function CancelOrderButton({ orderId }: { orderId: string }) {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    setLoading(true);
    try {
      await orderApi.cancelOrder(orderId);
      toast.success('Order cancelled');
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel order');
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  };

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Cancel order?</span>
        <button onClick={handleCancel} disabled={loading}
          className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50">
          {loading ? 'Cancelling...' : 'Yes, cancel'}
        </button>
        <button onClick={() => setConfirming(false)} className="text-xs text-gray-400 hover:underline">No</button>
      </div>
    );
  }

  return (
    <button onClick={() => setConfirming(true)}
      className="text-xs font-medium text-red-500 hover:text-red-600 hover:underline">
      Cancel Order
    </button>
  );
}

function OrderTimeline({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  if (status === 'CANCELLED') return (
    <div className="flex items-center gap-3 px-5 py-4 text-sm">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-base dark:bg-red-950/30">✕</div>
      <div>
        <p className="font-semibold text-red-700 dark:text-red-400">Order Cancelled</p>
        <p className="text-xs text-gray-400">This order has been cancelled</p>
      </div>
    </div>
  );
  const currentIdx = TIMELINE_STEPS.indexOf(status);
  return (
    <div className="px-5 py-4">
      {/* Active status banner */}
      <div className={`mb-4 flex items-center gap-2 rounded-xl px-4 py-2.5 ${cfg.badge}`}>
        <span className="text-base">{cfg.icon}</span>
        <span className="font-semibold text-sm">{cfg.label}</span>
      </div>
      <div className="flex items-center">
        {TIMELINE_STEPS.map((step, i) => {
          const done = i <= currentIdx;
          const active = i === currentIdx;
          return (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm border-2 transition-colors ${done ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30' : 'border-gray-200 bg-gray-50 dark:border-dark-600 dark:bg-dark-700'} ${active ? 'ring-2 ring-primary-300 ring-offset-1' : ''}`}>
                  {STATUS_CONFIG[step]?.icon || step[0]}
                </div>
                <p className={`mt-1 text-[10px] font-medium text-center w-16 ${done ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`}>{STATUS_CONFIG[step]?.label}</p>
              </div>
              {i < TIMELINE_STEPS.length - 1 && (
                <div className={`mb-4 h-0.5 flex-1 transition-colors ${i < currentIdx ? 'bg-primary-500' : 'bg-gray-200 dark:bg-dark-600'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function OrdersContent() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => orderApi.getUserOrders().then(res => res.data?.data?.orders ?? res.data?.orders ?? []),
  });

  if (isLoading) return <div className="flex min-h-screen items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"/></div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 py-10">
      <div className="container-main">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/account" className="text-sm font-medium text-primary-600 hover:underline dark:text-primary-400">
            ← My Account
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-sm text-gray-500">My Orders</span>
        </div>

        <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">My Orders</h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">{orders.length} orders placed</p>

        <div className="mt-8 space-y-4">
          {orders.map((order: any) => (
            <div key={order.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-dark-700 dark:bg-dark-800">
              {/* Order header */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 px-5 py-3 dark:bg-dark-700/50">
                <div className="flex flex-wrap gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Order ID</p>
                    <p className="font-mono font-semibold text-primary-700 dark:text-primary-400">#{order.orderNumber || order.id.slice(-8).toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Date</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                    <p className="font-bold text-gray-900 dark:text-white">{formatPrice(order.total)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className={`badge ${STATUS_CONFIG[order.status]?.badge || 'bg-gray-100 text-gray-700'}`}>
                    {STATUS_CONFIG[order.status]?.icon} {STATUS_CONFIG[order.status]?.label || order.status}
                  </span>
                  <span className={`badge ${order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800 border border-green-300 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700' : 'bg-yellow-100 text-yellow-800 border border-yellow-300 dark:bg-yellow-900/40 dark:text-yellow-300'}`}>
                    {order.paymentStatus === 'PAID' ? '💚 Paid' : '⏳ ' + order.paymentStatus}
                  </span>
                </div>
              </div>

              {/* Items */}
              <div className="divide-y divide-gray-50 dark:divide-dark-700 px-5">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-950/30 overflow-hidden">
                        {item.productImage ? (
                           <Image src={supabaseImg(item.productImage, 80)} alt={item.productName || ''} fill sizes="40px"
                             placeholder="blur" blurDataURL={BLUR_PLACEHOLDER} className="object-cover"/>
                        ) : (
                          <span className="text-lg">🧵</span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{item.productName}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {item.quantity}m × {formatPrice(item.pricePerMeter)}/m
                        </p>
                      </div>
                    </div>
                    <p className="font-bold text-gray-900 dark:text-white">
                      {formatPrice(item.total ?? item.quantity * item.pricePerMeter)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Timeline */}
              <div className="border-t border-gray-100 dark:border-dark-700">
                <OrderTimeline status={order.status} />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 dark:border-dark-700">
                <div>
                  {!['SHIPPED', 'DELIVERED', 'CANCELLED'].includes(order.status) && (
                    <CancelOrderButton orderId={order.id} />
                  )}
                </div>
                <Link href={`/account/orders/${order.id}`} className="text-sm font-medium text-primary-600 hover:underline dark:text-primary-400">
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>

        {orders.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-5xl">📦</p>
            <h3 className="mt-4 font-display text-2xl font-bold text-gray-900 dark:text-white">No orders yet</h3>
            <Link href="/products" className="button-primary mt-6 px-8 py-3 inline-block">Start Shopping</Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AccountOrdersPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent"/></div>}>
      <OrdersContent />
    </Suspense>
  );
}
