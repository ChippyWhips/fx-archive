// --- Host: controls, clock and loop. Same behaviour as the site playground. ---

const root = document.querySelector('.vv');
const canvas = root.querySelector('canvas');
const panel = root.querySelector('.vv-panel');

const values = {};
for (const [key, spec] of Object.entries(params)) values[key] = spec.default;

function sizeCanvas() {
	const dpr = Math.min(window.devicePixelRatio || 1, 2);
	const rect = canvas.getBoundingClientRect();
	const width = Math.max(1, Math.round(rect.width * dpr));
	const height = Math.max(1, Math.round(rect.height * dpr));
	if (canvas.width === width && canvas.height === height) return false;
	canvas.width = width;
	canvas.height = height;
	return true;
}

sizeCanvas();
const instance = create(canvas, { ...values });
instance.resize?.(canvas.width, canvas.height);

// --- Controls, built from the same params schema the site uses ----------------

function decimals(step) {
	const text = String(step);
	return text.includes('.') ? text.split('.')[1].length : 0;
}

function format(spec, value) {
	if (spec.type === 'toggle') return value ? 'On' : 'Off';
	if (spec.type === 'range') return value.toFixed(decimals(spec.step ?? 1)) + (spec.unit ?? '');
	return String(value);
}

function row(spec, control, valueNode, stack) {
	const el = document.createElement('div');
	el.className = stack ? 'vv-row vv-stack' : 'vv-row';
	const label = document.createElement('span');
	label.className = 'vv-label';
	label.textContent = spec.label;
	el.append(label);
	if (stack) {
		el.append(control);
	} else {
		el.append(control, valueNode);
	}
	return el;
}

function set(key, value) {
	values[key] = value;
	instance.update?.({ ...values });
	if (!playing) instance.frame(time, pointer);
}

const groups = new Map();
for (const [key, spec] of Object.entries(params)) {
	const name = spec.group ?? 'Controls';
	if (!groups.has(name)) groups.set(name, []);
	groups.get(name).push([key, spec]);
}

for (const [name, entries] of groups) {
	const group = document.createElement('div');
	group.className = 'vv-group';
	const title = document.createElement('div');
	title.className = 'vv-group-title';
	title.textContent = name;
	group.append(title);

	for (const [key, spec] of entries) {
		const value = document.createElement('span');
		value.className = 'vv-value';
		value.textContent = format(spec, values[key]);

		if (spec.type === 'range') {
			const input = document.createElement('input');
			input.type = 'range';
			input.min = spec.min;
			input.max = spec.max;
			input.step = spec.step ?? 1;
			input.value = values[key];
			input.setAttribute('aria-label', spec.label);
			const fill = () => {
				const ratio = (values[key] - spec.min) / (spec.max - spec.min);
				input.style.setProperty('--vv-fill', (ratio * 100).toFixed(2) + '%');
			};
			fill();
			input.addEventListener('input', () => {
				set(key, Number(input.value));
				value.textContent = format(spec, values[key]);
				fill();
			});
			group.append(row(spec, input, value, false));
		} else if (spec.type === 'select') {
			const choices = document.createElement('div');
			choices.className = 'vv-choices';
			for (const option of spec.options) {
				// Options are plain strings or { value, label }.
				const optionValue = typeof option === 'string' ? option : option.value;
				const button = document.createElement('button');
				button.type = 'button';
				button.textContent = typeof option === 'string' ? option : (option.label ?? option.value);
				button.setAttribute('aria-pressed', String(values[key] === optionValue));
				button.addEventListener('click', () => {
					set(key, optionValue);
					for (const sibling of choices.children) {
						sibling.setAttribute('aria-pressed', String(sibling === button));
					}
				});
				choices.append(button);
			}
			group.append(row(spec, choices, value, true));
		} else if (spec.type === 'toggle') {
			const button = document.createElement('button');
			button.type = 'button';
			button.className = 'vv-toggle';
			button.setAttribute('aria-pressed', String(values[key]));
			button.setAttribute('aria-label', spec.label);
			button.append(document.createElement('span'));
			button.addEventListener('click', () => {
				set(key, !values[key]);
				button.setAttribute('aria-pressed', String(values[key]));
			});
			group.append(row(spec, button, value, false));
		} else if (spec.type === 'colour') {
			const input = document.createElement('input');
			input.type = 'color';
			input.value = values[key];
			input.setAttribute('aria-label', spec.label);
			input.addEventListener('input', () => {
				set(key, input.value);
				value.textContent = input.value;
			});
			group.append(row(spec, input, value, false));
		} else if (spec.type === 'action') {
			const button = document.createElement('button');
			button.type = 'button';
			button.className = 'vv-action';
			button.textContent = 'Play';
			button.setAttribute('aria-label', spec.label);
			button.addEventListener('click', () => set(key, (values[key] ?? 0) + 1));
			group.append(row(spec, button, document.createElement('span'), false));
		}
	}

	panel.append(group);
}

// --- Clock, pointer and loop --------------------------------------------------

let time = 0;
let last = 0;
let playing = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const pointer = { x: 0, y: 0, vx: 0, vy: 0, down: false, inside: false };

canvas.addEventListener('pointermove', (event) => {
	const rect = canvas.getBoundingClientRect();
	const scale = canvas.width / rect.width;
	const x = (event.clientX - rect.left) * scale;
	const y = (event.clientY - rect.top) * scale;
	pointer.vx += ((x - pointer.x) * 60 - pointer.vx) * 0.3;
	pointer.vy += ((y - pointer.y) * 60 - pointer.vy) * 0.3;
	pointer.x = x;
	pointer.y = y;
	pointer.inside = true;
});
canvas.addEventListener('pointerleave', () => (pointer.inside = false));
canvas.addEventListener('pointerdown', () => (pointer.down = true));
window.addEventListener('pointerup', () => (pointer.down = false));

new ResizeObserver(() => {
	if (sizeCanvas()) instance.resize?.(canvas.width, canvas.height);
}).observe(canvas);

document.addEventListener('visibilitychange', () => {
	playing = !document.hidden;
	last = 0;
});

requestAnimationFrame(function tick(now) {
	requestAnimationFrame(tick);
	if (!playing) return;
	const seconds = now / 1000;
	// Clamp the step so a backgrounded tab does not jump the simulation.
	const delta = last ? Math.min(seconds - last, 1 / 20) : 0;
	last = seconds;
	time += delta;
	pointer.vx *= Math.exp(-delta * 6);
	pointer.vy *= Math.exp(-delta * 6);
	instance.frame(time, pointer);
});
