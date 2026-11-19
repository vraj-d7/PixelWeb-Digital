// Hero canvas.
// 1. A dim grid of pixels; pixels near the pointer light up lime, a slow wave and random twinkles keep it alive.
// 2. A crisp pixel icon that morphs every few seconds through what PixelWeb does
//    (website, code, cart, phone, search, rocket). The pixels flow from one shape into the next,
//    a lime scan line sweeps through them, they scatter away from the mouse and burst apart on click.

const LIME = '163,230,53';
const GRID = 30; // the icons are drawn on a 30 x 30 pixel grid

// Icons as SVG paths on a 24 x 24 canvas (stroked, then sampled into pixels).
const SHAPES: { label: string; d: string }[] = [
	{ label: 'web_design', d: 'M3 4.5h18v12H3zM3 8h18M12 16.5v3.5M8 20h8' },
	{ label: 'web_development', d: 'M8 7l-5 5 5 5M16 7l5 5-5 5M13.6 4.5l-3.2 15' },
	{ label: 'ecommerce', d: 'M2.5 4h2.2l2.4 10.5h11L20.6 8H6M9 19.2m-1.7 0a1.7 1.7 0 1 0 3.4 0a1.7 1.7 0 1 0-3.4 0M17 19.2m-1.7 0a1.7 1.7 0 1 0 3.4 0a1.7 1.7 0 1 0-3.4 0' },
	{ label: 'mobile_first', d: 'M8.5 2.5h7A2.5 2.5 0 0 1 18 5v14a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 6 19V5a2.5 2.5 0 0 1 2.5-2.5zM10.5 18h3' },
	{ label: 'seo_ready', d: 'M10.5 3.5a6.5 6.5 0 1 1 0 13a6.5 6.5 0 1 1 0-13zM15.5 15.5l5.5 5.5' },
	{ label: 'launch', d: 'M14 4c3-1.5 6-1 6-1s.5 3-1 6l-7 7-5-5 7-7ZM7 12l-3 1 1-3M12 17l-1 3 3-1M5 19l2-2' },
];

// Turn each icon into a list of [col, row] grid cells, in reading order (so neighbours stay neighbours when morphing).
function sampleShapes() {
	const S = 8; // sub-samples per cell
	const size = GRID * S;
	const c = document.createElement('canvas');
	c.width = c.height = size;
	const g = c.getContext('2d')!;
	const scale = size / 24;
	return SHAPES.map(({ d }) => {
		g.clearRect(0, 0, size, size);
		g.save();
		g.scale(scale, scale);
		g.lineWidth = 2.1;
		g.lineCap = 'round';
		g.lineJoin = 'round';
		g.strokeStyle = '#fff';
		g.stroke(new Path2D(d));
		g.restore();
		const data = g.getImageData(0, 0, size, size).data;
		const cells: [number, number][] = [];
		for (let r = 0; r < GRID; r++) for (let col = 0; col < GRID; col++) {
			const x = Math.floor((col + 0.5) * S), y = Math.floor((r + 0.5) * S);
			if (data[(y * size + x) * 4 + 3] > 110) cells.push([col, r]);
		}
		return cells;
	});
}

type Particle = {
	gc: number; gr: number; // home position in grid units (dust uses free positions)
	x: number; y: number; vx: number; vy: number;
	dust: boolean; on: boolean; delay: number; switchAt: number; phase: number;
	next: { gc: number; gr: number; dust: boolean } | null;
};

