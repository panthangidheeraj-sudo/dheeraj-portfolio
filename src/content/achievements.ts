import type { Achievement, AchievementCategory, StandType } from './types';

export const achievementCategories: [AchievementCategory, string][] = [
  ['academic', 'Academic'],
  ['hackathons', 'Hackathons & Competitions'],
  ['certifications', 'Certifications'],
  ['engineering', 'Engineering Projects'],
  ['recognition', 'Technical Recognition'],
  ['milestones', 'Other Milestones'],
  ['ongoing', 'Ongoing']
];

export const standTypes: [StandType, string][] = [
  ['showcase', 'Certificate in glass'],
  ['vitrine', 'Glass vitrine'],
  ['monument', 'Monument pedestal'],
  ['wall', 'Wall exhibition'],
  ['case', 'Document case'],
  ['floating', 'Floating display']
];

const M = '/media/museum/';
const A = '/media/achievements/';
const E = (o: Partial<Achievement> & Pick<Achievement, 'id' | 'title' | 'org' | 'date' | 'category' | 'description' | 'cert' | 'type' | 'room' | 'x' | 'z' | 'rot' | 'order'>): Achievement => ({
  pdf: '', verify: '', photos: [], size: 1, light: 1, featured: false, published: true, ...o
});

// Listed most valuable first — the exhibition is walked in this order.
// Certificates in /media/achievements are the real documents. Items still showing a watermarked placeholder
// (B.Tech, Automated Hole Digger, freelance) are waiting for their own documents.
export const achievements: Achievement[] = [
  // ---------- Hall I ----------
  E({ id: 'cs50', order: 1, headline: 'HARVARD CS50x', kicker: 'Certificate · 2025', title: 'CS50x — Introduction to Computer Science', org: 'Harvard University (CS50)', date: '2025', category: 'certifications', description: 'Completed CS50x, Harvard’s introduction to computer science, including ten problem sets and one final project. The certificate was awarded from Cambridge, Massachusetts, and is signed by Professor David J. Malan.', cert: A + 'cs50x.webp', verify: 'https://cs50.harvard.edu/certificates/bcb90f20-4072-4a65-b928-2a156a9e6bc8', type: 'showcase', room: 1, x: 0, z: -9.5, rot: 0, size: 1.15, light: 1.1, featured: true }),
  E({ id: 'tz', order: 2, headline: 'TECH ZEPHYR 4.0', kicker: 'Certificate of merit · Aquila AI Hackathon', title: 'Tech Zephyr 4.0 — Aquila AI Hackathon', org: 'Tech Zephyr 4.0', date: '', category: 'hackathons', description: 'Awarded a Certificate of Merit for taking part in the Aquila AI Hackathon at TechZephyr 4.0. Selected for the final round at IIT Bhubaneswar with Team Panthan, presenting VITALIS — an adaptive emergency-triage agent — for Problem Statement 2.', cert: A + 'tech-zephyr.webp', type: 'showcase', room: 1, x: -4.6, z: -14.5, rot: 20, featured: true }),
  E({ id: 'sd', order: 3, headline: 'SNAPDRAGON AI LAB', kicker: 'Ongoing · Build & Present Challenge', title: 'Snapdragon AI Lab Build & Present Challenge', org: 'Snapdragon × HP', date: 'Ongoing', category: 'ongoing', description: 'A top-percentile finish with Orion, a field-technician AI assistant built to run its vision-language model locally on the Snapdragon NPU.', cert: A + 'snapdragon-ai-lab.webp', photos: [M + 'photo-project.jpg'], type: 'vitrine', object: 'chip', room: 1, x: 4.6, z: -14.5, rot: -20, featured: true }),
  E({ id: 'wf', order: 4, headline: 'WOWFEST 2026', kicker: 'Google Developer Groups On Campus', title: 'WowFest — Wonder of Wonders 2026', org: 'Google Developer Groups On Campus · GITAM University', date: '4–5 July 2026', category: 'hackathons', description: 'Took part in Wonder of Wonders 2026 (WowFest), the Google Developer Groups On Campus event at GITAM University, Visakhapatnam, with a top-percentile finish.', cert: A + 'wowfest.webp', type: 'showcase', room: 1, x: -4.6, z: -19.5, rot: 20 }),
  E({ id: 'ad', order: 5, headline: 'ADOBE HACKATHON', kicker: 'Adobe University Hackathon', title: 'Adobe University Hackathon', org: 'Adobe (via Unstop)', date: '9 August 2026', category: 'hackathons', description: 'Participated in the Adobe University Hackathon organised by Adobe, representing the Gandhi Institute of Technology and Management (GITAM), Visakhapatnam.', cert: A + 'adobe-hackathon.webp', type: 'showcase', room: 1, x: 4.6, z: -19.5, rot: -20 }),
  E({ id: 'gt', order: 11, headline: 'B.TECH · CSE', kicker: 'GITAM · in progress', title: 'B.Tech, Computer Science (CSE Core)', org: 'GITAM', date: 'In progress', category: 'academic', description: 'Pursuing a B.Tech in Computer Science (CSE Core) at GITAM — currently in second year.', cert: M + 'cert-gitam.jpg', type: 'wall', room: 1, x: 8.97, z: -7, rot: -90 }),
  // ---------- Hall II ----------
  E({ id: 'v2s', order: 6, headline: 'VIBE2SHIP', kicker: 'Coding Ninjas × Google for Developers', title: 'Vibe2Ship — India’s Biggest Vibe Coding Hackathon', org: 'Coding Ninjas, in collaboration with Google for Developers', date: '', category: 'hackathons', description: 'Actively participated in Vibe2Ship, India’s biggest vibe-coding hackathon, organised by Coding Ninjas in collaboration with Google for Developers, building AI-powered solutions.', cert: A + 'vibe2ship.webp', type: 'showcase', room: 2, x: -4.8, z: -29.5, rot: 25 }),
  E({ id: 'cc', order: 7, headline: 'CLAUDE CODE IN ACTION', kicker: 'Anthropic · Certificate of completion', title: 'Claude Code in Action', org: 'Anthropic', date: '', category: 'certifications', description: 'Completed Anthropic’s Claude Code in Action course.', cert: A + 'claude-code-in-action.webp', type: 'showcase', room: 2, x: 4.8, z: -29.5, rot: -25 }),
  E({ id: 'aif', order: 8, headline: 'AI FLUENCY', kicker: 'Anthropic · Framework & Foundations', title: 'AI Fluency: Framework & Foundations', org: 'Anthropic', date: '', category: 'certifications', description: 'Completed Anthropic’s AI Fluency: Framework & Foundations course.', cert: A + 'ai-fluency.webp', type: 'showcase', room: 2, x: -4.8, z: -34.5, rot: 25 }),
  E({ id: 'c101', order: 9, headline: 'CLAUDE 101', kicker: 'Anthropic · May 2026', title: 'Claude 101', org: 'Anthropic', date: 'May 8, 2026', category: 'certifications', description: 'Completed Anthropic’s Claude 101 course. Certificate No. 8ug4vrm6oir8.', cert: A + 'claude-101.webp', type: 'showcase', room: 2, x: 4.8, z: -34.5, rot: -25 }),
  E({ id: 'ip', order: 10, headline: 'AI BOOTCAMP', kicker: 'IntelliPaat · July 2026', title: 'AI Bootcamp — IntelliPaat', org: 'IntelliPaat', date: '16 July 2026', category: 'certifications', description: 'Participated in the AI Bootcamp conducted online by IntelliPaat on 16 July 2026. Certificate ID IST-2026071675.', cert: A + 'intellipaat-ai-bootcamp.webp', type: 'showcase', room: 2, x: -4.8, z: -39.5, rot: 25 }),
  E({ id: 'hd', order: 12, headline: 'HOLE DIGGER', kicker: 'Engineering project', title: 'Automated Hole Digger', org: '[Course / event]', date: '[Date]', category: 'engineering', description: 'An Arduino-based engineering and robotics project. [Add what it does and your role.]', cert: M + 'cert-digger.jpg', photos: [M + 'photo-project.jpg'], type: 'vitrine', object: 'auger', room: 2, x: 4.8, z: -39.5, rot: -25 }),
  E({ id: 'fl', order: 13, headline: 'FREELANCE WEBSITES', kicker: 'Independent work', title: 'Websites for local businesses', org: 'Independent work', date: '[Dates]', category: 'milestones', description: 'Designed and built multiple mid- to high-end websites for local businesses and clients as a freelancer.', cert: M + 'screens-freelance.jpg', type: 'wall', room: 2, x: -8.97, z: -34.5, rot: 90 }),
  // ---------- Ongoing — posters of the courses and challenges currently in progress (not certificates) ----------
  E({ id: 'cs50p', order: 14, headline: 'CS50P · PYTHON', kicker: 'Ongoing · Harvard CS50', title: 'CS50’s Introduction to Programming with Python', org: 'Harvard University (CS50)', date: 'Ongoing', category: 'ongoing', description: 'Currently working through CS50P, Harvard’s Introduction to Programming with Python, taught by David J. Malan — Python, programming fundamentals, problem solving, and testing & debugging.', cert: A + 'cs50p.webp', type: 'wall', aspect: 1.778, size: 1.2, room: 2, x: 8.97, z: -29.5, rot: -90 }),
  E({ id: 'java', order: 15, headline: 'JAVA · HELSINKI', kicker: 'Ongoing · University of Helsinki', title: 'Java Programming', org: 'University of Helsinki', date: 'Ongoing', category: 'ongoing', description: 'Currently taking Java Programming, the University of Helsinki’s free online course on learning Java.', cert: A + 'helsinki-java.webp', type: 'wall', aspect: 1.778, size: 1.2, room: 2, x: 8.97, z: -34.5, rot: -90 }),
  E({ id: 'skillinf', order: 16, headline: 'SKILLINF HACKATHON', kicker: 'Ongoing · Portfolio Design Hackathon 2026', title: 'Skillinf Portfolio Design Hackathon 2026', org: 'Skillinf', date: 'Ongoing', category: 'ongoing', description: 'Taking part in the Skillinf Portfolio Design Hackathon 2026 — an online challenge to design, build and deploy a standout portfolio website that reflects your skills, creativity and identity.', cert: A + 'skillinf-hackathon.webp', type: 'wall', aspect: 1.778, size: 1.2, room: 2, x: 8.97, z: -39.5, rot: -90 }),
  E({ id: 'homingo', order: 17, headline: 'HOMINGO HACK DAYS', kicker: 'Ongoing · AI Engineering Hackathon', title: 'Homingo Hack Days — AI Engineering Hackathon', org: 'Homingo', date: 'Ongoing', category: 'ongoing', description: 'Taking part in Homingo Hack Days, an AI engineering hackathon about building AI that real people use, with tracks in autonomous AI agents, automation workflows and LLM applications.', cert: A + 'homingo-hack-days.webp', type: 'wall', aspect: 1.778, size: 1.2, room: 2, x: -8.97, z: -29.5, rot: 90 }),
  E({ id: 'builderr', order: 18, headline: 'BUILDERR AI CHALLENGES', kicker: 'Ongoing · Public AI Challenges', title: 'Builderr — Build AI Agents for Real Business Problems', org: 'Builderr', date: 'Ongoing', category: 'ongoing', description: 'Taking part in Builderr’s public AI challenges, turning real business use cases into working AI agents.', cert: A + 'builderr-ai.webp', type: 'wall', aspect: 1.778, size: 1.2, room: 2, x: -8.97, z: -39.5, rot: 90 })
];
