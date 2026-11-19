'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

export interface Country { name: string; iso: string; dial: string; min: number; max: number }

// India first; then neighbours and countries customers most often order from.
export const COUNTRIES: Country[] = [
  { name: 'India', iso: 'IN', dial: '+91', min: 10, max: 10 },
  { name: 'Nepal', iso: 'NP', dial: '+977', min: 10, max: 10 },
  { name: 'Bhutan', iso: 'BT', dial: '+975', min: 8, max: 8 },
  { name: 'Bangladesh', iso: 'BD', dial: '+880', min: 10, max: 10 },
  { name: 'Sri Lanka', iso: 'LK', dial: '+94', min: 9, max: 9 },
  { name: 'Myanmar', iso: 'MM', dial: '+95', min: 8, max: 10 },
  { name: 'United Arab Emirates', iso: 'AE', dial: '+971', min: 9, max: 9 },
  { name: 'Saudi Arabia', iso: 'SA', dial: '+966', min: 9, max: 9 },
  { name: 'Qatar', iso: 'QA', dial: '+974', min: 8, max: 8 },
  { name: 'Oman', iso: 'OM', dial: '+968', min: 8, max: 8 },
  { name: 'Kuwait', iso: 'KW', dial: '+965', min: 8, max: 8 },
  { name: 'Singapore', iso: 'SG', dial: '+65', min: 8, max: 8 },
  { name: 'Malaysia', iso: 'MY', dial: '+60', min: 9, max: 10 },
  { name: 'Thailand', iso: 'TH', dial: '+66', min: 9, max: 9 },
  { name: 'United States', iso: 'US', dial: '+1', min: 10, max: 10 },
  { name: 'Canada', iso: 'CA', dial: '+1', min: 10, max: 10 },
  { name: 'United Kingdom', iso: 'GB', dial: '+44', min: 10, max: 10 },
  { name: 'Australia', iso: 'AU', dial: '+61', min: 9, max: 9 },
  { name: 'New Zealand', iso: 'NZ', dial: '+64', min: 8, max: 10 },
  { name: 'Germany', iso: 'DE', dial: '+49', min: 10, max: 11 },
  { name: 'France', iso: 'FR', dial: '+33', min: 9, max: 9 },
];

const flag = (iso: string) => String.fromCodePoint(...[...iso].map((c) => 0x1f1a5 + c.charCodeAt(0)));

/** Local digits must fit the country; Indian mobiles start with 6–9. */
export function phoneProblem(digits: string, c: Country): string {
  if (!digits) return 'Enter your phone number';
  if (digits.length < c.min || digits.length > c.max)
    return c.min === c.max ? `Enter a ${c.min}-digit number` : `Enter ${c.min}–${c.max} digits`;
  if (c.iso === 'IN' && !/^[6-9]/.test(digits)) return 'Indian mobile numbers start with 6, 7, 8 or 9';
  return '';
}

/** Split a stored number like "+91 98765 43210" back into country + local digits. */
export function splitPhone(raw: string | null | undefined): { country: Country; digits: string } {
  const s = String(raw || '').trim();
  const all = s.replace(/\D/g, '');
  if (s.startsWith('+')) {
    const match = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length).find((c) => all.startsWith(c.dial.slice(1)));
    if (match) return { country: match, digits: all.slice(match.dial.length - 1).slice(0, match.max) };
  }
  const d = all.length > 10 && all.startsWith('91') ? all.slice(2) : all.replace(/^0+/, '');
  return { country: COUNTRIES[0], digits: d.slice(0, 10) };
}

const pretty = (digits: string, c: Country) =>
  c.iso === 'IN' && digits.length > 5 ? `${digits.slice(0, 5)} ${digits.slice(5)}` : digits;

/**
 * Phone field with a searchable country picker (India +91 by default).
 * onChange gives the full number as "+91 9876543210" and whether it is valid.
 */
