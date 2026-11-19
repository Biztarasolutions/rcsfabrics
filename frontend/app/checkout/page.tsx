'use client';
import React, { useState, useEffect, useRef } from 'react';
import { loadCashfree, openCashfreeCheckout } from '@/lib/cashfree';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useStoresHydrated, useCartStore, useAuthStore } from '@/lib/store';
import { orderApi, publicApi, userApi } from '@/lib/api';
import { formatPrice, productDisplayName } from '@/lib/utils';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { supabaseImg, BLUR_PLACEHOLDER } from '@/lib/image';
import { useQuery } from '@tanstack/react-query';

const STEPS = ['Cart Review', 'Shipping Address', 'Payment'];

function OrderSummary({ items, subtotal, shipping, discount, total, coupon, setCoupon, couponData, onApplyCoupon, onRemoveCoupon }: {
  items: any[]; subtotal: number; shipping: number; discount: number; total: number;
  coupon: string; setCoupon: (v: string) => void; couponData: any;
  onApplyCoupon: () => void; onRemoveCoupon: () => void;
}) {
  return (
    <div className="sticky top-24 rounded-2xl border border-gray-200 bg-gray-50 p-6 dark:border-dark-700 dark:bg-dark-800">
      <h3 className="font-display text-xl font-bold text-gray-900 dark:text-white">Order Summary</h3>
      <div className="mt-4 max-h-60 space-y-3 overflow-y-auto scrollbar-hide">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-white dark:bg-dark-700">
              <Image src={supabaseImg(item.product.images?.[0]?.url || '', 160, 70, 'cover') || BLUR_PLACEHOLDER} alt={productDisplayName(item.product)} fill sizes="56px" className="object-cover"/>
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{productDisplayName(item.product)}</p>
              <p className="text-xs text-gray-500">{item.quantity}m</p>
            </div>
            <p className="shrink-0 text-sm font-semibold">{formatPrice((item.product.discountPrice || item.product.basePrice) * item.quantity)}</p>
          </div>
        ))}
      </div>

      {/* Price breakdown */}
      <div className="mt-5 space-y-2 border-t border-gray-200 pt-4 dark:border-dark-700 text-sm">
        <div className="flex justify-between text-gray-600 dark:text-gray-400">
          <span>Subtotal</span><span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-gray-600 dark:text-gray-400">
          <span>Shipping</span><span>{shipping === 0 ? '🎁 Free' : formatPrice(shipping)}</span>
        </div>
        {couponData && (
          <div className="flex justify-between text-green-600 dark:text-green-400 font-medium">
            <span>Coupon ({couponData.code})</span>
            <span>−{formatPrice(discount)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-gray-200 pt-3 dark:border-dark-700 font-bold text-base text-gray-900 dark:text-white">
          <span>Total</span>
          <span className="text-primary-700 dark:text-primary-400">{formatPrice(total)}</span>
        </div>
        {couponData && discount > 0 && (
          <p className="text-center text-xs text-green-600 dark:text-green-400 font-medium">
            🎉 You save {formatPrice(discount)} with this coupon!
          </p>
        )}
      </div>

      {/* Coupon input / applied badge */}
      {couponData ? (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-3 dark:border-green-900/40 dark:bg-green-950/20">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎟️</span>
            <div>
              <p className="text-sm font-bold text-green-700 dark:text-green-400">{couponData.code}</p>
              <p className="text-xs text-green-600 dark:text-green-500">
                {couponData.type === 'PERCENT' ? `${couponData.value}% off` : `₹${couponData.value} off`} · saving {formatPrice(discount)}
              </p>
            </div>
          </div>
          <button onClick={onRemoveCoupon}
            className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30">
            Remove
          </button>
        </div>
      ) : (
        <div className="mt-4 flex gap-2">
          <input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && onApplyCoupon()}
            placeholder="Coupon code" className="input-field flex-1 py-2 text-sm uppercase tracking-widest"/>
          <button onClick={onApplyCoupon} className="button-secondary px-4 py-2 text-sm font-semibold">Apply</button>
        </div>
      )}
    </div>
  );
}

