// Site-wide motion: smooth scroll, pixel loader + page transitions, text reveals,
// marquees, magnetic buttons, cursor and card spotlights.
// Everything is skipped when the visitor prefers reduced motion (html lacks .motion).
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { pixelField } from './pixel-field';

gsap.registerPlugin(ScrollTrigger, SplitText);

const root = document.documentElement;
const motion = root.classList.contains('motion');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const ease = 'expo.out';

let lenis: Lenis | null = null;

/* ---------- smooth scroll ---------- */
function smoothScroll() {
	lenis = new Lenis({ lerp: 0.09 });
	lenis.on('scroll', ScrollTrigger.update);
	gsap.ticker.add((t) => lenis?.raf(t * 1000));
	gsap.ticker.lagSmoothing(0);

	// Hide the header while scrolling down, bring it back on the way up.
	const header = document.querySelector<HTMLElement>('.header');
	const menu = document.getElementById('menu') as HTMLInputElement | null;
	lenis.on('scroll', ({ scroll, direction }: Lenis) => {
		if (!header || menu?.checked) return;
		header.classList.toggle('is-hidden', direction === 1 && scroll > 160);
		header.classList.toggle('is-scrolled', scroll > 20);
	});
}

/* ---------- pixel loader + page transitions ---------- */
const loader = document.querySelector<HTMLElement>('.loader');
let cells: HTMLElement[] = [];

function buildCells() {
	if (!loader) return;
	const grid = loader.querySelector<HTMLElement>('.loader-grid')!;
	const size = innerWidth < 640 ? 54 : 84;
	const cols = Math.ceil(innerWidth / size);
	const rows = Math.ceil(innerHeight / size);
	grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
	grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
	cells = Array.from({ length: cols * rows }, () => document.createElement('i'));
	// A few cells flash lime as the grid breaks apart.
	cells.forEach((c) => Math.random() < 0.07 && c.classList.add('hot'));
	grid.replaceChildren(...cells);
	loader.classList.add('ready');
}

function intro(onReveal: () => void) {
	if (!loader) return onReveal();
	buildCells();
	const firstVisit = !root.classList.contains('seen');
	try { sessionStorage.setItem('pw-seen', '1'); } catch {}

	const tl = gsap.timeline({
		onComplete: () => { loader.style.visibility = 'hidden'; loader.style.pointerEvents = 'none'; },
	});

	if (firstVisit) {
		const counter = loader.querySelector('.loader-count');
		const count = { v: 0 };
		tl.from('.loader .lp', { scale: 0, transformOrigin: 'center', duration: 0.35, ease: 'back.out(3)', stagger: 0.06 })
			.to(count, { v: 100, duration: 1.1, ease: 'power2.inOut', onUpdate: () => { if (counter) counter.textContent = String(Math.round(count.v)); } }, 0)
			.to('.loader-logo', { scale: 0.85, opacity: 0, duration: 0.35, ease: 'power2.in' }, '+=0.1');
	}

	tl.add('reveal')
		.to('.loader-grid i.hot', { backgroundColor: '#a3e635', duration: 0.12, stagger: { amount: 0.25, from: 'random' } }, 'reveal')
		.to(cells, { scale: 0, duration: 0.55, ease: 'power3.inOut', stagger: { amount: 0.75, from: 'random' } }, 'reveal+=0.05')
		.add(onReveal, 'reveal+=0.25');
}

function leaveTo(url: string) {
	if (!loader || !cells.length) return void (location.href = url);
	loader.style.visibility = 'visible';
	loader.style.pointerEvents = 'auto';
	gsap.set('.loader-grid i.hot', { backgroundColor: '#0b0b0b' });
	gsap.to(cells, {
		scale: 1, duration: 0.4, ease: 'power3.inOut', stagger: { amount: 0.45, from: 'random' },
		onComplete: () => void (location.href = url),
	});
}

function pageTransitions() {
	document.addEventListener('click', (e) => {
		const a = (e.target as Element).closest('a');
		if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
		if (a.target === '_blank' || a.hasAttribute('download') || a.dataset.noTransition !== undefined) return;
		const url = new URL(a.href, location.href);
		if (url.origin !== location.origin) return;
		if (url.pathname === location.pathname) {
			// Same page: smooth-scroll to anchors or the top instead of reloading.
			e.preventDefault();
			lenis?.scrollTo(url.hash || 0, { duration: 1.2 });
			return;
		}
		e.preventDefault();
		const menu = document.getElementById('menu') as HTMLInputElement | null;
		if (menu) menu.checked = false;
		leaveTo(url.href);
	});
	// Coming back with the browser's back button restores a covered page from cache: uncover it.
	addEventListener('pageshow', (e) => {
		if (e.persisted && cells.length) {
			gsap.set(cells, { scale: 0 });
			if (loader) { loader.style.visibility = 'hidden'; loader.style.pointerEvents = 'none'; }
		}
	});
}

