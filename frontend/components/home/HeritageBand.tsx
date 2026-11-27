'use client';

import Link from 'next/link';

/** Short heritage band: who we are, in three facts. */
export default function HeritageBand() {
  const facts = [
    { big: '1962', small: 'Our first fabric store opens in Dimapur' },
    { big: '3', small: 'Generations of one family choosing every fabric' },
    { big: '48 h', small: 'Damage cover — if anything is wrong, we put it right' },
  ];
  return (
    <section className="bg-primary-900 text-white">
      <div className="container-main py-12 lg:py-16">
        <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#d9b96a]">Our heritage</p>
            <h2 className="mt-3 font-display text-3xl font-semibold leading-tight sm:text-4xl" style={{ textWrap: 'balance' as any }}>
              A family fabric house, since 1962
            </h2>
            <p className="mt-4 max-w-lg text-white/75">
              What began as a small store in Dimapur, Nagaland is now run by the third generation — the same eye for quality
              and honest service, now delivered across India.
            </p>
            <Link href="/about" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#e7cf98] underline-offset-4 hover:underline">
              Read our story <span aria-hidden="true">→</span>
            </Link>
          </div>
          <dl className="grid grid-cols-3 gap-3 sm:gap-6">
            {facts.map((f) => (
              <div key={f.big} className="border-l border-[#c9a24e]/50 pl-3 sm:pl-5">
                <dt className="font-display text-3xl text-[#e7cf98] sm:text-4xl">{f.big}</dt>
                <dd className="mt-1 text-xs leading-snug text-white/70 sm:text-sm">{f.small}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
