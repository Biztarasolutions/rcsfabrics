'use client';
import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore, useWishlistStore } from '@/lib/store';
import { formatPrice } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi, orderApi, userApi, productApi } from '@/lib/api';
import { queryClient } from '@/components/common/Providers';
import { supabaseImg, BLUR_PLACEHOLDER } from '@/lib/image';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  PROCESSING: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  SHIPPED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  DELIVERED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const TABS = ['Overview', 'My Orders', 'Profile', 'Addresses'];

function ContactChangeField({ label, field, currentValue, change, onStart, onCancel, onChangeValue, onSendOTP, onChangeOTP, onVerify }: {
  label: string; field: 'email' | 'phone'; currentValue: string;
  change: { step: 'input' | 'otp'; newValue: string; otp: string; sending: boolean; verifying: boolean } | null;
  onStart: () => void; onCancel: () => void;
  onChangeValue: (v: string) => void; onSendOTP: () => void;
  onChangeOTP: (v: string) => void; onVerify: () => void;
}) {
  return (
    <div className="mt-4">
      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      {!change ? (
        <div className="flex items-center gap-2">
          <input value={currentValue || ''} readOnly className="input-field flex-1 bg-gray-50 dark:bg-dark-700 cursor-default select-all"/>
          <button type="button" onClick={onStart}
            className="shrink-0 rounded-xl border border-primary-200 px-4 py-2.5 text-sm font-semibold text-primary-600 hover:bg-primary-50 dark:border-primary-800 dark:text-primary-400 dark:hover:bg-primary-950/20 transition-colors">
            Change
          </button>
        </div>
      ) : change.step === 'input' ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input value={change.newValue} onChange={(e) => onChangeValue(e.target.value)}
              type={field === 'email' ? 'email' : 'tel'}
              placeholder={field === 'email' ? 'Enter new email' : 'Enter new phone'}
              className="input-field flex-1" autoFocus/>
            <button type="button" onClick={onSendOTP} disabled={!change.newValue.trim() || change.sending}
              className="shrink-0 button-primary px-4 py-2.5 text-sm disabled:opacity-50">
              {change.sending ? 'Sending…' : 'Send OTP'}
            </button>
            <button type="button" onClick={onCancel} className="shrink-0 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">✕</button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">OTP sent to <strong>{change.newValue}</strong>. Enter it below.</p>
          <div className="flex items-center gap-2">
            <input value={change.otp} onChange={(e) => onChangeOTP(e.target.value)}
              placeholder="6-digit OTP" maxLength={6} className="input-field flex-1 font-mono tracking-widest" autoFocus/>
            <button type="button" onClick={onVerify} disabled={change.otp.length < 6 || change.verifying}
              className="shrink-0 button-primary px-4 py-2.5 text-sm disabled:opacity-50">
              {change.verifying ? 'Verifying…' : 'Verify'}
            </button>
            <button type="button" onClick={onCancel} className="shrink-0 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">✕</button>
          </div>
        </div>
      )}
    </div>
  );
}

const TAB_SLUGS: Record<string, string> = {
  'Overview': 'overview', 'My Orders': 'my-orders', 'Profile': 'profile', 'Addresses': 'addresses',
};
const SLUG_TO_TAB: Record<string, string> = Object.fromEntries(Object.entries(TAB_SLUGS).map(([k, v]) => [v, k]));

function AccountPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => SLUG_TO_TAB[searchParams.get('tab') ?? ''] ?? 'Overview');
  const { user, logout } = useAuthStore();
  const { items: wishlistItems } = useWishlistStore();
  const router = useRouter();

  const setTab = (tab: string) => {
    setActiveTab(tab);
    router.push(`?tab=${TAB_SLUGS[tab] ?? 'overview'}`, { scroll: false });
  };

  // Redirect if not logged in
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (!user && !token) {
      router.push('/auth?redirect=/account');
    }
  }, [user, router]);

  // Fetch real profile data (including phone, isVerified, etc.)
  const { data: profileRes, isLoading: isProfileLoading, refetch: refetchProfile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => authApi.getProfile().then(res => res.data.data),
    enabled: !!user,
  });

  // Fetch real user orders
  const { data: orders = [], isLoading: isOrdersLoading } = useQuery({
    queryKey: ['user-orders'],
    queryFn: () => orderApi.getUserOrders().then(res => res.data.data?.orders || []),
    enabled: !!user,
  });

  // Fetch real addresses
  const { data: addresses = [], isLoading: isAddressesLoading, refetch: refetchAddresses } = useQuery({
    queryKey: ['user-addresses'],
    queryFn: () => userApi.getAddresses().then(res => res.data.data || []),
    enabled: !!user,
  });

  // Fetch user's submitted reviews (to mark already-reviewed products)
  const qc = useQueryClient();
  const { data: myReviews = [] } = useQuery({
    queryKey: ['user-reviews'],
    queryFn: () => userApi.getMyReviews().then(res => res.data.data || []),
    enabled: !!user,
  });
  const reviewedProductIds = new Set(myReviews.map((r: any) => r.productId));

  // Profile Form State
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  // Contact change (email / phone) OTP flow
  type ContactField = 'email' | 'phone';
  const [contactChange, setContactChange] = useState<{
    field: ContactField; step: 'input' | 'otp'; newValue: string; otp: string; sending: boolean; verifying: boolean;
  } | null>(null);

  const startContactChange = (field: ContactField) =>
    setContactChange({ field, step: 'input', newValue: '', otp: '', sending: false, verifying: false });

  const cancelContactChange = () => setContactChange(null);

  const sendContactOTP = async () => {
    if (!contactChange) return;
    setContactChange((c) => c && { ...c, sending: true });
    try {
      await userApi.requestContactOTP(contactChange.field, contactChange.newValue.trim());
      toast.success(`OTP sent to your new ${contactChange.field}`);
      setContactChange((c) => c && { ...c, step: 'otp', sending: false });
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to send OTP');
      setContactChange((c) => c && { ...c, sending: false });
    }
  };

  const verifyContactOTP = async () => {
    if (!contactChange) return;
    setContactChange((c) => c && { ...c, verifying: true });
    try {
      const res = await userApi.verifyContactOTP(contactChange.field, contactChange.newValue.trim(), contactChange.otp.trim());
      const updatedUser = res.data.data;
      useAuthStore.getState().setUser(updatedUser);
      setProfileForm((f) => ({ ...f, [contactChange.field]: contactChange.newValue.trim() }));
      toast.success(`${contactChange.field === 'email' ? 'Email' : 'Phone'} updated successfully!`);
      refetchProfile();
      setContactChange(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Verification failed');
      setContactChange((c) => c && { ...c, verifying: false });
    }
  };

  useEffect(() => {
    if (profileRes) {
      setProfileForm({
        firstName: profileRes.firstName || '',
        lastName: profileRes.lastName || '',
        email: profileRes.email || '',
        phone: profileRes.phone || '',
      });
    }
  }, [profileRes]);

  // Review Modal State
  const [reviewModal, setReviewModal] = useState<{ order: any; item: any } | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewHover, setReviewHover] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);

  const openReview = (order: any, item: any) => {
    setReviewModal({ order, item });
    setReviewRating(0);
    setReviewComment('');
    setReviewHover(0);
  };

  const submitReview = async () => {
    if (!reviewRating || !reviewModal) return;
    setSubmittingReview(true);
    try {
      await productApi.submitReview(reviewModal.item.productId, {
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      });
      toast.success('Review submitted! Thank you.');
      qc.invalidateQueries({ queryKey: ['user-reviews'] });
      setReviewModal(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Address Form State
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
  });

  const handleLogout = () => { logout(); queryClient.clear(); router.push('/'); };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await authApi.updateProfile({
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        phone: profileForm.phone,
      });
      const updatedUser = res.data.data;
      useAuthStore.getState().setUser(updatedUser);
      toast.success('Profile updated successfully!');
      refetchProfile();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAddress(true);
    try {
      await userApi.addAddress(addressForm);
      toast.success('Address added successfully!');
      refetchAddresses();
      setShowAddressForm(false);
      setAddressForm({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to add address');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    try {
      await userApi.deleteAddress(id);
      toast.success('Address deleted successfully!');
      refetchAddresses();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete address');
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-dark-950">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400 font-medium">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  const isPageLoading =
    (activeTab === 'Overview' && (isProfileLoading || isOrdersLoading)) ||
    (activeTab === 'My Orders' && isOrdersLoading) ||
    (activeTab === 'Profile' && isProfileLoading) ||
    (activeTab === 'Addresses' && isAddressesLoading);
  const totalSpent = orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      <div className="container-main py-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">My Account</h1>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              Welcome back, {profileRes?.firstName || user.firstName}!
            </p>
          </div>
          <button onClick={handleLogout} className="button-secondary flex items-center gap-2 px-4 py-2 text-sm text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-900">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            Logout
          </button>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-4">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-dark-700 dark:bg-dark-800 animate-fade-in">
              <div className="mb-4 flex items-center gap-3 border-b border-gray-100 pb-4 dark:border-dark-700">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-lg font-bold text-white shadow-md">
                  {(profileRes?.firstName || user.firstName)?.[0]}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {profileRes?.firstName || user.firstName} {profileRes?.lastName || user.lastName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{profileRes?.email || user.email}</p>
                </div>
              </div>
              <nav className="space-y-1">
                {TABS.map((tab) => (
                  <button key={tab} onClick={() => setTab(tab)}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${activeTab === tab ? 'bg-primary-600 text-white shadow-sm shadow-primary-500/25' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-700'}`}>
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
            {isPageLoading ? (
              <div className="flex h-64 items-center justify-center rounded-2xl border border-gray-200 bg-white dark:border-dark-700 dark:bg-dark-800">
                <div className="flex flex-col items-center">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
                  <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading your account details...</p>
                </div>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {activeTab === 'Overview' && (
                  <motion.div key="overview" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-6">
                    {/* Stats */}
                    <div className="grid gap-4 sm:grid-cols-3">
                      {[
                        { label: 'Total Orders', value: orders.length, icon: '📦' },
                        { label: 'Total Spent', value: formatPrice(totalSpent), icon: '💰' },
                        { label: 'Wishlist Items', value: wishlistItems.length, icon: '❤️' },
                      ].map((stat) => (
                        <div key={stat.label} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-dark-700 dark:bg-dark-800 shadow-sm hover:shadow-md transition-shadow">
                          <p className="text-2xl">{stat.icon}</p>
                          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Recent orders */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-dark-700 dark:bg-dark-800 shadow-sm">
                      <h3 className="font-display text-lg font-bold text-gray-900 dark:text-white">Recent Orders</h3>
                      {orders.length === 0 ? (
                        <div className="mt-4 py-8 text-center text-gray-500 dark:text-gray-400">
                          <p className="text-3xl mb-2">🛍️</p>
                          <p className="font-medium">No orders yet</p>
                          <Link href="/products" className="text-primary-600 font-semibold hover:underline text-sm mt-1 inline-block">Start exploring fabrics</Link>
                        </div>
                      ) : (
                        <>
                          <div className="mt-4 space-y-3">
                            {orders.slice(0, 3).map((order: any) => {
                              const firstItem = order.items?.[0];
                              return (
                                <button key={order.id} onClick={() => setTab('My Orders')}
                                  className="flex w-full items-center gap-3 rounded-xl bg-gray-50 p-3 dark:bg-dark-700/50 border border-gray-100 dark:border-dark-700 hover:border-primary-200 dark:hover:border-primary-800 transition-colors text-left">
                                  {firstItem?.productImage ? (
                                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-dark-700">
                                      <Image src={supabaseImg(firstItem.productImage, 96)} alt={firstItem.productName || ''} fill sizes="48px"
                                        placeholder="blur" blurDataURL={BLUR_PLACEHOLDER} className="object-cover"/>
                                    </div>
                                  ) : (
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xl dark:bg-dark-700">🧵</div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{order.orderNumber}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                      {firstItem?.productName || 'Fabric Purchase'}
                                      {order.items?.length > 1 ? ` +${order.items.length - 1} more` : ''} · {new Date(order.createdAt).toLocaleDateString('en-IN')}
                                    </p>
                                  </div>
                                  <div className="shrink-0 text-right">
                                    <span className={`badge text-xs ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>{order.status}</span>
                                    <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">{formatPrice(order.total)}</p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                          <button onClick={() => setTab('My Orders')} className="button-secondary mt-4 w-full py-2.5 text-sm font-medium">View All Orders</button>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'My Orders' && (
                  <motion.div key="orders" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-dark-700 dark:bg-dark-800 shadow-sm">
                    <h3 className="font-display text-xl font-bold text-gray-900 dark:text-white">My Orders</h3>
                    {orders.length === 0 ? (
                      <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                        <p className="text-5xl mb-3">📦</p>
                        <p className="font-medium text-lg">You have not placed any orders yet</p>
                        <Link href="/products" className="button-primary mt-5 px-6 py-2.5 text-sm">Shop Now</Link>
                      </div>
                    ) : (
                      <div className="mt-5 space-y-4">
                        {orders.map((order: any) => (
                          <div key={order.id} className="rounded-2xl border border-gray-150 p-5 dark:border-dark-750 bg-gray-50/20 dark:bg-dark-800/10">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="font-bold text-gray-900 dark:text-white">{order.orderNumber}</p>
                                <p className="text-sm text-gray-500">
                                  {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <span className={`badge ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>{order.status}</span>
                                <span className={`badge ${order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20'}`}>
                                  {order.paymentStatus}
                                </span>
                              </div>
                            </div>
                            <div className="mt-4 space-y-2 border-t border-gray-100 pt-3 dark:border-dark-700">
                              {order.items?.map((item: any, i: number) => (
                                <Link key={i} href={item.product?.slug ? `/products/${item.product.slug}` : '/products'}
                                  className="flex items-center gap-3 rounded-xl p-2 -mx-2 hover:bg-gray-50 dark:hover:bg-dark-700/50 transition-colors group">
                                  {item.productImage ? (
                                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-dark-700">
                                      <Image src={supabaseImg(item.productImage, 128)} alt={item.productName || ''} fill sizes="56px"
                                        placeholder="blur" blurDataURL={BLUR_PLACEHOLDER} className="object-cover"/>
                                    </div>
                                  ) : (
                                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-2xl dark:bg-dark-700">🧵</div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                      {item.productName}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      {(item.product?.color || item.colorName) && (
                                        <span className="text-xs text-gray-500 dark:text-gray-400">{item.product?.color || item.colorName}</span>
                                      )}
                                      <span className="text-xs text-gray-400">× {item.quantity}m</span>
                                    </div>
                                  </div>
                                  <div className="shrink-0 text-right">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatPrice((item.pricePerMeter || item.price) * item.quantity)}</p>
                                    <p className="text-xs text-gray-400">{formatPrice(item.pricePerMeter || item.price)}/m</p>
                                  </div>
                                </Link>
                              ))}
                            </div>
                            {order.status === 'DELIVERED' && (
                              <div className="mt-3 border-t border-gray-100 pt-3 dark:border-dark-700 space-y-2">
                                <p className="text-xs font-medium text-gray-400 dark:text-gray-500">Rate your purchase:</p>
                                {order.items?.map((item: any, i: number) => {
                                  const alreadyReviewed = reviewedProductIds.has(item.productId);
                                  return alreadyReviewed ? (
                                    <div key={i} className="flex items-center gap-3 rounded-xl border border-green-100 bg-green-50 px-3 py-2 dark:border-green-900/30 dark:bg-green-950/10">
                                      {item.productImage ? (
                                        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-dark-700">
                                          <Image src={supabaseImg(item.productImage, 64)} alt={item.productName || ''} fill sizes="36px"
                                            placeholder="blur" blurDataURL={BLUR_PLACEHOLDER} className="object-cover"/>
                                        </div>
                                      ) : (
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-base dark:bg-dark-700">🧵</div>
                                      )}
                                      <div className="min-w-0 flex-1">
                                        <p className="truncate text-xs font-semibold text-gray-800 dark:text-gray-200">{item.productName}</p>
                                        {item.product?.color && <p className="text-[10px] text-gray-400">{item.product.color}</p>}
                                      </div>
                                      <span className="shrink-0 text-xs font-semibold text-green-600 dark:text-green-400">✓ Reviewed</span>
                                    </div>
                                  ) : (
                                    <button key={i} onClick={() => openReview(order, item)}
                                      className="flex w-full items-center gap-3 rounded-xl border border-primary-100 bg-primary-50 px-3 py-2 text-left hover:bg-primary-100 dark:border-primary-900/30 dark:bg-primary-950/10 dark:hover:bg-primary-950/20 transition-colors">
                                      {item.productImage ? (
                                        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-dark-700">
                                          <Image src={supabaseImg(item.productImage, 64)} alt={item.productName || ''} fill sizes="36px"
                                            placeholder="blur" blurDataURL={BLUR_PLACEHOLDER} className="object-cover"/>
                                        </div>
                                      ) : (
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-base dark:bg-dark-700">🧵</div>
                                      )}
                                      <div className="min-w-0 flex-1">
                                        <p className="truncate text-xs font-semibold text-gray-800 dark:text-gray-200">{item.productName}</p>
                                        {item.product?.color && <p className="text-[10px] text-gray-400">{item.product.color}</p>}
                                      </div>
                                      <span className="shrink-0 text-xs font-semibold text-primary-600 dark:text-primary-400">⭐ Review</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                            <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-dark-700">
                              <p className="text-sm font-bold text-gray-900 dark:text-white">Total: {formatPrice(order.total)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'Profile' && (
                  <motion.div key="profile" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-dark-700 dark:bg-dark-800 shadow-sm">
                    <h3 className="font-display text-xl font-bold text-gray-900 dark:text-white">Edit Profile</h3>
                    <p className="text-sm text-gray-500 mb-5">Update your personal information and contact details</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">First Name</label>
                        <input value={profileForm.firstName} onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })} className="input-field"/>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</label>
                        <input value={profileForm.lastName} onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })} className="input-field"/>
                      </div>
                    </div>

                    {/* Email — OTP-gated change */}
                    <ContactChangeField
                      label="Email Address" field="email"
                      currentValue={profileForm.email}
                      change={contactChange?.field === 'email' ? contactChange : null}
                      onStart={() => startContactChange('email')}
                      onCancel={cancelContactChange}
                      onChangeValue={(v) => setContactChange((c) => c && { ...c, newValue: v })}
                      onSendOTP={sendContactOTP}
                      onChangeOTP={(v) => setContactChange((c) => c && { ...c, otp: v })}
                      onVerify={verifyContactOTP}
                    />

                    {/* Phone — OTP-gated change */}
                    <ContactChangeField
                      label="Phone Number" field="phone"
                      currentValue={profileForm.phone}
                      change={contactChange?.field === 'phone' ? contactChange : null}
                      onStart={() => startContactChange('phone')}
                      onCancel={cancelContactChange}
                      onChangeValue={(v) => setContactChange((c) => c && { ...c, newValue: v })}
                      onSendOTP={sendContactOTP}
                      onChangeOTP={(v) => setContactChange((c) => c && { ...c, otp: v })}
                      onVerify={verifyContactOTP}
                    />

                    <button onClick={handleSaveProfile} disabled={savingProfile} className="button-primary mt-2 px-8 py-3 font-semibold shadow-sm transition-all flex items-center gap-2">
                      {savingProfile ? 'Saving Changes...' : 'Save Changes'}
                    </button>
                  </motion.div>
                )}

                {activeTab === 'Addresses' && (
                  <motion.div key="addresses" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-dark-700 dark:bg-dark-800 shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-dark-700">
                      <div>
                        <h3 className="font-display text-xl font-bold text-gray-900 dark:text-white">Saved Addresses</h3>
                        <p className="text-sm text-gray-500 mt-0.5">Manage your shipping and billing addresses</p>
                      </div>
                      <button onClick={() => setShowAddressForm(!showAddressForm)} className="button-primary px-4 py-2 text-sm font-medium">
                        {showAddressForm ? 'Cancel' : '+ Add Address'}
                      </button>
                    </div>

                    {showAddressForm && (
                      <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-5 rounded-2xl bg-gray-50 dark:bg-dark-900 p-5 border border-gray-200 dark:border-dark-700 space-y-4" onSubmit={handleAddAddress}>
                        <h4 className="font-semibold text-gray-900 dark:text-white">New Shipping Address</h4>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">First Name</label>
                            <input required value={addressForm.firstName} onChange={(e) => setAddressForm({ ...addressForm, firstName: e.target.value })} className="input-field mt-1 py-2 text-sm" placeholder="Priya"/>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Last Name</label>
                            <input required value={addressForm.lastName} onChange={(e) => setAddressForm({ ...addressForm, lastName: e.target.value })} className="input-field mt-1 py-2 text-sm" placeholder="Sharma"/>
                          </div>
                          <div className="sm:col-span-2">
                            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Email</label>
                            <input type="email" required value={addressForm.email} onChange={(e) => setAddressForm({ ...addressForm, email: e.target.value })} className="input-field mt-1 py-2 text-sm" placeholder="priya@example.com"/>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Phone</label>
                            <input required value={addressForm.phone} onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })} className="input-field mt-1 py-2 text-sm" placeholder="+91 98765 43210"/>
                          </div>
                          <div className="sm:col-span-2">
                            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Street Address</label>
                            <input required value={addressForm.street} onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })} className="input-field mt-1 py-2 text-sm" placeholder="123, Main Road, Apt 4B"/>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">City</label>
                            <input required value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} className="input-field mt-1 py-2 text-sm" placeholder="Mumbai"/>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">State</label>
                            <input required value={addressForm.state} onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} className="input-field mt-1 py-2 text-sm" placeholder="Maharashtra"/>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Postal Code (PIN)</label>
                            <input required value={addressForm.postalCode} onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })} className="input-field mt-1 py-2 text-sm" placeholder="400001"/>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Country</label>
                            <input required value={addressForm.country} onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })} className="input-field mt-1 py-2 text-sm" placeholder="India"/>
                          </div>
                        </div>
                        <button type="submit" disabled={savingAddress} className="button-primary w-full py-2.5 mt-2 font-medium">
                          {savingAddress ? 'Saving Address...' : 'Save Address'}
                        </button>
                      </motion.form>
                    )}

                    {addresses.length === 0 ? (
                      <div className="mt-5 rounded-xl border-2 border-dashed border-gray-200 p-6 text-center dark:border-dark-700 animate-fade-in">
                        <p className="text-4xl">📍</p>
                        <p className="mt-3 font-medium text-gray-700 dark:text-gray-300">No saved addresses yet</p>
                        <p className="text-sm text-gray-500">Add an address for faster checkout</p>
                      </div>
                    ) : (
                      <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        {addresses.map((addr: any) => (
                          <div key={addr.id} className="relative rounded-xl border border-gray-200 dark:border-dark-700 p-4 bg-white dark:bg-dark-800 shadow-sm flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between">
                                <p className="font-semibold text-gray-900 dark:text-white">
                                  {addr.firstName} {addr.lastName}
                                </p>
                                {addr.isDefault && (
                                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-950/40 dark:text-primary-400">
                                    Default
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                                {addr.street}, {addr.city}, {addr.state} - {addr.postalCode}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">{addr.country}</p>
                              <p className="text-xs text-gray-500 mt-2">📞 {addr.phone}</p>
                            </div>
                            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-dark-700 flex justify-end">
                              <button onClick={() => handleDeleteAddress(addr.id)} className="text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 hover:underline">
                                Delete Address
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </main>
        </div>
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {reviewModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && setReviewModal(null)}>
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-dark-800">
              <h3 className="font-display text-xl font-bold text-gray-900 dark:text-white">Write a Review</h3>
              <div className="mt-3 flex items-center gap-3">
                {reviewModal.item.productImage ? (
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-dark-700">
                    <Image src={supabaseImg(reviewModal.item.productImage, 100)} alt={reviewModal.item.productName || ''} fill sizes="56px"
                      placeholder="blur" blurDataURL={BLUR_PLACEHOLDER} className="object-cover"/>
                  </div>
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-2xl dark:bg-dark-700">🧵</div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{reviewModal.item.productName}</p>
                  {reviewModal.item.product?.color && (
                    <p className="text-sm text-gray-400">{reviewModal.item.product.color}</p>
                  )}
                </div>
              </div>

              <div className="mt-5">
                <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Your Rating *</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star}
                      onMouseEnter={() => setReviewHover(star)}
                      onMouseLeave={() => setReviewHover(0)}
                      onClick={() => setReviewRating(star)}
                      className={`text-3xl transition-transform hover:scale-110 ${(reviewHover || reviewRating) >= star ? 'text-yellow-400' : 'text-gray-300 dark:text-dark-600'}`}>
                      ★
                    </button>
                  ))}
                </div>
                {reviewRating > 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][reviewRating]}
                  </p>
                )}
              </div>

              <div className="mt-4">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Comment <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={3}
                  placeholder="Share your experience with this fabric..."
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-dark-600 dark:bg-dark-700 dark:text-white dark:placeholder-gray-500"
                />
              </div>

              <div className="mt-5 flex gap-3">
                <button onClick={() => setReviewModal(null)} className="button-secondary flex-1 py-2.5">Cancel</button>
                <button onClick={submitReview} disabled={!reviewRating || submittingReview}
                  className="button-primary flex-1 py-2.5 disabled:opacity-50">
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AccountPageWrapper() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-dark-950">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"/>
      </div>
    }>
      <AccountPage />
    </Suspense>
  );
}
