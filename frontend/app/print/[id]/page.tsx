'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { BUSINESS } from '@/lib/business';

const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');

// GST on fabric. Prices on the site already include GST.
const GST_RATE = 0.05;
// Our registration is in Nagaland: same-state orders get CGST + SGST, others IGST.
const HOME_STATE = 'nagaland';

type Data = {
  orderNumber: string; createdAt: string; status: string; paymentMethod?: string; paymentStatus: string;
  subtotal: number; shippingCost: number; discountAmount: number; couponCode?: string; total: number;
  customerPhone?: string; trackingNumber?: string;
  address: any; customer?: { firstName?: string; lastName?: string; email?: string; phone?: string };
  items: { productName: string; quantity: number; pricePerMeter: number; total: number }[];
};

const inr = (n: number) => `₹${(Math.round(n * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dateIN = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

function addressLines(d: Data) {
  const a = d.address || {};
  const name = a.fullName || a.name || [a.firstName, a.lastName].filter(Boolean).join(' ') || [d.customer?.firstName, d.customer?.lastName].filter(Boolean).join(' ');
  const pin = a.postalCode || a.pincode || a.zip || '';
  return {
    name,
    lines: [
      a.street || a.addressLine1 || a.line1 || a.address || '',
      a.addressLine2 || a.line2 || '',
      a.landmark ? `Landmark: ${a.landmark}` : '',
      [a.city, a.state].filter(Boolean).join(', '),
      a.country && a.country !== 'India' ? a.country : '',
    ].filter(Boolean),
    pin,
    phone: a.phone || d.customerPhone || d.customer?.phone || '',
    state: String(a.state || ''),
  };
}

function Label({ d }: { d: Data }) {
  const to = addressLines(d);
  return (
    <div className="sheet label">
      <div className="lbl-head">
        <span className="tag">PARCEL</span>
        <span className="ord">Order {d.orderNumber}</span>
      </div>
      <div className="to">
        <p className="cap">To</p>
        <p className="name">{to.name}</p>
        {to.lines.map((l, i) => <p key={i} className="line">{l}</p>)}
        {to.pin && <p className="pin">PIN <b>{to.pin}</b></p>}
        {to.phone && <p className="phone">Mobile: <b>{to.phone}</b></p>}
      </div>
      <div className="from">
        <p className="cap">From</p>
        <p><b>{BUSINESS.brand}</b> ({BUSINESS.tradeName})</p>
        <p>{BUSINESS.city}</p>
        <p>Mobile: {BUSINESS.phone}</p>
      </div>
      <p className="foot">{d.items.length} item{d.items.length === 1 ? '' : 's'} · {d.items.reduce((s, i) => s + i.quantity, 0)} m fabric{d.trackingNumber ? ` · Tracking ${d.trackingNumber}` : ''}</p>
    </div>
  );
}

function Bill({ d }: { d: Data }) {
  const to = addressLines(d);
  const intra = to.state.trim().toLowerCase() === HOME_STATE;
  const taxable = d.total / (1 + GST_RATE);
  const gst = d.total - taxable;
  const paid = d.paymentStatus === 'PAID';
  return (
    <div className="sheet bill">
      <div className="bill-head">
        <div>
          <p className="brand">{BUSINESS.brand}</p>
          <p>{BUSINESS.tradeName}</p>
          <p>{BUSINESS.city}, India</p>
          <p>GSTIN: <b>{BUSINESS.gstin}</b></p>
          <p>{BUSINESS.phone} · {BUSINESS.ordersEmail}</p>
        </div>
        <div className="right">
          <p className="title">TAX INVOICE</p>
          <p>Invoice no: <b>{d.orderNumber}</b></p>
          <p>Date: <b>{dateIN(d.createdAt)}</b></p>
          <p>Payment: <b>{paid ? 'Paid online' : d.paymentStatus === 'REFUNDED' ? 'Refunded' : 'Pending'}</b></p>
        </div>
      </div>

      <div className="billto">
        <p className="cap">Bill to / Ship to</p>
        <p className="name">{to.name}</p>
        {to.lines.map((l, i) => <p key={i}>{l}</p>)}
        {to.pin && <p>PIN {to.pin}</p>}
        {to.phone && <p>Mobile: {to.phone}</p>}
        {d.customer?.email && <p>{d.customer.email}</p>}
        {to.state && <p>Place of supply: <b>{to.state}</b></p>}
      </div>

      <table className="items">
        <thead>
          <tr><th>#</th><th className="l">Description</th><th>Qty (m)</th><th>Rate / m</th><th>Amount</th></tr>
        </thead>
        <tbody>
          {d.items.map((it, i) => (
            <tr key={i}><td>{i + 1}</td><td className="l">{it.productName}</td><td>{it.quantity}</td><td>{inr(it.pricePerMeter)}</td><td>{inr(it.total)}</td></tr>
          ))}
        </tbody>
      </table>

      <table className="totals">
        <tbody>
          <tr><td>Subtotal</td><td>{inr(d.subtotal)}</td></tr>
          {d.discountAmount > 0 && <tr><td>Discount{d.couponCode ? ` (${d.couponCode})` : ''}</td><td>− {inr(d.discountAmount)}</td></tr>}
          <tr><td>Shipping</td><td>{d.shippingCost > 0 ? inr(d.shippingCost) : 'Free'}</td></tr>
          <tr className="grand"><td>Total (incl. GST)</td><td>{inr(d.total)}</td></tr>
          <tr className="sub"><td>Taxable value</td><td>{inr(taxable)}</td></tr>
          {intra ? (
            <>
              <tr className="sub"><td>CGST @ {(GST_RATE * 50).toFixed(1)}%</td><td>{inr(gst / 2)}</td></tr>
              <tr className="sub"><td>SGST @ {(GST_RATE * 50).toFixed(1)}%</td><td>{inr(gst / 2)}</td></tr>
            </>
          ) : (
            <tr className="sub"><td>IGST @ {(GST_RATE * 100).toFixed(0)}%</td><td>{inr(gst)}</td></tr>
          )}
        </tbody>
      </table>

      <p className="note">Prices include GST. This is a computer-generated invoice and does not need a signature.</p>
      <p className="thanks">Thank you for shopping with {BUSINESS.brand}!</p>
    </div>
  );
}

export default function PrintPage() {
  const { id } = useParams<{ id: string }>();
  const sp = useSearchParams();
  const type = sp.get('type') === 'bill' ? 'bill' : 'label';
  const t = sp.get('t') || '';
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API}/print/orders/${id}?t=${encodeURIComponent(t)}`)
      .then(async (r) => { const j = await r.json(); if (!r.ok || !j.success) throw new Error(j.message || 'Could not load the order'); setData(j.data); })
      .catch((e) => setError(e.message || 'Could not load the order'));
  }, [id, t]);

  useEffect(() => {
    if (!data) return;
    document.title = `${type === 'bill' ? 'Bill' : 'Address'} — ${data.orderNumber}`;
    const timer = setTimeout(() => window.print(), 600); // open the print dialog straight away
    return () => clearTimeout(timer);
  }, [data, type]);

  return (
    <div className="print-root">
      <style>{CSS}</style>
      <div className="toolbar no-print">
        <button onClick={() => window.print()}>🖨 Print {type === 'bill' ? 'bill' : 'address'}</button>
        <a href={`?type=${type === 'bill' ? 'label' : 'bill'}&t=${encodeURIComponent(t)}`}>Switch to {type === 'bill' ? 'address label' : 'bill'}</a>
      </div>
      {error && <p className="msg">{error}</p>}
      {!data && !error && <p className="msg">Loading…</p>}
      {data && (type === 'bill' ? <Bill d={data}/> : <Label d={data}/>)}
    </div>
  );
}

