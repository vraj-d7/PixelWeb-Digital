// Interactive grid of pixels behind the hero. Pixels near the pointer light up lime,
// a slow wave and random twinkles keep it alive, and a click sends out a ripple.
// On touch screens (or with no pointer over it) a virtual cursor wanders on its own.

const LIME = '163,230,53';

export function pixelField(canvas: HTMLCanvasElement, animate: boolean) {
	const ctx = canvas.getContext('2d');
	if (!ctx) return;
	const area = (canvas.parentElement ?? canvas) as HTMLElement;

	let w = 0, h = 0, cols = 0, rows = 0, gap = 26;
	let vals = new Float32Array(0);
	const pointer = { x: 0, y: 0, active: false };
	const cur = { x: 0, y: 0 };
	const ripples: { x: number; y: number; t: number }[] = [];
	let running = false;
	let raf = 0;

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
		if (!animate) drawStatic();
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
				let target = d < R ? Math.pow(1 - d / R, 1.8) : 0;

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
		ripples.push({ x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() });
	});

	new ResizeObserver(resize).observe(canvas);
	let onScreen = false;
	new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; setRunning(onScreen && !document.hidden); }).observe(canvas);
	document.addEventListener('visibilitychange', () => setRunning(onScreen && !document.hidden));
	resize();
}
