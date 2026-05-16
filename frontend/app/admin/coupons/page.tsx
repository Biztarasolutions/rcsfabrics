'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatPrice } from '@/lib/utils';
import { adminApi } from '@/lib/api';
import { toast } from 'react-hot-toast';

const EMPTY = { code: '', discountType: 'PERCENTAGE', discountValue: '', minOrderAmount: '', maxUses: '', expiresAt: '', isActive: true };

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const res = await adminApi.getCoupons();
      setCoupons(res.data.data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const data = {
        ...form,
        discountValue: Number(form.discountValue),
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : null,
        maxUses: form.maxUses ? Number(form.maxUses) : null,
      };
      await adminApi.createCoupon(data);
      toast.success('Coupon created');
      setShowModal(false);
      fetchCoupons();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await adminApi.deleteCoupon(id);
      toast.success('Coupon deleted');
      fetchCoupons();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Coupons</h2>
          <p className="text-sm text-gray-500">{coupons.filter((c) => c.isActive).length} active coupons</p>
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
                {coupons.map((coupon) => (
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
                        <span className="text-gray-700 dark:text-gray-300">{coupon.usedCount}</span>
                        {coupon.maxUses && (
                          <>
                            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-100 dark:bg-dark-700">
                              <div className="h-full rounded-full bg-primary-500" style={{ width: `${Math.min((coupon.usedCount / coupon.maxUses) * 100, 100)}%` }}/>
                            </div>
                            <span className="text-xs text-gray-400">/ {coupon.maxUses}</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell text-xs text-gray-500 dark:text-gray-400">
                      {new Date(coupon.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`badge ${coupon.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-dark-700 dark:text-gray-400'}`}>
                        {coupon.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleDelete(coupon.id)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 transition-colors">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-dark-800">
              <h3 className="font-display text-xl font-bold text-gray-900 dark:text-white mb-5">Add Coupon</h3>
              <div className="space-y-4">
                <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Coupon Code</label><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="input-field font-mono" placeholder="SAVE20"/></div>
                <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                  <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })} className="input-field">
                    <option value="PERCENTAGE">Percentage Off</option>
                    <option value="FIXED">Flat Amount Off</option>
                  </select>
                </div>
                <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Value ({form.discountType === 'PERCENTAGE' ? '%' : '₹'})</label><input type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} className="input-field" placeholder={form.discountType === 'PERCENTAGE' ? '10' : '200'}/></div>
                <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Min Order (₹)</label><input type="number" value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })} className="input-field" placeholder="0 = no minimum"/></div>
                <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Usage Limit</label><input type="number" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} className="input-field" placeholder="Blank = unlimited"/></div>
                <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Expiry Date</label><input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="input-field"/></div>
              </div>
              <div className="mt-5 flex gap-3">
                <button onClick={() => setShowModal(false)} className="button-secondary flex-1 py-3">Cancel</button>
                <button onClick={handleSave} className="button-primary flex-1 py-3">Create Coupon</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
