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

/** Product code: Name-Category-Code-Color (e.g. Polka Dot-Satin-P10001-White) */
export const buildProductCode = (
  name: string,
  categoryName: string,
  colorName: string,
  code: number | string
): string =>
  `${name.trim()}-${categoryName.trim()}-${formatProductCodeSuffix(code)}-${colorName.trim()}`;

/** Legacy style code: 101-SAT-POL */
export const buildLegacyStyleCode = (
  code: number | string,
  categoryName: string,
  productName: string
): string => {
  const catStr = categoryName.trim().substring(0, 3).toUpperCase() || 'UNK';
  const patStr = productName.trim().substring(0, 3).toUpperCase() || 'UNK';
  return `${code}-${catStr}-${patStr}`;
};

/** Legacy product code: 101-SAT-POL-WHI */
export const buildLegacyProductCode = (legacyStyle: string, colorName: string): string =>
  `${legacyStyle}-${colorName.trim().substring(0, 3).toUpperCase()}`;

/** Candidate Drive folder names to try (new + legacy formats). */
export const getDriveFolderNameCandidates = (opts: {
  name: string;
  categoryName: string;
  code: number | string;
  colorName?: string;
}): string[] => {
  const { name, categoryName, code, colorName } = opts;
  const seen = new Set<string>();
  const add = (value?: string) => {
    const trimmed = value?.trim();
    if (trimmed) seen.add(trimmed);
  };

  const style = buildStyleCode(name, categoryName, code);
  const legacyStyle = buildLegacyStyleCode(code, categoryName, name);

  add(style);
  add(legacyStyle);
  add(formatProductCodeSuffix(code));
  add(String(code));

  if (colorName) {
    add(buildProductCode(name, categoryName, colorName, code));
    add(buildLegacyProductCode(legacyStyle, colorName));
  }

  return [...seen];
};

/**
 * Extracts and cleans the core design/product name by removing category, code and color suffixes.
 * E.g., "Polka Dot-Satin-P10001-White" -> "Polka Dot"
 */
export const extractDesignName = (name: string, categoryName: string, code: number | string): string => {
  let cleaned = name.trim();
  const suffix = `-${categoryName.trim()}-${formatProductCodeSuffix(code)}`;
  if (cleaned.includes(suffix)) {
    cleaned = cleaned.split(suffix)[0];
  }
  return cleaned.trim();
};

