import { prisma } from '@/index';
import { listAllFolders, folderHasFabricPhotos, folderUrlFromId } from '@/utils/googleDrive.util';
import { buildProductCode, buildStyleCode, generateSlug } from '@/utils/string.util';
import { properCase } from '@/services/rcsCode';

type Cat = { id: string; name: string };
export interface ParsedFolder { name: string; color: string; categoryId: string; categoryName: string; code: number | null }

const norm = (s?: string | null) => (s || '').trim().toLowerCase().replace(/\s+/g, ' ');

/**
 * Product folder inside a category folder → name + colour, written properly:
 *   "Polka Dot-White", "polka dot - white", "polka dot, white"  →  "Polka Dot" / "White"
 * The colour is the part after the LAST comma (or, if there is no comma, the last hyphen).
 */
export const parseProductFolder = (folderName: string, cat: Cat): ParsedFolder | null => {
  const raw = folderName.trim();
  const sep = raw.includes(',') ? ',' : '-';
  const at = raw.lastIndexOf(sep);
  if (at <= 0 || at === raw.length - 1) return null;
  const name = properCase(raw.slice(0, at).replace(/[-,]+$/, ''));
  const color = properCase(raw.slice(at + 1).replace(/^[-,]+/, ''));
  if (!name || !color) return null;
  return { name, color, categoryId: cat.id, categoryName: cat.name.trim(), code: null };
};

/** Older structure, still understood: "P10001-Polka Dot-Satin-White" */
export const parseCodedFolder = (folderName: string, categories: Cat[]): ParsedFolder | null => {
  const m = folderName.trim().match(/^P(\d+)-(.+)$/i);
  if (!m) return null;
  const rest = m[2];
  const cats = [...categories].sort((a, b) => b.name.length - a.name.length);
  for (const c of cats) {
    const marker = `-${c.name.trim().toLowerCase()}-`;
    const at = rest.toLowerCase().lastIndexOf(marker);
    if (at <= 0) continue;
    const name = rest.slice(0, at).trim();
    const color = rest.slice(at + marker.length).trim();
    if (name && color) return { name: properCase(name), color: properCase(color), categoryId: c.id, categoryName: c.name.trim(), code: Number(m[1]) };
  }
  return null;
};

export interface ImportResult {
  created: string[];
  waitingForPhotos: string[];
  notUnderstood: string[];
}

/**
 * Photoshoot structure:  <Category folder, e.g. "Satin"> / <"Name-Colour" folder> / Fabric-1, Fabric-2, …
 * Every product folder with finished Fabric photos that is not in the shop yet becomes a DRAFT:
 * hidden from customers, name / category / colour / description filled in, price · width · stock left empty.
 * Run by the admin from Admin → Products → Import from Drive.
 */
export const importFabricsFromDrive = async (limit = 40): Promise<ImportResult> => {
  const [folders, categories, products] = await Promise.all([
    listAllFolders(),
    prisma.category.findMany({ select: { id: true, name: true, description: true, bestFor: true, properties: true } }),
    prisma.product.findMany({ select: { productCode: true, slug: true, name: true, categoryId: true, color: true } }),
  ]);

  const catByName = new Map(categories.map((c) => [norm(c.name), c]));
  const catFolders = new Map<string, Cat>(); // folder id → category
  for (const f of folders) {
    const c = catByName.get(norm(f.name));
    if (c) catFolders.set(f.id, c);
  }

  // The same fabric = same name + category + colour (any code, any spelling of spaces/case)
  const keyOf = (name: string, categoryId: string, color: string) => [norm(name), categoryId, norm(color)].join('|');
  // "Polka Dot Poplin" in Poplin is the same design as a folder named "Polka Dot"
  const catName = new Map(categories.map((c) => [c.id, norm(c.name)]));
  const withoutCategory = (name: string, categoryId: string) => {
    const n = norm(name); const c = catName.get(categoryId) || '';
    return c && n.endsWith(` ${c}`) ? n.slice(0, -c.length - 1) : n;
  };
  const have = new Set<string>();
  for (const p of products) {
    have.add(keyOf(p.name, p.categoryId, p.color));
    have.add(keyOf(withoutCategory(p.name, p.categoryId), p.categoryId, p.color));
  }
  const codes = new Set(products.map((p) => norm(p.productCode)));
  const slugs = new Set(products.map((p) => p.slug));
  const result: ImportResult = { created: [], waitingForPhotos: [], notUnderstood: [] };

  for (const f of folders) {
    if (result.created.length >= limit) break;
    const parentCat = f.parents.map((id) => catFolders.get(id)).find(Boolean);
    let parsed: ParsedFolder | null = null;
    if (parentCat) {
      parsed = parseProductFolder(f.name, parentCat);
      if (!parsed) { result.notUnderstood.push(`${parentCat.name} / ${f.name}`); continue; }
    } else if (/^P\d+-/i.test(f.name)) {
      parsed = parseCodedFolder(f.name, categories);
      if (!parsed) continue;
    } else continue;

    const key = keyOf(parsed.name, parsed.categoryId, parsed.color);
    const productCode = buildProductCode(parsed.name, parsed.categoryName, parsed.color, parsed.code);
    if (have.has(key) || codes.has(norm(productCode))) continue;
    if (!(await folderHasFabricPhotos(f.id))) { result.waitingForPhotos.push(f.name); continue; }

    const slug = generateSlug(productCode);
    if (slugs.has(slug)) continue;
    const cat = categories.find((c) => c.id === parsed!.categoryId)!;
    const folderUrl = folderUrlFromId(f.id);
    await prisma.product.create({
      data: {
        name: parsed.name,
        slug,
        categoryId: parsed.categoryId,
        code: parsed.code,
        styleCode: buildStyleCode(parsed.name, parsed.categoryName, parsed.code),
        productCode,
        color: parsed.color,
        // category information
        description: cat.description || null,
        bestFor: cat.bestFor || [],
        properties: cat.properties || [],
        // for the admin to fill in
        basePrice: 0,
        width: 0,
        pattern: '',
        stretchability: 'Non-Stretch',
        totalStock: 0,
        isActive: false,
        isDraft: true,
        folderUrl,
        colors: { create: [{ name: parsed.color, hexCode: '#cccccc', productCode, folderUrl }] },
      },
    });
    slugs.add(slug);
    have.add(key);
    codes.add(norm(productCode));
    result.created.push(`${parsed.name} (${parsed.color}) · ${parsed.categoryName}`);
  }
  return result;
};
