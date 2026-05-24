import { v4 as uuidv4 } from 'uuid';

export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

export const generateSKU = (prefix: string): string => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
};

export const generateUUID = (): string => {
  return uuidv4();
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

export const getInitials = (firstName: string, lastName?: string): string => {
  const first = firstName[0]?.toUpperCase() || '';
  const last = lastName?.[0]?.toUpperCase() || '';
  return (first + last).slice(0, 2);
};

export const truncateString = (str: string, length: number): string => {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
};

/** e.g. 10001 → P10001 */
export const formatProductCodeSuffix = (code: number | string): string => `P${code}`;

/** Style code: Name-Category-Code (e.g. Polka Dot-Satin-P10001) */
export const buildStyleCode = (name: string, categoryName: string, code: number | string): string =>
  `${name.trim()}-${categoryName.trim()}-${formatProductCodeSuffix(code)}`;

/** Product code: Name-Category-Color-Code (e.g. Polka Dot-Satin-White-P10001) */
export const buildProductCode = (
  name: string,
  categoryName: string,
  colorName: string,
  code: number | string
): string =>
  `${name.trim()}-${categoryName.trim()}-${colorName.trim()}-${formatProductCodeSuffix(code)}`;
