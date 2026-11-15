'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Cancelled orders now live in Orders (filter: Cancelled)
export default function CancelledOrdersRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/admin/orders?status=CANCELLED'); }, [router]);
  return null;
}
