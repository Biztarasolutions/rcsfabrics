import { prisma } from '@/index';

const norm = (v: unknown): string => String(v ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
const clean = (v: unknown, max: number): string => String(v ?? '').trim().slice(0, max);

/**
 * Save an order's shipping address to the user's address book unless the same
 * address is already saved. The email always comes from the user's account.
 * Never throws — saving the address must not break checkout or payment.
 */
export async function saveAddressIfNew(userId: string, raw: unknown): Promise<void> {
  try {
    let a: any = raw;
    if (typeof raw === 'string') {
      try { a = JSON.parse(raw); } catch { return; }
    }
    if (!a || typeof a !== 'object') return;

    const street = clean(a.street || a.addressLine1 || a.address, 255);
    const city = clean(a.city, 100);
    const postalCode = clean(a.postalCode || a.pincode || a.zipCode, 20);
    if (!street || !city || !postalCode) return; // incomplete — nothing sensible to save

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (!user) return;

    const candidate = {
      firstName: clean(a.firstName, 100),
      lastName: clean(a.lastName, 100),
      phone: clean(a.phone, 20),
      street,
      city,
      state: clean(a.state, 100),
      postalCode,
      country: clean(a.country || 'India', 100),
    };

    const existing = await prisma.address.findMany({ where: { userId } });
    const key = (x: typeof candidate) =>
      [x.street, x.city, x.postalCode, x.phone, x.firstName, x.lastName].map(norm).join('|');
    if (existing.some((e) => key(e as any) === key(candidate))) return;

    await prisma.address.create({
      data: {
        userId,
        ...candidate,
        email: user.email || '',
        isDefault: existing.length === 0, // first saved address becomes the default
      },
    });
  } catch (err) {
    console.error('[Address] could not save order address:', err);
  }
}
