/**
 * About Us page content — edit text here without touching the design.
 * Kept short on purpose: the family story, without individual names.
 */

export interface TimelineEntry {
  when: string;
  title: string;
  text: string;
  photo?: string;
  photoAlt?: string;
}

export const ABOUT = {
  meta: {
    title: 'About Us — A Family Fabric Legacy Since 1962',
    description:
      'RCS Fabrics is a family-owned fabric business from Dimapur, Nagaland, founded in 1962 and now carried forward by the third generation.',
  },

  hero: {
    eyebrow: 'Since 1962 · Dimapur, Nagaland · India',
    title: 'A Legacy Woven Through Generations.',
    subtitle: 'Three generations. Decades of fabric expertise. One family passion.',
    image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1800&q=75',
    imageAlt: 'Close-up of rolls of richly textured fabric',
  },

  story: {
    eyebrow: 'Our Story',
    title: 'Three Generations of Fabric Expertise',
    paragraphs: [
      'RCS Fabrics is a family-owned fabric business with roots going back to 1962 in Dimapur, Nagaland.',
      'It began as a small fabric store with a modest collection and a simple vision: quality fabrics and trustworthy service.',
      'The next generation grew it — more variety, imported and premium collections, and customer relationships that have lasted for decades.',
      'Today the third generation is taking that same store online, combining decades of fabric knowledge with modern technology so customers, designers and boutiques across India and beyond can shop our collections.',
    ],
    pullQuote: 'A simple vision: quality fabrics and trustworthy service.',
  },

  journey: {
    eyebrow: 'Our Journey',
    title: 'A Family Legacy Since 1962',
    entries: [
      { when: '1962', title: 'The Beginning', text: 'A small fabric store opens in Dimapur, Nagaland, built on quality and trust.' },
      { when: 'The Next Generation', title: 'Expansion', text: 'The collection grows with more varieties, imported fabrics and premium-quality materials.' },
      { when: 'Today', title: 'A New Chapter', text: 'The third generation brings the family’s expertise online, to customers everywhere.' },
    ] as TimelineEntry[],
  },

  closing: {
    title: 'Rooted in Tradition. Inspired by the Future.',
    paragraphs: [
      'Every fabric we offer carries the knowledge passed down through our family since 1962. We invite you to become a part of our story.',
    ],
    cta: { label: 'Explore Our Collection', href: '/fabrics' },
  },
};
