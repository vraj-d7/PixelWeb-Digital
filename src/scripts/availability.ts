// "Online now / back at ..." status from the business hours in site.ts.
// Any element with data-availability (plus data-tz, data-days, data-open, data-close) gets the class
// is-open while you're working, and its [data-avail-text] child gets the message.
// data-avail-style="short" gives a compact version for the header.

const NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function update(el: HTMLElement) {
	const tz = el.dataset.tz ?? 'UTC';
	const days = (el.dataset.days ?? '').split(',').map(Number);
	const toMin = (t = '0:0') => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
	const open = toMin(el.dataset.open), close = toMin(el.dataset.close);
	const short = el.dataset.availStyle === 'short';
	const label = (min: number) => new Date(2000, 0, 1, Math.floor(min / 60), min % 60).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });

	const parts = new Intl.DateTimeFormat('en-GB', { timeZone: tz, weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
	const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
	const day = SHORT.indexOf(get('weekday'));
	const now = Number(get('hour')) * 60 + Number(get('minute'));
	const isOpen = days.includes(day) && now >= open && now < close;

	let text = short ? 'online now' : "We're online now · replies within one working day";
	if (!isOpen) {
		let when: string;
		if (days.includes(day) && now < open) when = short ? '' : 'today';
		else {
			let d = day;
			for (let k = 1; k <= 7; k++) { d = (day + k) % 7; if (days.includes(d)) break; }
			when = d === (day + 1) % 7 ? (short ? 'tmrw' : 'tomorrow') : short ? SHORT[d] : NAMES[d];
		}
		text = short ? `back ${when ? `${when} ` : ''}${label(open)}` : `Offline now · back ${when} at ${label(open)}`;
	}
	el.classList.toggle('is-open', isOpen);
	const target = el.querySelector('[data-avail-text]');
	if (target) target.textContent = text;
}

export function startAvailability(root: ParentNode = document) {
	const els = [...root.querySelectorAll<HTMLElement>('[data-availability]')];
	if (!els.length) return;
	const run = () => els.forEach(update);
	run();
	setInterval(run, 60_000);
}
