import type { Achievement, AchievementCategory, StandType } from './types';

export const achievementCategories: [AchievementCategory, string][] = [
  ['academic', 'Academic'],
  ['hackathons', 'Hackathons & Competitions'],
  ['certifications', 'Certifications'],
  ['engineering', 'Engineering Projects'],
  ['recognition', 'Technical Recognition'],
  ['milestones', 'Other Milestones']
];

export const standTypes: [StandType, string][] = [
  ['vitrine', 'Glass vitrine'],
  ['monument', 'Monument pedestal'],
  ['wall', 'Wall exhibition'],
  ['case', 'Document case'],
  ['floating', 'Floating display']
];

const M = '/media/museum/';
const E = (o: Partial<Achievement> & Pick<Achievement, 'id' | 'title' | 'org' | 'date' | 'category' | 'description' | 'cert' | 'type' | 'room' | 'x' | 'z' | 'rot' | 'order'>): Achievement => ({
  pdf: '', verify: '', photos: [], size: 1, light: 1, featured: false, published: true, ...o
});

// Certificates are watermarked placeholders — upload the originals to replace them.
export const achievements: Achievement[] = [
  E({ id: 'tz', order: 1, title: 'Tech Zephyr 4.0 — Final round', org: 'IIT Bhubaneswar', date: '[Date]', category: 'hackathons', description: 'Selected for the final round of Tech Zephyr 4.0 at IIT Bhubaneswar with Team Panthan, presenting VITALIS — an adaptive emergency-triage agent — for Problem Statement 2.', cert: M + 'cert-techzephyr.jpg', photos: [M + 'photo-event.jpg', M + 'photo-team.jpg'], type: 'monument', object: 'vessel', room: 1, x: 0, z: -10, rot: 0, featured: true }),
  E({ id: 'sd', order: 2, title: 'Snapdragon AI Lab Build & Present Challenge', org: '[Organisation]', date: '[Date]', category: 'hackathons', description: 'A top-percentile finish with Orion, a field-technician AI assistant built to run its vision-language model locally on the Snapdragon NPU.', cert: M + 'cert-snapdragon.jpg', photos: [M + 'photo-project.jpg'], type: 'vitrine', object: 'chip', room: 1, x: -4.6, z: -16.5, rot: 20, featured: true }),
  E({ id: 'wf', order: 3, title: 'WowFest — Top-percentile finish', org: '[Organisation]', date: '[Date]', category: 'hackathons', description: 'A top-percentile finish at WowFest. [Add the event details and what you built.]', cert: M + 'cert-wowfest.jpg', type: 'wall', room: 1, x: -8.97, z: -7, rot: 90 }),
  E({ id: 'gt', order: 4, title: 'B.Tech, Computer Science (CSE Core)', org: 'GITAM', date: 'In progress', category: 'academic', description: 'Pursuing a B.Tech in Computer Science (CSE Core) at GITAM — currently in second year.', cert: M + 'cert-gitam.jpg', type: 'wall', room: 1, x: 8.97, z: -7, rot: -90 }),
  E({ id: 'c1', order: 5, title: '[Certification title]', org: '[Issuing organisation]', date: '[Date]', category: 'certifications', description: '[What the certification covers and what it took to earn it.]', cert: M + 'cert-cert1.jpg', photos: [M + 'photo-event.jpg'], type: 'case', room: 1, x: 4.6, z: -16.5, rot: -20 }),
  E({ id: 'hd', order: 6, title: 'Automated Hole Digger', org: '[Course / event]', date: '[Date]', category: 'engineering', description: 'An Arduino-based engineering and robotics project. [Add what it does and your role.]', cert: M + 'cert-digger.jpg', photos: [M + 'photo-project.jpg'], type: 'vitrine', object: 'auger', room: 2, x: -4.8, z: -29.5, rot: 25 }),
  E({ id: 'fl', order: 7, title: 'Websites for local businesses', org: 'Independent work', date: '[Dates]', category: 'milestones', description: 'Designed and built multiple mid- to high-end websites for local businesses and clients as a freelancer.', cert: M + 'screens-freelance.jpg', type: 'floating', room: 2, x: 4.8, z: -29.5, rot: -25 }),
  E({ id: 'c2', order: 8, title: '[Certification title]', org: '[Issuing organisation]', date: '[Date]', category: 'certifications', description: '[What the certification covers.]', cert: M + 'cert-cert2.jpg', type: 'wall', room: 2, x: 8.97, z: -34.5, rot: -90 }),
  E({ id: 'rc', order: 9, title: '[Technical recognition]', org: '[Issuing organisation]', date: '[Date]', category: 'recognition', description: '[The recognition, who gave it and why.]', cert: M + 'cert-recognition.jpg', type: 'monument', object: 'prism', room: 2, x: -5, z: -38.5, rot: 25 }),
  E({ id: 'ac', order: 10, title: '[Academic achievement]', org: '[Issuing organisation]', date: '[Date]', category: 'academic', description: '[The achievement and what it recognises.]', cert: M + 'cert-academic.jpg', photos: [M + 'photo-team.jpg', M + 'photo-project.jpg'], type: 'case', room: 2, x: 5, z: -39, rot: -25 })
];
