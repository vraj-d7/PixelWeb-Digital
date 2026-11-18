// Scroll effects used on the home page. Called from motion.ts only when animations are on.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const finePointer = () => matchMedia('(hover: hover) and (pointer: fine)').matches;

// "Selected work": the section pins and the cards slide sideways as you scroll down (wide screens).
function workPin() {
	const sec = document.querySelector<HTMLElement>('[data-work]');
	const track = sec?.querySelector<HTMLElement>('[data-work-track]');
	if (!sec || !track) return;
	gsap.matchMedia().add('(min-width: 901px)', () => {
		const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
		const tween = gsap.to(track, {
			x: () => -dist(), ease: 'none',
			scrollTrigger: { trigger: sec, start: 'top top', end: () => `+=${dist()}`, pin: true, scrub: 0.6, invalidateOnRefresh: true },
		});
		return () => tween.scrollTrigger?.kill();
	});
}

// Laptop and phone: the sample site inside each screen scrolls as you scroll past.
function devices() {
	const sec = document.querySelector('[data-devices]');
	if (!sec) return;
	sec.querySelectorAll<HTMLElement>('[data-scrollsite]').forEach((site) => {
		gsap.to(site, {
			y: () => -Math.max(0, site.scrollHeight - (site.parentElement?.clientHeight ?? 0)), ease: 'none',
			scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: 0.5, invalidateOnRefresh: true },
		});
	});
}

// "Why people pick us": each card shrinks and dims as the next one slides over it.
function stacking() {
	const cards = [...document.querySelectorAll<HTMLElement>('[data-stack] .scard')];
	cards.forEach((card, i) => {
		const nextCard = cards[i + 1];
		if (!nextCard) return;
		gsap.fromTo(card, { scale: 1, filter: 'brightness(1)' }, {
			scale: 0.92, filter: 'brightness(0.6)', ease: 'none',
			scrollTrigger: { trigger: nextCard, start: 'top bottom', end: () => `top top+=${112 + (i + 1) * 22}`, scrub: true },
		});
	});
}

// Process strip: the line draws itself and each step lights up as the line reaches it.
function processStrip() {
	const strip = document.querySelector<HTMLElement>('[data-pstrip]');
	if (!strip) return;
	const nodes = [...strip.querySelectorAll<HTMLElement>('.ps-node')];
	ScrollTrigger.create({
		trigger: strip, start: 'top 75%', end: 'bottom 50%', scrub: true,
		onUpdate: (s) => {
			strip.style.setProperty('--p', s.progress.toFixed(3));
			nodes.forEach((n, i) => n.classList.toggle('is-on', s.progress >= (i / Math.max(1, nodes.length - 1)) * 0.95));
		},
	});
}

// The page background shifts gently between sections.
function bgShift() {
	document.querySelectorAll<HTMLElement>('main [data-bg]').forEach((sec) => {
		ScrollTrigger.create({
			trigger: sec, start: 'top 50%', end: 'bottom 50%',
			onToggle: (st) => { if (st.isActive) gsap.to(document.body, { backgroundColor: sec.dataset.bg, duration: 0.7, overwrite: 'auto' }); },
		});
	});
}

// Work cards tilt in 3D towards the mouse.
function tilt() {
	if (!finePointer()) return;
	document.querySelectorAll<HTMLElement>('[data-tilt]').forEach((card) => {
		gsap.set(card, { transformPerspective: 900 });
		const rx = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power3.out' });
		const ry = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power3.out' });
		card.addEventListener('pointermove', (e) => {
			const r = card.getBoundingClientRect();
			ry(((e.clientX - r.left) / r.width - 0.5) * 14);
			rx(-((e.clientY - r.top) / r.height - 0.5) * 10);
		});
		card.addEventListener('pointerleave', () => { rx(0); ry(0); });
	});
}

export function homeFx() {
	if (!document.querySelector('[data-work], [data-pstrip], [data-stack]')) return;
	workPin(); // pins first, so later triggers are measured after the pin spacing
	devices();
	stacking();
	processStrip();
	bgShift();
	tilt();
}