const CONFETTI_COLORS = ['#16a34a', '#d4af37', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#10b981'];

function ThankYouScreen({ order }: { order: any }) {
  const stageRef = useRef<HTMLDivElement>(null);

  const deliveryDate = new Date(order.createdAt || Date.now());
  deliveryDate.setDate(deliveryDate.getDate() + 7);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const pieces: HTMLDivElement[] = [];
    for (let i = 0; i < 60; i++) {
      const el = document.createElement('div');
      const size = 6 + Math.random() * 6;
      el.style.cssText = [
        'position:absolute',
        `left:${Math.random() * 100}%`,
        'top:-16px',
        `width:${size}px`,
        `height:${6 + Math.random() * 10}px`,
        `background:${CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]}`,
        `border-radius:${Math.random() > 0.5 ? '50%' : '2px'}`,
        'opacity:0',
        'pointer-events:none',
        `animation:rcs-fall ${1.4 + Math.random()}s ease-in ${0.3 + Math.random() * 0.8}s both`,
      ].join(';');
      stage.appendChild(el);
      pieces.push(el);
    }
    return () => pieces.forEach(el => el.remove());
  }, []);

  return (
    <>
      <style>{`
        @keyframes rcs-fall {
          0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(620px) rotate(720deg); opacity: 0; }
        }
        @keyframes rcs-circle-pop {
          0%   { r: 0; opacity: 0; }
          60%  { r: 42; opacity: 1; }
          80%  { r: 38; }
          100% { r: 40; opacity: 1; }
        }
        @keyframes rcs-check-draw {
          0%   { stroke-dashoffset: 120; }
          100% { stroke-dashoffset: 0; }
        }
      `}</style>
      <div ref={stageRef} className="relative min-h-screen overflow-hidden bg-gray-50 py-16 dark:bg-dark-950">
        <div className="container-main max-w-lg text-center">

          {/* Animated checkmark */}
          <div className="flex justify-center">
            <svg width="90" height="90" viewBox="0 0 90 90" aria-hidden="true">
              <circle
                cx="45" cy="45"
                fill="#16a34a"
                style={{ animation: 'rcs-circle-pop 0.45s cubic-bezier(.34,1.56,.64,1) 0.05s both' }}
              />
              <polyline
                points="26,46 39,59 64,33"
                fill="none" stroke="white" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ strokeDasharray: 120, strokeDashoffset: 120, animation: 'rcs-check-draw 0.45s ease-out 0.4s both' }}
              />
            </svg>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75, duration: 0.4 }}
            className="mt-6 font-display text-3xl font-bold text-gray-900 dark:text-white"
          >
            Thank you for shopping with us!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.4 }}
            className="mt-2 text-gray-500 dark:text-gray-400"
          >
            Your order has been placed successfully.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.05, duration: 0.4 }}
            className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 text-left dark:border-dark-700 dark:bg-dark-800 space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Order Number</span>
              <span className="font-mono font-bold text-primary-600 dark:text-primary-400">
                #{order.orderNumber || order.id?.slice(-8).toUpperCase()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Total Paid</span>
              <span className="font-bold text-gray-900 dark:text-white">{formatPrice(order.total)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-gray-100 pt-4 dark:border-dark-700">
              <span className="text-sm text-gray-500">Expected Delivery</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                by {deliveryDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2, duration: 0.4 }}
            className="mt-6 flex gap-3"
          >
            <Link href={`/account/orders/${order.id}`} className="button-secondary flex-1 py-3 text-center">View Order Details</Link>
            <Link href="/fabrics" className="button-primary flex-1 py-3 text-center">Continue Shopping</Link>
          </motion.div>
        </div>
      </div>
    </>
  );
}