/* ---------- hero entrance ---------- */
function heroIn() {
	const tl = gsap.timeline();
	const title = document.querySelector<HTMLElement>('[data-hero-title]');
	if (title) {
		const split = SplitText.create(title, { type: 'lines,chars', mask: 'lines' });
		title.style.visibility = 'visible';
		tl.from(split.chars, { yPercent: 115, rotate: 6, duration: 1.1, ease, stagger: 0.025 }, 0);
	}
	document.querySelectorAll<HTMLElement>('[data-type]').forEach((el) => {
		const text = el.dataset.type || '';
		const state = { n: 0 };
		el.textContent = '';
		tl.to(state, { n: text.length, duration: text.length * 0.045, ease: 'none', onUpdate: () => void (el.textContent = text.slice(0, Math.round(state.n))) }, 0.1);
	});
	tl.from('[data-hero-fade]', { y: 30, opacity: 0, duration: 1, ease, stagger: 0.1 }, 0.45);
	return tl;
}

/* ---------- scroll-driven text and reveals ---------- */
function textReveals() {
	document.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
		const chars = el.dataset.split === 'chars';
		SplitText.create(el, {
			type: chars ? 'lines,chars' : 'lines',
			mask: 'lines',
			autoSplit: true,
			onSplit(self) {
				el.style.visibility = 'visible';
				return gsap.from(chars ? self.chars : self.lines, {
					yPercent: 115, duration: chars ? 1.2 : 1.1, ease, stagger: chars ? 0.04 : 0.1,
					scrollTrigger: { trigger: el, start: 'top 88%', once: true },
				});
			},
		});
	});

	// Words light up one by one as the paragraph scrolls through the screen.
	document.querySelectorAll<HTMLElement>('[data-scrub]').forEach((el) => {
		const split = SplitText.create(el, { type: 'words' });
		gsap.fromTo(split.words, { opacity: 0.12 }, {
			opacity: 1, ease: 'none', stagger: 0.1,
			scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 50%', scrub: 0.6 },
		});
	});

	ScrollTrigger.batch('[data-reveal]', {
		start: 'top 90%',
		once: true,
		onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1.1, ease, stagger: 0.09, overwrite: true }),
	});

	// Hero content drifts up and fades as you scroll past it.
	const hero = document.querySelector('.hero');
	if (hero) {
		gsap.to('.hero-inner', { yPercent: -18, opacity: 0.2, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
	}

	// Thin progress bar at the top of the page.
	gsap.to('.progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });
}

/* ---------- marquee bands that react to scroll speed ---------- */
function marquees() {
	document.querySelectorAll<HTMLElement>('[data-marquee]').forEach((band) => {
		const track = band.querySelector<HTMLElement>('.marquee-track');
		if (!track) return;
		const dir = Number(band.dataset.marquee) || -1;
		let width = track.scrollWidth / 2;
		let x = dir > 0 ? -width : 0;
		let flip = 1;
		let visible = true;
		new IntersectionObserver(([e]) => void (visible = e.isIntersecting)).observe(band);
		addEventListener('resize', () => void (width = track.scrollWidth / 2));
		gsap.ticker.add((_t, dt) => {
			if (!visible) return;
			const v = lenis?.velocity ?? 0;
			if (Math.abs(v) > 0.5) flip = Math.sign(v);
			const speed = (0.7 + Math.min(Math.abs(v), 80) * 0.28) * (dt / 16.67);
			x = gsap.utils.wrap(-width, 0, x + speed * dir * flip);
			track.style.transform = `translate3d(${x}px,0,0)`;
		});
	});
}

/* ---------- pointer effects (desktop only) ---------- */
function pointerFx() {
	document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
		const xTo = gsap.quickTo(el, 'x', { duration: 0.7, ease: 'elastic.out(1, 0.35)' });
		const yTo = gsap.quickTo(el, 'y', { duration: 0.7, ease: 'elastic.out(1, 0.35)' });
		el.addEventListener('pointermove', (e) => {
			const r = el.getBoundingClientRect();
			xTo((e.clientX - r.left - r.width / 2) * 0.35);
			yTo((e.clientY - r.top - r.height / 2) * 0.45);
		});
		el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
	});

	// Square cursor that trails the pointer and grows over anything clickable.
	const cursor = document.createElement('div');
	cursor.className = 'cursor';
	cursor.setAttribute('aria-hidden', 'true');
	document.body.append(cursor);
	gsap.set(cursor, { xPercent: -50, yPercent: -50, opacity: 0 });
	const cx = gsap.quickTo(cursor, 'x', { duration: 0.45, ease: 'power3.out' });
	const cy = gsap.quickTo(cursor, 'y', { duration: 0.45, ease: 'power3.out' });
	addEventListener('pointermove', (e) => {
		cx(e.clientX); cy(e.clientY);
		gsap.to(cursor, { opacity: 1, duration: 0.3, overwrite: 'auto' });
		const hot = (e.target as Element).closest('a, button, label, select, input, textarea');
		cursor.classList.toggle('is-hot', !!hot);
	});
	document.addEventListener('pointerleave', () => gsap.to(cursor, { opacity: 0, duration: 0.3 }));
}

