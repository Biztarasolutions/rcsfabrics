import crypto from 'crypto';
import { config } from '@/config';

/** Unguessable per-order key for the print links in the team order email (no login needed). */
export const printToken = (orderId: string): string =>
  crypto.createHmac('sha256', String(config.JWT_SECRET)).update(`print:${orderId}`).digest('base64url').slice(0, 32);

export const verifyPrintToken = (orderId: string, token: unknown): boolean => {
  if (typeof token !== 'string' || token.length !== 32) return false;
  const a = Buffer.from(printToken(orderId));
  const b = Buffer.from(token);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};
