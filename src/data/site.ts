// Everything about the business lives here, so contact details only change in one place.

export const site = {
	name: 'PixelWeb Digital',
	tagline: 'Websites that don’t just look good — they bring you customers.',
	description:
		'PixelWeb Digital designs and develops fast, modern, mobile-friendly websites and online stores for small businesses, startups and personal brands.',

	instagram: {
		handle: '@pixelweb.digital',
		href: 'https://instagram.com/pixelweb.digital',
		// Instagram DMs open with ig.me; the DM keyword from the slides.
		dm: 'https://ig.me/m/pixelweb.digital',
		keyword: 'WEBSITE',
	},

	// TODO: replace with the real email address.
	email: 'hello@pixelweb.digital',

	// TODO: replace with the real WhatsApp number, digits only with country code (e.g. 919876543210).
	whatsapp: '',

	// TODO: create a free form at https://formspree.io and paste its endpoint here,
	// e.g. 'https://formspree.io/f/abcdwxyz'. Until then the form opens the visitor's email app.
	formEndpoint: '',
};

export const whatsappHref = site.whatsapp
	? `https://wa.me/${site.whatsapp}?text=${encodeURIComponent('Hi PixelWeb Digital, I’d like a website.')}`
	: '';

export const nav = [
	{ href: '/', label: 'Home' },
	{ href: '/services/', label: 'Services' },
	{ href: '/about/', label: 'About' },
	{ href: '/contact/', label: 'Contact' },
];

export type IconName = 'monitor' | 'code' | 'cart' | 'phone' | 'search' | 'rocket' | 'arrow' | 'mail' | 'chat' | 'instagram' | 'check';

export const services: { icon: IconName; title: string; short: string; body: string; points: string[] }[] = [
	{
		icon: 'monitor',
		title: 'Website Design',
		short: 'Modern looks that build trust',
		body: 'A clean, modern design built around your brand, so visitors trust you from the first second they land on your page.',
		points: ['Custom design, no cookie-cutter templates', 'Your colours, fonts and logo', 'Clear layout that leads people to contact you'],
	},
	{
		icon: 'code',
		title: 'Web Development',
		short: 'Custom sites & web apps',
		body: 'Fast, secure code that just works. From a simple business site to a custom web app with logins and dashboards.',
		points: ['Hand-built, lightweight code', 'Booking, forms and integrations', 'Easy to grow as your business grows'],
	},
	{
		icon: 'cart',
		title: 'E-commerce Stores',
		short: 'Sell online, 24/7',
		body: 'An online store that takes orders while you sleep: product pages, cart, secure payments and order emails.',
		points: ['Product catalogue and checkout', 'Secure online payments', 'Simple to add and edit products'],
	},
	{
		icon: 'phone',
		title: 'Mobile-friendly & Fast',
		short: 'Perfect on every screen',
		body: 'Most of your customers are on their phones. Every site we build is designed for mobile first and loads in a blink.',
		points: ['Looks right on phones, tablets and desktops', 'Optimised images and fast loading', 'Tested on real devices'],
	},
	{
		icon: 'search',
		title: 'SEO-ready',
		short: 'Get found on Google',
		body: 'A beautiful site is useless if nobody finds it. We set up the foundations so Google understands and ranks your business.',
		points: ['Page titles, descriptions and sitemaps', 'Google Business Profile tips', 'Clean structure search engines love'],
	},
];

export const steps = [
	{ icon: 'monitor' as IconName, title: 'Design', body: 'Clean, modern looks built around your brand.' },
	{ icon: 'code' as IconName, title: 'Develop', body: 'Fast, secure code that just works.' },
	{ icon: 'rocket' as IconName, title: 'Launch', body: 'Live, tested and supported after.' },
];
