// Utility functions for frontend
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
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
