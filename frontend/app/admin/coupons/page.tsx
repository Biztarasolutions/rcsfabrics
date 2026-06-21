'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatPrice } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { toast } from 'react-hot-toast';

const EMPTY = { code: '', discountType: 'PERCENTAGE', discountValue: '', minOrderAmount: '', maxUses: '', expiresAt: '', isActive: true };

const NO_EXPIRY_SENTINEL = '2099-12-31';

function isNoExpiry(dateStr: string) {
  return !dateStr || new Date(dateStr).getFullYear() >= 2099;
}

export default function AdminCouponsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);

  const { data: coupons = [], isLoading: loading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: () => adminApi.getCoupons().then(res => res.data.data || []),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => adminApi.createCoupon(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.success('Coupon created');
      setShowModal(false);
      setForm(EMPTY);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminApi.updateCoupon(id, { isActive }),
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.success(isActive ? 'Coupon activated' : 'Coupon deactivated');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.success('Coupon deleted');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleSave = () => {
    if (!form.code || !form.discountValue) {
      toast.error('Code and discount value are required');
      return;
    }
    const data = {
      ...form,
      discountValue: Number(form.discountValue),
      minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : null,
      maxUses: form.maxUses ? Number(form.maxUses) : null,
      expiresAt: form.expiresAt || null,
    };
    createMutation.mutate(data);
  };

  const activeCoupons = coupons.filter((c: any) => c.isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Coupons</h2>
          <p className="text-sm text-gray-500">{activeCoupons} active · {coupons.length} total</p>
        </div>
        <button onClick={() => { setForm(EMPTY); setShowModal(true); }} className="button-primary flex items-center gap-2 px-5 py-2.5">
          <span className="text-lg">+</span> Add Coupon
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-dark-700 dark:bg-dark-800">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-10 text-center text-gray-500">Loading coupons...</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 dark:border-dark-700 bg-gray-50 dark:bg-dark-700/50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <th className="px-5 py-4">Code</th>
                  <th className="px-5 py-4">Discount</th>
                  <th className="px-5 py-4 hidden sm:table-cell">Min Order</th>
                  <th className="px-5 py-4 hidden md:table-cell">Usage</th>
                  <th className="px-5 py-4 hidden lg:table-cell">Expires</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-dark-700">
                {coupons.map((coupon: any) => (
                  <tr key={coupon.id} className="hover:bg-gray-50 dark:hover:bg-dark-700/30 transition-colors">
                    <td className="px-5 py-4">
                      <span className="rounded-lg bg-primary-50 px-3 py-1.5 font-mono text-sm font-bold text-primary-700 dark:bg-primary-950/30 dark:text-primary-400">
                        {coupon.code}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-gray-900 dark:text-white">
                      {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}% off` : `${formatPrice(coupon.discountValue)} off`}
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell text-gray-500 dark:text-gray-400">
                      {coupon.minOrderAmount > 0 ? `Min ${formatPrice(coupon.minOrderAmount)}` : 'No minimum'}
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-700 dark:text-gray-300">{coupon.usedCount || 0}</span>
                        {coupon.maxUses && (
                          <>
                            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-100 dark:bg-dark-700">
                              <div className="h-full rounded-full bg-primary-500" style={{ width: `${Math.min(((coupon.usedCount || 0) / coupon.maxUses) * 100, 100)}%` }}/>
                            </div>
                            <span className="text-xs text-gray-400">/ {coupon.maxUses}</span>
                          </>
                        )}
                        {!coupon.maxUses && <span className="text-xs text-gray-400">Unlimited</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell text-xs text-gray-500 dark:text-gray-400">
                      {isNoExpiry(coupon.expiresAt)
                        ? <span className="text-green-600 dark:text-green-400 font-medium">No expiry</span>
                        : new Date(coupon.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      }
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => toggleMutation.mutate({ id: coupon.id, isActive: !coupon.isActive })}
                        disabled={toggleMutation.isPending}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all disabled:opacity-50 ${
                          coupon.isActive
                            ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-dark-700 dark:text-gray-400'
                        }`}
                        title={coupon.isActive ? 'Click to deactivate' : 'Click to activate'}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${coupon.isActive ? 'bg-green-500' : 'bg-gray-400'}`}/>
                        {coupon.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => { if (confirm('Delete this coupon?')) deleteMutation.mutate(coupon.id); }}
                        disabled={deleteMutation.isPending}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 transition-colors">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {!loading && coupons.length === 0 && (
          <div className="py-12 text-center text-gray-500">No coupons yet. Create your first one!</div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-dark-800">
              <h3 className="font-display text-xl font-bold text-gray-900 dark:text-white mb-5">Add Coupon</h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Coupon Code *</label>
                  <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    className="input-field font-mono tracking-wider" placeholder="e.g. SAVE20"/>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                    <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })} className="input-field">
                      <option value="PERCENTAGE">% Percentage</option>
                      <option value="FIXED">₹ Flat Amount</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Value ({form.discountType === 'PERCENTAGE' ? '%' : '₹'}) *
                    </label>
                    <input type="number" value={form.discountValue}
                      onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                      className="input-field" placeholder={form.discountType === 'PERCENTAGE' ? '10' : '200'}/>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Min Order (₹)</label>
                    <input type="number" value={form.minOrderAmount}
                      onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
                      className="input-field" placeholder="No minimum"/>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Usage Limit</label>
                    <input type="number" value={form.maxUses}
                      onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                      className="input-field" placeholder="Unlimited"/>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Expiry Date
                    <span className="ml-1.5 text-xs font-normal text-gray-400">(leave blank = no expiry until deactivated)</span>
                  </label>
                  <input type="date" value={form.expiresAt}
                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                    className="input-field"/>
                  {!form.expiresAt && (
                    <p className="mt-1 text-xs text-green-600 dark:text-green-400">✓ This coupon will not expire automatically</p>
                  )}
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button onClick={() => setShowModal(false)} className="button-secondary flex-1 py-3">Cancel</button>
                <button onClick={handleSave} disabled={createMutation.isPending} className="button-primary flex-1 py-3">
                  {createMutation.isPending ? 'Creating...' : 'Create Coupon'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
