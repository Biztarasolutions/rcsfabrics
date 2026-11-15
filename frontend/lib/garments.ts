// "What can I make?" — approximate fabric needed per garment.
//
// Figures are for an average adult size (M) with a simple design, for narrow
// (about 44") and wide (about 58–60") fabric. Rounded up to half-metre steps,
// which is how the shop cuts fabric. Edit the numbers here if your tailors use
// different lengths.

export interface Garment {
  key: string;
  name: string;
  narrow: number; // metres for ~44" fabric
  wide: number;   // metres for 54"+ fabric
  match: RegExp;  // matched against a product's "Best for" list
}

export const GARMENTS: Garment[] = [
  { key: 'kurti',   name: 'Kurti',                 narrow: 2.5, wide: 2,   match: /kurt/i },
  { key: 'shirt',   name: 'Shirt',                 narrow: 2.5, wide: 2,   match: /shirt|uniform/i },
  { key: 'top',     name: 'Top',                   narrow: 1.5, wide: 1,   match: /\btops?\b/i },
  { key: 'dress',   name: 'Dress',                 narrow: 3,   wide: 2,   match: /dress|gown|one.?piece/i },
  { key: 'bottom',  name: 'Pants / palazzo',       narrow: 2.5, wide: 1.5, match: /bottom|pant|palazzo|trouser|skirt/i },
  { key: 'active',  name: 'Leggings / gymwear', narrow: 2,   wide: 1.5, match: /active|legging|gym|sports/i },
  { key: 'blouse',  name: 'Blouse',                narrow: 1,   wide: 1,   match: /blouse/i },
  { key: 'suit',    name: 'Kurta + pant set', narrow: 5, wide: 3.5, match: /suit|salwar|set|co.?ord/i },
];

const DEFAULT_KEYS = ['kurti', 'top', 'dress', 'blouse'];

export function garmentsFor(bestFor: string[] | undefined | null, widthInches: number | undefined | null) {
  const wide = (widthInches || 0) >= 54;
  const list = (bestFor || []).join(' | ');
  let picked = GARMENTS.filter((g) => g.match.test(list));
  if (!picked.length) picked = GARMENTS.filter((g) => DEFAULT_KEYS.includes(g.key));
  return {
    wide,
    widthLabel: widthInches ? `${widthInches}"` : '44"',
    items: picked.slice(0, 6).map((g) => ({ key: g.key, name: g.name, metres: wide ? g.wide : g.narrow })),
  };
}
