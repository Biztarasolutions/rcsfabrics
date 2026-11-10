// Order pricing rules — the server is the source of truth.
export const FREE_SHIPPING_THRESHOLD = 2000; // ₹
export const FLAT_SHIPPING = 150; // ₹
export const MIN_QTY = 0.5; // metres
export const MAX_QTY_PER_LINE = 1000; // metres

export const roundMoney = (n: number): number => Math.round(n * 100) / 100;

export const isHalfMetreStep = (q: number): boolean => Math.abs(q * 2 - Math.round(q * 2)) < 1e-9;

export const calculateShipping = (subtotal: number): number =>
  subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;

export interface CouponRule {
  discountType: 'PERCENTAGE' | 'FIXED' | string;
  discountValue: number;
  maxDiscount?: number | null;
}

/** Discount in ₹ for a subtotal: capped by maxDiscount and never more than the subtotal. */
export const couponDiscount = (subtotal: number, c: CouponRule): number => {
  const raw = c.discountType === 'PERCENTAGE' ? (subtotal * c.discountValue) / 100 : c.discountValue;
  const capped = c.maxDiscount ? Math.min(raw, c.maxDiscount) : raw;
  return roundMoney(Math.max(0, Math.min(capped, subtotal)));
};
