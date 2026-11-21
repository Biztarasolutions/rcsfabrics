'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { productApi } from '@/lib/api';
import { useCartStore } from '@/lib/store';
import { cartAddedToast } from '@/lib/cartToast';
import { productDisplayName } from '@/lib/utils';
import {
  ADULT_SIZES, Answers, estimate, GARMENTS, KID_AGES, SLEEVES, Who, widthKeyFor,
} from '@/lib/estimator';
import { BUSINESS } from '@/lib/business';

type StepKey = 'who' | 'garment' | 'style' | 'size' | 'sleeves' | 'result';

const WHO: { key: Who; label: string; hint: string }[] = [
  { key: 'women', label: 'Women', hint: 'Kurtis, suits, dresses, blouses' },
  { key: 'men', label: 'Men', hint: 'Shirts, kurtas, trousers' },
  { key: 'kids', label: 'Kids', hint: 'Frocks, kurta sets, tops' },
];

function Option({ on, onClick, title, hint }: { on?: boolean; onClick: () => void; title: string; hint?: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on}
      className={`group flex w-full items-center justify-between gap-3 rounded-2xl border px-5 py-4 text-left transition ${
        on ? 'border-primary-700 bg-primary-50/60 dark:border-primary-400 dark:bg-primary-950/30'
           : 'border-[#e6dccb] bg-white hover:border-primary-300 hover:bg-[#fffdf9] dark:border-dark-700 dark:bg-dark-900 dark:hover:border-dark-500'}`}>
      <span className="min-w-0">
        <span className="block text-base font-semibold text-gray-900 dark:text-white">{title}</span>
        {hint && <span className="mt-0.5 block text-sm text-gray-500 dark:text-gray-400">{hint}</span>}
      </span>
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition ${on ? 'border-primary-700 bg-primary-700 text-white' : 'border-gray-300 text-transparent group-hover:border-primary-300 dark:border-dark-500'}`} aria-hidden="true">
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
      </span>
    </button>
  );
}

function Chip({ on, onClick, children }: { on?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on}
      className={`h-12 min-w-[4rem] rounded-full border px-5 text-sm font-semibold transition ${
        on ? 'border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900'
           : 'border-[#e6dccb] bg-white text-gray-800 hover:border-gray-400 dark:border-dark-700 dark:bg-dark-900 dark:text-gray-200'}`}>
      {children}
    </button>
  );
}

export default function Estimator() {
  const params = useSearchParams();
  const fromSlug = params.get('fabric') || '';
  const fromName = params.get('name') || '';
  const fromWidth = Number(params.get('width')) || 0;

  const router = useRouter();
  const { addItem, updateQty, items: cartItems } = useCartStore();
  // The fabric the customer came from, so the result can add it to the bag directly
  const { data: fabric } = useQuery({
    queryKey: ['product', fromSlug],
    queryFn: () => productApi.getBySlug(fromSlug).then((res) => res.data.data),
    enabled: !!fromSlug,
    staleTime: 5 * 60 * 1000,
  });

  const addToBag = (metres: number) => {
    if (!fabric) { router.push(`/fabrics/${fromSlug}?qty=${metres}`); return; }
    const stock = Number(fabric.totalStock) || 0;
    if (stock <= 0) { toast.error('Sorry, this fabric is out of stock right now.'); return; }
    const qty = Math.min(metres, Math.floor(stock * 2) / 2);
    // Set the bag to exactly the estimated length (don't stack on top of an earlier amount)
    const line = cartItems.find((i) => i.productId === fabric.id);
    if (line) updateQty(line.id, qty);
    else addItem({ id: fabric.id, productId: fabric.id, product: fabric, quantity: qty });
    cartAddedToast(qty < metres
      ? `Only ${stock} m in stock — added ${qty} m of ${productDisplayName(fabric)} to your bag`
      : `${qty} m of ${productDisplayName(fabric)} added to your bag`);
    // Take them back to the fabric, with the same length selected
    router.push(`/fabrics/${fromSlug}?qty=${qty}`);
  };

  const [a, setA] = useState<Answers>({ width: widthKeyFor(fromWidth), bigPrint: false });
  const [step, setStep] = useState<StepKey>('who');
  const [, setHistory] = useState<StepKey[]>([]);

  const garment = a.who ? GARMENTS[a.who].find((g) => g.key === a.garment) : undefined;

  // The questions that apply to this garment, in order
  const flow = useMemo<StepKey[]>(() => {
    const f: StepKey[] = ['who', 'garment', 'style'];
    if (!garment || garment.sized) f.push('size');
    if (!garment || garment.sleeves) f.push('sleeves');
    f.push('result');
    return f;
  }, [garment]);

  const go = (next: StepKey) => { setHistory((h) => [...h, step]); setStep(next); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const nextOf = (s: StepKey) => flow[flow.indexOf(s) + 1] || 'result';
  const back = () => setHistory((h) => { const prev = h.at(-1); if (prev) setStep(prev); return h.slice(0, -1); });
  const restart = () => { setA({ width: widthKeyFor(fromWidth), bigPrint: false }); setHistory([]); setStep('who'); };

  const pick = (patch: Partial<Answers>, from: StepKey, auto = true) => {
    setA((x) => ({ ...x, ...patch }));
    if (auto) go(nextOf(from));
  };

  const questionIndex = Math.max(0, flow.indexOf(step));
  const totalQuestions = flow.length - 1;
  const result = step === 'result' ? estimate(a) : null;
  const sizeLabel = a.who === 'kids' ? KID_AGES.find((s) => s.key === a.size)?.label : ADULT_SIZES.find((s) => s.key === a.size)?.label;

  const TITLES: Record<StepKey, string> = {
    who: 'Who is it for?',
    garment: 'What are you making?',
    style: `Which ${garment?.label.toLowerCase() || 'style'}?`,
    size: a.who === 'kids' ? 'How old is the child?' : 'What size do you wear?',
    sleeves: 'What sleeves?',
    result: 'You need',
  };

  return (
    <div className="min-h-screen bg-[#faf6ee] dark:bg-dark-950">
      <div className="container-main max-w-2xl py-10 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a07c3b]">Fabric estimator</p>
        <h1 className="mt-2 font-display text-3xl text-gray-900 dark:text-white sm:text-4xl">How much fabric do I need?</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          A few quick questions and we&apos;ll suggest how many metres to buy{fromName ? <> of <strong className="text-gray-900 dark:text-white">{fromName}</strong></> : ''}.
        </p>

        {/* Progress */}
        <div className="mt-8 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e6dccb] dark:bg-dark-800">
            <div className="h-full rounded-full bg-primary-700 transition-all duration-500" style={{ width: `${(step === 'result' ? 1 : questionIndex / totalQuestions) * 100}%` }}/>
          </div>
          <span className="shrink-0 text-xs text-gray-500">{step === 'result' ? 'Done' : `${questionIndex + 1} of ${totalQuestions}`}</span>
        </div>

        <section className="mt-6 rounded-3xl border border-[#e6dccb] bg-white p-5 shadow-sm dark:border-dark-700 dark:bg-dark-900 sm:p-8" aria-live="polite">
          {step !== 'result' && <h2 className="font-display text-2xl text-gray-900 dark:text-white">{TITLES[step]}</h2>}

          {step === 'who' && (
            <div className="mt-5 grid gap-3">
              {WHO.map((w) => <Option key={w.key} on={a.who === w.key} title={w.label} hint={w.hint}
                onClick={() => pick({ who: w.key, garment: undefined, style: undefined, size: undefined }, 'who')}/>)}
            </div>
          )}

          {step === 'garment' && a.who && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {GARMENTS[a.who].map((g) => <Option key={g.key} on={a.garment === g.key} title={g.label} hint={g.hint}
                onClick={() => pick({ garment: g.key, style: g.styles.length === 1 ? g.styles[0].key : undefined }, 'garment')}/>)}
            </div>
          )}

          {step === 'style' && garment && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {garment.styles.map((s) => <Option key={s.key} on={a.style === s.key} title={s.label} hint={s.hint}
                onClick={() => pick({ style: s.key }, 'style')}/>)}
            </div>
          )}

          {step === 'size' && (
            <div className="mt-5 flex flex-wrap gap-2">
              {(a.who === 'kids' ? KID_AGES : ADULT_SIZES).map((s) => (
                <Chip key={s.key} on={a.size === s.key} onClick={() => pick({ size: s.key }, 'size')}>{s.label}</Chip>
              ))}
            </div>
          )}

          {step === 'sleeves' && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {SLEEVES.map((s) => <Option key={s.key} on={a.sleeves === s.key} title={s.label} onClick={() => pick({ sleeves: s.key }, 'sleeves')}/>)}
            </div>
          )}

          {step === 'result' && result && (
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#a07c3b]">You need about</p>
              <p className="mt-3 font-display text-6xl text-gray-900 dark:text-white sm:text-7xl">{result.low}–{result.high}<span className="ml-2 text-3xl text-gray-500">m</span></p>
              <p className="mt-3 text-gray-600 dark:text-gray-400">
                for <strong className="text-gray-900 dark:text-white">{result.garment.label} — {result.style.label}</strong>
                {sizeLabel ? <> · {a.who === 'kids' ? sizeLabel : `size ${sizeLabel}`}</> : null}
                {garment?.sleeves && a.sleeves ? <> · {SLEEVES.find((s) => s.key === a.sleeves)?.label.toLowerCase()}</> : null}
                {' '}· {fromWidth ? `${fromName || 'this fabric'} is ${fromWidth}″ wide` : 'standard 44″ wide fabric'}
              </p>

              <div className="mx-auto mt-6 max-w-md rounded-2xl bg-[#faf6ee] p-4 text-left text-sm text-gray-700 dark:bg-dark-800 dark:text-gray-300">
                <p><strong className="text-gray-900 dark:text-white">{result.low} m</strong> is enough for a standard fit. <strong className="text-gray-900 dark:text-white">{result.high} m</strong> gives your tailor extra room for fitting and adjustments — we recommend it.</p>
              </div>

              {/* Change any answer here and the estimate updates straight away */}
              <div className="mx-auto mt-6 max-w-md rounded-2xl border border-[#e6dccb] p-4 text-left dark:border-dark-700">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Your answers</p>
                  <p className="text-xs text-gray-500">Change any to compare</p>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#efe6d6] pt-3 text-sm dark:border-dark-700">
                  <span className="text-gray-500">Making</span>
                  <span className="flex items-center gap-3">
                    <span className="font-medium text-gray-900 dark:text-white">{WHO.find((w) => w.key === a.who)?.label} · {garment?.label}</span>
                    <button type="button" onClick={() => { setHistory((h) => [...h, 'result']); setStep('who'); }}
                      className="text-xs font-semibold text-primary-700 underline underline-offset-4 dark:text-primary-400">Change</button>
                  </span>
                </div>

                {garment && garment.styles.length > 1 && (
                  <div className="mt-3 border-t border-[#efe6d6] pt-3 dark:border-dark-700">
                    <p className="text-xs text-gray-500">Style</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {garment.styles.map((st) => (
                        <button key={st.key} type="button" onClick={() => setA((x) => ({ ...x, style: st.key }))} aria-pressed={a.style === st.key}
                          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${a.style === st.key ? 'border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900' : 'border-[#e6dccb] text-gray-700 hover:border-gray-400 dark:border-dark-600 dark:text-gray-300'}`}>
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {garment?.sized && (
                  <div className="mt-3 border-t border-[#efe6d6] pt-3 dark:border-dark-700">
                    <p className="text-xs text-gray-500">{a.who === 'kids' ? 'Age' : 'Size'}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(a.who === 'kids' ? KID_AGES : ADULT_SIZES).map((sz) => (
                        <button key={sz.key} type="button" onClick={() => setA((x) => ({ ...x, size: sz.key }))} aria-pressed={a.size === sz.key}
                          className={`min-w-[2.75rem] rounded-full border px-3 py-1.5 text-xs font-medium transition ${a.size === sz.key ? 'border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900' : 'border-[#e6dccb] text-gray-700 hover:border-gray-400 dark:border-dark-600 dark:text-gray-300'}`}>
                          {sz.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {garment?.sleeves && (
                  <div className="mt-3 border-t border-[#efe6d6] pt-3 dark:border-dark-700">
                    <p className="text-xs text-gray-500">Sleeves</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {SLEEVES.map((sl) => (
                        <button key={sl.key} type="button" onClick={() => setA((x) => ({ ...x, sleeves: sl.key }))} aria-pressed={a.sleeves === sl.key}
                          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${a.sleeves === sl.key ? 'border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900' : 'border-[#e6dccb] text-gray-700 hover:border-gray-400 dark:border-dark-600 dark:text-gray-300'}`}>
                          {sl.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
                {fromSlug ? (
                  <button type="button" onClick={() => addToBag(result.high)} className="button-primary justify-center px-8 py-3.5">
                    Add {result.high} m of {fromName || 'this fabric'} to bag
                  </button>
                ) : (
                  <Link href="/fabrics" className="button-primary justify-center px-8 py-3.5">Shop fabrics →</Link>
                )}
                <button type="button" onClick={restart} className="rounded-xl border border-gray-300 px-8 py-3.5 text-sm font-semibold text-gray-800 hover:border-gray-500 dark:border-dark-600 dark:text-gray-200">
                  Estimate another garment
                </button>
              </div>
              <p className="mx-auto mt-6 max-w-md rounded-xl border border-[#e6dccb] px-4 py-3 text-left text-xs leading-relaxed text-gray-600 dark:border-dark-700 dark:text-gray-400">
                <strong className="text-gray-800 dark:text-gray-200">This is only an estimate.</strong> The fabric needed depends on your tailor, the cut and the fit,
                so please confirm with your tailor before ordering. RCS Fabrics is not responsible for any shortfall or sizing issue.
                Questions? <a href={BUSINESS.whatsapp} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">Ask us on WhatsApp</a>.
              </p>
            </div>
          )}

          {step !== 'who' && (
            <div className="mt-6 flex items-center justify-between border-t border-[#efe6d6] pt-4 dark:border-dark-700">
              <button type="button" onClick={back} className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">← Back</button>
              {step !== 'result' && <button type="button" onClick={restart} className="text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">Start again</button>}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
