import { prisma } from '@/index';
import { listProductFolders, folderHasFabricPhotos, folderUrlFromId } from '@/utils/googleDrive.util';
import { buildProductCode, buildStyleCode, generateSlug } from '@/utils/string.util';

export interface ParsedFolder { folderId: string; folderName: string; code: number; design: string; categoryId: string; categoryName: string; color: string }

/**
 * "P10001-Polka Dot-Satin-White" → code 10001, design "Polka Dot", category Satin, colour "White".
 * The category is found by name, so designs and colours may contain hyphens.
 */
export const parseColourFolder = (name: string, categories: Array<{ id: string; name: string }>): Omit<ParsedFolder, 'folderId'> | null => {
  const m = name.trim().match(/^P(\d+)-(.+)$/i);
  if (!m) return null;
  const rest = m[2];
  // longest category name first (e.g. "Cotton Silk" before "Silk")
  const cats = [...categories].sort((a, b) => b.name.length - a.name.length);
  for (const c of cats) {
    const marker = `-${c.name.trim().toLowerCase()}-`;
    const at = rest.toLowerCase().lastIndexOf(marker);
    if (at <= 0) continue;
    const design = rest.slice(0, at).trim();
    const color = rest.slice(at + marker.length).trim();
    if (!design || !color) continue;
    return { folderName: name.trim(), code: Number(m[1]), design, categoryId: c.id, categoryName: c.name.trim(), color };
  }
  return null;
};

export interface ImportResult {
  created: string[];
  waitingForPhotos: string[];
  unknownCategory: string[];
}

/**
 * Looks through Drive for colour folders (with finished Fabric photos) that are not in the shop yet
 * and adds each as a DRAFT: hidden from customers, price / width / stock left empty for the admin.
 */
export const importFabricsFromDrive = async (limit = 40): Promise<ImportResult> => {
  const [folders, categories, products] = await Promise.all([
    listProductFolders(),
    prisma.category.findMany({ select: { id: true, name: true } }),
    prisma.product.findMany({ select: { productCode: true, slug: true, code: true, name: true, categoryId: true, color: true } }),
  ]);
  const norm = (s?: string | null) => (s || '').trim().toLowerCase().replace(/\s+/g, ' ');
  // Already in the shop if the product code matches, or the same design + category + colour + code
  // exists (older products use codes like "Polka Dot-Satin-P10001-White")
  const have = new Set(products.map((p) => norm(p.productCode)));
  const sameFabric = new Set(products.map((p) => [p.code, norm(p.name), p.categoryId, norm(p.color)].join('|')));
  const slugs = new Set(products.map((p) => p.slug));
  const result: ImportResult = { created: [], waitingForPhotos: [], unknownCategory: [] };
  const seen = new Set<string>();

  for (const f of folders) {
    if (result.created.length >= limit) break;
    const parsed = parseColourFolder(f.name, categories);
    if (!parsed) {
      // design-level folders like "P10001-Satin" have only two parts; report only colour-looking names
      if (f.name.split('-').length >= 4) result.unknownCategory.push(f.name);
      continue;
    }
    const productCode = buildProductCode(parsed.design, parsed.categoryName, parsed.color, parsed.code);
    const key = norm(productCode);
    const fabricKey = [parsed.code, norm(parsed.design), parsed.categoryId, norm(parsed.color)].join('|');
    if (have.has(key) || seen.has(key) || sameFabric.has(fabricKey)) continue;
    seen.add(key);
    if (!(await folderHasFabricPhotos(f.id))) { result.waitingForPhotos.push(f.name); continue; }

    const slug = generateSlug(productCode);
    if (slugs.has(slug)) continue;
    const folderUrl = folderUrlFromId(f.id);
    await prisma.product.create({
      data: {
        name: parsed.design,
        slug,
        categoryId: parsed.categoryId,
        code: parsed.code,
        styleCode: buildStyleCode(parsed.design, parsed.categoryName, parsed.code),
        productCode,
        color: parsed.color,
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
    sameFabric.add(fabricKey);
    result.created.push(productCode);
  }
  return result;
};
