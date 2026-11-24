'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { ABOUT } from '@/content/about';
import { Reveal, Eyebrow, Timeline } from '@/components/about/AboutPieces';

// Warm ivory / beige / gold palette for this page
const IVORY = '#faf6ee';
const INK = '#2b2118';

export default function AboutPage() {
  const reduce = useReducedMotion();
  const { hero, story, journey, closing } = ABOUT;

  return (
    <div style={{ backgroundColor: IVORY, color: INK }}>
      {/* 1 · Hero */}
      <section className="relative isolate overflow-hidden" aria-labelledby="about-hero-title">
        <Image src={hero.image} alt={hero.imageAlt} fill priority sizes="100vw" className="-z-20 object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#1d150e]/80 via-[#2b2118]/65 to-[#2b2118]/85" />
        <div className="container-main flex min-h-[60vh] flex-col justify-end py-20 sm:py-28">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl"
          >
            <Eyebrow light>{hero.eyebrow}</Eyebrow>
            <h1 id="about-hero-title" className="mt-6 font-display text-5xl leading-[1.05] text-[#fbf5e8] sm:text-6xl lg:text-7xl">
              {hero.title}
            </h1>
            <p className="mt-6 max-w-xl text-lg text-[#efe2c6] sm:text-xl">{hero.subtitle}</p>
          </motion.div>
        </div>
      </section>

      {/* 2 · Our Story */}
      <section id="story" className="scroll-mt-24 py-20 sm:py-28" aria-labelledby="story-title">
        <div className="container-main grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <Reveal>
              <Eyebrow>{story.eyebrow}</Eyebrow>
              <h2 id="story-title" className="mt-5 font-display text-4xl leading-tight sm:text-5xl">{story.title}</h2>
            </Reveal>
          </div>
          <div className="lg:col-span-8">
            <Reveal delay={0.1}>
              <div className="space-y-6 text-[17px] leading-[1.85] text-[#5a4b3c] sm:text-lg">
                {story.paragraphs.map((p, i) => (
                  <p key={i} className={i === 0 ? 'font-display text-2xl leading-snug text-[#2b2118] sm:text-[28px]' : ''}>{p}</p>
                ))}
              </div>
              <blockquote className="mt-10 border-l-2 border-[#c9a24e] pl-6 font-display text-2xl italic text-[#8a6a33]">
                “{story.pullQuote}”
              </blockquote>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 4 · Our Journey */}
      <section className="py-20 sm:py-28" style={{ backgroundColor: '#f3ead9' }} aria-labelledby="journey-title">
        <div className="container-main">
          <Reveal className="max-w-2xl">
            <Eyebrow>{journey.eyebrow}</Eyebrow>
            <h2 id="journey-title" className="mt-5 font-display text-4xl sm:text-5xl">{journey.title}</h2>
          </Reveal>
          <div className="mt-14">
            <Timeline entries={journey.entries} />
          </div>
        </div>
      </section>

      {/* 7 · Closing */}
      <section className="py-24 sm:py-32" aria-labelledby="closing-title">
        <div className="container-main">
        <Reveal className="mx-auto max-w-3xl text-center">
          <h2 id="closing-title" className="font-display text-4xl leading-tight sm:text-5xl">{closing.title}</h2>
          <div className="mt-8 space-y-4 text-lg leading-relaxed text-[#5a4b3c]">
            {closing.paragraphs.map((p) => <p key={p}>{p}</p>)}
          </div>
          <Link href={closing.cta.href} className="button-luxury mt-10 inline-flex px-10 py-4 text-base font-semibold">
            {closing.cta.label}
          </Link>
        </Reveal>
        </div>
      </section>
    </div>
  );
}