/* ---------- service rows: photo follows the cursor ---------- */
function servicePreview() {
	const list = document.querySelector<HTMLElement>('.svc-list');
	const preview = document.querySelector<HTMLElement>('.svc-preview');
	if (!list || !preview) return;
	const rows = [...list.querySelectorAll<HTMLElement>('.svc')];
	const imgs = [...preview.querySelectorAll<HTMLImageElement>('img')];
	const cap = preview.querySelector('.svc-cap span');

	gsap.set(preview, { xPercent: -50, yPercent: -50, scale: 0.6, autoAlpha: 0 });
	gsap.set(imgs, { yPercent: 100 });
	const xTo = gsap.quickTo(preview, 'x', { duration: 0.65, ease: 'power3.out' });
	const yTo = gsap.quickTo(preview, 'y', { duration: 0.65, ease: 'power3.out' });
	const rTo = gsap.quickTo(preview, 'rotation', { duration: 0.8, ease: 'power3.out' });

	let current = -1;
	let z = 1;
	let lastX = 0;
	let settle: gsap.core.Tween | null = null;

	list.addEventListener('pointerenter', (e) => {
		gsap.set(preview, { x: e.clientX, y: e.clientY });
		lastX = e.clientX;
	});
	list.addEventListener('pointermove', (e) => {
		xTo(e.clientX);
		yTo(e.clientY);
		// Tilt in the direction the mouse moves, then straighten out.
		rTo(gsap.utils.clamp(-14, 14, (e.clientX - lastX) * 0.8));
		lastX = e.clientX;
		settle?.kill();
		settle = gsap.delayedCall(0.12, () => rTo(0));
	});
	list.addEventListener('pointerleave', () => {
		current = -1;
		gsap.to(preview, { scale: 0.6, autoAlpha: 0, duration: 0.35, ease: 'power3.in', overwrite: 'auto' });
	});

	rows.forEach((row, i) => {
		row.addEventListener('pointerenter', () => {
			if (i === current) return;
			const img = imgs[i];
			if (cap) cap.textContent = img.dataset.file ?? '';
			if (current === -1) {
				// First row entered: pop the frame in with this row's photo already in place.
				gsap.set(imgs, { yPercent: 100 });
				gsap.set(img, { yPercent: 0, scale: 1, zIndex: ++z });
				gsap.to(preview, { scale: 1, autoAlpha: 1, duration: 0.5, ease: 'back.out(1.7)', overwrite: 'auto' });
			} else {
				// Moving between rows: the new photo slides in from the side you came from.
				const dir = i > current ? 1 : -1;
				gsap.fromTo(img, { yPercent: 100 * dir, scale: 1.25, zIndex: ++z }, { yPercent: 0, scale: 1, duration: 0.7, ease: 'expo.out', overwrite: true });
				gsap.to(imgs[current], { yPercent: -35 * dir, duration: 0.7, ease: 'expo.out', overwrite: true });
			}
			current = i;
		});
	});
}

function spotlights() {
	// Cards glow where the pointer is.
	document.addEventListener('pointermove', (e) => {
		const card = (e.target as Element).closest<HTMLElement>('[data-spot]');
		if (!card) return;
		const r = card.getBoundingClientRect();
		card.style.setProperty('--mx', `${e.clientX - r.left}px`);
		card.style.setProperty('--my', `${e.clientY - r.top}px`);
	});
}

/* ---------- start ---------- */
const canvas = document.querySelector<HTMLCanvasElement>('[data-pixel-field]');
if (canvas) pixelField(canvas, motion);

if (motion) {
	const start = () => {
		try {
			loader?.style.setProperty('animation', 'none');
			smoothScroll();
			pageTransitions();
			textReveals();
			marquees();
			spotlights();
			if (finePointer) { pointerFx(); servicePreview(); }
			const hero = heroIn().pause();
			intro(() => void hero.play());
		} catch (err) {
			// Never leave the page covered if something goes wrong.
			root.classList.remove('motion');
			console.error(err);
		}
	};
	// Lines can only be measured once the web fonts are in.
	document.fonts.ready.then(start);
}
