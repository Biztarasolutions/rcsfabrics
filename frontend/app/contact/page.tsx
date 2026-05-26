'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function ContactPage() {
  const [activeForm, setActiveForm] = useState<'contact' | 'swatch' | 'bulk'>('contact');
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [swatchForm, setSwatchForm] = useState({ name: '', email: '', phone: '', fabrics: '', address: '' });
  const [bulkForm, setBulkForm] = useState({ name: '', company: '', email: '', phone: '', fabric: '', quantity: '', deadline: '', notes: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    toast.success('Message sent! We\'ll get back to you within 24 hours.');
    setLoading(false);
  };

  const faqs = [
    { q: 'What is the minimum order quantity?', a: 'Minimum order is 0.5 meters for most fabrics. Some specialty fabrics require 1 meter minimum.' },
    { q: 'Do you offer samples/swatches?', a: 'Yes! Request physical swatches before committing to a full order. Swatch requests are processed within 2-3 days.' },
    { q: 'How long does delivery take?', a: 'Standard delivery: 3-5 business days. Express: 1-2 business days. Free shipping on orders above ₹2,000.' },
    { q: 'Can I return fabric?', a: 'We accept returns within 30 days for unused, uncut fabric in original condition. Cut fabric cannot be returned.' },
    { q: 'Do you offer bulk discounts?', a: 'Yes! Orders above 20 meters get 5% off, above 50 meters get 10% off. Contact us for custom wholesale pricing.' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-dark-950">
      {/* Hero */}
      <div className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-950/30 dark:to-dark-900 py-16">
        <div className="container-main text-center">
          <span className="section-tag">📞 Get in Touch</span>
          <h1 className="section-title mt-3 font-display">Contact Us</h1>
          <p className="section-subtitle">We're here to help. Reach out for orders, swatches, or anything else.</p>
        </div>
      </div>

      <div className="container-main py-16">
        <div className="grid gap-12 lg:grid-cols-3">
          {/* Left — contact info */}
          <div className="space-y-8">
            <div>
              <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white">We'd love to hear from you</h2>
              <p className="mt-3 text-gray-600 dark:text-gray-400">Whether you need help with an order, want to request a swatch, or have a bulk requirement — we're just a message away.</p>
            </div>
            {[
              { icon: '📍', title: 'Visit Us', info: '123 Fabric Market, Surat, Gujarat 395003' },
              { icon: '📞', title: 'Call Us', info: '+91 98765 43210', sub: 'Mon–Sat, 9am–6pm' },
              { icon: '✉️', title: 'Email Us', info: 'info@rcsfabrics.com', sub: 'Reply within 24 hours' },
              { icon: '💬', title: 'WhatsApp', info: '+91 98765 43210', sub: 'Quick responses' },
            ].map((c) => (
              <div key={c.title} className="flex items-start gap-4">
                <span className="text-2xl">{c.icon}</span>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{c.title}</p>
                  <p className="text-gray-600 dark:text-gray-400">{c.info}</p>
                  {c.sub && <p className="text-sm text-gray-500">{c.sub}</p>}
                </div>
              </div>
            ))}
          </div>

          {/* Right — forms */}
          <div className="lg:col-span-2">
            {/* Form type selector */}
            <div className="mb-6 flex gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-1.5 dark:border-dark-700 dark:bg-dark-800">
              {(['contact', 'swatch', 'bulk'] as const).map((type) => (
                <button key={type} onClick={() => setActiveForm(type)}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-semibold capitalize transition-all ${activeForm === type ? 'bg-white shadow-sm text-primary-700 dark:bg-dark-700 dark:text-primary-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}>
                  {type === 'contact' ? '💬 General' : type === 'swatch' ? '🧵 Swatch Request' : '📦 Bulk Order'}
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-8 dark:border-dark-700 dark:bg-dark-800">
              {activeForm === 'contact' && (
                <motion.form id="contact" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Your Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Priya Sharma" required className="input-field"/></div>
                    <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" required className="input-field"/></div>
                  </div>
                  <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Phone (optional)</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" className="input-field"/></div>
                  <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Subject</label><input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Order query, product info..." required className="input-field"/></div>
                  <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Message</label><textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={4} placeholder="Tell us how we can help..." required className="input-field resize-none"/></div>
                  <button type="submit" disabled={loading} className="button-primary w-full py-3.5">{loading ? 'Sending...' : 'Send Message'}</button>
                </motion.form>
              )}

              {activeForm === 'swatch' && (
                <motion.form id="swatch" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleSubmit} className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Request physical fabric swatches to feel the quality before ordering. Swatches are sent free of charge for up to 5 fabrics.</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label><input value={swatchForm.name} onChange={(e) => setSwatchForm({ ...swatchForm, name: e.target.value })} required className="input-field" placeholder="Your name"/></div>
                    <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label><input type="email" value={swatchForm.email} onChange={(e) => setSwatchForm({ ...swatchForm, email: e.target.value })} required className="input-field" placeholder="your@email.com"/></div>
                  </div>
                  <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label><input value={swatchForm.phone} onChange={(e) => setSwatchForm({ ...swatchForm, phone: e.target.value })} required className="input-field" placeholder="+91 ..."/></div>
                  <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Fabrics you want samples of</label><textarea value={swatchForm.fabrics} onChange={(e) => setSwatchForm({ ...swatchForm, fabrics: e.target.value })} rows={3} required className="input-field resize-none" placeholder="e.g. Banarasi Silk, Egyptian Cotton, French Linen..."/></div>
                  <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Delivery Address</label><textarea value={swatchForm.address} onChange={(e) => setSwatchForm({ ...swatchForm, address: e.target.value })} rows={2} required className="input-field resize-none" placeholder="Full delivery address..."/></div>
                  <button type="submit" disabled={loading} className="button-primary w-full py-3.5">{loading ? 'Sending...' : '🧵 Request Swatches'}</button>
                </motion.form>
              )}

              {activeForm === 'bulk' && (
                <motion.form id="bulk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleSubmit} className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Need 20+ meters? Get special wholesale pricing. Fill out the form and we'll send a custom quote within 4 hours.</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Contact Name</label><input value={bulkForm.name} onChange={(e) => setBulkForm({ ...bulkForm, name: e.target.value })} required className="input-field" placeholder="Your name"/></div>
                    <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Company</label><input value={bulkForm.company} onChange={(e) => setBulkForm({ ...bulkForm, company: e.target.value })} className="input-field" placeholder="Company name (optional)"/></div>
                    <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label><input type="email" value={bulkForm.email} onChange={(e) => setBulkForm({ ...bulkForm, email: e.target.value })} required className="input-field" placeholder="your@email.com"/></div>
                    <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label><input value={bulkForm.phone} onChange={(e) => setBulkForm({ ...bulkForm, phone: e.target.value })} required className="input-field" placeholder="+91 ..."/></div>
                  </div>
                  <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Fabric Required</label><input value={bulkForm.fabric} onChange={(e) => setBulkForm({ ...bulkForm, fabric: e.target.value })} required className="input-field" placeholder="Fabric name or description..."/></div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Quantity (meters)</label><input type="number" min={20} value={bulkForm.quantity} onChange={(e) => setBulkForm({ ...bulkForm, quantity: e.target.value })} onWheel={(e) => (e.target as HTMLInputElement).blur()} required className="input-field" placeholder="e.g. 100"/></div>
                    <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Required By</label><input type="date" value={bulkForm.deadline} onChange={(e) => setBulkForm({ ...bulkForm, deadline: e.target.value })} className="input-field"/></div>
                  </div>
                  <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Additional Notes</label><textarea value={bulkForm.notes} onChange={(e) => setBulkForm({ ...bulkForm, notes: e.target.value })} rows={3} className="input-field resize-none" placeholder="Color preferences, special requirements..."/></div>
                  <button type="submit" disabled={loading} className="button-luxury w-full py-3.5 font-semibold">{loading ? 'Sending...' : '📦 Request Bulk Quote'}</button>
                </motion.form>
              )}
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20">
          <h2 className="section-title text-center font-display">Frequently Asked Questions</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {faqs.map((faq, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-dark-700 dark:bg-dark-800">
                <p className="font-semibold text-gray-900 dark:text-white">{faq.q}</p>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
