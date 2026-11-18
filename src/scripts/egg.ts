// Hidden easter egg: type "pixel", enter the Konami code, or tap the footer logo 5 times.
// The footer wordmark bursts apart, then a tiny pixel Snake game opens.

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
const LIME = '#a3e635';

function trigger() {
	if (document.querySelector('.snake')) return;
	(window as any).__wordmark?.burst?.();
	setTimeout(openSnake, (window as any).__wordmark ? 700 : 0);
}

export function watchForEgg(logo: Element | null) {
	let typed = '';
	let keys: string[] = [];
	addEventListener('keydown', (e) => {
		const t = e.target;
		if ((t instanceof Element && t.closest('input, textarea, select, [contenteditable]')) || document.querySelector('.snake')) return;
		typed = (typed + (e.key.length === 1 ? e.key.toLowerCase() : '')).slice(-5);
		keys = [...keys, e.key.length === 1 ? e.key.toLowerCase() : e.key].slice(-KONAMI.length);
		if (typed === 'pixel' || keys.join() === KONAMI.join()) { typed = ''; keys = []; trigger(); }
	});
	let taps: number[] = [];
	logo?.addEventListener('click', () => {
		const now = performance.now();
		taps = [...taps.filter((t) => now - t < 2500), now];
		if (taps.length >= 5) { taps = []; trigger(); }
	});
}

function openSnake() {
	const N = 16; // grid size
	const wrap = document.createElement('div');
	wrap.className = 'snake';
	wrap.setAttribute('role', 'dialog');
	wrap.setAttribute('aria-modal', 'true');
	wrap.setAttribute('aria-label', 'Pixel Snake, a hidden game');
	wrap.innerHTML = `
		<div class="snake-box">
			<div class="snake-top"><span>&gt; secret_unlocked: pixel_snake</span><button type="button" class="snake-x" aria-label="Close game">×</button></div>
			<canvas width="320" height="320"></canvas>
			<p class="snake-info">score <b data-score>0</b> · best <b data-best>0</b> · arrows / WASD / swipe · esc to quit</p>
		</div>`;
	document.body.append(wrap);
	const lenis = (window as any).__lenis;
	lenis?.stop();

	const canvas = wrap.querySelector('canvas')!;
	const ctx = canvas.getContext('2d')!;
	const scoreEl = wrap.querySelector<HTMLElement>('[data-score]')!;
	const bestEl = wrap.querySelector<HTMLElement>('[data-best]')!;
	const C = canvas.width / N;
	let best = 0;
	try { best = Number(localStorage.getItem('pw-snake-best')) || 0; } catch {}
	bestEl.textContent = String(best);

	let snake: { x: number; y: number }[], dir: { x: number; y: number }, nextDir: { x: number; y: number }, food: { x: number; y: number }, score: number, over: boolean;
	const placeFood = () => {
		do food = { x: Math.floor(Math.random() * N), y: Math.floor(Math.random() * N) };
		while (snake.some((s) => s.x === food.x && s.y === food.y));
	};
	const reset = () => {
		snake = [{ x: 7, y: 8 }, { x: 6, y: 8 }, { x: 5, y: 8 }];
		dir = { x: 1, y: 0 }; nextDir = dir; score = 0; over = false;
		scoreEl.textContent = '0';
		placeFood();
	};
	reset();

	const draw = (t: number) => {
		ctx.fillStyle = '#0b0b0b';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = '#1c1c1c';
		for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) ctx.fillRect(x * C + C / 2 - 1, y * C + C / 2 - 1, 2, 2);
		ctx.fillStyle = Math.floor(t / 300) % 2 ? LIME : '#d9f99d';
		ctx.fillRect(food.x * C + 3, food.y * C + 3, C - 6, C - 6);
		snake.forEach((s, i) => { ctx.fillStyle = i === 0 ? LIME : '#f2f2f2'; ctx.fillRect(s.x * C + 1, s.y * C + 1, C - 2, C - 2); });
		if (over) {
			ctx.fillStyle = 'rgb(11 11 11 / 0.8)';
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.fillStyle = LIME;
			ctx.font = "700 22px 'JetBrains Mono', monospace";
			ctx.textAlign = 'center';
			ctx.fillText('game_over', canvas.width / 2, canvas.height / 2 - 10);
			ctx.fillStyle = '#b4b4b4';
			ctx.font = "700 13px 'JetBrains Mono', monospace";
			ctx.fillText('space / tap to play again', canvas.width / 2, canvas.height / 2 + 18);
		}
	};

	const step = () => {
		if (over) return;
		dir = nextDir;
		const head = { x: (snake[0].x + dir.x + N) % N, y: (snake[0].y + dir.y + N) % N };
		if (snake.some((s) => s.x === head.x && s.y === head.y)) {
			over = true;
			if (score > best) { best = score; bestEl.textContent = String(best); try { localStorage.setItem('pw-snake-best', String(best)); } catch {} }
			return;
		}
		snake.unshift(head);
		if (head.x === food.x && head.y === food.y) { score++; scoreEl.textContent = String(score); placeFood(); }
		else snake.pop();
	};

	let raf = 0, last = 0;
	const loop = (t: number) => {
		raf = requestAnimationFrame(loop);
		if (t - last > Math.max(70, 130 - score * 3)) { last = t; step(); }
		draw(t);
	};
	raf = requestAnimationFrame(loop);

	const turn = (x: number, y: number) => { if (x !== -dir.x || y !== -dir.y) nextDir = { x, y }; };
	const onKey = (e: KeyboardEvent) => {
		const k = e.key.toLowerCase();
		if (k === 'escape') return close();
		if ((k === ' ' || k === 'enter') && over) { e.preventDefault(); return reset(); }
		const map: Record<string, [number, number]> = { arrowup: [0, -1], w: [0, -1], arrowdown: [0, 1], s: [0, 1], arrowleft: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0] };
		if (map[k]) { e.preventDefault(); turn(...map[k]); }
	};
	addEventListener('keydown', onKey);

	let sx = 0, sy = 0;
	canvas.addEventListener('pointerdown', (e) => { sx = e.clientX; sy = e.clientY; if (over) reset(); });
	canvas.addEventListener('pointerup', (e) => {
		const dx = e.clientX - sx, dy = e.clientY - sy;
		if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
		if (Math.abs(dx) > Math.abs(dy)) turn(Math.sign(dx), 0); else turn(0, Math.sign(dy));
	});

	function close() {
		cancelAnimationFrame(raf);
		removeEventListener('keydown', onKey);
		wrap.remove();
		lenis?.start();
	}
	wrap.querySelector('.snake-x')?.addEventListener('click', close);
	wrap.addEventListener('click', (e) => { if (e.target === wrap) close(); });
	(wrap.querySelector('.snake-x') as HTMLElement).focus();
}
