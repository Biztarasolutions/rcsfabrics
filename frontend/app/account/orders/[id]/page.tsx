'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { orderApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';
import { BLUR_PLACEHOLDER, supabaseImg } from '@/lib/image';
import toast from 'react-hot-toast';

const STATUS_CONFIG: Record<string, { label: string; icon: string; badge: string }> = {
  PENDING:    { label: 'Order Placed',  icon: '📋', badge: 'bg-yellow-100 text-yellow-800 border border-yellow-300 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-700' },
  PROCESSING: { label: 'Preparing',     icon: '⚙️', badge: 'bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700' },
  SHIPPED:    { label: 'On the Way',    icon: '🚚', badge: 'bg-purple-100 text-purple-800 border border-purple-300 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700' },
  DELIVERED:  { label: 'Delivered',     icon: '✅', badge: 'bg-green-100 text-green-800 border border-green-300 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700' },
  CANCELLED:  { label: 'Cancelled',     icon: '✕',  badge: 'bg-red-100 text-red-800 border border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700' },
};

const TIMELINE_STEPS = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

const METHOD_LABEL: Record<string, string> = {
  UPI: '📲 UPI Transfer',
  COD: '💵 Cash on Delivery',
  RAZORPAY: '💳 Razorpay',
  BANK_TRANSFER: '🏦 Bank Transfer',
};

