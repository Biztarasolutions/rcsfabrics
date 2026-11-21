// Fabric estimator: how many metres to buy for a garment.
//
// Every base figure is for an average adult (size M, average height) with 3/4 sleeves
// on 44-inch fabric, rounded the way a tailor would ask for it. Adjustments below scale it
// for size, height, sleeves, fabric width and big prints. Edit the numbers here if your
// tailors use different lengths — the page updates itself.

export type Who = 'women' | 'men' | 'kids';

export interface Style { key: string; label: string; hint?: string; metres: number }
export interface Garment {
  key: string;
  label: string;
  hint: string;
  styles: Style[];
  /** Ask about sleeves (and add or remove fabric for them) */
  sleeves?: boolean;
  /** Ask the wearer's size (kids: age) — false for things like a saree */
  sized?: boolean;
  /** Long garments use more fabric for tall wearers */
  long?: boolean;
}

export const GARMENTS: Record<Who, Garment[]> = {
  women: [
    { key: 'kurti', label: 'Kurti / Kurta', hint: 'Straight, A-line, Anarkali…', sleeves: true, sized: true, long: true, styles: [
      { key: 'short', label: 'Short kurti', hint: 'Hip length', metres: 2 },
      { key: 'straight', label: 'Straight kurta', hint: 'Knee length', metres: 2.5 },
      { key: 'aline', label: 'A-line', hint: 'Gently flared', metres: 3 },
      { key: 'flared', label: 'Flared / umbrella', hint: 'Lots of flare', metres: 3.5 },
      { key: 'anarkali', label: 'Anarkali', hint: 'Full flare, long', metres: 4.5 },
    ] },
    { key: 'suit', label: 'Suit set', hint: 'Kurta with pants', sleeves: true, sized: true, long: true, styles: [
      { key: 'straight-pant', label: 'Kurta + straight pants', metres: 4.5 },
      { key: 'palazzo', label: 'Kurta + palazzo', metres: 5 },
      { key: 'salwar', label: 'Kurta + salwar', metres: 5.5 },
      { key: 'patiala', label: 'Kurta + patiala', metres: 6.5 },
    ] },
    { key: 'top', label: 'Top', hint: 'Crop, regular, tunic', sleeves: true, sized: true, styles: [
      { key: 'crop', label: 'Crop top', metres: 1.25 },
      { key: 'regular', label: 'Regular top', metres: 1.5 },
      { key: 'tunic', label: 'Tunic', hint: 'Mid-thigh', metres: 2 },
      { key: 'shirt', label: 'Shirt', metres: 2 },
    ] },
    { key: 'dress', label: 'Dress', hint: 'Bodycon to maxi', sleeves: true, sized: true, long: true, styles: [
      { key: 'bodycon', label: 'Bodycon / sheath', metres: 2 },
      { key: 'aline', label: 'A-line', metres: 2.5 },
      { key: 'shirt', label: 'Shirt dress', metres: 2.75 },
      { key: 'skater', label: 'Skater / fit and flare', metres: 3 },
      { key: 'maxi', label: 'Maxi', metres: 3.5 },
      { key: 'gown', label: 'Gown', hint: 'Full flare, floor length', metres: 4.5 },
    ] },
    { key: 'bottom', label: 'Bottom wear', hint: 'Pants, palazzo, skirt', sized: true, long: true, styles: [
      { key: 'straight', label: 'Straight / cigarette pants', metres: 2 },
      { key: 'palazzo', label: 'Palazzo', metres: 2.5 },
      { key: 'salwar', label: 'Salwar', metres: 3 },
      { key: 'patiala', label: 'Patiala', metres: 4 },
      { key: 'skirt-a', label: 'A-line skirt', metres: 2 },
      { key: 'skirt-flared', label: 'Flared / tiered skirt', metres: 3 },
    ] },
    { key: 'coord', label: 'Co-ord set', hint: 'Top with matching pants', sleeves: true, sized: true, long: true, styles: [
      { key: 'shirt-pant', label: 'Shirt + pants', metres: 3.5 },
      { key: 'top-palazzo', label: 'Top + palazzo', metres: 4 },
    ] },
    { key: 'blouse', label: 'Blouse', hint: 'Saree blouse', sized: true, styles: [
      { key: 'regular', label: 'Regular blouse', metres: 1 },
      { key: 'designer', label: 'Designer / long sleeves', metres: 1.5 },
    ] },
    { key: 'saree', label: 'Saree / Dupatta', hint: 'One length', styles: [
      { key: 'saree', label: 'Saree', metres: 5.5 },
      { key: 'saree-blouse', label: 'Saree with blouse piece', metres: 6.5 },
      { key: 'dupatta', label: 'Dupatta', metres: 2.5 },
    ] },
  ],
  men: [
    { key: 'shirt', label: 'Shirt', hint: 'Half or full sleeves', sleeves: true, sized: true, styles: [
      { key: 'regular', label: 'Regular fit shirt', metres: 2 },
      { key: 'slim', label: 'Slim fit shirt', metres: 1.75 },
    ] },
    { key: 'kurta', label: 'Kurta', hint: 'Short or long', sleeves: true, sized: true, long: true, styles: [
      { key: 'short', label: 'Short kurta', metres: 2.25 },
      { key: 'long', label: 'Long kurta', metres: 2.75 },
      { key: 'set', label: 'Kurta + pyjama', metres: 5 },
    ] },
    { key: 'trouser', label: 'Trousers / Pyjama', hint: 'Pants, pyjama, shorts', sized: true, long: true, styles: [
      { key: 'trouser', label: 'Trousers', metres: 1.5 },
      { key: 'pyjama', label: 'Pyjama', metres: 2.5 },
      { key: 'shorts', label: 'Shorts', metres: 1 },
    ] },
    { key: 'jacket', label: 'Nehru jacket', hint: 'Sleeveless jacket', sized: true, styles: [
      { key: 'nehru', label: 'Nehru jacket / koti', metres: 1.5 },
    ] },
  ],
  kids: [
    { key: 'frock', label: 'Frock / Dress', hint: 'For girls', sleeves: true, sized: true, styles: [
      { key: 'simple', label: 'Simple frock', metres: 1.5 },
      { key: 'flared', label: 'Flared / layered frock', metres: 2.5 },
    ] },
    { key: 'top', label: 'Top / Shirt', hint: 'Boys or girls', sleeves: true, sized: true, styles: [
      { key: 'top', label: 'Top or shirt', metres: 1.25 },
    ] },
    { key: 'kurta', label: 'Kurta set', hint: 'Kurta with pants', sleeves: true, sized: true, styles: [
      { key: 'kurta', label: 'Kurta only', metres: 1.25 },
      { key: 'set', label: 'Kurta + pants', metres: 2.25 },
    ] },
    { key: 'bottom', label: 'Pants / Skirt', hint: 'Bottom wear', sized: true, styles: [
      { key: 'pants', label: 'Pants', metres: 1 },
      { key: 'skirt', label: 'Skirt', metres: 1 },
    ] },
  ],
};