export default function PhoneInput({
  value, onChange, id = 'phone', required, showError,
}: {
  value: string;
  onChange: (full: string, valid: boolean) => void;
  id?: string;
  required?: boolean;
  showError?: boolean;
}) {
  const initial = useMemo(() => splitPhone(value), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [country, setCountry] = useState<Country>(initial.country);
  const [digits, setDigits] = useState(initial.digits);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [touched, setTouched] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const emit = (c: Country, d: string) => onChange(d ? `${c.dial} ${d}` : '', !phoneProblem(d, c));

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
    const close = (e: MouseEvent) => { if (!boxRef.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const q = query.trim().toLowerCase().replace(/^\+/, '');
  const list = COUNTRIES.filter((c) => !q || c.name.toLowerCase().includes(q) || c.dial.slice(1).startsWith(q) || c.iso.toLowerCase() === q);
  const problem = phoneProblem(digits, country);
  const showProblem = (touched || showError) && !!digits && !!problem;

  const pick = (c: Country) => {
    const d = digits.slice(0, c.max);
    setCountry(c); setDigits(d); setOpen(false); setQuery('');
    emit(c, d);
  };

  return (
    <div ref={boxRef} className="relative">
      <div className={`flex items-stretch overflow-hidden rounded-xl border bg-white transition-colors focus-within:border-primary-500 dark:bg-dark-800 ${
        showProblem ? 'border-red-500' : digits && !problem ? 'border-green-500' : 'border-gray-300 dark:border-dark-600'}`}>
        <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open}
          aria-label={`Country code ${country.name} ${country.dial}`}
          className="flex shrink-0 items-center gap-1.5 border-r border-gray-200 bg-gray-50 px-3 text-sm font-semibold text-gray-800 hover:bg-gray-100 dark:border-dark-600 dark:bg-dark-700 dark:text-gray-100">
          <span aria-hidden="true">{flag(country.iso)}</span>
          {country.dial}
          <svg className="h-3.5 w-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
        </button>
        <input id={id} name="phone" type="tel" inputMode="numeric" autoComplete="tel-national" required={required}
          value={pretty(digits, country)}
          placeholder={country.iso === 'IN' ? '98765 43210' : `${country.min === country.max ? country.min : `${country.min}–${country.max}`}-digit number`}
          onChange={(e) => {
            const d = e.target.value.replace(/\D/g, '').slice(0, country.max);
            setDigits(d); emit(country, d);
          }}
          onBlur={() => setTouched(true)}
          className="w-full min-w-0 border-0 bg-transparent px-3 py-3 text-sm text-gray-900 shadow-none outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0 dark:text-white" />
      </div>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-full max-w-sm overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-dark-600 dark:bg-dark-800">
          <div className="border-b border-gray-100 p-2 dark:border-dark-700">
            <input ref={searchRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search country or code"
              aria-label="Search country"
              onKeyDown={(e) => { if (e.key === 'Enter' && list[0]) { e.preventDefault(); pick(list[0]); } if (e.key === 'Escape') setOpen(false); }}
              className="w-full rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none dark:bg-dark-700 dark:text-white" />
          </div>
          <ul role="listbox" className="max-h-60 overflow-y-auto py-1">
            {list.map((c) => (
              <li key={c.iso}>
                <button type="button" role="option" aria-selected={c.iso === country.iso} onClick={() => pick(c)}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-dark-700 ${c.iso === country.iso ? 'font-semibold text-primary-700 dark:text-primary-400' : 'text-gray-800 dark:text-gray-200'}`}>
                  <span aria-hidden="true">{flag(c.iso)}</span>
                  <span className="flex-1">{c.name}</span>
                  <span className="text-gray-500">{c.dial}</span>
                </button>
              </li>
            ))}
            {!list.length && <li className="px-3 py-3 text-sm text-gray-500">No country found</li>}
          </ul>
        </div>
      )}

      {showProblem && <p className="mt-1.5 text-xs font-medium text-red-600">{problem}</p>}
    </div>
  );
}
