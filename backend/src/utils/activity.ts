// Activity history ("History" page in admin): who did what, and when.
//
// Admin-panel changes are recorded automatically by `trackAdminActivity`
// (mounted on the admin router). Shop events — sign-ups, orders, payments,
// customer cancellations — call `logActivity` directly.
import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/index';

export interface ActivityDetails {
  summary: string;
  actorName?: string;
  actorEmail?: string;
  actorRole?: string;
  [key: string]: unknown;
}

/** Fire-and-forget: history must never break the real action */
export function logActivity(entry: {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details: ActivityDetails;
}): void {
  prisma.activityLog
    .create({
      data: {
        userId: entry.userId || null,
        action: entry.action.slice(0, 255),
        entity: entry.entity.slice(0, 100),
        entityId: String(entry.entityId || '-').slice(0, 255),
        details: JSON.stringify(entry.details),
      },
    })
    .catch((err: unknown) => console.error('[History] could not record activity:', err));
}

const fmtM = (n: unknown) => `${Number(n)} m`;
const rupee = (n: unknown) => (n === null || n === undefined || n === '' ? '—' : `₹${Number(n)}`);
const changed = (a: unknown, b: unknown) => b !== undefined && b !== null && b !== '' && String(a ?? '') !== String(b);

async function actorInfo(req: Request) {
  const u = (req as any).user;
  if (!u?.id) return {};
  const user = await prisma.user.findUnique({ where: { id: u.id }, select: { firstName: true, lastName: true, email: true } });
  return {
    actorName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : u.email,
    actorEmail: user?.email || u.email,
    actorRole: u.role,
  };
}

/** Load what a record looked like before the change (for names and before → after) */
async function before(method: string, path: string): Promise<any> {
  const m = path.match(/^\/(products|categories|banners|coupons|orders|users)\/([^/]+)/);
  if (!m || method === 'POST') return null;
  const [, kind, id] = m;
  try {
    switch (kind) {
      case 'products':
        return prisma.product.findUnique({ where: { id }, select: { name: true, color: true, basePrice: true, discountPrice: true, totalStock: true, isActive: true } });
      case 'categories':
        return prisma.category.findUnique({ where: { id }, select: { name: true } });
      case 'banners':
        return prisma.banner.findUnique({ where: { id }, select: { title: true, isActive: true } });
      case 'coupons':
        return prisma.coupon.findUnique({ where: { id }, select: { code: true, isActive: true } });
      case 'orders':
        return prisma.order.findUnique({ where: { id }, select: { orderNumber: true, status: true, paymentStatus: true } });
      case 'users':
        return prisma.user.findUnique({ where: { id }, select: { email: true, firstName: true, lastName: true, role: true } });
    }
  } catch {
    return null;
  }
  return null;
}

const productLabel = (p: any) => (p ? `${p.name}${p.color ? ` — ${p.color}` : ''}` : 'a product');

