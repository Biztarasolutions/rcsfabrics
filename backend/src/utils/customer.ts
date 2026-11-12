import { prisma } from '@/index';

/** Readable customer ID, e.g. 42 -> "RCS000042". One per account (and so per email). */
export const customerCode = (n?: number | null): string | null =>
  typeof n === 'number' && n > 0 ? `RCS${String(n).padStart(6, '0')}` : null;

export const normalizePhone = (phone: unknown): string => String(phone ?? '').replace(/\s+/g, '');
export const phoneLast10 = (phone: string): string => phone.replace(/\D/g, '').slice(-10);

/**
 * Is this phone number used by another account (as their current number or one
 * they used before)? Numbers are compared on their last 10 digits.
 */
export async function phoneUsedByOther(phone: string, exceptUserId?: string): Promise<boolean> {
  const last10 = phoneLast10(phone);
  if (!last10) return false;
  const notMe = exceptUserId ? { NOT: { id: exceptUserId } } : {};
  const current = await prisma.user.findFirst({
    where: { ...notMe, OR: [{ phone }, { phone: { endsWith: last10 } }] },
    select: { id: true },
  });
  if (current) return true;
  const past = await prisma.userPhone.findFirst({
    where: { ...(exceptUserId ? { NOT: { userId: exceptUserId } } : {}), OR: [{ phone }, { phone: { endsWith: last10 } }] },
    select: { id: true },
  });
  return !!past;
}

/** Record a phone number in the user's history (skips if it's already there). */
export async function recordPhone(userId: string, phone: string): Promise<void> {
  if (!phone) return;
  const exists = await prisma.userPhone.findFirst({ where: { userId, phone }, select: { id: true } });
  if (!exists) await prisma.userPhone.create({ data: { userId, phone } });
}
