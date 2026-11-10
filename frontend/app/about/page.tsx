'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { ABOUT } from '@/content/about';
import { Reveal, Eyebrow, FamilyCard, Timeline, WorldMap } from '@/components/about/AboutPieces';

// Warm ivory / beige / gold palette for this page
const IVORY = '#faf6ee';
const BEIGE = '#f3ead9';
const INK = '#2b2118';

export default function AboutPage() {
  const reduce = useReducedMotion();
  const { hero, story, family, journey, philosophy, world, closing } = ABOUT;

  return (
    <div style={{ backgroundColor: IVORY, color: INK }}>
      {/* 1 · Hero */}
      <section className="relative isolate overflow-hidden" aria-labelledby="about-hero-title">
        <Image src={hero.image} alt={hero.imageAlt} fill priority sizes="100vw" className="-z-20 object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#1d150e]/80 via-[#2b2118]/65 to-[#2b2118]/85" />
        <div className="container-main flex min-h-[78vh] flex-col justify-end py-20 sm:py-28">
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
              <ol className="mt-10 space-y-5 border-l border-[#d9c39a] pl-6">
                {story.generations.map((g) => (
                  <li key={g.label}>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a07c3b]">{g.label}</p>
                    <p className="mt-1 font-display text-lg">{g.names}</p>
                  </li>
                ))}
              </ol>
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

      {/* 3 · Meet the Family */}
      <section id="family" className="scroll-mt-24 py-20 sm:py-28" style={{ backgroundColor: BEIGE }} aria-labelledby="family-title">
        <div className="container-main">
          <Reveal className="mx-auto max-w-2xl text-center">
            <div className="flex justify-center"><Eyebrow>{family.eyebrow}</Eyebrow></div>
            <h2 id="family-title" className="mt-5 font-display text-4xl sm:text-5xl">{family.title}</h2>
          </Reveal>
          <div className="mt-16 space-y-20 sm:mt-20 sm:space-y-28">
            {family.members.map((m, i) => <FamilyCard key={m.name} m={m} index={i} />)}
          </div>
        </div>
      </section>

      {/* 4 · Our Journey */}
      <section className="py-20 sm:py-28" aria-labelledby="journey-title">
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

      {/* 5 · Philosophy */}
      <section id="philosophy" className="relative scroll-mt-24 overflow-hidden py-24 sm:py-32" style={{ backgroundColor: BEIGE }} aria-labelledby="philosophy-title">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-60"
          style={{ backgroundImage: 'repeating-linear-gradient(90deg, rgba(160,124,59,0.06) 0 1px, transparent 1px 7px), repeating-linear-gradient(0deg, rgba(160,124,59,0.05) 0 1px, transparent 1px 7px)' }}
        />
        <div className="container-main relative">
        <Reveal className="mx-auto max-w-3xl text-center">
          <div className="flex justify-center"><Eyebrow>{philosophy.eyebrow}</Eyebrow></div>
          <h2 id="philosophy-title" className="mt-6 font-display text-4xl leading-tight sm:text-5xl">{philosophy.title}</h2>
          <div className="mx-auto mt-8 h-px w-16 bg-[#c9a24e]" />
          <div className="mt-8 space-y-5 text-lg leading-relaxed text-[#5a4b3c]">
            {philosophy.paragraphs.map((p) => <p key={p}>{p}</p>)}
          </div>
        </Reveal>
        </div>
      </section>

      {/* 6 · From Dimapur to the World */}
      <section className="py-20 sm:py-28" style={{ backgroundColor: INK }} aria-labelledby="world-title">
        <div className="container-main grid items-center gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <Eyebrow light>{world.eyebrow}</Eyebrow>
            <h2 id="world-title" className="mt-6 font-display text-3xl leading-snug text-[#fbf5e8] sm:text-4xl">
              “{world.quote}”
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-[#d8c8a8]">{world.text}</p>
          </Reveal>
          <Reveal delay={0.15} className="lg:col-span-7">
            <WorldMap />
          </Reveal>
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
