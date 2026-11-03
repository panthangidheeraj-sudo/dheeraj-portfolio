import type { PriceType, Service, ServicePackage } from './types';

let k = 0;
const P = (name: string, priceType: PriceType, amount: number | null, desc: string, included?: string[], examples?: string[]): ServicePackage => ({
  id: 'pk' + ++k, name, priceType, amount, showPrice: true, desc, included, examples
});

export const services: Service[] = [
  {
    id: 'web', title: 'Web Development', visible: true, cta: 'Discuss this project', img: '', items: [],
    desc: 'Web experiences designed to look refined, work smoothly, and solve real problems.',
    packages: [
      P('Small scale', 'starting', 4000, 'A focused, well-crafted site for a person, a product or a small business.',
        ['Design and build of a responsive website', 'Mobile-friendly layout and basic on-page SEO', 'Contact form or enquiry link', 'Help getting it live'],
        ['Landing pages', 'Personal portfolio websites', 'Basic business websites', 'Simple promotional websites', 'Small informational websites']),
      P('Medium scale', 'starting', null, 'Multi-page sites and web apps with real functionality behind them.',
        ['Planning the pages and features with you', 'Custom design and responsive build', 'Database and backend integration where needed', 'An admin area for managing content, if in scope'],
        ['Multi-page websites', 'Business websites with additional functionality', 'Admin dashboards', 'Booking and enquiry systems', 'Database-connected applications', 'Interactive web experiences']),
      P('Large scale', 'custom', null, 'Full-stack platforms with multiple modules, data and users.',
        ['Scoping and technical planning', 'Full-stack architecture and build', 'Integrations such as payments, APIs and authentication, as required', 'Phased delivery with regular check-ins'],
        ['E-commerce platforms', 'Complex full-stack applications', 'Large management systems', 'Advanced dashboards', 'Multi-module web platforms', 'Custom database-driven applications'])
    ]
  },
  {
    id: 'marketing', title: 'Digital Marketing', visible: true, cta: 'Discuss a campaign', img: '',
    desc: 'Digital presence, creative communication, and campaigns designed to reach the right audience.',
    items: ['Social media content planning', 'Social media management', 'Promotional creative design', 'Brand communication', 'Campaign setup and coordination', 'Digital marketing strategy', 'Online promotional activities'],
    packages: [
      P('Individual task / campaign', 'enquiry', null, 'A single deliverable or one campaign, scoped up front.'),
      P('Monthly support', 'monthly', null, 'Ongoing content and coordination, month to month.'),
      P('Custom marketing requirements', 'custom', null, 'Anything that doesn’t fit the two above.')
    ]
  },
  {
    id: 'ai', title: 'AI & Software', visible: true, cta: 'Discuss an AI / software project', img: '',
    desc: 'Custom digital tools and intelligent applications built to address specific problems.',
    items: ['AI-powered applications', 'AI agents and automation workflows', 'Custom software applications', 'Business management tools', 'Dashboard development', 'Database integration', 'API integration', 'Workflow automation', 'Web-based software systems'],
    pricingNote: 'Every build is quoted individually. Pricing depends on the functionality you need, the integrations involved, the technical complexity and the overall scope.',
    packages: [P('Project-based', 'project', null, '')]
  },
  {
    id: 'hire', title: 'Direct Hiring', visible: true, cta: 'Hire me for a task', img: '',
    desc: 'Need an extra pair of technical hands for a specific task? Hire me directly for scoped development work.',
    items: ['Frontend development', 'Backend development', 'Bug fixing', 'Website modifications', 'Feature implementation', 'API integrations', 'Database-related work', 'Technical troubleshooting', 'Existing project improvements'],
    packages: [
      P('Task-based', 'quote', null, 'A clearly defined task with an agreed scope and quotation before any work starts.'),
      P('Hourly / time-based', 'hourly', null, 'For ongoing or flexible development needs — subject to availability and mutually agreed rates.')
    ]
  },
  {
    id: 'custom', title: 'Custom Projects', visible: true, cta: 'Request a custom quotation', img: '', items: [], packages: [],
    desc: 'Have an unusual idea, an experimental concept, or a project that doesn’t fit into the categories above? Tell me about it. We can discuss the possibilities and work out a suitable approach.'
  }
];

const money = (n: number) => '₹' + Number(n).toLocaleString('en-IN');

// Never invents a number: with no amount set, a sentence is shown instead.
export function priceLabel(p: ServicePackage): { kicker: string; text: string; soft: boolean } {
  if (!p.showPrice) return { kicker: 'Pricing', text: 'Price on enquiry', soft: true };
  const has = p.amount !== null && p.amount !== undefined && !Number.isNaN(p.amount);
  switch (p.priceType) {
    case 'starting': return has ? { kicker: 'Starting at', text: money(p.amount!), soft: false } : { kicker: 'Pricing', text: 'Let’s discuss your requirements', soft: true };
    case 'fixed': return has ? { kicker: 'Fixed price', text: money(p.amount!), soft: false } : { kicker: 'Pricing', text: 'Price on enquiry', soft: true };
    case 'hourly': return has ? { kicker: 'Hourly', text: money(p.amount!) + ' / hour', soft: false } : { kicker: 'Rate', text: 'Rate on request', soft: true };
    case 'monthly': return has ? { kicker: 'Monthly', text: money(p.amount!) + ' / month', soft: false } : { kicker: 'Pricing', text: 'Price on enquiry', soft: true };
    case 'custom': return { kicker: 'Pricing', text: 'Custom quotation', soft: true };
    case 'quote': return { kicker: 'Pricing', text: 'Quoted per task', soft: true };
    case 'project': return { kicker: 'Pricing', text: 'Project-based quotation', soft: true };
    default: return { kicker: 'Pricing', text: 'Price on enquiry', soft: true };
  }
}