/** Turn an admin request into a history entry (null = not worth recording) */
function describe(method: string, path: string, body: any, prev: any, resBody: any): { action: string; entity: string; entityId?: string; summary: string; extra?: Record<string, unknown> } | null {
  const data = resBody?.data;
  const id = path.split('/')[2];

  // Products
  if (method === 'POST' && path === '/products/group') {
    const n = Array.isArray(data) ? data.length : Array.isArray(data?.products) ? data.products.length : undefined;
    return { action: 'PRODUCT_ADDED', entity: 'Product', summary: `Added product${n && n > 1 ? `s (${n} colours)` : ''}: ${body?.name || data?.name || data?.products?.[0]?.name || 'new product'}` };
  }
  if (method === 'POST' && path === '/products') {
    return { action: 'PRODUCT_ADDED', entity: 'Product', entityId: data?.id, summary: `Added product: ${productLabel(data || body)}` };
  }
  if (method === 'PUT' && /^\/products\/[^/]+$/.test(path)) {
    const bits: string[] = [];
    if (prev && changed(prev.basePrice, body?.basePrice)) bits.push(`price ${rupee(prev.basePrice)} → ${rupee(body.basePrice)}`);
    if (prev && body?.discountPrice !== undefined && String(prev.discountPrice ?? '') !== String(body.discountPrice ?? '')) bits.push(`sale price ${rupee(prev.discountPrice)} → ${rupee(body.discountPrice)}`);
    if (prev && changed(prev.totalStock, body?.totalStock)) bits.push(`stock ${fmtM(prev.totalStock)} → ${fmtM(body.totalStock)}`);
    if (prev && body?.isActive !== undefined && Boolean(prev.isActive) !== Boolean(body.isActive)) bits.push(body.isActive ? 'made visible' : 'hidden from shop');
    return { action: 'PRODUCT_UPDATED', entity: 'Product', entityId: id, summary: `Updated product: ${productLabel(prev || data)}${bits.length ? ` (${bits.join(', ')})` : ''}` };
  }
  if (method === 'DELETE' && /^\/products\/[^/]+$/.test(path)) {
    return { action: 'PRODUCT_REMOVED', entity: 'Product', entityId: id, summary: `Removed product: ${productLabel(prev)}` };
  }
  if (method === 'PATCH' && /^\/products\/[^/]+\/stock$/.test(path)) {
    const d = Number(body?.adjustment);
    return {
      action: 'STOCK_ADJUSTED', entity: 'Product', entityId: id,
      summary: `Stock ${d >= 0 ? 'added' : 'reduced'}: ${productLabel(prev)} ${d >= 0 ? '+' : ''}${d} m (${fmtM(prev?.totalStock ?? 0)} → ${fmtM(data?.totalStock ?? '')})${body?.reason ? ` · ${body.reason}` : ''}`,
    };
  }

  // Orders
  if (method === 'PUT' && /^\/orders\/[^/]+$/.test(path)) {
    const no = prev?.orderNumber || id.slice(-8).toUpperCase();
    const bits: string[] = [];
    if (body?.status && body.status !== prev?.status) bits.push(`status ${prev?.status || '—'} → ${body.status}`);
    if (body?.paymentStatus && body.paymentStatus !== prev?.paymentStatus) bits.push(`payment ${prev?.paymentStatus || '—'} → ${body.paymentStatus}`);
    if (!bits.length) return null;
    const cancelled = body?.status === 'CANCELLED' && prev?.status !== 'CANCELLED';
    return { action: cancelled ? 'ORDER_CANCELLED' : 'ORDER_UPDATED', entity: 'Order', entityId: id, summary: `Order #${no}: ${bits.join(', ')}` };
  }

  // Categories, banners, coupons
  const simple: [RegExp, string, string, (x: any) => string][] = [
    [/^\/categories/, 'Category', 'category', (x) => x?.name],
    [/^\/banners/, 'Banner', 'banner', (x) => x?.title],
    [/^\/coupons/, 'Coupon', 'coupon', (x) => x?.code],
  ];
  for (const [re, entity, word, name] of simple) {
    if (!re.test(path)) continue;
    const label = name(prev) || name(data) || name(body) || '';
    if (method === 'POST') return { action: `${entity.toUpperCase()}_ADDED`, entity, entityId: data?.id, summary: `Added ${word}: ${label}` };
    if (method === 'DELETE') return { action: `${entity.toUpperCase()}_REMOVED`, entity, entityId: id, summary: `Removed ${word}: ${label}` };
    const vis = body?.isActive !== undefined && prev && Boolean(prev.isActive) !== Boolean(body.isActive)
      ? ` (${body.isActive ? 'switched on' : 'switched off'})` : '';
    if (Object.keys(body || {}).length === 1 && body?.order !== undefined) return null; // banner reordering
    return { action: `${entity.toUpperCase()}_UPDATED`, entity, entityId: id, summary: `Updated ${word}: ${label}${vis}` };
  }

  // Roles
  if (method === 'PATCH' && /^\/users\/[^/]+\/role$/.test(path)) {
    const who = prev ? `${`${prev.firstName || ''} ${prev.lastName || ''}`.trim() || prev.email} (${prev.email})` : 'a user';
    return { action: 'ROLE_CHANGED', entity: 'User', entityId: id, summary: `Changed role of ${who}: ${prev?.role || '—'} → ${body?.role}` };
  }

  // Settings
  if (method === 'PUT' && path.startsWith('/settings/')) {
    return { action: 'SETTING_CHANGED', entity: 'Setting', entityId: id, summary: `Changed setting: ${id}` };
  }
  return null;
}

/** Admin router middleware: records every successful change made in the admin panel */
export const trackAdminActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
  const path = req.path;
  if (/sync|migrate/.test(path)) return next(); // maintenance jobs
  const prev = await before(req.method, path);

  let resBody: any;
  const json = res.json.bind(res);
  res.json = (b: any) => { resBody = b; return json(b); };

  res.on('finish', async () => {
    if (res.statusCode >= 400 || resBody?.success === false) return;
    try {
      const d = describe(req.method, path, req.body, prev, resBody);
      if (!d) return;
      logActivity({
        userId: (req as any).user?.id,
        action: d.action,
        entity: d.entity,
        entityId: d.entityId,
        details: { summary: d.summary, ...(await actorInfo(req)), ...(d.extra || {}) },
      });
    } catch (err) {
      console.error('[History] tracking failed:', err);
    }
  });
  next();
};

/** Shop events about an order: placed, paid, cancelled by the customer */
export async function logOrderEvent(
  orderId: string,
  action: 'ORDER_PLACED' | 'PAYMENT_RECEIVED' | 'ORDER_CANCELLED',
  headline: string
): Promise<void> {
  try {
    const o = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true, orderNumber: true, total: true, paymentMethod: true, userId: true,
        user: { select: { firstName: true, lastName: true, email: true } },
        items: { select: { productName: true, quantity: true, product: { select: { color: true } } } },
      },
    });
    if (!o) return;
    const who = `${`${o.user?.firstName || ''} ${o.user?.lastName || ''}`.trim() || o.user?.email || 'Customer'}`;
    const items = o.items
      .map((i) => `${i.productName}${i.product?.color && !i.productName.includes(i.product.color) ? ` — ${i.product.color}` : ''} ${i.quantity} m`)
      .join(', ');
    logActivity({
      userId: o.userId,
      action,
      entity: 'Order',
      entityId: o.id,
      details: {
        summary: `${headline} #${o.orderNumber}: ${items} · ₹${Math.round(o.total).toLocaleString('en-IN')}${o.paymentMethod ? ` · ${String(o.paymentMethod).replace(/_/g, ' ')}` : ''}`,
        actorName: who,
        actorEmail: o.user?.email,
        actorRole: 'CUSTOMER',
      },
    });
  } catch (err) {
    console.error('[History] order event failed:', err);
  }
}
