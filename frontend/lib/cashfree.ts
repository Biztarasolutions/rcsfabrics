'use client';
// Cashfree Checkout (JS SDK v3). The session comes from our server; the result is
// always confirmed server-side with orderApi.verifyPayment — never trusted from here.
const SDK_URL = 'https://sdk.cashfree.com/js/v3/cashfree.js';
let loading: Promise<void> | null = null;

export function loadCashfree(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if ((window as any).Cashfree) return Promise.resolve();
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = SDK_URL;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => { loading = null; reject(new Error('Could not load the payment page. Check your connection and try again.')); };
      document.body.appendChild(s);
    });
  }
  return loading;
}

export type CashfreeResult = { closed: boolean; redirecting: boolean; message?: string };

/** Opens the Cashfree payment pop-up and resolves when it closes or completes */
export async function openCashfreeCheckout(paymentSessionId: string, mode: string = 'production'): Promise<CashfreeResult> {
  await loadCashfree();
  const cashfree = (window as any).Cashfree({ mode: mode === 'sandbox' ? 'sandbox' : 'production' });
  const result = await cashfree.checkout({ paymentSessionId, redirectTarget: '_modal' });
  if (result?.redirect) return { closed: false, redirecting: true };
  if (result?.error) return { closed: true, redirecting: false, message: result.error?.message };
  return { closed: false, redirecting: false, message: result?.paymentDetails?.paymentMessage };
}
