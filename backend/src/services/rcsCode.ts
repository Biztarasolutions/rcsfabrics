import { prisma } from '@/index';

/**
 * Product codes:  RCS-<category number>-<design number>-<Colour>   e.g. RCS-10001-1001-Black
 *  - category number: 10001, 10002 … one per category
 *  - design number:   1001, 1002 … one per product name inside its category (shared by its colours)
 */
const CATEGORY_START = 10001;
const DESIGN_START = 1001;

const norm = (s?: string | null) => (s || '').trim().toLowerCase().replace(/\s+/g, ' ');

/** "polka dot" → "Polka Dot", "SAGE GREEN" → "Sage Green"; mixed-case words (e.g. "McQueen") are kept. */
const capWord = (w: string) => {
  if (!w) return w;
  const allLower = w === w.toLowerCase();
  const allUpper = w === w.toUpperCase();
  return allLower || allUpper ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w;
};
export const properCase = (s: string): string =>
  s.trim().replace(/\s+/g, ' ').split(' ').map((w) => w.split('-').map(capWord).join('-')).join(' ');

/** Colour part of the code: "sage green" → "SageGreen" */
export const colourForCode = (c?: string | null): string =>
  properCase(c || 'Default').replace(/[^A-Za-z0-9]+/g, '') || 'Default';

/** Give every category without a number the next one (oldest first). */
export const ensureCategoryNumbers = async (): Promise<void> => {
  const cats = await prisma.category.findMany({ select: { id: true, codeNumber: true }, orderBy: { createdAt: 'asc' } });
  let next = Math.max(CATEGORY_START - 1, ...cats.map((c) => c.codeNumber || 0)) + 1;
  for (const c of cats) {
    if (c.codeNumber) continue;
    await prisma.category.update({ where: { id: c.id }, data: { codeNumber: next++ } });
  }
};

/**
 * Fills in design numbers and RCS codes for products that are missing them, and refreshes the code
 * when a product's colour or category changed. Safe to run any time.
 */
export const assignRcsCodes = async (): Promise<number> => {
  await ensureCategoryNumbers();
  const [cats, products] = await Promise.all([
    prisma.category.findMany({ select: { id: true, codeNumber: true } }),
    prisma.product.findMany({
      select: { id: true, name: true, categoryId: true, color: true, designNumber: true, rcsCode: true, styleCode: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);
  const catNo = new Map(cats.map((c) => [c.id, c.codeNumber!]));

  // Same name + same category = one design with colour variations, whatever the letter case:
  // use the oldest spelling for all of them so they group together.
  const catNames = new Map((await prisma.category.findMany({ select: { id: true, name: true } })).map((c) => [c.id, c.name.trim()]));
  const canonical = new Map<string, string>();
  for (const p of products) {
    const k = `${p.categoryId}|${norm(p.name)}`;
    if (!canonical.has(k)) canonical.set(k, p.name.trim().replace(/\s+/g, ' '));
  }
  for (const p of products) {
    const name = canonical.get(`${p.categoryId}|${norm(p.name)}`)!;
    const styleCode = `${name}-${catNames.get(p.categoryId) || ''}`;
    if (p.name !== name || p.styleCode !== styleCode) {
      await prisma.product.update({ where: { id: p.id }, data: { name, styleCode } });
      p.name = name;
    }
  }

  // design number per (category, name): reuse the one a colour of that design already has
  const designNo = new Map<string, number>();
  const maxInCat = new Map<string, number>();
  for (const p of products) {
    if (!p.designNumber) continue;
    const k = `${p.categoryId}|${norm(p.name)}`;
    if (!designNo.has(k)) designNo.set(k, p.designNumber);
    maxInCat.set(p.categoryId, Math.max(maxInCat.get(p.categoryId) || 0, p.designNumber));
  }

  const used = new Set(products.map((p) => p.rcsCode).filter(Boolean) as string[]);
  let changed = 0;
  for (const p of products) {
    const k = `${p.categoryId}|${norm(p.name)}`;
    let dn = designNo.get(k);
    if (!dn) {
      dn = Math.max(DESIGN_START - 1, maxInCat.get(p.categoryId) || 0) + 1;
      designNo.set(k, dn);
      maxInCat.set(p.categoryId, dn);
    }
    let code = `RCS-${catNo.get(p.categoryId)}-${dn}-${colourForCode(p.color)}`;
    if (p.rcsCode === code && p.designNumber === dn) continue;
    if (p.rcsCode !== code) {
      if (p.rcsCode) used.delete(p.rcsCode);
      let n = 2;
      const base = code;
      while (used.has(code)) code = `${base}-${n++}`; // same colour twice: keep codes unique
      used.add(code);
    }
    await prisma.product.update({ where: { id: p.id }, data: { designNumber: dn, rcsCode: code } });
    changed++;
  }
  return changed;
};

/** Run after anything that adds or changes products; never fails the request. */
export const refreshRcsCodes = (): void => {
  assignRcsCodes().catch((e) => console.error('[RCS codes] failed:', e));
};
