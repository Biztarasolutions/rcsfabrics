'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatPrice } from '@/lib/utils';

const INITIAL_COUPONS = [
  { id: '1', code: 'RCS10', type: 'PERCENT', value: 10, minOrder: 0, usageLimit: 1000, used: 342, expires: '2025-12-31', isActive: true },
  { id: '2', code: 'WELCOME200', type: 'FLAT', value: 200, minOrder: 1000, usageLimit: 500, used: 128, expires: '2025-09-30', isActive: true },
  { id: '3', code: 'SILK20', type: 'PERCENT', value: 20, minOrder: 2000, usageLimit: 200, used: 76, expires: '2025-06-30', isActive: false },
  { id: '4', code: 'FREESHIP', type: 'SHIPPING', value: 0, minOrder: 0, usageLimit: null, used: 892, expires: '2025-12-31', isActive: true },
];

const EMPTY = { code: '', type: 'PERCENT', value: '', minOrder: '', usageLimit: '', expires: '', isActive: true };

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState(INITIAL_COUPONS);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<typeof EMPTY>(EMPTY);

  const handleSave = () => {
    setCoupons((p) => [...p, { id: Date.now().toString(), code: form.code, type: form.type, value: Number(form.value), minOrder: Number(form.minOrder), usageLimit: form.usageLimit ? Number(form.usageLimit) : null, used: 0, expires: form.expires, isActive: form.isActive }]);
    setShowModal(false);
  };
  const toggleActive = (id: string) => setCoupons((p) => p.map((c) => c.id === id ? { ...c, isActive: !c.isActive } : c));
  const handleDelete = (id: string) => setCoupons((p) => p.filter((c) => c.id !== id));

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
                    {coupon.type === 'PERCENT' ? `${coupon.value}% off` : coupon.type === 'FLAT' ? `${formatPrice(coupon.value)} off` : 'Free Shipping'}
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell text-gray-500 dark:text-gray-400">
                    {coupon.minOrder > 0 ? `Min ${formatPrice(coupon.minOrder)}` : 'No minimum'}
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-700 dark:text-gray-300">{coupon.used}</span>
                      {coupon.usageLimit && (
                        <>
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-100 dark:bg-dark-700">
                            <div className="h-full rounded-full bg-primary-500" style={{ width: `${Math.min((coupon.used / coupon.usageLimit) * 100, 100)}%` }}/>
                          </div>
                          <span className="text-xs text-gray-400">/ {coupon.usageLimit}</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell text-xs text-gray-500 dark:text-gray-400">
                    {new Date(coupon.expires).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`badge ${coupon.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-dark-700 dark:text-gray-400'}`}>
                      {coupon.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => toggleActive(coupon.id)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-dark-600 dark:text-gray-400 transition-colors">
                        {coupon.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button onClick={() => handleDelete(coupon.id)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 transition-colors">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input-field">
                    <option value="PERCENT">Percentage Off</option>
                    <option value="FLAT">Flat Amount Off</option>
                    <option value="SHIPPING">Free Shipping</option>
                  </select>
                </div>
                {form.type !== 'SHIPPING' && <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Value ({form.type === 'PERCENT' ? '%' : '₹'})</label><input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="input-field" placeholder={form.type === 'PERCENT' ? '10' : '200'}/></div>}
                <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Min Order (₹)</label><input type="number" value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })} className="input-field" placeholder="0 = no minimum"/></div>
                <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Usage Limit</label><input type="number" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} className="input-field" placeholder="Blank = unlimited"/></div>
                <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Expiry Date</label><input type="date" value={form.expires} onChange={(e) => setForm({ ...form, expires: e.target.value })} className="input-field"/></div>
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
