import type { Metadata } from 'next';
import { Suspense } from 'react';
import Estimator from './Estimator';

export const metadata: Metadata = {
  title: 'Fabric Estimator — How Much Fabric Do I Need?',
  description:
    'Answer a few quick questions — who it is for, the garment, style, size and fabric width — and see how many metres of fabric to buy.',
  alternates: { canonical: '/fabric-estimator' },
};

export default function FabricEstimatorPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <Estimator />
    </Suspense>
  );
}