export const ADULT_SIZES = [
  { key: 'xs', label: 'XS', factor: 0.9 },
  { key: 's', label: 'S', factor: 0.95 },
  { key: 'm', label: 'M', factor: 1 },
  { key: 'l', label: 'L', factor: 1.05 },
  { key: 'xl', label: 'XL', factor: 1.15 },
  { key: 'xxl', label: 'XXL', factor: 1.25 },
  { key: '3xl', label: '3XL', factor: 1.35 },
];
// Kids' base figures are for about 6 years
export const KID_AGES = [
  { key: '1-3', label: '1–3 years', factor: 0.6 },
  { key: '4-7', label: '4–7 years', factor: 1 },
  { key: '8-12', label: '8–12 years', factor: 1.4 },
];
export const HEIGHTS = [
  { key: 'petite', label: 'Under 5′2″', add: -0.15 },
  { key: 'average', label: '5′2″ – 5′7″', add: 0 },
  { key: 'tall', label: 'Over 5′7″', add: 0.3 },
];
export const SLEEVES = [
  { key: 'none', label: 'Sleeveless', add: -0.25 },
  { key: 'short', label: 'Short / half', add: -0.1 },
  { key: 'three-quarter', label: '3/4 sleeves', add: 0 },
  { key: 'full', label: 'Full sleeves', add: 0.25 },
];
export const WIDTHS = [
  { key: '36', label: '36″ or less', hint: 'Narrow', factor: 1.2 },
  { key: '44', label: '42–46″', hint: 'Most dress fabrics', factor: 1 },
  { key: '58', label: '54–60″', hint: 'Wide', factor: 0.75 },
];

/** Pick the width option that fits a fabric's width in inches */
export const widthKeyFor = (inches?: number | null): string =>
  !inches ? '44' : inches <= 38 ? '36' : inches >= 52 ? '58' : '44';

export interface Answers {
  who?: Who; garment?: string; style?: string; size?: string; height?: string;
  sleeves?: string; width?: string; bigPrint?: boolean;
}

const roundUpHalf = (m: number) => Math.ceil(m * 2 - 1e-9) / 2;

/** Metres to buy (rounded up to the shop's 0.5 m steps) and the parts that made it up */
export function estimate(a: Answers) {
  const g = (a.who && GARMENTS[a.who].find((x) => x.key === a.garment)) || null;
  const st = g?.styles.find((s) => s.key === a.style) || null;
  if (!g || !st) return null;
  const sizeF = !g.sized ? 1 : a.who === 'kids'
    ? (KID_AGES.find((s) => s.key === a.size)?.factor ?? 1)
    : (ADULT_SIZES.find((s) => s.key === a.size)?.factor ?? 1);
  const heightAdd = g.long && a.who !== 'kids' ? (HEIGHTS.find((h) => h.key === a.height)?.add ?? 0) : 0;
  const sleeveAdd = g.sleeves ? (SLEEVES.find((s) => s.key === a.sleeves)?.add ?? 0) * (a.who === 'kids' ? 0.5 : 1) : 0;
  const widthF = WIDTHS.find((w) => w.key === a.width)?.factor ?? 1;
  const printAdd = a.bigPrint ? 0.25 : 0;

  const raw = Math.max(0.5, (st.metres * sizeF + heightAdd + sleeveAdd) * widthF + printAdd);
  // A range, not one number: cuts, fit and tailors differ. The upper end leaves room for
  // fitting and mistakes; bigger garments get a wider margin.
  const low = roundUpHalf(raw);
  const high = low + (low >= 4 ? 1 : 0.5);
  return { low, high, garment: g, style: st };
}
