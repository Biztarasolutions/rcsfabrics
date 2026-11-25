// Utility functions for frontend
// ₹449 for whole rupees, ₹449.10 otherwise (never ₹449.1)
export const formatPrice = (price: number): string => {
  const value = Math.round((Number(price) || 0) * 100) / 100;
  const digits = Number.isInteger(value) ? 0 : 2;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
};

export const calculateDiscount = (original: number, discounted: number): number => {
  return Math.round(((original - discounted) / original) * 100);
};

export const truncateText = (text: string, length: number): string => {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
};

export const capitalizeFirst = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export const generateImageUrl = (path: string): string => {
  if (path.startsWith('http')) return path;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  return `${baseUrl}${path}`;
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export const cn = (...classes: (string | undefined | null | boolean)[]): string => {
  return classes.filter(Boolean).join(' ');
};

type CodeValue = number | string | null | undefined;
const hasCode = (code: CodeValue) => code !== null && code !== undefined && String(code).trim() !== '' && Number(code) !== 0;

/** e.g. 10001 → P10001 (empty when the product has no code) */
export const formatProductCodeSuffix = (code: CodeValue): string => (hasCode(code) ? `P${code}` : '');
const withCode = (code: CodeValue, rest: string) => (hasCode(code) ? `P${code}-${rest}` : rest);

/** Style code: [Code-]Name-Category (e.g. P10001-Polka Dot-Satin, or Polka Dot-Satin) */
export const buildStyleCode = (name: string, categoryName: string, code?: CodeValue): string =>
  withCode(code, `${name.trim()}-${categoryName.trim()}`);

/** Product code: [Code-]Name-Category-Color */
export const buildProductCode = (
  name: string,
  categoryName: string,
  colorName: string,
  code?: CodeValue
): string =>
  withCode(code, `${name.trim()}-${categoryName.trim()}-${colorName.trim()}`);

/**
 * Extracts and cleans the core design/product name by removing category, code and color suffixes.
 * E.g., "Polka Dot-Satin-P10001-White" -> "Polka Dot"
 */
export const extractDesignName = (name: string, categoryName: string, code?: CodeValue): string => {
  let cleaned = name.trim();
  if (!hasCode(code)) return cleaned;
  const suffix = `-${categoryName.trim()}-${formatProductCodeSuffix(code)}`;
  if (cleaned.includes(suffix)) {
    cleaned = cleaned.split(suffix)[0];
  }
  return cleaned.trim();
};

/** Product name with its colour, e.g. "Lachka — Pink" (skips if the name already has it). */
/**
 * Customer-facing title: the design name only, e.g. "Lachka" (never "Lachka — Orange").
 * The colour is shown separately (productColorName). Database names are not changed.
 */
export function productBaseName(product: { name?: string; color?: string | null } | null | undefined): string {
  const name = product?.name?.trim() || '';
  const color = product?.color?.trim();
  if (!color) return name;
  const esc = color.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Drop a trailing colour written as "Name — Colour", "Name - Colour", "Name (Colour)" or "Name Colour"
  const stripped = name.replace(new RegExp(`\\s*(?:[—–-]\\s*|\\(\\s*)?${esc}\\s*\\)?$`, 'i'), '').trim();
  return stripped || name;
}

/** The colour shown under the title */
export const productColorName = (product: { color?: string | null } | null | undefined): string =>
  product?.color?.trim() || '';

/**
 * Name + colour in one string, for places with no separate colour line:
 * WhatsApp messages, image alt text, "added to cart" pop-ups. E.g. "Lachka (Orange)".
 */
export function productDisplayName(product: { name?: string; color?: string | null } | null | undefined): string {
  const base = productBaseName(product);
  const color = productColorName(product);
  return color && color.toLowerCase() !== base.toLowerCase() ? `${base} (${color})` : base;
}
