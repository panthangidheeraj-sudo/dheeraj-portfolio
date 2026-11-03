import type { SiteSettings } from './types';

export const site: SiteSettings = {
  introHeading: 'IT’S GOOD TO HAVE YOU HERE.',
  introText:
    'Whether you have a project in mind, want to collaborate, have a question, or simply want to connect, I’d be happy to hear from you.',
  closingHeading: 'THE NEXT CHAPTER STARTS WITH A CONVERSATION.',
  closingText: 'Have an idea worth exploring? Let’s make something meaningful together.',
  channels: [
    { key: 'email', label: 'Email', note: 'Primary communication channel', value: 'panthangidheeraj@gmail.com', enabled: true },
    { key: 'linkedin', label: 'LinkedIn', note: 'Professional networking', value: 'https://www.linkedin.com/in/dheeraj-panthangi-73583a378/', enabled: true },
    { key: 'github', label: 'GitHub', note: 'Software projects and repositories', value: 'https://github.com/panthangidheeraj-sudo', enabled: true },
    { key: 'instagram', label: 'Instagram', note: 'Personal and creative work', value: 'https://www.instagram.com/dheeraj_fl_07/', enabled: true }
  ]
};
