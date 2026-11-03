import type { CategoryKey, Project } from './types';

export const projectCategories: { key: 'all' | CategoryKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'software', label: 'Software' },
  { key: 'ai', label: 'AI & ML' },
  { key: 'engineering', label: 'Engineering' },
  { key: 'design', label: 'Design' },
  { key: 'entrepreneurship', label: 'Entrepreneurship' }
];

const P = (p: Partial<Project> & Pick<Project, 'id' | 'slug' | 'title' | 'short' | 'cover' | 'ratio'>, order: number): Project => ({
  overview: '',
  categories: [],
  tech: [],
  alt: '',
  size: 'm',
  role: '',
  links: { github: '', live: '' },
  cs: {},
  media: [],
  featured: false,
  published: true,
  order,
  ...p
});

// Covers are generated placeholder title cards — replace them with real screenshots in /public/media/work.
export const projects: Project[] = [
  P({ id: 'p01', slug: 'evento', title: 'Evento', short: 'Event hosting and ticket-booking platform.', overview: 'An event hosting and ticket-booking platform, built with React, TypeScript, Vite, Supabase and Framer Motion.', categories: ['software'], tech: ['React', 'TypeScript', 'Vite', 'Supabase', 'Framer Motion'], cover: '/media/work/evento.jpg', alt: 'Placeholder cover for Evento — a ticket stub reading Admit one', ratio: '16:9', featured: true }, 1),
  P({ id: 'p02', slug: 'cognis', title: 'COGNIS', short: 'AI-powered company intelligence agent.', overview: 'An AI-powered company-intelligence agent, built for the Builderr Signalpost hackathon. It runs on free official data sources instead of paid APIs.', categories: ['software', 'ai'], tech: ['Tavily search', 'BRREG', 'Regnskapsregisteret', 'NAV Arbeidsplassen', 'TED', 'Doffin open data'], cover: '/media/work/cognis.jpg', alt: 'Placeholder cover for COGNIS — a network of connected nodes', ratio: '9:16', featured: true }, 2),
  P({ id: 'p03', slug: 'urban-threads', title: 'Urban Threads', short: 'Clothing brand and e-commerce project.', overview: 'A clothing brand and its e-commerce presence.', categories: ['design', 'entrepreneurship'], tech: ['[Add tools]'], cover: '/media/work/urban-threads.jpg', alt: 'Placeholder cover for Urban Threads — a clothes hanger over woven lines', ratio: '1:1' }, 3),
  P({ id: 'p04', slug: 'netcoop-ai', title: 'NetCoop AI', short: 'An AI-based project.', overview: '[One-paragraph overview of NetCoop AI]', categories: ['ai'], tech: ['[Add tools]'], cover: '/media/work/netcoop-ai.jpg', alt: 'Placeholder cover for NetCoop AI — layers of a neural network', ratio: '1:1' }, 4),
  P({ id: 'p05', slug: 'automated-hole-digger', title: 'Automated Hole Digger', short: 'Arduino-based engineering and robotics project.', overview: 'An Arduino-based engineering and robotics project.', categories: ['engineering'], tech: ['Arduino'], cover: '/media/work/hole-digger.jpg', alt: 'Placeholder cover for Automated Hole Digger — an auger drilling into ground layers', ratio: '9:16' }, 5),
  P({ id: 'p06', slug: 'vitalis', title: 'VITALIS', short: 'Adaptive emergency triage agent.', overview: 'An adaptive emergency-triage app built with Team Panthan for Problem Statement 2 at Tech Zephyr 4.0, IIT Bhubaneswar, where the team reached the final round.', categories: ['software', 'ai'], tech: ['[Add tools]'], cover: '/media/work/vitalis.jpg', alt: 'Placeholder cover for VITALIS — a heartbeat line on deep red', ratio: '16:9', featured: true }, 6),
  P({ id: 'p07', slug: 'orion', title: 'Orion', short: 'Field-technician AI assistant.', overview: 'A field-technician AI assistant for the Snapdragon AI Lab Build & Present Challenge, built to run its vision-language model locally on the Snapdragon NPU.', categories: ['software', 'ai'], tech: ['React', 'TypeScript', 'FastAPI', 'Firebase', 'Qualcomm GenieX', 'QAIRT', 'Groq'], cover: '/media/work/orion.jpg', alt: 'Placeholder cover for Orion — orbit rings around a bright point', ratio: '9:16', featured: true,
    links: { github: 'https://github.com/panthangidheeraj-sudo/Orion', live: 'https://orion-frontend-pktc.onrender.com' },
    cs: { architecture: 'A React and TypeScript front end on a FastAPI backend. The deployed version runs as a public orion-api service (FastAPI, Firebase, hosted Groq model, clearly labelled as hosted AI) plus a private orion-vision service for detection, classification, segmentation, OCR and tracking. On the Snapdragon laptop the reasoning model runs locally through GenieX and QAIRT on the NPU. Firebase handles Google sign-in, profiles and conversation sync.' } }, 7),
  P({ id: 'p08', slug: 'papertovideo', title: 'PaperToVideo', short: 'Research papers into video overviews.', overview: 'A local automation app that processes research papers and drives NotebookLM to generate video overviews.', categories: ['software', 'ai'], tech: ['FastAPI', 'Playwright', 'NotebookLM'], cover: '/media/work/papertovideo.jpg', alt: 'Placeholder cover for PaperToVideo — stacked pages with a play symbol', ratio: '1:1' }, 8),
  P({ id: 'p09', slug: 'project-10', title: '[Project title]', short: '[Short description]', overview: '[Overview]', tech: ['[Add tools]'], cover: '/media/work/placeholder-10.jpg', alt: 'Empty placeholder cover', ratio: '1:1' }, 9),
  P({ id: 'p10', slug: 'ipo-mining', title: 'IPO Mining', short: 'An 8-checkpoint IPO research framework.', overview: 'A second brain for IPO research, built in Obsidian around an 8-checkpoint methodology, with an institutional-movement layer that reads NSE bulk and block deal data and Screener.in shareholding trends. Applied across multiple IPOs with structured scoring and apply-or-skip decisions.', categories: ['software'], tech: ['Obsidian', 'NSE bulk & block deals', 'Screener.in'], cover: '/media/work/ipo-mining.jpg', alt: 'Placeholder cover for IPO Mining — a candlestick chart', ratio: '16:9', featured: true }, 10),
  P({ id: 'p11', slug: 'project-11', title: '[Project title]', short: '[Short description]', overview: '[Overview]', tech: ['[Add tools]'], cover: '/media/work/placeholder-11.jpg', alt: 'Empty placeholder cover', ratio: '9:16' }, 11)
];