export default function CheckoutPage() {
  const [step, setStep] = useState(0);
  const [address, setAddress] = useState({
    firstName: '', lastName: '', phone: '',
    street: '', city: '', state: '', postalCode: '', country: 'India',
  });
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressIdx, setSelectedAddressIdx] = useState<number | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [coupon, setCoupon] = useState('');
  const [couponData, setCouponData] = useState<any>(null);
  const [placing, setPlacing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');
  const [placedOrder, setPlacedOrder] = useState<any>(null);

  const { items, clearCart, totalPrice } = useCartStore();
  const { user } = useAuthStore();
  const hydrated = useStoresHydrated();
  const router = useRouter();

  const { data: settings } = useQuery({
    queryKey: ['public-settings'],
    queryFn: () => publicApi.getSettings().then(r => r.data.data),
    staleTime: 5 * 60 * 1000,
  });

  const codEnabled = settings?.payment_cod_enabled !== 'false';
  // Online = Cashfree (UPI, cards, net banking, wallets). Existing on/off switches still apply.
  const onlineEnabled = settings?.payment_online_enabled !== 'false';

  // Load the Cashfree checkout script early so the payment pop-up opens instantly
  useEffect(() => {
    if (onlineEnabled) loadCashfree().catch(() => {});
  }, [onlineEnabled]);

  useEffect(() => {
    if (!user) return;
    userApi.getAddresses().then(res => {
      const addrs = res.data?.data ?? res.data ?? [];
      setSavedAddresses(addrs);
      if (addrs.length > 0) {
        setSelectedAddressIdx(0);
        const a = addrs[0];
        setAddress({ firstName: a.firstName || '', lastName: a.lastName || '', phone: a.phone || '', street: a.street || a.addressLine1 || '', city: a.city || '', state: a.state || '', postalCode: a.postalCode || a.zipCode || '', country: 'India' });
        setShowNewForm(false);
      } else {
        setShowNewForm(true);
      }
    }).catch(() => setShowNewForm(true));
  }, [user]);

  useEffect(() => {
    if (settings) {
      if (onlineEnabled) setPaymentMethod('online');
      else if (codEnabled) setPaymentMethod('cod');
    }
  }, [settings, onlineEnabled, codEnabled]);

  const subtotal = totalPrice();
  const shipping = subtotal >= 2000 ? 0 : 150;
  // Use the backend-calculated discount (already respects maxDiscount cap).
  const discount = Math.min(couponData?.discount ?? 0, subtotal);
  const total = subtotal + shipping - discount;

  const handleCoupon = async () => {
    if (!coupon.trim()) return;
    try {
      const res = await orderApi.validateCoupon(coupon.trim(), subtotal);
      // Axios: res.data = { success, data: { code, type, value, discount }, statusCode }
      const data = res.data?.data ?? res.data;
      setCouponData(data);
      toast.success(`Coupon ${data.code} applied! You save ${formatPrice(data.discount)}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Invalid coupon code');
    }
  };

  // Cart changed after a coupon was applied (items added/removed, quantity changed):
  // re-check the coupon against the new subtotal so the saving stays correct.
  const appliedCode = couponData?.code as string | undefined;
  useEffect(() => {
    if (!appliedCode || !hydrated) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const res = await orderApi.validateCoupon(appliedCode, subtotal);
        const data = res.data?.data ?? res.data;
        if (!cancelled) setCouponData((prev: any) => (prev && prev.code === appliedCode ? data : prev));
      } catch (error: any) {
        if (cancelled) return;
        setCouponData(null);
        toast.error(`Coupon ${appliedCode} removed: ${error.response?.data?.message || 'no longer valid for this cart'}`);
      }
    }, 400);
    return () => { cancelled = true; clearTimeout(t); };
  }, [subtotal, appliedCode, hydrated]);

  const handleRemoveCoupon = () => {
    setCouponData(null);
    setCoupon('');
    toast('Coupon removed');
  };

  const placeOrder = async () => {
    if (!user) {
      toast.error('Please login to place an order');
      router.push('/login?redirect=/checkout');
      return;
    }

    setPlacing(true);
    try {
      const orderPayload: any = {
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.product.discountPrice || item.product.basePrice,
        })),
        shippingAddress: address,
        shippingCost: shipping,
        tax: 0,
        paymentMethod: paymentMethod === 'online' ? 'CASHFREE' : 'COD',
        couponCode: couponData?.code,
      };

      const res = await orderApi.create(orderPayload);
      const order = res.data?.data ?? res.data;

      if (paymentMethod === 'online') {
        // The order is saved (stock reserved); now take payment with Cashfree
        clearCart();
        if (!order.paymentSessionId) {
          toast.error('Could not open the payment page. Your order is saved — tap “Pay now” to try again.');
          router.push(`/account/orders/${order.id}`);
          return;
        }
        const result = await openCashfreeCheckout(order.paymentSessionId, order.cashfreeMode);
        if (result.redirecting) return; // Cashfree takes over and brings the customer back to the order page
        // Always confirm with our server, whatever the pop-up says
        const v = await orderApi.verifyPayment(order.id).catch(() => null);
        const paid = v?.data?.data?.paid;
        if (paid) {
          toast.success('🎉 Payment successful! Your order is confirmed.');
          setPlacedOrder({ ...order, paymentStatus: 'PAID' });
        } else {
          toast(result.closed ? 'Payment not completed. Your order is saved — you can pay from My Orders.' : 'Payment is being confirmed. We’ll update your order shortly.');
          router.push(`/account/orders/${order.id}`);
        }
        setPlacing(false);
        return;
      }

      clearCart();
      toast.success('🎉 Order placed successfully!');
      setPlacedOrder(order);
      setPlacing(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to place order. Please try again.');
      setPlacing(false);
    }
  };

  const handleMainButton = () => placeOrder();

  const paymentOptions = [
    onlineEnabled && { id: 'online' as const, label: 'Pay online', sub: 'UPI, cards, net banking & wallets · secured by Cashfree', icon: '💳' },
    codEnabled && { id: 'cod' as const, label: 'Cash on Delivery', sub: 'Pay when order arrives', icon: '💵' },
  ].filter(Boolean) as { id: 'online' | 'cod'; label: string; sub: string; icon: string }[];

  if (placedOrder) return <ThankYouScreen order={placedOrder} />;

  // Wait until the saved login is loaded, so signed-in shoppers never see the prompt
  if (!hydrated) {
    return <div className="flex min-h-screen items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"/></div>;
  }

  if (items.length === 0 && !placing) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center py-24">
        <p className="text-6xl">🛒</p>
        <h2 className="mt-4 font-display text-2xl font-bold text-gray-900 dark:text-white">Your cart is empty</h2>
        <Link href="/fabrics" className="button-primary mt-6 px-8 py-3">Start Shopping</Link>
      </div>
    );
  }

  // Orders belong to an account: ask guests to sign in, then bring them back here
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-16 dark:bg-dark-950">
        <div className="container-main">
          <div className="mx-auto max-w-md rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-dark-700 dark:bg-dark-800">
            <p className="text-4xl">🧵</p>
            <h1 className="mt-4 font-display text-2xl font-bold text-gray-900 dark:text-white">Sign in to place your order</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Your cart ({items.length} {items.length === 1 ? 'item' : 'items'}, {formatPrice(totalPrice())}) is saved. Sign in or create an account and we&apos;ll bring you straight back to checkout.
            </p>
            <div className="mt-6 grid gap-3">
              <Link href="/auth?next=/checkout" className="button-primary w-full py-3.5">Sign in</Link>
              <Link href="/auth?mode=register&next=/checkout" className="button-secondary w-full py-3.5">Create an account</Link>
            </div>
            <Link href="/cart" className="mt-4 inline-block text-sm text-gray-500 hover:text-primary-700 dark:text-gray-400">← Back to cart</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 py-10">
      <div className="container-main">
        <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">Checkout</h1>

        {/* Steps */}
        <div className="mt-6 flex items-center gap-4">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div className="flex items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${i <= step ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500 dark:bg-dark-700'}`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`hidden text-sm font-medium sm:block ${i === step ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}`}>{s}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`flex-1 h-px ${i < step ? 'bg-primary-500' : 'bg-gray-200 dark:bg-dark-700'}`}/>}
            </React.Fragment>
          ))}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {/* Step 0 — Cart review */}
            {step === 0 && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-dark-700 dark:bg-dark-800">
                <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white">Review Your Cart</h2>
                <div className="mt-4 space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 rounded-xl border border-gray-100 p-4 dark:border-dark-700">
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-50 dark:bg-dark-700 sm:h-24 sm:w-24">
                        <Image src={supabaseImg(item.product.images?.[0]?.url || '', 200, 70, 'cover') || BLUR_PLACEHOLDER} alt={productDisplayName(item.product)} fill sizes="96px" className="object-cover"/>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 font-semibold text-gray-900 dark:text-white">{productDisplayName(item.product)}</p>
                        <p className="text-sm text-gray-500">{item.quantity}m · {formatPrice(item.product.discountPrice || item.product.basePrice)}/m</p>
                      </div>
                      <p className="shrink-0 font-bold text-primary-700 dark:text-primary-400">
                        {formatPrice((item.product.discountPrice || item.product.basePrice) * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
                <button onClick={() => setStep(1)} className="button-primary mt-6 w-full py-3.5">Continue to Shipping</button>
              </motion.div>
            )}

            {/* Step 1 — Shipping */}
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-dark-700 dark:bg-dark-800">
                <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white">Shipping Address</h2>

                {/* Saved addresses */}
                {savedAddresses.length > 0 && (
                  <div className="mt-5 space-y-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Select a saved address</p>
                    {savedAddresses.map((a, idx) => (
                      <button key={idx} type="button"
                        onClick={() => {
                          setSelectedAddressIdx(idx);
                          setShowNewForm(false);
                          setAddress({ firstName: a.firstName || '', lastName: a.lastName || '', phone: a.phone || '', street: a.street || a.addressLine1 || '', city: a.city || '', state: a.state || '', postalCode: a.postalCode || a.zipCode || '', country: 'India' });
                        }}
                        className={`w-full rounded-xl border-2 p-4 text-left transition-colors ${selectedAddressIdx === idx && !showNewForm ? 'border-primary-500 bg-primary-50/30 dark:border-primary-500/50 dark:bg-primary-950/10' : 'border-gray-200 dark:border-dark-700'}`}>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{a.firstName} {a.lastName}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{a.street || a.addressLine1}, {a.city}, {a.state} — {a.postalCode || a.zipCode}</p>
                        {a.phone && <p className="text-xs text-gray-400 mt-0.5">{a.phone}</p>}
                      </button>
                    ))}
                    <button type="button"
                      onClick={() => { setSelectedAddressIdx(null); setShowNewForm(true); setAddress({ firstName: user?.firstName || '', lastName: user?.lastName || '', phone: user?.phone || '', street: '', city: '', state: '', postalCode: '', country: 'India' }); }}
                      className={`w-full rounded-xl border-2 border-dashed p-4 text-sm font-medium transition-colors ${showNewForm ? 'border-primary-500 bg-primary-50/30 text-primary-700 dark:border-primary-500/50 dark:bg-primary-950/10 dark:text-primary-400' : 'border-gray-200 text-gray-500 hover:border-gray-300 dark:border-dark-700'}`}>
                      + Add New Address
                    </button>
                  </div>
                )}

                {/* Address form */}
                {showNewForm && (
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    {[
                      { name: 'firstName', label: 'First Name', placeholder: 'Priya' },
                      { name: 'lastName', label: 'Last Name', placeholder: 'Sharma' },
                      { name: 'phone', label: 'Phone', placeholder: '+91 98765 43210', full: true },
                      { name: 'street', label: 'Street Address', placeholder: '123, Main Street', full: true },
                      { name: 'city', label: 'City', placeholder: 'Mumbai' },
                      { name: 'state', label: 'State', placeholder: 'Maharashtra' },
                      { name: 'postalCode', label: 'PIN Code', placeholder: '400001' },
                    ].map((f) => (
                      <div key={f.name} className={(f as any).full ? 'sm:col-span-2' : ''}>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{f.label}</label>
                        <input name={f.name} value={(address as any)[f.name]} placeholder={f.placeholder}
                          onChange={(e) => setAddress({ ...address, [e.target.name]: e.target.value })}
                          className="input-field"/>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6 flex gap-3">
                  <button onClick={() => setStep(0)} className="button-secondary flex-1 py-3">← Back</button>
                  <button onClick={() => setStep(2)}
                    disabled={!address.firstName || !address.street || !address.city}
                    className="button-primary flex-1 py-3 disabled:opacity-60">Continue to Payment →</button>
                </div>
              </motion.div>
            )}

            {/* Step 2 — Payment */}
            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-dark-700 dark:bg-dark-800">
                  <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white">Payment</h2>
                  <div className="mt-5 space-y-3">
                    {paymentOptions.map((method) => (
                      <label key={method.id}
                        className={`flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 transition-colors ${paymentMethod === method.id ? 'border-primary-500 bg-primary-50/30 dark:border-primary-500/50 dark:bg-primary-950/10' : 'border-gray-200 dark:border-dark-700'}`}>
                        <input type="radio" name="payment" value={method.id} checked={paymentMethod === method.id}
                          onChange={() => setPaymentMethod(method.id)}
                          className="accent-primary-600"/>
                        <span className="text-2xl">{method.icon}</span>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{method.label}</p>
                          <p className="text-sm text-gray-500">{method.sub}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="button-secondary flex-1 py-3">← Back</button>
                  <button
                    onClick={handleMainButton}
                    disabled={placing}
                    className="button-luxury flex-1 py-3 font-semibold disabled:opacity-60">
                    {placing
                      ? '⏳ Processing...'
                      : paymentMethod === 'online'
                        ? `Pay ${formatPrice(total)} securely`
                        : `🔒 Place Order · ${formatPrice(total)}`}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
          <div>
            <OrderSummary
              items={items} subtotal={subtotal} shipping={shipping} discount={discount} total={total}
              coupon={coupon} setCoupon={setCoupon} couponData={couponData}
              onApplyCoupon={handleCoupon} onRemoveCoupon={handleRemoveCoupon}
            />
          </div>
        </div>
      </div>

    </div>
  );
}
