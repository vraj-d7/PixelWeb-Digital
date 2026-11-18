// Extra content for the Services page. The five services themselves live in site.ts (same order).
// TODO: these are drafts. Check every answer, package and feature against how you really work.

export type Demo = 'design' | 'develop' | 'store' | 'mobile' | 'seo';

// One entry per service in site.ts, same order.
export const serviceExtras: { id: string; demo: Demo; faq: { q: string; a: string }[] }[] = [
	{
		id: 'website-design', demo: 'design',
		faq: [
			{ q: 'Do I need a logo first?', a: "It helps, but it's not required. If you don't have one yet, tell us and we'll plan around it." },
			{ q: 'How many design changes can I ask for?', a: "We refine the design with you until it feels right before we start building." },
		],
	},
	{
		id: 'web-development', demo: 'develop',
		faq: [
			{ q: 'Can you add bookings or forms?', a: 'Yes. Contact forms, booking forms and other integrations are part of what we build.' },
			{ q: 'Will it work on every browser?', a: 'Yes. We test on real phones, tablets and desktops before launch.' },
		],
	},
	{
		id: 'ecommerce', demo: 'store',
		faq: [
			{ q: 'Can I add products myself?', a: 'Yes. We set things up so adding and editing products is simple.' },
			{ q: 'How do customers pay?', a: 'Through secure online payments. We help you choose and connect a payment provider.' },
		],
	},
	{
		id: 'mobile-fast', demo: 'mobile',
		faq: [
			{ q: 'Is mobile-friendly extra?', a: 'No. Every site we build is designed for phones first.' },
			{ q: 'How fast will my site be?', a: 'We optimise images and code so pages load in a blink, and check speed before launch.' },
		],
	},
	{
		id: 'seo', demo: 'seo',
		faq: [
			{ q: 'Will I be #1 on Google?', a: "Nobody can honestly promise that. We set up the foundations so Google understands and ranks your business." },
			{ q: 'Do you help with Google Maps?', a: 'We share tips for your Google Business Profile so locals can find you.' },
		],
	},
];

// "What do you need?" picker at the top of the page.
export const needs: { label: string; services: string[]; pkg: string }[] = [
	{ label: 'I need a new website', services: ['website-design', 'web-development', 'mobile-fast'], pkg: 'business' },
	{ label: 'I want to sell online', services: ['ecommerce', 'mobile-fast', 'seo'], pkg: 'store' },
	{ label: 'My site is old or slow', services: ['website-design', 'mobile-fast'], pkg: 'business' },
	{ label: "People can't find me on Google", services: ['seo', 'web-development'], pkg: 'starter' },
];

// TODO: set real prices, e.g. price: 'From ₹15,000'. Leave empty to show "Custom quote".
export const packages: { id: string; name: string; price: string; blurb: string; popular?: boolean }[] = [
	{ id: 'starter', name: 'Starter site', price: '', blurb: 'A sharp one-page site to get you online fast.' },
	{ id: 'business', name: 'Business site', price: '', blurb: 'A full website with every page your business needs.', popular: true },
	{ id: 'store', name: 'Online store', price: '', blurb: 'Everything in Business, plus a store that sells 24/7.' },
];

// Comparison table. Values per package (same order as above): true = included, false = not included, or a short text.
export const features: { label: string; values: (boolean | string)[] }[] = [
	{ label: 'Custom design, no templates', values: [true, true, true] },
	{ label: 'Mobile-friendly and fast', values: [true, true, true] },
	{ label: 'Pages', values: ['1 page', 'Multiple pages', 'Multiple pages'] },
	{ label: 'Contact form', values: [true, true, true] },
	{ label: 'SEO setup', values: ['Basic', true, true] },
	{ label: 'Bookings and integrations', values: [false, true, true] },
	{ label: 'Online store and payments', values: [false, false, true] },
	{ label: 'Edit content yourself', values: [false, true, true] },
	{ label: 'Support after launch', values: [true, true, true] },
];
