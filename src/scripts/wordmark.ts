// Footer wordmark drawn as pixels on a canvas.
// - Pixels fly in and fill the word left to right as you scroll to the bottom (and leave again if you scroll back up).
// - The outline of the word is always visible underneath, so you can see it filling in.
// - Under the mouse the pixels scatter and flicker lime, and the letter you're on jumps up.
// - The word runs off the bottom edge of the page on purpose.
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const WORD = 'PixelWeb';
const LIME = '#a3e635';
const SPACING = -0.065; // letter spacing in em, same as the CSS version

type Pixel = { hx: number; hy: number; x: number; y: number; vx: number; vy: number; li: number; th: number; on: boolean };

export function wordmark(wrap: HTMLElement) {
	const canvas = wrap.querySelector('canvas');
	const ctx = canvas?.getContext('2d');
	if (!canvas || !ctx) return;

	let w = 0, h = 0, size = 0, base = 0, step = 6;
	let parts: Pixel[] = [];
	let letters: { x0: number; x1: number }[] = [];
	const lift = new Float32Array(WORD.length);
	const liftV = new Float32Array(WORD.length);
	const mouse = { x: 0, y: 0, in: false };
	let progress = 0;
	let raf = 0;
	let running = false;
	const font = (s: number) => `700 ${s}px 'Space Grotesk', system-ui, sans-serif`;

	function build() {
		const r = wrap.getBoundingClientRect();
		const dpr = Math.min(devicePixelRatio || 1, 2);
		w = r.width;
		if (!w) return;

		// Size the word so it spans the full width.
		ctx!.font = font(100);
		const widths = [...WORD].map((c) => ctx!.measureText(c).width / 100);
		const total = widths.reduce((a, b) => a + b, 0) + SPACING * (WORD.length - 1);
		size = (w * 0.97) / total;
		h = Math.round(size * 0.78);
		base = h + size * 0.12; // baseline sits below the canvas, so the bottom of the letters is cut off

		canvas!.width = Math.round(w * dpr);
		canvas!.height = Math.round(h * dpr);
		canvas!.style.height = `${h}px`;
		ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

		const off = document.createElement('canvas');
		off.width = Math.ceil(w);
		off.height = h;
		const o = off.getContext('2d')!;
		o.font = font(size);
		o.fillStyle = '#fff';
		letters = [];
		let x = (w - total * size) / 2;
		[...WORD].forEach((c, i) => {
			o.fillText(c, x, base);
			letters.push({ x0: x, x1: x + widths[i] * size });
			x += (widths[i] + SPACING) * size;
		});

		const data = o.getImageData(0, 0, off.width, off.height).data;
		step = Math.max(4, Math.round(size / 44));
		parts = [];
		for (let yy = step / 2; yy < h; yy += step) {
			for (let xx = step / 2; xx < w; xx += step) {
				if (data[(Math.floor(yy) * off.width + Math.floor(xx)) * 4 + 3] < 110) continue;
				let li = letters.findIndex((L) => xx < L.x1);
				if (li < 0) li = WORD.length - 1;
				parts.push({
					hx: xx, hy: yy,
					x: xx + (Math.random() - 0.5) * 300, y: h + 60 + Math.random() * 240,
					vx: 0, vy: 0, li,
					// Left pixels land first, so the word fills left to right.
					th: 0.06 + 0.72 * (xx / w) + Math.random() * 0.14,
					on: false,
				});
			}
		}
	}

	function frame() {
		raf = requestAnimationFrame(frame);
		ctx!.clearRect(0, 0, w, h);

		// Which letter is the mouse on?
		let hovered = -1;
		if (mouse.in) hovered = letters.findIndex((L) => mouse.x >= L.x0 && mouse.x < L.x1);
		for (let i = 0; i < WORD.length; i++) {
			const target = i === hovered ? -size * 0.11 : 0;
			liftV[i] = (liftV[i] + (target - lift[i]) * 0.14) * 0.74;
			lift[i] += liftV[i];
		}

		// Outline of the word, always there.
		ctx!.font = font(size);
		ctx!.lineWidth = 1.25;
		ctx!.strokeStyle = '#2e2e2e';
		letters.forEach((L, i) => ctx!.strokeText(WORD[i], L.x0, base + lift[i]));

		const R = Math.max(50, size * 0.2);
		const s0 = step * 0.82;
		for (const p of parts) {
			if (progress >= p.th) p.on = true;
			else if (progress < p.th - 0.02) p.on = false;

			const tx = p.on ? p.hx : p.hx + (p.hx - w / 2) * 0.15;
			const ty = p.on ? p.hy + lift[p.li] : h + 140;
			let ax = (tx - p.x) * 0.07;
			let ay = (ty - p.y) * 0.07;

			let near = 0;
			if (mouse.in) {
				const dx = p.x - mouse.x, dy = p.y - mouse.y;
				const d = Math.hypot(dx, dy);
				if (d < R && d > 0.01) {
					near = 1 - d / R;
					ax += (dx / d) * near * 3.2;
					ay += (dy / d) * near * 3.2;
				}
			}

			p.vx = (p.vx + ax) * 0.8;
			p.vy = (p.vy + ay) * 0.8;
			p.x += p.vx;
			p.y += p.vy;
			if (p.y > h + step) continue;

			const lime = p.li >= 5; // "Web"
			let color = lime ? LIME : '#fff';
			if (p.li === hovered) color = lime ? '#fff' : LIME; // hovered letter swaps colour
			if (near > 0 && Math.random() < 0.35 * near) color = Math.random() < 0.5 ? LIME : '#0b0b0b';
			const s = near > 0 ? s0 * (0.6 + Math.random() * 0.8) : s0;
			ctx!.fillStyle = color;
			ctx!.fillRect(p.x - s / 2, p.y - s / 2, s, s);
		}
	}

	function setRunning(on: boolean) {
		if (on === running) return;
		running = on;
		if (on) raf = requestAnimationFrame(frame);
		else cancelAnimationFrame(raf);
	}

	wrap.addEventListener('pointermove', (e) => {
		if (e.pointerType !== 'mouse') return;
		const r = canvas.getBoundingClientRect();
		mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.in = true;
	});
	wrap.addEventListener('pointerleave', () => void (mouse.in = false));
	// On touch screens a tap makes the letter jump and the pixels scatter for a moment.
	let tapTimer = 0;
	wrap.addEventListener('pointerdown', (e) => {
		if (e.pointerType === 'mouse') return;
		const r = canvas.getBoundingClientRect();
		mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.in = true;
		clearTimeout(tapTimer);
		tapTimer = window.setTimeout(() => void (mouse.in = false), 700);
	});

	build();
	wrap.classList.add('is-canvas');
	ScrollTrigger.create({
		trigger: wrap,
		start: 'top bottom',
		end: 'bottom bottom',
		onUpdate: (st) => void (progress = st.progress),
		onRefresh: (st) => void (progress = st.progress),
	});
	new ResizeObserver(() => build()).observe(wrap);
	new IntersectionObserver(([e]) => setRunning(e.isIntersecting)).observe(wrap);
}