function CancelBlock({ orderId }: { orderId: string }) {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    setLoading(true);
    try {
      await orderApi.cancelOrder(orderId);
      toast.success('Order cancelled successfully');
      await queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      await queryClient.invalidateQueries({ queryKey: ['my-orders'] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel');
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  };

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900/40 dark:bg-red-950/20">
      <p className="font-semibold text-red-800 dark:text-red-300">Cancel this order?</p>
      <p className="mt-1 text-sm text-red-600 dark:text-red-400">You can cancel before the order is shipped. Stock will be restored.</p>
      {confirming ? (
        <div className="mt-3 flex gap-3">
          <button onClick={handleCancel} disabled={loading}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
            {loading ? 'Cancelling...' : 'Yes, Cancel Order'}
          </button>
          <button onClick={() => setConfirming(false)}
            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100">
            Keep Order
          </button>
        </div>
      ) : (
        <button onClick={() => setConfirming(true)}
          className="mt-3 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 dark:text-red-300 dark:hover:bg-red-950/40">
          Cancel Order
        </button>
      )}
    </div>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderApi.getOrderById(id).then(r => r.data.data ?? r.data),
    enabled: !!id,
  });

  if (isLoading) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"/>
    </div>
  );

  if (isError || !order) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 py-24">
      <p className="text-5xl">😕</p>
      <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Order not found</h2>
      <Link href="/account/orders" className="button-primary px-6 py-2.5">Back to My Orders</Link>
    </div>
  );

  const currentIdx = TIMELINE_STEPS.indexOf(order.status);
  const isCancelled = order.status === 'CANCELLED';
  const address = typeof order.shippingAddress === 'string'
    ? (() => { try { return JSON.parse(order.shippingAddress); } catch { return null; } })()
    : order.shippingAddress;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 py-10">
      <div className="container-main max-w-3xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-sm">
          <Link href="/account" className="text-primary-600 hover:underline dark:text-primary-400">My Account</Link>
          <span className="text-gray-400">/</span>
          <Link href="/account/orders" className="text-primary-600 hover:underline dark:text-primary-400">My Orders</Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-500">#{order.orderNumber || order.id?.slice(-8).toUpperCase()}</span>
        </div>

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Order Details</h1>
            <p className="mt-0.5 font-mono text-sm text-primary-600 dark:text-primary-400">
              #{order.orderNumber || order.id?.slice(-8).toUpperCase()}
            </p>
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

        <div className="space-y-4">
          {/* Order timeline */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-dark-700 dark:bg-dark-800">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Order Status</h2>
            {isCancelled ? (
              <div className="flex items-center gap-3 rounded-xl bg-red-50 p-4 text-red-700 dark:bg-red-950/20 dark:text-red-400">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-xl dark:bg-red-950/40">✕</div>
                <div>
                  <p className="font-semibold">Order Cancelled</p>
                  <p className="text-xs text-red-500">This order has been cancelled and inventory has been restored.</p>
                </div>
              </div>
            ) : (
              <>
                {/* Active status banner */}
                <div className={`mb-4 flex items-center gap-2 rounded-xl px-4 py-3 ${STATUS_CONFIG[order.status]?.badge || 'bg-gray-100'}`}>
                  <span className="text-lg">{STATUS_CONFIG[order.status]?.icon}</span>
                  <div>
                    <p className="font-semibold text-sm">{STATUS_CONFIG[order.status]?.label || order.status}</p>
                    <p className="text-xs opacity-75">Current order status</p>
                  </div>
                </div>
                <div className="flex items-center">
                  {TIMELINE_STEPS.map((step, i) => {
                    const done = i <= currentIdx;
                    const active = i === currentIdx;
                    return (
                      <React.Fragment key={step}>
                        <div className="flex flex-col items-center">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-base transition-all ${done ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30' : 'border-gray-200 bg-gray-50 dark:border-dark-600 dark:bg-dark-700'} ${active ? 'ring-2 ring-primary-300 ring-offset-2' : ''}`}>
                            {STATUS_CONFIG[step]?.icon || step[0]}
                          </div>
                          <p className={`mt-1.5 text-[10px] font-semibold text-center w-16 ${done ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`}>
                            {STATUS_CONFIG[step]?.label}
                          </p>
                        </div>
                        {i < TIMELINE_STEPS.length - 1 && (
                          <div className={`mb-5 h-0.5 flex-1 ${i < currentIdx ? 'bg-primary-500' : 'bg-gray-200 dark:bg-dark-600'}`}/>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </>
            )}
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          {/* Items */}
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-dark-700 dark:bg-dark-800">
            <h2 className="border-b border-gray-100 px-5 py-4 text-sm font-bold uppercase tracking-wider text-gray-500 dark:border-dark-700 dark:text-gray-400">
              Items Ordered
            </h2>
            <div className="divide-y divide-gray-50 dark:divide-dark-700 px-5">
              {order.items?.map((item: any) => (
                <div key={item.id} className="flex items-center gap-4 py-4">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-dark-700">
                    {item.productImage ? (
                      <Image src={supabaseImg(item.productImage, 128)} alt={item.productName || ''} fill sizes="64px"
                        placeholder="blur" blurDataURL={BLUR_PLACEHOLDER} className="object-cover"/>
                    ) : <span className="flex h-full items-center justify-center text-2xl">🧵</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white">{item.productName}</p>
                    <p className="text-sm text-gray-500">{item.quantity}m × {formatPrice(item.pricePerMeter)}/m</p>
                  </div>
                  <p className="font-bold text-gray-900 dark:text-white shrink-0">
                    {formatPrice(item.total ?? item.quantity * item.pricePerMeter)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Price breakdown + Payment + Address in a 2-col grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Price breakdown */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-dark-700 dark:bg-dark-800">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Price Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Subtotal</span><span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Shipping</span>
                  <span>{order.shippingCost > 0 ? formatPrice(order.shippingCost) : '🎁 Free'}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount {order.couponCode && `(${order.couponCode})`}</span>
                    <span>-{formatPrice(order.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-100 pt-2 dark:border-dark-700 text-base font-bold text-gray-900 dark:text-white">
                  <span>Total</span><span>{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Payment info */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-dark-700 dark:bg-dark-800">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Payment</h2>
              <p className="font-semibold text-gray-900 dark:text-white">
                {METHOD_LABEL[order.paymentMethod] || order.paymentMethod || 'N/A'}
              </p>
              {order.utrReference && (
                <div className="mt-2 rounded-lg bg-green-50 p-2 dark:bg-green-950/20">
                  <p className="text-xs text-gray-500">UTR Reference</p>
                  <p className="font-mono text-sm text-green-800 dark:text-green-300">{order.utrReference}</p>
                </div>
              )}
              {order.razorpayPaymentId && (
                <div className="mt-2 rounded-lg bg-blue-50 p-2 dark:bg-blue-950/20">
                  <p className="text-xs text-gray-500">Payment ID</p>
                  <p className="font-mono text-xs text-blue-800 dark:text-blue-300 break-all">{order.razorpayPaymentId}</p>
                </div>
              )}
              {order.trackingNumber && (
                <div className="mt-3 border-t border-gray-100 pt-3 dark:border-dark-700">
                  <p className="text-xs text-gray-500">Tracking Number</p>
                  <p className="font-mono text-sm font-semibold text-gray-900 dark:text-white">{order.trackingNumber}</p>
                </div>
              )}
            </div>
          </div>

          {/* Shipping address */}
          {address && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-dark-700 dark:bg-dark-800">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Shipping Address</h2>
              <p className="font-semibold text-gray-900 dark:text-white">{address.firstName} {address.lastName}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{address.phone}</p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {address.street}, {address.city}, {address.state} — {address.postalCode}
              </p>
            </div>
          )}

          {/* UPI pending notice */}
          {order.paymentMethod === 'UPI' && order.paymentStatus === 'PENDING' && (
            <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5 dark:border-yellow-900/40 dark:bg-yellow-950/20">
              <p className="font-semibold text-yellow-800 dark:text-yellow-300">⏳ Payment Verification Pending</p>
              <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-400">
                We're verifying your UPI payment. Your order will be confirmed within a few hours.
                {order.utrReference && ` UTR: ${order.utrReference}`}
              </p>
            </div>
          )}

          {/* Cancel order */}
          {!['SHIPPED', 'DELIVERED', 'CANCELLED'].includes(order.status) && (
            <CancelBlock orderId={order.id} />
          )}

          <div className="flex gap-3 pt-2">
            <Link href="/account/orders" className="button-secondary flex-1 py-3 text-center">← All Orders</Link>
            <Link href="/products" className="button-primary flex-1 py-3 text-center">Continue Shopping</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