export function pixelField(canvas: HTMLCanvasElement, animate: boolean, onShape?: (label: string) => void) {
	const ctx = canvas.getContext('2d');
	if (!ctx) return { assemble() {} };
	const area = (canvas.parentElement ?? canvas) as HTMLElement;

	let w = 0, h = 0, cols = 0, rows = 0, gap = 26;
	let vals = new Float32Array(0);
	const pointer = { x: 0, y: 0, active: false };
	const cur = { x: 0, y: 0 };
	const par = { x: 0, y: 0 };
	const tilt = { x: 0, y: 0 }; // fake 3D turn of the icon towards the mouse
	const ripples: { x: number; y: number; t: number }[] = [];
	let running = false;
	let raf = 0;

	const shapes = sampleShapes();
	const count = Math.max(...shapes.map((s) => s.length));
	const icon = { cx: 0, cy: 0, size: 0, cell: 0 };
	let shapeIndex = 0;
	let assembleAt = Infinity;
	let nextMorph = Infinity;

	// Free spot for spare pixels: a loose cloud around the icon, in grid units.
	const dustSpot = () => {
		const a = Math.random() * Math.PI * 2, r = GRID * (0.55 + Math.random() * 0.35);
		return { gc: GRID / 2 + Math.cos(a) * r, gr: GRID / 2 + Math.sin(a) * r };
	};

	const parts: Particle[] = Array.from({ length: count }, (_, i) => {
		const cell = shapes[0][i];
		const spot = cell ? { gc: cell[0], gr: cell[1] } : dustSpot();
		return { ...spot, x: 0, y: 0, vx: 0, vy: 0, dust: !cell, on: false, delay: Math.random() * 700, switchAt: 0, phase: Math.random() * Math.PI * 2, next: null };
	});

	const homeX = (p: { gc: number }) => icon.cx - icon.size / 2 + (p.gc + 0.5) * icon.cell;
	const homeY = (p: { gr: number }) => icon.cy - icon.size / 2 + (p.gr + 0.5) * icon.cell;

	function layout() {
		// Same breakpoint as the hero CSS (which measures the window, scrollbar included).
		const wide = matchMedia('(min-width: 761px)').matches;
		icon.size = wide ? Math.min(h * 0.5, w * 0.25) : Math.min(w * 0.42, 200);
		icon.cx = wide ? w * 0.77 : w * 0.5;
		icon.cy = wide ? h * 0.46 : icon.size / 2 + 32;
		icon.cell = icon.size / GRID;
	}

	function morphTo(k: number, now: number) {
		shapeIndex = k;
		const cells = shapes[k];
		parts.forEach((p, i) => {
			const cell = cells[i];
			p.next = cell ? { gc: cell[0], gr: cell[1], dust: false } : { ...dustSpot(), dust: true };
			// A wave from left to right as the pixels peel off to their new places.
			p.switchAt = now + ((cell ? cell[0] : p.gc) / GRID) * 380 + Math.random() * 140;
		});
		onShape?.(SHAPES[k].label);
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
		layout();
		parts.forEach((p) => {
			if (!p.on) { p.x = icon.cx + (Math.random() - 0.5) * w * 1.3; p.y = icon.cy + (Math.random() - 0.5) * h * 1.5; }
		});
		if (!animate) drawStatic();
	}

	function drawGlow(alpha: number) {
		const R = icon.size * 1.05;
		const g = ctx!.createRadialGradient(icon.cx, icon.cy, 0, icon.cx, icon.cy, R);
		g.addColorStop(0, `rgba(${LIME},${0.14 * alpha})`);
		g.addColorStop(1, `rgba(${LIME},0)`);
		ctx!.fillStyle = g;
		ctx!.fillRect(icon.cx - R, icon.cy - R, R * 2, R * 2);
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
		const s = icon.cell * 0.8;
		ctx!.fillStyle = '#fff';
		for (const p of parts) if (!p.dust) ctx!.fillRect(homeX(p) - s / 2, homeY(p) - s / 2, s, s);
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

		drawIcon(t);
	}

	function drawIcon(t: number) {
		if (t < assembleAt) return;
		const since = t - assembleAt;
		drawGlow(Math.min(1, since / 1200));

		// Morph to the next shape every few seconds.
		if (t >= nextMorph) {
			morphTo((shapeIndex + 1) % shapes.length, t);
			nextMorph = t + 3400;
		}

		// Lean away from the mouse and turn towards it (fake 3D); drift slowly when there's no mouse.
		const ptx = pointer.active ? (pointer.x / w - 0.5) * -24 : 0;
		const pty = pointer.active ? (pointer.y / h - 0.5) * -16 : 0;
		par.x += (ptx - par.x) * 0.06;
		par.y += (pty - par.y) * 0.06;
		const ttx = pointer.active ? pointer.x / w - 0.5 : Math.sin(t * 0.0005) * 0.25;
		const tty = pointer.active ? pointer.y / h - 0.5 : Math.cos(t * 0.0004) * 0.2;
		tilt.x += (ttx - tilt.x) * 0.05;
		tilt.y += (tty - tilt.y) * 0.05;

		const mx = pointer.active ? pointer.x : -1e5;
		const my = pointer.active ? pointer.y : -1e5;
		const RR = Math.max(80, icon.size * 0.36);
		const ps = icon.cell * 0.8;
		// A lime scan line sweeps down through the icon.
		const scanY = icon.cy - icon.size * 0.6 + ((t % 2600) / 2600) * icon.size * 1.2;

		for (const p of parts) {
			if (!p.on) {
				if (since < p.delay) continue;
				p.on = true;
			}
			if (p.next && t >= p.switchAt) { p.gc = p.next.gc; p.gr = p.next.gr; p.dust = p.next.dust; p.next = null; }

			const float = p.dust ? 4 : 0.35; // tiny wobble keeps it alive without blurring the edges
			const fx = homeX(p) + par.x + Math.sin(t * 0.0013 + p.phase) * float;
			const fy = homeY(p) + par.y + Math.cos(t * 0.0011 + p.phase) * float;
			let ax = (fx - p.x) * 0.06;
			let ay = (fy - p.y) * 0.06;

			const dx = p.x - mx, dy = p.y - my;
			const d = Math.hypot(dx, dy);
			if (d < RR && d > 0.01) {
				const f = (1 - d / RR) * 4.5;
				ax += (dx / d) * f;
				ay += (dy / d) * f;
			}

			p.vx = (p.vx + ax) * 0.82;
			p.vy = (p.vy + ay) * 0.82;
			p.x += p.vx;
			p.y += p.vy;

			// Perspective: pixels on the side nearest the mouse are drawn bigger and pushed outward.
			const rx = p.x - icon.cx, ry = p.y - icon.cy;
			const persp = 1 + (rx * tilt.x + ry * tilt.y) / (icon.size * 1.4);
			const px = icon.cx + rx * persp, py = icon.cy + ry * persp;

			if (p.dust) {
				ctx!.fillStyle = `rgba(${LIME},0.35)`;
				const s = ps * 0.45;
				ctx!.fillRect(px - s / 2, py - s / 2, s, s);
				continue;
			}
			// Out of place (moving or pushed by the mouse) or under the scan line = lime; otherwise white.
			const off = Math.min(1, Math.hypot(p.x - fx, p.y - fy) / 40);
			const scan = Math.abs(p.y - scanY) < icon.cell * 1.3;
			ctx!.fillStyle = off > 0.35 || scan ? `rgb(${LIME})` : off > 0.08 ? '#e4f7c0' : '#f2f2f2';
			const s = ps * persp * (1 - off * 0.2);
			ctx!.fillRect(px - s / 2, py - s / 2, s, s);
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
		// Burst: blow nearby pixels outward; they flow back into the shape.
		const reach = Math.max(240, icon.size);
		for (const p of parts) {
			const dx = p.x - x, dy = p.y - y;
			const dd = Math.hypot(dx, dy) || 1;
			if (dd < reach) {
				const f = (1 - dd / reach) * 30 + 4;
				p.vx += (dx / dd) * f + (Math.random() - 0.5) * 6;
				p.vy += (dy / dd) * f + (Math.random() - 0.5) * 6;
			}
		}
	});

	new ResizeObserver(resize).observe(canvas);
	let onScreen = false;
	new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; setRunning(onScreen && !document.hidden); }).observe(canvas);
	document.addEventListener('visibilitychange', () => setRunning(onScreen && !document.hidden));
	resize();
	onShape?.(SHAPES[0].label);

	const assemble = () => {
		if (assembleAt !== Infinity) return;
		assembleAt = performance.now();
		nextMorph = assembleAt + 3600;
	};
	// Safety net: build the icon even if the intro never calls assemble().
	setTimeout(assemble, 4500);
	return { assemble };
}
