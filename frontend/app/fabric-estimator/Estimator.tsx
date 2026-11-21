'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ADULT_SIZES, Answers, estimate, GARMENTS, HEIGHTS, KID_AGES, SLEEVES, Who, WIDTHS, widthKeyFor,
} from '@/lib/estimator';
import { BUSINESS } from '@/lib/business';

type StepKey = 'who' | 'garment' | 'style' | 'size' | 'sleeves' | 'fabric' | 'result';

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

  const [a, setA] = useState<Answers>({ width: widthKeyFor(fromWidth), bigPrint: false });
  const [step, setStep] = useState<StepKey>('who');
  const [, setHistory] = useState<StepKey[]>([]);

  const garment = a.who ? GARMENTS[a.who].find((g) => g.key === a.garment) : undefined;

  // The questions that apply to this garment, in order
  const flow = useMemo<StepKey[]>(() => {
    const f: StepKey[] = ['who', 'garment', 'style'];
    if (!garment || garment.sized) f.push('size');
    if (!garment || garment.sleeves) f.push('sleeves');
    f.push('fabric', 'result');
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
  const needsHeight = !!garment?.long && a.who !== 'kids';

  const TITLES: Record<StepKey, string> = {
    who: 'Who is it for?',
    garment: 'What are you making?',
    style: `Which ${garment?.label.toLowerCase() || 'style'}?`,
    size: a.who === 'kids' ? 'How old is the child?' : 'What size do you wear?',
    sleeves: 'What sleeves?',
    fabric: 'About the fabric',
    result: 'You need',
  };

  return (
    <div className="min-h-screen bg-[#faf6ee] dark:bg-dark-950">
      <div className="container-main max-w-2xl py-10 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a07c3b]">Fabric estimator</p>
        <h1 className="mt-2 font-display text-3xl text-gray-900 dark:text-white sm:text-4xl">How much fabric do I need?</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          A few quick questions and we&apos;ll tell you how many metres to buy{fromName ? <> of <strong className="text-gray-900 dark:text-white">{fromName}</strong></> : ''}.
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
            <div className="mt-5 space-y-6">
              <div className="flex flex-wrap gap-2">
                {(a.who === 'kids' ? KID_AGES : ADULT_SIZES).map((s) => (
                  <Chip key={s.key} on={a.size === s.key} onClick={() => pick({ size: s.key }, 'size', !needsHeight)}>{s.label}</Chip>
                ))}
              </div>
              {needsHeight && (
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Your height</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {HEIGHTS.map((h) => <Chip key={h.key} on={a.height === h.key} onClick={() => setA((x) => ({ ...x, height: h.key }))}>{h.label}</Chip>)}
                  </div>
                </div>
              )}
              {needsHeight && (
                <button type="button" disabled={!a.size} onClick={() => { if (!a.height) setA((x) => ({ ...x, height: 'average' })); go(nextOf('size')); }}
                  className="button-primary w-full py-3.5 disabled:opacity-40 sm:w-auto sm:px-10">Continue</button>
              )}
            </div>
          )}

          {step === 'sleeves' && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {SLEEVES.map((s) => <Option key={s.key} on={a.sleeves === s.key} title={s.label} onClick={() => pick({ sleeves: s.key }, 'sleeves')}/>)}
            </div>
          )}

          {step === 'fabric' && (
            <div className="mt-5 space-y-6">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Fabric width</p>
                <p className="text-sm text-gray-500">{fromWidth ? `${fromName || 'This fabric'} is ${fromWidth}″ wide — already selected.` : 'Shown as “Width” on every fabric page.'}</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {WIDTHS.map((w) => <Option key={w.key} on={a.width === w.key} title={w.label} hint={w.hint} onClick={() => setA((x) => ({ ...x, width: w.key }))}/>)}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Big print, checks or stripes?</p>
                <p className="text-sm text-gray-500">These need a little extra so the pattern lines up at the seams.</p>
                <div className="mt-3 flex gap-2">
                  <Chip on={!a.bigPrint} onClick={() => setA((x) => ({ ...x, bigPrint: false }))}>No</Chip>
                  <Chip on={!!a.bigPrint} onClick={() => setA((x) => ({ ...x, bigPrint: true }))}>Yes</Chip>
                </div>
              </div>
              <button type="button" onClick={() => go('result')} className="button-primary w-full py-3.5 sm:w-auto sm:px-10">Show my estimate</button>
            </div>
          )}

          {step === 'result' && result && (
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#a07c3b]">You need about</p>
              <p className="mt-3 font-display text-7xl text-gray-900 dark:text-white">{result.metres}<span className="ml-2 text-3xl text-gray-500">m</span></p>
              <p className="mt-3 text-gray-600 dark:text-gray-400">
                for <strong className="text-gray-900 dark:text-white">{result.garment.label} — {result.style.label}</strong>
                {sizeLabel ? <> · {a.who === 'kids' ? sizeLabel : `size ${sizeLabel}`}</> : null}
                {garment?.sleeves && a.sleeves ? <> · {SLEEVES.find((s) => s.key === a.sleeves)?.label.toLowerCase()}</> : null}
                {' '}· {WIDTHS.find((w) => w.key === a.width)?.label} fabric
              </p>

              <div className="mx-auto mt-6 max-w-md rounded-2xl bg-[#faf6ee] p-4 text-left text-sm text-gray-700 dark:bg-dark-800 dark:text-gray-300">
                <p><strong className="text-gray-900 dark:text-white">Want a little spare?</strong> Buy {result.safe} m if your tailor likes extra room for fitting, or you plan to pre-wash cotton or rayon (they can shrink slightly).</p>
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
                {fromSlug ? (
                  <Link href={`/fabrics/${fromSlug}?qty=${result.metres}`} className="button-primary justify-center px-8 py-3.5">
                    Add {result.metres} m of {fromName || 'this fabric'} →
                  </Link>
                ) : (
                  <Link href="/fabrics" className="button-primary justify-center px-8 py-3.5">Shop fabrics →</Link>
                )}
                <button type="button" onClick={restart} className="rounded-xl border border-gray-300 px-8 py-3.5 text-sm font-semibold text-gray-800 hover:border-gray-500 dark:border-dark-600 dark:text-gray-200">
                  Estimate another garment
                </button>
              </div>
              <p className="mx-auto mt-6 max-w-md text-xs text-gray-500">
                An estimate for a standard fit. Designer cuts, extra flare or lining need more — check with your tailor, or{' '}
                <a href={BUSINESS.whatsapp} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">ask us on WhatsApp</a>.
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
