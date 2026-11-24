'use client';
import React from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import type { TimelineEntry } from '@/content/about';
import { WORLD_DOTS, WORLD_W, WORLD_H, DIMAPUR } from './worldDots';

/* ── Reveal: gentle fade-up on scroll (disabled for reduced-motion users) ── */
export function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p className={`flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] ${light ? 'text-[#e9d8b4]' : 'text-[#a07c3b]'}`}>
      <span className={`h-px w-8 ${light ? 'bg-[#e9d8b4]/70' : 'bg-[#c9a24e]'}`} />
      {children}
    </p>
  );
}

/* ── Photo or monogram placeholder (never a stock face) ── */
export function Portrait({ photo, alt, initials, className = '' }: { photo?: string; alt: string; initials: string; className?: string }) {
  if (photo) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <Image src={photo} alt={alt} fill loading="lazy" sizes="(max-width: 768px) 90vw, 360px" className="object-cover" />
      </div>
    );
  }
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={{
        backgroundColor: '#efe4d0',
        backgroundImage:
          'repeating-linear-gradient(45deg, rgba(160,124,59,0.07) 0 2px, transparent 2px 9px), repeating-linear-gradient(-45deg, rgba(160,124,59,0.05) 0 2px, transparent 2px 9px)',
      }}
      role="img"
      aria-label={`${alt} — photo coming soon`}
    >
      <div className="flex h-24 w-24 items-center justify-center rounded-full border border-[#c9a24e]/50 bg-[#faf6ee]/80 shadow-sm">
        <span className="font-display text-2xl tracking-wide text-[#8a6a33]">{initials}</span>
      </div>
    </div>
  );
}

/* ── Family profile ── */
export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  return (
    <ol className="relative grid gap-10 lg:grid-cols-3 lg:gap-8">
      {/* connecting thread */}
      <span aria-hidden="true" className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-[#c9a24e] via-[#c9a24e]/60 to-transparent lg:left-0 lg:right-0 lg:top-[11px] lg:bottom-auto lg:h-px lg:w-auto lg:bg-gradient-to-r" />
      {entries.map((e, i) => (
        <li key={e.title} className="relative pl-12 lg:pl-0 lg:pt-12">
          <span aria-hidden="true" className="absolute left-0 top-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-[#c9a24e] bg-[#faf6ee] lg:top-0">
            <span className="h-2 w-2 rounded-full bg-[#a07c3b]" />
          </span>
          <Reveal delay={i * 0.12}>
            <p className="font-display text-2xl text-[#a07c3b]">{e.when}</p>
            <h3 className="mt-1 text-lg font-semibold text-[#2b2118]">{e.title}</h3>
            <p className="mt-3 leading-relaxed text-[#5a4b3c]">{e.text}</p>
            {e.photo ? (
              <div className="relative mt-5 aspect-[3/2] overflow-hidden rounded-2xl">
                <Image src={e.photo} alt={e.photoAlt || e.title} fill loading="lazy" sizes="(max-width: 1024px) 90vw, 380px" className="object-cover sepia-[.15]" />
              </div>
            ) : null}
          </Reveal>
        </li>
      ))}
    </ol>
  );
}

/* ── Dotted world map with Dimapur highlighted ── */
const ll = (lat: number, lon: number): [number, number] => [WORLD_W / 2 + lon * (WORLD_W / 360), WORLD_H / 2 + 40 - lat * (WORLD_W / 360)];
const REACH: [number, number][] = [ll(28.6, 77.2), ll(19.1, 72.9), ll(25.2, 55.3), ll(51.5, -0.1), ll(40.7, -74), ll(1.35, 103.8), ll(-33.9, 151.2)];

export function WorldMap() {
  const reduce = useReducedMotion();
  const [dx, dy] = DIMAPUR;
  return (
    // aria-label (not <title>) so screen readers get a description without a hover tooltip
    <svg viewBox={`0 0 ${WORLD_W} ${WORLD_H}`} className="h-auto w-full" role="img"
      aria-label="World map with Dimapur, Nagaland highlighted and lines reaching outward to the rest of the world">
      <path d={WORLD_DOTS} stroke="#e9d8b4" strokeOpacity={0.35} strokeWidth={3.2} strokeLinecap="round" fill="none" />
      {REACH.map(([x, y], i) => {
        const mx = (dx + x) / 2, my = Math.min(dy, y) - Math.abs(dx - x) * 0.22 - 18;
        const d = `M${dx} ${dy} Q${mx.toFixed(1)} ${my.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
        return (
          <g key={i}>
            <motion.path
              d={d} fill="none" stroke="#d9b46a" strokeWidth={1.2} strokeDasharray="3 5" strokeOpacity={0.8}
              initial={reduce ? false : { pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }}
              transition={{ duration: 1.6, delay: 0.2 + i * 0.12, ease: 'easeOut' }}
            />
            <circle cx={x} cy={y} r={2.6} fill="#e9d8b4" />
          </g>
        );
      })}
      <circle cx={dx} cy={dy} r={14} fill="#d9b46a" fillOpacity={0.18}>
        {!reduce && <animate attributeName="r" values="8;18;8" dur="3s" repeatCount="indefinite" />}
      </circle>
      <circle cx={dx} cy={dy} r={5} fill="#f3d995" stroke="#2b2118" strokeWidth={1.5} />
      <text x={dx + 12} y={dy - 10} fill="#f3e6c8" fontSize={15} fontFamily="'Playfair Display', serif">Dimapur</text>
    </svg>
  );
}
