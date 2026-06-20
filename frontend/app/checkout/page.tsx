'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useCartStore, useAuthStore } from '@/lib/store';
import { orderApi, publicApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';

const STEPS = ['Cart Review', 'Shipping Address', 'Payment'];

const UPI_APPS = [
  { name: 'GPay', icon: '/icons/gpay.png', emoji: '🟢', scheme: (id: string, name: string, amt: number) => `tez://upi/pay?pa=${id}&pn=${encodeURIComponent(name)}&am=${amt}&cu=INR&tn=RCS+Fabrics+Order` },
  { name: 'PhonePe', icon: '/icons/phonepe.png', emoji: '🟣', scheme: (id: string, name: string, amt: number) => `phonepe://pay?pa=${id}&pn=${encodeURIComponent(name)}&am=${amt}&cu=INR&tn=RCS+Fabrics+Order` },
  { name: 'Paytm', icon: '/icons/paytm.png', emoji: '🔵', scheme: (id: string, name: string, amt: number) => `paytmmp://pay?pa=${id}&pn=${encodeURIComponent(name)}&am=${amt}&cu=INR&tn=RCS+Fabrics+Order` },
  { name: 'BHIM', icon: '/icons/bhim.png', emoji: '🟠', scheme: (id: string, name: string, amt: number) => `upi://pay?pa=${id}&pn=${encodeURIComponent(name)}&am=${amt}&cu=INR&tn=RCS+Fabrics+Order` },
];

function UpiPayPanel({ upiId, upiName, amount, upiPaid, setUpiPaid, utrRef, setUtrRef }: {
  upiId: string; upiName: string; amount: number;
  upiPaid: boolean; setUpiPaid: (v: boolean) => void;
  utrRef: string; setUtrRef: (v: string) => void;
}) {
  const isMobile = typeof navigator !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="mt-4 rounded-xl border-2 border-green-200 bg-green-50 p-5 dark:border-green-900/40 dark:bg-green-950/20 space-y-4">

      {/* Payee info */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white border border-green-200 text-2xl shadow-sm">📲</div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Pay to</p>
          <p className="font-bold text-gray-900 dark:text-white">{upiName}</p>
          <p className="text-xs font-mono text-green-700 dark:text-green-400">{upiId}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs text-gray-500">Amount</p>
          <p className="font-bold text-lg text-gray-900 dark:text-white">₹{amount.toFixed(2)}</p>
        </div>
      </div>

      {/* Open UPI app buttons */}
      <div>
        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Open with your UPI app</p>
        <div className="grid grid-cols-4 gap-2">
          {UPI_APPS.map((app) => (
            <a key={app.name}
              href={app.scheme(upiId, upiName, amount)}
              onClick={() => setTimeout(() => setUpiPaid(true), 3000)}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-green-200 bg-white px-2 py-3 text-center hover:border-green-400 hover:bg-green-50 transition-colors dark:bg-dark-800 dark:border-green-900/50 dark:hover:bg-dark-700">
              <span className="text-2xl">{app.emoji}</span>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{app.name}</span>
            </a>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-500 text-center dark:text-gray-400">
          Tap an app above — it will open with the payment pre-filled
        </p>
      </div>

      {/* Fallback copy for desktop */}
      {!isMobile && (
        <details className="group">
          <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 list-none flex items-center gap-1">
            <span className="group-open:hidden">▶ On desktop? Copy UPI ID manually</span>
            <span className="hidden group-open:inline">▼ UPI ID</span>
          </summary>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-white border border-green-200 px-3 py-2 text-sm font-mono text-green-800 dark:bg-dark-800 dark:border-green-900 dark:text-green-300 break-all">
              {upiId}
            </code>
            <button onClick={() => { navigator.clipboard.writeText(upiId); }}
              className="shrink-0 rounded-lg border border-green-300 bg-white px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-50 transition-colors">
              Copy
            </button>
          </div>
        </details>
      )}

      {/* Confirmation */}
      <div className="border-t border-green-200 pt-4 dark:border-green-900/40">
        <label className="flex cursor-pointer items-center gap-2.5">
          <input type="checkbox" checked={upiPaid} onChange={(e) => setUpiPaid(e.target.checked)} className="accent-green-600 h-4 w-4 rounded"/>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">I have completed the payment</span>
        </label>
        {upiPaid && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3">
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              UTR / Transaction Reference <span className="text-red-500">*</span>
            </label>
            <input value={utrRef} onChange={(e) => setUtrRef(e.target.value)}
              placeholder="e.g. 426812345678"
              className="input-field text-sm"/>
            <p className="mt-1 text-xs text-gray-500">Find this in your UPI app → Transaction History</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export default function CheckoutPage() {
  const [step, setStep] = useState(0);
  const [address, setAddress] = useState({ firstName: '', lastName: '', email: '', phone: '', street: '', city: '', state: '', postalCode: '', country: 'India' });
  const [coupon, setCoupon] = useState('');
  const [couponData, setCouponData] = useState<any>(null);
  const [placing, setPlacing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'upi' | 'cod'>('upi');
  const [utrRef, setUtrRef] = useState('');
  const [upiPaid, setUpiPaid] = useState(false);

  const { items, clearCart, totalPrice } = useCartStore();
  const { user } = useAuthStore();
  const router = useRouter();

  const { data: settings } = useQuery({
    queryKey: ['public-settings'],
    queryFn: () => publicApi.getSettings().then(r => r.data.data),
    staleTime: 5 * 60 * 1000,
  });

  const upiEnabled = settings?.payment_upi_enabled !== 'false';
  const codEnabled = settings?.payment_cod_enabled !== 'false';
  const razorpayEnabled = settings?.payment_razorpay_enabled !== 'false';
  const upiId = settings?.upi_id || 'MAB0450543A0000066@Yesbank';
  const upiName = settings?.upi_name || 'Rajasthan Cloth Store';

  // Load Razorpay script
  useEffect(() => {
    if (!razorpayEnabled) return;
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => { if (document.body.contains(script)) document.body.removeChild(script); };
  }, [razorpayEnabled]);

  // Sync user info if logged in
  useEffect(() => {
    if (user) {
      setAddress(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || prev.phone,
      }));
    }
  }, [user]);

  // Set default payment method based on what's enabled
  useEffect(() => {
    if (settings) {
      if (upiEnabled) setPaymentMethod('upi');
      else if (razorpayEnabled) setPaymentMethod('razorpay');
      else if (codEnabled) setPaymentMethod('cod');
    }
  }, [settings, upiEnabled, razorpayEnabled, codEnabled]);

  const subtotal = totalPrice();
  const shipping = subtotal >= 2000 ? 0 : 150;
  const discount = couponData ? (couponData.type === 'PERCENT' ? Math.round(subtotal * (couponData.value / 100)) : couponData.value) : 0;
  const total = subtotal + shipping - discount;

  const handleCoupon = async () => {
    if (!coupon) return;
    try {
      const res = await orderApi.validateCoupon(coupon, subtotal);
      setCouponData(res.data);
      toast.success('Coupon applied successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Invalid coupon code');
    }
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error('Please login to place an order');
      router.push('/login?redirect=/checkout');
      return;
    }
    if (paymentMethod === 'upi' && upiPaid && !utrRef.trim()) {
      toast.error('Please enter your UTR / transaction reference number');
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
        paymentMethod: paymentMethod === 'upi' ? 'UPI' : paymentMethod.toUpperCase(),
        couponCode: couponData?.code,
      };
      if (paymentMethod === 'upi' && utrRef) orderPayload.utrReference = utrRef;

      const res = await orderApi.create(orderPayload);
      const order = res.data?.data ?? res.data;

      if (paymentMethod === 'razorpay' && order.razorpayOrderId) {
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: (order.total || order.totalAmount) * 100,
          currency: 'INR',
          name: 'RCS Fabrics',
          description: `Order #${order.orderNumber || order.id}`,
          order_id: order.razorpayOrderId,
          handler: async (response: any) => {
            try {
              await orderApi.verifyPayment(order.id, {
                orderId: order.id,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });
              clearCart();
              toast.success('🎉 Payment successful! Order placed.');
              router.push(`/account/orders/${order.id}`);
            } catch {
              toast.error('Payment verification failed. Please contact support.');
            }
          },
          prefill: { name: `${address.firstName} ${address.lastName}`, email: address.email, contact: address.phone },
          theme: { color: '#000000' },
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        // COD or UPI
        clearCart();
        if (paymentMethod === 'upi') {
          toast.success('🎉 Order placed! We will confirm once payment is verified.');
        } else {
          toast.success('🎉 Order placed successfully!');
        }
        router.push(`/account/orders/${order.id}`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  const OrderSummary = () => (
    <div className="sticky top-24 rounded-2xl border border-gray-200 bg-gray-50 p-6 dark:border-dark-700 dark:bg-dark-800">
      <h3 className="font-display text-xl font-bold text-gray-900 dark:text-white">Order Summary</h3>
      <div className="mt-4 max-h-60 space-y-3 overflow-y-auto scrollbar-hide">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <Image src={item.product.images?.[0]?.url || '/placeholder.png'} alt={item.product.name} width={48} height={48} className="rounded-lg object-cover"/>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{item.product.name}</p>
              <p className="text-xs text-gray-500">{item.quantity}m</p>
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {formatPrice((item.product.discountPrice || item.product.basePrice) * item.quantity)}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-5 space-y-2 border-t border-gray-200 pt-4 dark:border-dark-700 text-sm">
        <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
        <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Shipping</span><span>{shipping === 0 ? '🎁 Free' : formatPrice(shipping)}</span></div>
        {couponData && <div className="flex justify-between text-green-600"><span>Discount ({couponData.code})</span><span>-{formatPrice(discount)}</span></div>}
        <div className="flex justify-between border-t border-gray-200 pt-3 dark:border-dark-700 text-base font-bold text-gray-900 dark:text-white"><span>Total</span><span>{formatPrice(total)}</span></div>
      </div>
      {!couponData && (
        <div className="mt-4 flex gap-2">
          <input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="Coupon code" className="input-field flex-1 py-2 text-sm"/>
          <button onClick={handleCoupon} className="button-secondary px-4 py-2 text-sm">Apply</button>
        </div>
      )}
    </div>
  );

  if (items.length === 0 && !placing) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center py-24">
        <p className="text-6xl">🛒</p>
        <h2 className="mt-4 font-display text-2xl font-bold text-gray-900 dark:text-white">Your cart is empty</h2>
        <Link href="/products" className="button-primary mt-6 px-8 py-3">Start Shopping</Link>
      </div>
    );
  }

  const paymentOptions = [
    upiEnabled && { id: 'upi' as const, label: 'UPI Payment', sub: `Pay directly to ${upiName}`, icon: '📲' },
    razorpayEnabled && { id: 'razorpay' as const, label: 'Cards / Net Banking / Wallets', sub: 'Powered by Razorpay — secure checkout', icon: '💳' },
    codEnabled && { id: 'cod' as const, label: 'Cash on Delivery', sub: 'Pay when your order arrives', icon: '💵' },
  ].filter(Boolean) as { id: 'upi' | 'razorpay' | 'cod'; label: string; sub: string; icon: string }[];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 py-10">
      <div className="container-main">
        <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">Checkout</h1>

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
            {step === 0 && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-dark-700 dark:bg-dark-800">
                <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white">Review Your Cart</h2>
                <div className="mt-4 space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 rounded-xl border border-gray-100 p-4 dark:border-dark-700">
                      <Image src={item.product.images?.[0]?.url || '/placeholder.png'} alt={item.product.name} width={64} height={64} className="rounded-xl object-cover"/>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white">{item.product.name}</p>
                        <p className="text-sm text-gray-500">{item.quantity}m · {formatPrice(item.product.discountPrice || item.product.basePrice)}/m</p>
                      </div>
                      <p className="font-bold text-primary-700 dark:text-primary-400">
                        {formatPrice((item.product.discountPrice || item.product.basePrice) * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
                <button onClick={() => setStep(1)} className="button-primary mt-6 w-full py-3.5">Continue to Shipping</button>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-dark-700 dark:bg-dark-800">
                <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white">Shipping Address</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {[
                    { name: 'firstName', label: 'First Name', placeholder: 'Priya' },
                    { name: 'lastName', label: 'Last Name', placeholder: 'Sharma' },
                    { name: 'email', label: 'Email', placeholder: 'you@example.com', full: true },
                    { name: 'phone', label: 'Phone', placeholder: '+91 98765 43210' },
                    { name: 'street', label: 'Street Address', placeholder: '123, Main Street', full: true },
                    { name: 'city', label: 'City', placeholder: 'Mumbai' },
                    { name: 'state', label: 'State', placeholder: 'Maharashtra' },
                    { name: 'postalCode', label: 'PIN Code', placeholder: '400001' },
                  ].map((f) => (
                    <div key={f.name} className={f.full ? 'sm:col-span-2' : ''}>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{f.label}</label>
                      <input name={f.name} value={(address as any)[f.name]} placeholder={f.placeholder}
                        onChange={(e) => setAddress({ ...address, [e.target.name]: e.target.value })}
                        className="input-field"/>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex gap-3">
                  <button onClick={() => setStep(0)} className="button-secondary flex-1 py-3">← Back</button>
                  <button onClick={() => setStep(2)} className="button-primary flex-1 py-3">Continue to Payment →</button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-dark-700 dark:bg-dark-800">
                  <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white">Payment</h2>
                  <div className="mt-5 space-y-3">
                    {paymentOptions.map((method) => (
                      <label key={method.id} className={`flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 transition-colors ${paymentMethod === method.id ? 'border-primary-500 bg-primary-50/30 dark:border-primary-500/50 dark:bg-primary-950/10' : 'border-gray-200 dark:border-dark-700'}`}>
                        <input type="radio" name="payment" value={method.id} checked={paymentMethod === method.id} onChange={() => { setPaymentMethod(method.id); setUpiPaid(false); setUtrRef(''); }} className="accent-primary-600"/>
                        <span className="text-2xl">{method.icon}</span>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{method.label}</p>
                          <p className="text-sm text-gray-500">{method.sub}</p>
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* UPI Pay Panel */}
                  {paymentMethod === 'upi' && (
                    <UpiPayPanel
                      upiId={upiId}
                      upiName={upiName}
                      amount={total}
                      upiPaid={upiPaid}
                      setUpiPaid={setUpiPaid}
                      utrRef={utrRef}
                      setUtrRef={setUtrRef}
                    />
                  )}
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="button-secondary flex-1 py-3">← Back</button>
                  <button onClick={handlePlaceOrder} disabled={placing || (paymentMethod === 'upi' && upiPaid && !utrRef.trim())}
                    className="button-luxury flex-1 py-3 font-semibold disabled:opacity-60">
                    {placing ? '⏳ Processing...' : paymentMethod === 'upi' && !upiPaid
                      ? '⬆ Pay & Place Order'
                      : `🔒 Place Order · ${formatPrice(total)}`}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
          <div><OrderSummary /></div>
        </div>
      </div>
    </div>
  );
}
