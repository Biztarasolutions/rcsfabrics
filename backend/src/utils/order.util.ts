import { PrismaClient } from '@prisma/client';

export const generateOrderNumber = async (prisma: PrismaClient): Promise<string> => {
  const count = await prisma.order.count();
  return `RCS-${String(count + 1).padStart(6, '0')}`;
};

export const calculateOrderTotal = (
  subtotal: number,
  shippingCost: number,
  tax: number,
  discountAmount: number
): number => {
  return Math.max(0, subtotal + shippingCost + tax - discountAmount);
};

export const calculateDiscount = (
  basePrice: number,
  discountType: 'PERCENTAGE' | 'FIXED',
  discountValue: number,
  maxDiscount?: number
): number => {
  let discount = 0;
  if (discountType === 'PERCENTAGE') discount = (basePrice * discountValue) / 100;
  else discount = discountValue;
  if (maxDiscount && discount > maxDiscount) discount = maxDiscount;
  return Math.round(discount * 100) / 100;
};

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(price);
};
