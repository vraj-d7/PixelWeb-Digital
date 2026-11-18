// Hero canvas.
// 1. A dim grid of pixels; pixels near the pointer light up lime, a slow wave and random twinkles keep it alive.
// 2. The PixelWeb "P" logo, built from small square particles. They fly in and assemble on load,
//    scatter away from the mouse, spring back, and burst apart on click.

const LIME = '163,230,53';
// Logo cells on a 5x5 grid (same shape as the logo SVG); the last one is the lime pixel.
const LOGO: [number, number, boolean][] = [
	[0, 0, false], [1, 0, false], [2, 0, false], [3, 0, false],
	[0, 1, false], [0, 2, false], [1, 2, false], [2, 2, false], [3, 2, false],
	[0, 3, false], [0, 4, false], [4, 1, true],
];
const SUB = 4; // particles per cell edge (4x4 per cell)

type Particle = { hx: number; hy: number; x: number; y: number; vx: number; vy: number; lime: boolean; delay: number; on: boolean; phase: number };

export function pixelField(canvas: HTMLCanvasElement, animate: boolean) {
	const ctx = canvas.getContext('2d');
	if (!ctx) return { assemble() {} };
	const area = (canvas.parentElement ?? canvas) as HTMLElement;

	let w = 0, h = 0, cols = 0, rows = 0, gap = 26;
	let vals = new Float32Array(0);
	const pointer = { x: 0, y: 0, active: false };
	const cur = { x: 0, y: 0 };
	const par = { x: 0, y: 0 };
	const tilt = { x: 0, y: 0 }; // fake 3D turn of the logo towards the mouse
	const ripples: { x: number; y: number; t: number }[] = [];
	let running = false;
	let raf = 0;

	let parts: Particle[] = [];
	const logo = { cx: 0, cy: 0, size: 0, ps: 0 };
	let assembleAt = Infinity;

	function layoutLogo() {
		// Same breakpoint as the hero CSS (which measures the window, scrollbar included).
		const wide = matchMedia('(min-width: 761px)').matches;
		const size = wide ? Math.min(h * 0.58, w * 0.27) : Math.min(w * 0.44, 210);
		logo.size = size;
		logo.cx = wide ? w * 0.77 : w * 0.5;
		logo.cy = wide ? h * 0.46 : size / 2 + 28;
		const cell = size / 5;
		const step = (cell * 0.82) / SUB;
		logo.ps = step * 0.8;

		const homes: { hx: number; hy: number; lime: boolean }[] = [];
		for (const [c, r, lime] of LOGO) {
			for (let a = 0; a < SUB; a++) for (let b = 0; b < SUB; b++) {
				homes.push({
					hx: logo.cx - size / 2 + c * cell + a * step + step / 2,
					hy: logo.cy - size / 2 + r * cell + b * step + step / 2,
					lime,
				});
			}
		}
		if (parts.length === homes.length) {
			homes.forEach((p, i) => { parts[i].hx = p.hx; parts[i].hy = p.hy; });
			return;
		}
		parts = homes.map((p) => ({
			...p,
			// Start scattered around the hero, invisible until assemble() is called.
			x: logo.cx + (Math.random() - 0.5) * w * 1.3,
			y: logo.cy + (Math.random() - 0.5) * h * 1.5,
			vx: 0, vy: 0,
			delay: Math.random() * 650,
			on: false,
			phase: Math.random() * Math.PI * 2,
		}));
	}

	function resize() {
		const r = canvas.getBoundingClientRect();
		const dpr = Math.min(devicePixelRatio || 1, 2);
		w = r.width; h = r.height;
		gap = w < 640 ? 22 : 26;
		canvas.width = Math.round(w * dpr);
		canvas.height = Math.round(h * dpr);
		ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
		cols = Math.ceil(w / gap);
		rows = Math.ceil(h / gap);
		vals = new Float32Array(cols * rows);
		cur.x = w * 0.7; cur.y = h * 0.5;
		layoutLogo();
		if (!animate) drawStatic();
	}

	function drawGlow(alpha: number) {
		const g = ctx!.createRadialGradient(logo.cx, logo.cy, 0, logo.cx, logo.cy, logo.size * 1.1);
		g.addColorStop(0, `rgba(${LIME},${0.16 * alpha})`);
		g.addColorStop(1, `rgba(${LIME},0)`);
		ctx!.fillStyle = g;
		ctx!.fillRect(logo.cx - logo.size * 1.2, logo.cy - logo.size * 1.2, logo.size * 2.4, logo.size * 2.4);
	}

	function drawStatic() {
		ctx!.clearRect(0, 0, w, h);
		for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
			const x = i * gap + gap / 2, y = j * gap + gap / 2;
			const lit = Math.random() < 0.02;
			ctx!.fillStyle = lit ? `rgba(${LIME},0.5)` : '#232323';
			const s = lit ? 6 : 2.5;
			ctx!.fillRect(x - s / 2, y - s / 2, s, s);
		}
		drawGlow(1);
		for (const p of parts) {
			ctx!.fillStyle = p.lime ? `rgb(${LIME})` : '#fff';
			ctx!.fillRect(p.hx - logo.ps / 2, p.hy - logo.ps / 2, logo.ps, logo.ps);
		}
	}

	function frame(t: number) {
		raf = requestAnimationFrame(frame);
		// The glow follows the real pointer, or wanders by itself.
		const tx = pointer.active ? pointer.x : w * (0.68 + 0.22 * Math.sin(t * 0.00031));
		const ty = pointer.active ? pointer.y : h * (0.5 + 0.32 * Math.sin(t * 0.00047));
		cur.x += (tx - cur.x) * (pointer.active ? 0.2 : 0.04);
		cur.y += (ty - cur.y) * (pointer.active ? 0.2 : 0.04);

		const R = Math.max(140, Math.min(240, w * 0.22));
		for (let k = ripples.length - 1; k >= 0; k--) if (t - ripples[k].t > 1600) ripples.splice(k, 1);

		ctx!.clearRect(0, 0, w, h);
		ctx!.fillStyle = '#212121';
		for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
			ctx!.fillRect(i * gap + gap / 2 - 1.25, j * gap + gap / 2 - 1.25, 2.5, 2.5);
		}

		for (let j = 0; j < rows; j++) {
			for (let i = 0; i < cols; i++) {
				const k = j * cols + i;
				const x = i * gap + gap / 2, y = j * gap + gap / 2;
				const d = Math.hypot(x - cur.x, y - cur.y);
				let target = d < R ? Math.pow(1 - d / R, 1.8) * 0.8 : 0;

				// Diagonal wave sweeping across the grid.
				const wave = Math.sin(i * 0.22 + j * 0.16 - t * 0.0016);
				if (wave > 0.985) target = Math.max(target, (wave - 0.985) * 20);

				for (const r of ripples) {
					const radius = (t - r.t) * 0.55;
					const band = Math.abs(Math.hypot(x - r.x, y - r.y) - radius);
					if (band < gap) target = Math.max(target, (1 - band / gap) * (1 - (t - r.t) / 1600));
				}

				if (Math.random() < 0.00035) vals[k] = 0.9;
				vals[k] += (target - vals[k]) * (target > vals[k] ? 0.3 : 0.05);

				const v = vals[k];
				if (v < 0.03) continue;
				const s = 2.5 + v * (gap * 0.62 - 2.5);
				ctx!.fillStyle = `rgba(${LIME},${Math.min(1, v * 1.15)})`;
				ctx!.fillRect(x - s / 2, y - s / 2, s, s);
			}
		}

		drawLogo(t);
	}

	function drawLogo(t: number) {
		if (t < assembleAt) return;
		const since = t - assembleAt;
		drawGlow(Math.min(1, since / 1200));

		// Logo leans gently away from the mouse.
		const ptx = pointer.active ? (pointer.x / w - 0.5) * -26 : 0;
		const pty = pointer.active ? (pointer.y / h - 0.5) * -18 : 0;
		par.x += (ptx - par.x) * 0.06;
		par.y += (pty - par.y) * 0.06;
		// Turn towards the mouse; drift slowly by itself when there's no mouse.
		const ttx = pointer.active ? pointer.x / w - 0.5 : Math.sin(t * 0.0005) * 0.25;
		const tty = pointer.active ? pointer.y / h - 0.5 : Math.cos(t * 0.0004) * 0.2;
		tilt.x += (ttx - tilt.x) * 0.05;
		tilt.y += (tty - tilt.y) * 0.05;

		const mx = pointer.active ? pointer.x : -1e5;
		const my = pointer.active ? pointer.y : -1e5;
		const RR = Math.max(90, logo.size * 0.42);
		const ps = logo.ps;

		for (const p of parts) {
			if (!p.on) {
				if (since < p.delay) continue;
				p.on = true;
			}
			const fx = p.hx + par.x + Math.sin(t * 0.0013 + p.phase) * 1.2;
			const fy = p.hy + par.y + Math.cos(t * 0.0011 + p.phase) * 1.2;
			let ax = (fx - p.x) * 0.05;
			let ay = (fy - p.y) * 0.05;

			const dx = p.x - mx, dy = p.y - my;
			const d = Math.hypot(dx, dy);
			if (d < RR && d > 0.01) {
				const f = (1 - d / RR) * 5;
				ax += (dx / d) * f;
				ay += (dy / d) * f;
			}

			p.vx = (p.vx + ax) * 0.85;
			p.vy = (p.vy + ay) * 0.85;
			p.x += p.vx;
			p.y += p.vy;

			// Pixels that are pushed out of place glow lime.
			const off = Math.min(1, Math.hypot(p.x - fx, p.y - fy) / 70);
			if (p.lime || off > 0.5) {
				ctx!.fillStyle = `rgb(${LIME})`;
			} else if (off > 0.08) {
				const g = Math.round(255 - (255 - 230) * off * 2);
				const r = Math.round(255 - (255 - 163) * off * 2);
				const b = Math.round(255 - (255 - 53) * off * 2);
				ctx!.fillStyle = `rgb(${r},${g},${b})`;
			} else {
				ctx!.fillStyle = '#fff';
			}
			// Perspective: pixels on the side nearest the mouse are drawn bigger and pushed outward.
			const rx = p.x - logo.cx, ry = p.y - logo.cy;
			const persp = 1 + (rx * tilt.x + ry * tilt.y) / (logo.size * 1.4);
			const s = ps * (1 - off * 0.25) * persp;
			ctx!.fillRect(logo.cx + rx * persp - s / 2, logo.cy + ry * persp - s / 2, s, s);
		}
	}

	function setRunning(on: boolean) {
		if (!animate || on === running) return;
		running = on;
		if (on) raf = requestAnimationFrame(frame);
		else cancelAnimationFrame(raf);
	}

	area.addEventListener('pointermove', (e) => {
		if (e.pointerType !== 'mouse') return;
		const r = canvas.getBoundingClientRect();
		pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top; pointer.active = true;
	});
	area.addEventListener('pointerleave', () => void (pointer.active = false));
	area.addEventListener('pointerdown', (e) => {
		const r = canvas.getBoundingClientRect();
		const x = e.clientX - r.left, y = e.clientY - r.top;
		ripples.push({ x, y, t: performance.now() });
		// Burst: blow nearby logo pixels outward.
		const reach = Math.max(260, logo.size);
		for (const p of parts) {
			const dx = p.x - x, dy = p.y - y;
			const d = Math.hypot(dx, dy) || 1;
			if (d < reach) {
				const f = (1 - d / reach) * 34 + 4;
				p.vx += (dx / d) * f + (Math.random() - 0.5) * 6;
				p.vy += (dy / d) * f + (Math.random() - 0.5) * 6;
			}
		}
	});

	new ResizeObserver(resize).observe(canvas);
	let onScreen = false;
	new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; setRunning(onScreen && !document.hidden); }).observe(canvas);
	document.addEventListener('visibilitychange', () => setRunning(onScreen && !document.hidden));
	resize();

	const assemble = () => { if (assembleAt === Infinity) assembleAt = performance.now(); };
	// Safety net: build the logo even if the intro never calls assemble().
	setTimeout(assemble, 4500);
	return { assemble };
}
