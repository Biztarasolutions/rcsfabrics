// Roles & permissions
//
//  SUPER_ADMIN  full admin panel + decides every user's role (Users page).
//               Always the email(s) in SUPER_ADMIN_EMAILS (default rish6.jain@gmail.com).
//  ADMIN        full admin panel, but cannot change anyone's role.
//  EMPLOYEE     admin panel without insights: no dashboard, orders, customers,
//               analytics or enquiries — products, inventory, categories, banners etc. only.
//  CUSTOMER     default for every new account; no admin panel.
import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/index';

export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE' | 'CUSTOMER';
export const ASSIGNABLE_ROLES: Role[] = ['ADMIN', 'EMPLOYEE', 'CUSTOMER'];

const superAdminEmails = (): string[] =>
  (process.env.SUPER_ADMIN_EMAILS || 'rish6.jain@gmail.com')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

export const isSuperAdminEmail = (email?: string | null): boolean =>
  !!email && superAdminEmails().includes(email.toLowerCase());

/** The role that actually applies (the super admin email always wins) */
export const effectiveRole = (user: { email?: string | null; role?: string | null }): Role => {
  if (isSuperAdminEmail(user.email)) return 'SUPER_ADMIN';
  const r = (user.role || 'CUSTOMER') as string;
  return (['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE'].includes(r) ? r : 'CUSTOMER') as Role;
};

export const STAFF: Role[] = ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE'];
export const MANAGERS: Role[] = ['SUPER_ADMIN', 'ADMIN'];

export const isStaff = (role?: string) => STAFF.includes(role as Role);
export const isManager = (role?: string) => MANAGERS.includes(role as Role);

/**
 * Re-reads the user's role from the database on every admin request, so a role
 * change by the super admin applies immediately (no need to log in again).
 */
export const loadCurrentRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = (req as any).user?.id;
    if (!id) {
      res.status(401).json({ success: false, message: 'Unauthorized', statusCode: 401 });
      return;
    }
    const user = await prisma.user.findUnique({ where: { id }, select: { email: true, role: true, isActive: true } });
    if (!user || user.isActive === false) {
      res.status(401).json({ success: false, message: 'Unauthorized', statusCode: 401 });
      return;
    }
    (req as any).user.role = effectiveRole(user);
    next();
  } catch (err) {
    next(err);
  }
};

/** Allow only the given roles (use after loadCurrentRole) */
export const allowRoles = (roles: Role[]) => (req: Request, res: Response, next: NextFunction): void => {
  const role = (req as any).user?.role;
  if (!roles.includes(role)) {
    res.status(403).json({ success: false, message: 'You do not have access to this section', statusCode: 403 });
    return;
  }
  next();
};
