// Content model shared by the public pages and the admin dashboard.
// When a backend is added, these become the database tables.

export type Ratio = '9:16' | '1:1' | '16:9';
export type CategoryKey = 'software' | 'ai' | 'engineering' | 'design' | 'entrepreneurship';

export interface Project {
  id: string;
  slug: string;
  title: string;
  short: string;
  overview: string;
  categories: CategoryKey[];
  tech: string[];
  cover: string;
  alt: string;
  ratio: Ratio;
  size: 'm' | 'l';
  role: string;
  links: { github: string; live: string };
  cs: { problem?: string; approach?: string; architecture?: string; challenges?: string; outcomes?: string };
  media: { src: string; ratio: Ratio; kind: 'image' | 'video' }[];
  featured: boolean;
  published: boolean;
  order: number;
}

export type StandType = 'vitrine' | 'monument' | 'wall' | 'case' | 'floating';
export type AchievementCategory = 'academic' | 'hackathons' | 'certifications' | 'engineering' | 'recognition' | 'milestones';

export interface Achievement {
  id: string;
  title: string;
  org: string;
  date: string;
  category: AchievementCategory;
  description: string;
  cert: string;
  pdf: string;
  verify: string;
  photos: string[];
  type: StandType;
  object?: 'chip' | 'auger' | 'vessel' | 'prism';
  room: 1 | 2;
  x: number;
  z: number;
  rot: number;
  size: number;
  light: number;
  featured: boolean;
  published: boolean;
  order: number;
}

export type PriceType = 'starting' | 'fixed' | 'hourly' | 'monthly' | 'custom' | 'enquiry' | 'quote' | 'project';

export interface ServicePackage {
  id: string;
  name: string;
  priceType: PriceType;
  amount: number | null;
  showPrice: boolean;
  desc: string;
  included?: string[];
  examples?: string[];
}

export interface Service {
  id: 'web' | 'marketing' | 'ai' | 'hire' | 'custom' | string;
  title: string;
  visible: boolean;
  cta: string;
  desc: string;
  items: string[];
  img: string;
  pricingNote?: string;
  packages: ServicePackage[];
}

export interface ContactChannel {
  key: 'email' | 'linkedin' | 'github' | 'instagram';
  label: string;
  note: string;
  value: string;
  enabled: boolean;
}

export interface SiteSettings {
  introHeading: string;
  introText: string;
  closingHeading: string;
  closingText: string;
  channels: ContactChannel[];
}

export interface Content {
  projects: Project[];
  achievements: Achievement[];
  services: Service[];
  site: SiteSettings;
}
