// Content for the About page.
// TODO: this is draft and placeholder content. Replace it with your own words and real details.
// Anything marked `placeholder: true` only shows in local preview (npm run dev), never on the live site.
import type { ImageMetadata } from 'astro';
import type { IconName } from './site';
import { site } from './site';

// Draft: a positioning statement, not a made-up history. Swap in your real story (why you started, who you are).
export const story =
	"Most small businesses don't need a bigger website. They need one that looks sharp, loads fast and brings in customers, built by people who actually answer their messages. That's PixelWeb: one team from the first sketch to launch day, and the support after.";

// Typed out line by line in the terminal card at the top of the page.
export const terminal: [string, string][] = [
	['whoami', site.name],
	['location', site.city],
	['founded', '2026'], // TODO: check
	['loves', 'fast sites, clean code, lime green'],
	['status', 'taking_new_projects'],
];

export type TeamMember = {
	name: string;
	role: string;
	fact: string; // fun one-liner shown like a terminal line
	photo?: ImageMetadata; // import a photo from src/assets/team/ and set it here
	placeholder?: boolean;
};

// TODO: add the real people. Photos pixelate into place when they scroll into view.
export const team: TeamMember[] = [
	{ name: 'Your name', role: 'Founder · Design & development', fact: 'currently_learning: three.js', placeholder: true },
	{ name: 'Teammate name', role: 'Design · Content', fact: 'favourite_colour: #a3e635', placeholder: true },
];

// The pinned "how we work" section. Each step has its own little animation.
export const process: { title: string; body: string; icon: IconName; visual: 'design' | 'develop' | 'launch' }[] = [
	{ title: 'Design', icon: 'monitor', visual: 'design', body: 'We sketch your pages around your brand and your customers, then turn them into a clean, modern design you sign off on.' },
	{ title: 'Develop', icon: 'code', visual: 'develop', body: 'We build it with fast, secure code that just works, on every screen, and test it on real devices.' },
	{ title: 'Launch', icon: 'rocket', visual: 'launch', body: 'We take it live, connect your domain, check everything twice, and stay around for support after.' },
];

// Draft timeline. TODO: adjust the timings to how you really work.
export const timeline = [
	{ when: 'Day 1', title: 'Free call', body: 'We talk about your business, your customers and what the site needs to do. No obligation.' },
	{ when: 'Week 1', title: 'Design', body: 'You see your homepage design and give feedback. We refine it until it feels right.' },
	{ when: 'Weeks 2–3', title: 'Build', body: 'We build every page, connect forms and bookings, and test on phones, tablets and desktops.' },
	{ when: 'Week 4', title: 'Launch & support', body: 'Your site goes live. We stay around for fixes, updates and questions.' },
];

// Only figures the site already promises elsewhere. TODO: add real ones (projects launched, happy clients...) when you have them.
export const stats = [
	{ value: 1, suffix: '', label: 'team from sketch to launch' },
	{ value: 5, suffix: '', label: 'services under one roof' },
	{ value: 100, suffix: '%', label: 'custom designs, no templates' },
	{ value: 1, suffix: ' day', label: 'to reply to every enquiry' },
];

// TODO: edit to the tools you actually use.
export const tools = ['Figma', 'Astro', 'GSAP', 'Shopify', 'WordPress', 'Webflow', 'Cloudflare', 'Google Search Console'];

// TODO: add real client quotes. Placeholders only show in local preview.
export const testimonials: { quote: string; name: string; business: string; placeholder?: boolean }[] = [
	{ quote: 'Placeholder: a real quote from your first happy client goes here.', name: 'Client name', business: 'Their business', placeholder: true },
	{ quote: 'Placeholder: a second quote, ideally about results (more calls, bookings or sales).', name: 'Client name', business: 'Their business', placeholder: true },
];

// Draft answers based on what the site already says. TODO: review each answer.
export const faq = [
	{ q: 'How much does a website cost?', a: "Every project is different, so we quote after a free call. You'll get a clear price before any work starts." },
	{ q: 'How long does it take?', a: "A simple business site usually takes a few weeks. Online stores and web apps take longer. We'll give you a timeline on the first call." },
	{ q: 'What do you need from me?', a: "Your logo, photos and a rough idea of the pages you want. If you don't have everything yet, tell us and we'll plan it together." },
	{ q: 'Do you handle hosting and domains?', a: 'Yes. We can set up hosting and your domain, or launch on the ones you already have.' },
	{ q: 'Can I update the site myself?', a: 'Yes. We can set things up so you can edit text, photos and products without touching any code.' },
	{ q: 'What happens after launch?', a: 'We test everything before going live and stay around for fixes, updates and questions.' },
];