const CSS = `
  .print-root { background:#f3efe8; min-height:100vh; padding:24px 12px; color:#1d1712; font-family: Arial, Helvetica, sans-serif; }
  .toolbar { max-width:794px; margin:0 auto 16px; display:flex; gap:12px; align-items:center; flex-wrap:wrap; }
  .toolbar button { background:#6b1219; color:#fff; border:0; border-radius:10px; padding:12px 20px; font-size:15px; font-weight:600; cursor:pointer; }
  .toolbar a { color:#6b1219; font-size:14px; }
  .msg { text-align:center; color:#6b5e52; }
  .sheet { background:#fff; margin:0 auto; box-shadow:0 2px 12px rgba(0,0,0,.08); }
  .sheet p { margin:0; }
  .cap { font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:#8a7a68; margin-bottom:6px !important; }

  /* Address label — fits a 4 × 6 inch label or a quarter of A4 */
  .label { width:100%; max-width:4in; padding:18px; border:2px dashed #999; }
  .lbl-head { display:flex; justify-content:space-between; font-size:11px; font-weight:700; border-bottom:1px solid #ddd; padding-bottom:8px; margin-bottom:12px; gap:8px; }
  .to .name { font-size:20px; font-weight:700; margin-bottom:4px !important; }
  .to .line { font-size:16px; line-height:1.45; }
  .to .pin { font-size:18px; margin-top:6px !important; letter-spacing:1px; }
  .to .phone { font-size:16px; margin-top:4px !important; }
  .from { margin-top:16px; padding-top:10px; border-top:1px solid #ddd; font-size:12px; line-height:1.5; color:#444; }
  .foot { margin-top:10px !important; font-size:11px; color:#666; }

  /* Bill — A4 */
  .bill { max-width:794px; padding:36px 40px; font-size:13px; line-height:1.5; }
  .bill-head { display:flex; justify-content:space-between; gap:20px; border-bottom:2px solid #6b1219; padding-bottom:16px; flex-wrap:wrap; }
  .bill-head .brand { font-family: Georgia, 'Times New Roman', serif; font-size:24px; color:#6b1219; }
  .bill-head .right { text-align:right; }
  .bill-head .title { font-size:18px; font-weight:700; letter-spacing:2px; margin-bottom:6px !important; }
  .billto { margin:18px 0; }
  .billto .name { font-size:15px; font-weight:700; }
  table { width:100%; border-collapse:collapse; }
  .items th { background:#f6efe3; font-size:12px; text-align:right; padding:8px; border-bottom:1px solid #d9cdb8; }
  .items td { text-align:right; padding:8px; border-bottom:1px solid #eee; vertical-align:top; }
  .items .l { text-align:left; }
  .items th:first-child, .items td:first-child { text-align:left; width:28px; }
  .totals { width:320px; margin:14px 0 0 auto; }
  .totals td { padding:5px 8px; text-align:right; }
  .totals td:first-child { text-align:left; color:#555; }
  .totals .grand td { font-weight:700; font-size:15px; border-top:2px solid #1d1712; color:#1d1712; }
  .totals .sub td { font-size:12px; color:#777; }
  .note { margin-top:24px !important; font-size:11px; color:#777; }
  .thanks { margin-top:6px !important; font-family: Georgia, serif; color:#6b1219; }

  @media print {
    @page { margin: 12mm; }
    .no-print { display:none !important; }
    .print-root { background:#fff; padding:0; }
    .sheet { box-shadow:none; margin:0; }
    .bill { max-width:none; padding:0; }
  }
`;
