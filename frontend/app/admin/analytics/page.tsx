'use client';
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';

// ── Date presets ─────────────────────────────────────────────────────────
const PRESETS = [
  { label: 'Today', days: 0 },
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
];

function toYMD(d: Date) {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

// ── Tiny SVG sparkline ────────────────────────────────────────────────────
function Sparkline({ data, color = '#7c3aed', height = 56 }: { data: number[]; color?: string; height?: number }) {
  if (!data.length || data.every(v => v === 0)) {
    return <div className="h-14 flex items-center justify-center text-xs text-gray-400">No data</div>;
  }
  const max = Math.max(...data, 1);
  const w = 300;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = height - (v / max) * (height - 8) - 4;
    return `${x},${y}`;
  });
  const path = pts.join(' L ');
  const fill = pts.concat([`${w},${height}`, `0,${height}`]).join(' L ');
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`g${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={`M ${fill}`} fill={`url(#g${color.replace('#', '')})`}/>
      <path d={`M ${path}`} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  );
}

// ── Bar chart ────────────────────────────────────────────────────────────
function BarChart({ data }: { data: { label: string; value: number }[] }) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-2 h-32 mt-2">
      {data.map((d, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">{formatPrice(d.value)}</span>
          <div
            className="w-full rounded-t-lg bg-primary-500 transition-all"
            style={{ height: `${Math.max((d.value / max) * 96, 4)}px` }}
          />
          <span className="text-[10px] text-gray-500 truncate max-w-full">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Area chart (daily revenue) ────────────────────────────────────────────
function AreaChart({ daily }: { daily: { date: string; revenue: number; orders: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);

  if (!daily.length) {
    return <div className="h-32 flex items-center justify-center text-sm text-gray-400">No data for this period</div>;
  }

  const revenues = daily.map(d => d.revenue);
  const max = Math.max(...revenues, 1);
  const w = 600;
  const h = 120;
  const pad = 4;

  const pts = daily.map((_, i) => {
    const x = daily.length > 1 ? (i / (daily.length - 1)) * (w - pad * 2) + pad : w / 2;
    const y = h - (revenues[i] / max) * (h - 20) - 10;
    return { x, y };
  });

  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const fillD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    + ` L ${pts[pts.length - 1].x} ${h} L ${pts[0].x} ${h} Z`;

  return (
    <div className="relative select-none">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none"
        onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d={fillD} fill="url(#areaGrad)"/>
        <path d={pathD} fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
        {pts.map((p, i) => (
          <rect key={i} x={p.x - 10} y={0} width={20} height={h} fill="transparent"
            onMouseEnter={() => setHover(i)}/>
        ))}
        {hover !== null && pts[hover] && (
          <>
            <line x1={pts[hover].x} y1={0} x2={pts[hover].x} y2={h} stroke="#7c3aed" strokeWidth="1" strokeDasharray="4"/>
            <circle cx={pts[hover].x} cy={pts[hover].y} r="5" fill="#7c3aed" stroke="white" strokeWidth="2"/>
          </>
        )}
      </svg>
      {hover !== null && daily[hover] && (
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full rounded-lg bg-gray-900 px-3 py-1.5 text-xs text-white shadow-lg dark:bg-dark-700">
          <span className="font-semibold">{daily[hover].date}</span>
          <br/>
          Revenue: {formatPrice(daily[hover].revenue)}
          <br/>
          Orders: {daily[hover].orders}
        </div>
      )}
    </div>
  );
}

// ── Metric card ──────────────────────────────────────────────────────────
function MetricCard({ icon, label, value, sub, color = 'bg-primary-50 dark:bg-primary-950/20' }: {
  icon: string; label: string; value: string; sub?: string; color?: string;
}) {
  return (
    <div className={`rounded-2xl border border-gray-200 bg-white p-5 dark:border-dark-700 dark:bg-dark-800`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────
const STATUS_OPTIONS = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function AnalyticsPage() {
  const today = new Date();
  const [from, setFrom] = useState(toYMD(addDays(today, -29)));
  const [to, setTo] = useState(toYMD(today));
  const [activePreset, setActivePreset] = useState(1); // '30 days'
  const [status, setStatus] = useState(''); // '' = all (except cancelled)

  const applyPreset = (days: number, idx: number) => {
    setActivePreset(idx);
    if (days === 0) {
      setFrom(toYMD(today));
      setTo(toYMD(today));
    } else {
      setFrom(toYMD(addDays(today, -days + 1)));
      setTo(toYMD(today));
    }
  };

  // Compute analytics client-side from the live orders endpoint so it works regardless of
  // whether the dedicated /admin/analytics route is deployed on the backend.
  const { data: allOrders = [], isLoading } = useQuery({
    queryKey: ['admin-orders-for-analytics'],
    queryFn: () => adminApi.getOrders({ limit: 1000 }).then(r => r.data.data?.orders ?? r.data.data ?? []),
    refetchInterval: 60 * 1000,
  });
  const { data: stats } = useQuery({
    queryKey: ['admin-stats-for-analytics'],
    queryFn: () => adminApi.getStats().then(r => r.data.data),
  });

  const analytics = useMemo(() => {
    const ymd = (iso: string) => new Date(iso).toISOString().slice(0, 10);
    const enumerateDates = (f: string, t: string) => {
      const out: string[] = [];
      const d = new Date(f + 'T00:00:00Z');
      const end = new Date(t + 'T00:00:00Z');
      while (d <= end) { out.push(d.toISOString().slice(0, 10)); d.setUTCDate(d.getUTCDate() + 1); }
      return out;
    };

    const orders = allOrders as any[];
    const inRange = orders.filter((o) => {
      const k = ymd(o.createdAt);
      if (k < from || k > to) return false;
      return status ? o.status === status : o.status !== 'CANCELLED';
    });

    const totalRevenue = inRange.reduce((s, o) => s + Number(o.total || 0), 0);
    const totalOrders = inRange.length;
    const aov = totalOrders ? totalRevenue / totalOrders : 0;

    const dailyMap: Record<string, { revenue: number; orders: number }> = {};
    enumerateDates(from, to).forEach((d) => { dailyMap[d] = { revenue: 0, orders: 0 }; });
    inRange.forEach((o) => {
      const k = ymd(o.createdAt);
      if (dailyMap[k]) { dailyMap[k].orders += 1; dailyMap[k].revenue += Number(o.total || 0); }
    });
    const dailyArr = Object.entries(dailyMap).map(([date, v]) => ({ date, ...v }));

    const methodMap: Record<string, number> = {};
    inRange.forEach((o) => { const m = o.paymentMethod || 'UNKNOWN'; methodMap[m] = (methodMap[m] || 0) + Number(o.total || 0); });

    const prodMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
    inRange.forEach((o) => (o.items || []).forEach((it: any) => {
      const n = it.productName || 'Unknown';
      if (!prodMap[n]) prodMap[n] = { name: n, quantity: 0, revenue: 0 };
      prodMap[n].quantity += Number(it.quantity || 0);
      prodMap[n].revenue += Number(it.total || 0);
    }));
    const topProductsArr = Object.values(prodMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    const everCount: Record<string, number> = {};
    orders.forEach((o) => { if (o.status !== 'CANCELLED') everCount[o.userId] = (everCount[o.userId] || 0) + 1; });
    const periodUsers = [...new Set(inRange.map((o) => o.userId))];
    const repeatCustomers = periodUsers.filter((id) => everCount[id] > 1).length;
    const newCustomers = periodUsers.length - repeatCustomers;

    return {
      totalRevenue, totalOrders, aov,
      daily: dailyArr, byMethod: methodMap, topProducts: topProductsArr,
      newCustomers, repeatCustomers,
      totalCustomers: stats?.totalCustomers ?? periodUsers.length,
    };
  }, [allOrders, from, to, status, stats]);

  const daily: { date: string; revenue: number; orders: number }[] = analytics.daily;
  const topProducts: { name: string; quantity: number; revenue: number }[] = analytics.topProducts;
  const byMethod: Record<string, number> = analytics.byMethod;

  const methodEntries = Object.entries(byMethod).sort((a, b) => b[1] - a[1]);
  const methodTotal = methodEntries.reduce((s, [, v]) => s + v, 0);
  const METHOD_LABEL: Record<string, string> = { UPI: '📲 UPI', COD: '💵 COD', RAZORPAY: '💳 Razorpay', STRIPE: '💳 Stripe', BANK_TRANSFER: '🏦 Bank Transfer' };
  const METHOD_COLOR: Record<string, string> = { UPI: 'bg-violet-500', COD: 'bg-amber-500', RAZORPAY: 'bg-blue-500', STRIPE: 'bg-indigo-500', BANK_TRANSFER: 'bg-teal-500' };

  const revenueSparkline = daily.map(d => d.revenue);
  const ordersSparkline = daily.map(d => d.orders);

  // X-axis labels — show every N-th date
  const labelStep = Math.max(1, Math.floor(daily.length / 6));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Trends, revenue, and customer insights</p>
        </div>

        {/* Date controls */}
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((p, i) => (
            <button key={p.label} onClick={() => applyPreset(p.days, i)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${activePreset === i ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-dark-700 dark:text-gray-300 dark:hover:bg-dark-600'}`}>
              {p.label}
            </button>
          ))}
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-1.5 dark:border-dark-700 dark:bg-dark-800">
            <input type="date" value={from} max={to}
              onChange={e => { setFrom(e.target.value); setActivePreset(-1); }}
              className="bg-transparent text-sm text-gray-700 dark:text-gray-200 outline-none"/>
            <span className="text-gray-400">→</span>
            <input type="date" value={to} min={from} max={toYMD(today)}
              onChange={e => { setTo(e.target.value); setActivePreset(-1); }}
              className="bg-transparent text-sm text-gray-700 dark:text-gray-200 outline-none"/>
          </div>
          {/* Status filter */}
          <select value={status} onChange={e => setStatus(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 outline-none dark:border-dark-700 dark:bg-dark-800 dark:text-gray-200">
            <option value="">All (excl. cancelled)</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-gray-100 dark:bg-dark-800"/>)}
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon="💰" label="Revenue" value={formatPrice(analytics?.totalRevenue ?? 0)}
              sub={`${analytics?.totalOrders ?? 0} orders`} color="bg-green-50 dark:bg-green-950/20"/>
            <MetricCard icon="📊" label="Avg Order Value" value={formatPrice(analytics?.aov ?? 0)}
              sub="per order" color="bg-blue-50 dark:bg-blue-950/20"/>
            <MetricCard icon="👥" label="Total Customers" value={String(analytics?.totalCustomers ?? 0)}
              sub={`${analytics?.newCustomers ?? 0} new in period`} color="bg-purple-50 dark:bg-purple-950/20"/>
            <MetricCard icon="🔁" label="Repeat Customers" value={String(analytics?.repeatCustomers ?? 0)}
              sub="placed >1 order" color="bg-orange-50 dark:bg-orange-950/20"/>
          </div>

          {/* Revenue trend */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-dark-700 dark:bg-dark-800">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Revenue Trend</h3>
            <AreaChart daily={daily}/>
            {/* X-axis labels */}
            <div className="mt-1 flex justify-between">
              {daily.map((d, i) => i % labelStep === 0 ? (
                <span key={i} className="text-[10px] text-gray-400">{d.date.slice(5)}</span>
              ) : null)}
            </div>
          </div>

          {/* Orders + mini sparkline cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-dark-700 dark:bg-dark-800">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Orders</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics?.totalOrders ?? 0}</p>
                </div>
                <span className="text-xl">📦</span>
              </div>
              <Sparkline data={ordersSparkline} color="#3b82f6"/>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-dark-700 dark:bg-dark-800">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatPrice(analytics?.totalRevenue ?? 0)}</p>
                </div>
                <span className="text-xl">💰</span>
              </div>
              <Sparkline data={revenueSparkline} color="#7c3aed"/>
            </div>
          </div>

          {/* Bottom row */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Top products */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-dark-700 dark:bg-dark-800">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Top Products</h3>
              {topProducts.length > 0 ? (
                <BarChart data={topProducts.map(p => ({ label: p.name, value: p.revenue }))}/>
              ) : (
                <p className="py-10 text-center text-sm text-gray-400">No product data in this period</p>
              )}
            </div>

            {/* Payment methods */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-dark-700 dark:bg-dark-800">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Payment Methods</h3>
              {methodEntries.length > 0 ? (
                <div className="space-y-3 mt-2">
                  {methodEntries.map(([method, amount]) => {
                    const pct = methodTotal > 0 ? (amount / methodTotal) * 100 : 0;
                    return (
                      <div key={method}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {METHOD_LABEL[method] || method}
                          </span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatPrice(amount)}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-dark-700">
                          <div className={`h-full rounded-full ${METHOD_COLOR[method] || 'bg-gray-400'} transition-all`}
                            style={{ width: `${pct}%` }}/>
                        </div>
                        <p className="mt-0.5 text-right text-[10px] text-gray-400">{pct.toFixed(1)}%</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="py-10 text-center text-sm text-gray-400">No payment data in this period</p>
              )}
            </div>
          </div>

          {/* Customer breakdown */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-dark-700 dark:bg-dark-800">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-5">Customer Breakdown</h3>
            <div className="flex flex-wrap gap-8">
              {/* Donut */}
              {(() => {
                const total = (analytics?.newCustomers ?? 0) + (analytics?.repeatCustomers ?? 0);
                if (total === 0) return <p className="text-sm text-gray-400">No customer data in this period</p>;
                const newPct = total > 0 ? ((analytics?.newCustomers ?? 0) / total) : 0;
                const r = 40;
                const circ = 2 * Math.PI * r;
                return (
                  <>
                    <div className="relative flex h-32 w-32 items-center justify-center">
                      <svg viewBox="0 0 100 100" className="h-32 w-32 -rotate-90">
                        <circle cx="50" cy="50" r={r} fill="none" stroke="#e5e7eb" strokeWidth="12" className="dark:stroke-dark-700"/>
                        <circle cx="50" cy="50" r={r} fill="none" stroke="#7c3aed" strokeWidth="12"
                          strokeDasharray={`${newPct * circ} ${circ}`} strokeLinecap="round"/>
                      </svg>
                      <div className="absolute text-center">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{Math.round(newPct * 100)}%</p>
                        <p className="text-[10px] text-gray-500">New</p>
                      </div>
                    </div>
                    <div className="flex flex-col justify-center gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full bg-primary-600"/>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{analytics?.newCustomers} New Customers</p>
                          <p className="text-xs text-gray-500">First order in this period</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full bg-gray-200 dark:bg-dark-600"/>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{analytics?.repeatCustomers} Repeat Customers</p>
                          <p className="text-xs text-gray-500">More than one order ever</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full bg-blue-400"/>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{analytics?.totalCustomers} Total Registered</p>
                          <p className="text-xs text-gray-500">All time</p>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
