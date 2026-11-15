'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { publicApi } from '@/lib/api';
import { BUSINESS, waLink, telLink } from '@/lib/business';
import BulkFabricPicker from '@/components/contact/BulkFabricPicker';

const WA = (
  <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
);

export default function ContactPage() {
  const [activeForm, setActiveForm] = useState<'contact' | 'bulk'>('contact');
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [bulkForm, setBulkForm] = useState({ name: '', company: '', email: '', phone: '', fabric: '', quantity: '', targetPrice: '', deadline: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [bulkKey, setBulkKey] = useState(0); // remounts the fabric picker after a successful send

  const [website, setWebsite] = useState(''); // honeypot — hidden from real users

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const payload = activeForm === 'bulk'
        ? { type: 'bulk' as const, ...bulkForm, website }
        : { type: 'contact' as const, ...form, website };
      const res = await publicApi.sendEnquiry(payload);
      toast.success(res.data?.message || 'Message sent! We\'ll get back to you soon.');
      if (activeForm === 'bulk') {
        setBulkForm({ name: '', company: '', email: '', phone: '', fabric: '', quantity: '', targetPrice: '', deadline: '', notes: '' });
        setBulkKey((k) => k + 1);
      } else {
        setForm({ name: '', email: '', phone: '', subject: '', message: '' });
      }
    } catch (err: any) {
      toast.error(err?.message || 'Could not send your message. Please call or WhatsApp us.');
    } finally {
      setLoading(false);
    }
  };

  const honeypot = (
    <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
      <label>Website<input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} /></label>
    </div>
  );

  const faqs = [
    { q: 'What is the minimum order quantity?', a: 'Minimum order is 0.5 metres for most fabrics. Some specialty fabrics require 1 metre minimum.' },
    { q: 'Do you offer samples or swatches?', a: 'We don’t send samples, but we’re happy to share extra photos or a short video of any fabric on WhatsApp before you order.' },
    { q: 'How long does delivery take?', a: 'Usually dispatched in 1–2 business days and delivered in 2–5 business days. Free shipping on orders of ₹2,000 or more; ₹150 below that.' },
    { q: 'Can I return fabric?', a: 'Yes — within 7 days of delivery, for fabric bought in a length of 2 metres or more that is unused, unwashed and not cut further. Pieces under 2 metres are not returnable unless they arrive damaged or wrong.' },
    { q: 'Do you offer bulk discounts?', a: 'Yes — for larger quantities we offer wholesale pricing. Use the Bulk Order form or WhatsApp us for a quote.' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-dark-950">
      {/* Hero */}
      <div className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-950/30 dark:to-dark-900 py-16">
        <div className="container-main text-center">
          <span className="section-tag">Get in touch</span>
          <h1 className="section-title mt-3 font-display">Contact Us</h1>
          <p className="section-subtitle">The quickest way to reach us is WhatsApp — chat with Mayank, Mon–Sat, 9am–6pm.</p>
          <a href={waLink()} target="_blank" rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2.5 rounded-xl bg-[#25D366] px-8 py-4 text-base font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#1fb658]">
            {WA}
            Chat with us on WhatsApp
          </a>
        </div>
      </div>

      <div className="container-main py-16">
        <div className="grid gap-12 lg:grid-cols-3">
          {/* Left — contact info */}
          <div className="space-y-5">
            <div>
              <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white">We'd love to hear from you</h2>
              <p className="mt-3 text-gray-600 dark:text-gray-400">Whether you need help with an order, want more photos of a fabric, or have a bulk requirement — we're just a message away.</p>
            </div>
            {[
              { key: 'wa', title: 'WhatsApp', info: BUSINESS.phone, sub: 'Fastest reply — chat with Mayank', href: waLink(), cta: 'Chat on WhatsApp', primary: true },
              { key: 'call', title: 'Call us', info: BUSINESS.phone, sub: 'Mayank Jain · Mon–Sat, 9am–6pm', href: telLink(), cta: 'Call now', primary: false },
              { key: 'mail', title: 'Email us', info: BUSINESS.email, sub: 'We reply within 24 hours', href: `mailto:${BUSINESS.email}?subject=${encodeURIComponent('Query for RCS Fabrics')}`, cta: 'Send an email', primary: false },
            ].map((c) => (
              <div key={c.key} className={`rounded-2xl border p-5 ${c.primary ? 'border-[#25D366]/40 bg-[#25D366]/5' : 'border-gray-200 dark:border-dark-700'}`}>
                <p className="font-semibold text-gray-900 dark:text-white">{c.title}</p>
                <p className="mt-0.5 break-all text-gray-700 dark:text-gray-300">{c.info}</p>
                <p className="text-sm text-gray-500">{c.sub}</p>
                <a href={c.href} {...(c.key === 'wa' ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-colors ${c.primary ? 'bg-[#25D366] text-white hover:bg-[#1fb658]' : 'border border-gray-300 text-gray-800 hover:border-primary-700 hover:text-primary-700 dark:border-dark-600 dark:text-gray-200'}`}>
                  {c.key === 'wa' && WA}
                  {c.cta}
                </a>
              </div>
            ))}
          </div>

          {/* Right — forms */}
          <div className="lg:col-span-2">
            {/* Form type selector */}
            <div className="mb-6 flex gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-1.5 dark:border-dark-700 dark:bg-dark-800">
              {(['contact', 'bulk'] as const).map((type) => (
                <button key={type} onClick={() => setActiveForm(type)}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-semibold capitalize transition-all ${activeForm === type ? 'bg-white shadow-sm text-primary-700 dark:bg-dark-700 dark:text-primary-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}>
                  {type === 'contact' ? 'General' : 'Bulk Order'}
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-8 dark:border-dark-700 dark:bg-dark-800">
              {activeForm === 'contact' && (
                <motion.form id="contact" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleSubmit} className="relative space-y-4">
                  {honeypot}
                  <p className="text-sm text-gray-600 dark:text-gray-400">Prefer to write? Send us a message and we&apos;ll reply by email — or <a href={waLink()} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#128C4B] hover:underline">WhatsApp us</a> for a faster answer.</p>
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

              {activeForm === 'bulk' && (
                <motion.form id="bulk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleSubmit} className="relative space-y-4">
                  {honeypot}
                  <p className="text-sm text-gray-600 dark:text-gray-400">Need 20+ metres? Get special wholesale pricing. <a href={waLink('Hi! I would like a bulk quote from RCS Fabrics.')} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#128C4B] hover:underline">Ask on WhatsApp</a> or fill out the form and we'll send you a custom quote.</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Contact Name</label><input value={bulkForm.name} onChange={(e) => setBulkForm({ ...bulkForm, name: e.target.value })} required className="input-field" placeholder="Your name"/></div>
                    <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Company</label><input value={bulkForm.company} onChange={(e) => setBulkForm({ ...bulkForm, company: e.target.value })} className="input-field" placeholder="Company name (optional)"/></div>
                    <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label><input type="email" value={bulkForm.email} onChange={(e) => setBulkForm({ ...bulkForm, email: e.target.value })} required className="input-field" placeholder="your@email.com"/></div>
                    <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label><input value={bulkForm.phone} onChange={(e) => setBulkForm({ ...bulkForm, phone: e.target.value })} required className="input-field" placeholder="+91 ..."/></div>
                  </div>
                  <BulkFabricPicker key={bulkKey} onChange={(fabric) => setBulkForm((f) => ({ ...f, fabric }))} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Quantity (metres)</label><input type="number" min={20} value={bulkForm.quantity} onChange={(e) => setBulkForm({ ...bulkForm, quantity: e.target.value })} required className="input-field" placeholder="e.g. 100"/></div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Your price per metre <span className="font-normal text-gray-400">(optional)</span></label>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                        <input type="number" min={1} step="0.01" inputMode="decimal" value={bulkForm.targetPrice}
                          onChange={(e) => setBulkForm({ ...bulkForm, targetPrice: e.target.value })}
                          className="input-field pl-8" placeholder="e.g. 120" />
                      </div>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">The rate you&apos;re hoping for — we&apos;ll do our best to match it.</p>
                    </div>
                    <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Required By</label><input type="date" value={bulkForm.deadline} onChange={(e) => setBulkForm({ ...bulkForm, deadline: e.target.value })} className="input-field"/></div>
                  </div>
                  <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Additional Notes</label><textarea value={bulkForm.notes} onChange={(e) => setBulkForm({ ...bulkForm, notes: e.target.value })} rows={3} className="input-field resize-none" placeholder="Color preferences, special requirements..."/></div>
                  <button type="submit" disabled={loading} className="button-luxury w-full py-3.5 font-semibold">{loading ? 'Sending...' : 'Request Bulk Quote'}</button>
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
                viewport={{ once: true }} transition={{ duration: 0.25, delay: i * 0.04 }}
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
