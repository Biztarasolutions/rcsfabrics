// Mirrors backend/src/utils/roles.ts
export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE' | 'CUSTOMER';

export const ROLE_LABEL: Record<Role, string> = {
  SUPER_ADMIN: 'Super admin',
  ADMIN: 'Admin',
  EMPLOYEE: 'Employee',
  CUSTOMER: 'Customer',
};

/** Can open the admin panel */
export const isStaff = (role?: string | null) => role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'EMPLOYEE';
/** Can see insights: dashboard, orders, customers, analytics */
export const isManager = (role?: string | null) => role === 'SUPER_ADMIN' || role === 'ADMIN';
