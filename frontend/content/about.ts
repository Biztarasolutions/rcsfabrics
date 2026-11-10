/**
 * About Us page content — edit text here without touching the design.
 *
 * PHOTOS: put real photos in /frontend/public/about/ and set `photo` to the
 * path, e.g. photo: '/about/rajesh-rashmi.jpg'. While `photo` is empty, a
 * monogram placeholder is shown (never a stock photo of strangers).
 * Recommended: portraits 800×1000 (4:5), timeline/store photos 1200×800.
 */

export interface FamilyMember {
  name: string;
  role: string;
  initials: string;
  photo?: string;
  photoAlt?: string;
  paragraphs: string[];
  focus: string[];
}

export interface TimelineEntry {
  when: string;
  title: string;
  text: string;
  photo?: string;
  photoAlt?: string;
}

export const ABOUT = {
  meta: {
    title: 'About Us — A Family Fabric Legacy Since 1970',
    description:
      'RCS Fabrics is a family-owned fabric business from Dimapur, Nagaland, founded in 1970 and now carried forward by the third generation of the Kashliwal family.',
  },

  hero: {
    eyebrow: 'Since 1970 · Dimapur, Nagaland · India',
    title: 'A Legacy Woven Through Generations.',
    subtitle: 'Three generations. Decades of fabric expertise. One family passion.',
    image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1800&q=75',
    imageAlt: 'Close-up of rolls of richly textured fabric',
  },

  story: {
    eyebrow: 'Our Story',
    title: 'Three Generations of Fabric Expertise',
    paragraphs: [
      'RCS Fabrics is a family-owned fabric business with roots dating back to 1970 in Dimapur, Nagaland, India.',
      'Our journey began with our grandfather, Late Kundanmal Kashliwal, who established our family’s offline fabric store with a modest collection and a simple vision: to provide customers with quality fabrics and trustworthy service.',
      'The business was later carried forward by our father, Rajesh Kashliwal, alongside our mother, Rashmi Kashliwal. Together, they expanded the business, introduced a wider variety of fabrics, and brought imported and premium-quality collections to their customers. Through their dedication, customer relationships and understanding of fabrics, they took the family business to the next level.',
      'Today, the third generation — Rishabh and Mayank Kashliwal — is taking this legacy forward. Mayank is leading the expansion of our traditional offline fabric business into the online world, bringing our family’s carefully selected collections to a much wider audience. Rishabh, with an engineering background, is building and managing the technology and digital infrastructure that supports this vision.',
      'Together, we are combining decades of traditional fabric knowledge with modern technology to make our collections accessible to customers, designers, boutiques and businesses across India and around the globe.',
    ],
    pullQuote: 'A simple vision: quality fabrics and trustworthy service.',
    generations: [
      { label: 'First generation', names: 'Late Kundanmal Kashliwal' },
      { label: 'Second generation', names: 'Rajesh & Rashmi Kashliwal' },
      { label: 'Third generation', names: 'Rishabh, Rishika & Mayank Kashliwal' },
    ],
  },

  family: {
    eyebrow: 'The People',
    title: 'Meet the Family Behind RCS Fabrics',
    members: [
      {
        name: 'Rajesh & Rashmi Kashliwal',
        role: 'The Experience and Foundation',
        initials: 'R&R',
        photo: '',
        photoAlt: 'Rajesh and Rashmi Kashliwal',
        paragraphs: [
          'The people who expanded our family business and built its foundation through years of dedication, customer relationships and a deep understanding of quality fabrics.',
          'Their commitment to bringing more variety, imported fabrics and premium-quality collections shaped the business we are proud of today.',
        ],
        focus: ['Fabric knowledge', 'Customer relationships', 'Premium & imported collections'],
      },
      {
        name: 'Rishabh Kashliwal',
        role: 'Technology & Digital Development',
        initials: 'RK',
        photo: '',
        photoAlt: 'Rishabh Kashliwal',
        paragraphs: [
          'With an engineering background, Rishabh leads the technical side of RCS Fabrics.',
          'He is responsible for building and managing the website, digital infrastructure and technology that create a seamless online shopping experience and support the business’s future growth.',
        ],
        focus: ['Website', 'Digital infrastructure', 'Technology'],
      },
      {
        name: 'Rishika Kashliwal',
        role: 'Design & Creative Direction',
        initials: 'RK',
        photo: '',
        photoAlt: 'Rishika Kashliwal',
        paragraphs: [
          'Rishika brings a creative perspective to RCS Fabrics, focusing on fabric styling, design inspiration and the visual presentation of our collections.',
          'She helps showcase the beauty and versatility of fabrics through creative ideas and thoughtful styling.',
        ],
        focus: ['Fabric styling', 'Design inspiration', 'Visual presentation'],
      },
      {
        name: 'Mayank Kashliwal',
        role: 'Customer Experience, Operations & Digital Expansion',
        initials: 'MK',
        photo: '',
        photoAlt: 'Mayank Kashliwal',
        paragraphs: [
          'Mayank manages customer interactions and inventory, bringing personal attention and traditional customer service to every interaction.',
          'He also plays a key role in bringing the family’s traditional offline fabric business into the online world, making our collections accessible to a much wider audience and taking our family legacy beyond the boundaries of our physical store.',
        ],
        focus: ['Customer interactions', 'Inventory', 'Taking the store online'],
      },
    ] as FamilyMember[],
  },

  journey: {
    eyebrow: 'Our Journey',
    title: 'A Family Legacy Since 1970',
    entries: [
      {
        when: '1970',
        title: 'The Beginning',
        text: 'Our grandfather, Late Kundanmal Kashliwal, establishes the family fabric business in Dimapur, Nagaland, starting with a modest collection and a commitment to quality and trust.',
        photo: '',
        photoAlt: 'The family fabric store in its early years',
      },
      {
        when: 'The Next Generation',
        title: 'Expansion',
        text: 'Rajesh and Rashmi carry the business forward, expanding the collection with more varieties, imported fabrics and premium-quality materials while building lasting customer relationships.',
        photo: '',
        photoAlt: 'The store as the collection expanded',
      },
      {
        when: 'Today',
        title: 'A New Chapter',
        text: 'Rishabh and Mayank bring the family’s expertise into the digital era through RCS Fabrics, combining traditional fabric knowledge, business experience and modern technology with a vision to reach customers worldwide.',
        photo: '',
        photoAlt: 'RCS Fabrics today',
      },
    ] as TimelineEntry[],
  },

  philosophy: {
    eyebrow: 'Our Philosophy',
    title: 'More Than Fabrics. A Legacy of Trust.',
    paragraphs: [
      'We believe that choosing fabric is personal. Every material has its own character, every colour tells a story, and every creation begins with the right fabric.',
      'Our goal is to bring together quality, variety, honest service and decades of experience so that customers can find fabrics they truly love.',
      'For us, every customer relationship matters, and every fabric we offer carries a part of the knowledge and experience passed down through our family.',
    ],
  },

  world: {
    eyebrow: 'From Dimapur to the World',
    quote: 'Our roots are in Dimapur. Our vision has no boundaries.',
    text: 'From a traditional offline fabric store in Dimapur to an online fabric destination — we want to share our family’s fabric expertise and carefully selected collections with customers, designers, boutiques and businesses across India and around the world.',
  },

  closing: {
    title: 'Rooted in Tradition. Inspired by the Future.',
    paragraphs: [
      'For us, RCS Fabrics is more than an online store. It is the continuation of a family journey that began in 1970.',
      'From our grandfather’s first fabric collection to the expanded collections of the next generation, and now to our digital presence, the passion for fabrics continues.',
      'We invite you to become a part of our story.',
    ],
    cta: { label: 'Explore Our Collection', href: '/products' },
  },
};
