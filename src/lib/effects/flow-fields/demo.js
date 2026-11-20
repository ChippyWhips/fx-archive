/**
 * Flow fields — Canvas 2D.
 *
 * Lifecycle: `create` on mount, `update` on parameter change, `frame` per tick,
 * `destroy` on unmount. In React that is useEffect(…, []) / useEffect(…, [params])
 * / a requestAnimationFrame loop started in that effect / the effect's cleanup.
 * In Svelte it is $effect, an $effect reading the params rune, the same loop,
 * and the effect's teardown return. On a plain page: call create once the canvas
 * is in the DOM, call update from an input listener, drive frame from
 * requestAnimationFrame, and call destroy on unload.
 *
 * Canvas 2D because the output is lines, and the field is only ever sampled
 * where a particle is. Each particle keeps a short history of its own path,
 * and the whole picture is redrawn from those histories every frame, so trails
 * stay crisp instead of smearing into grey through repeated translucent fills.
 */

import { createNoise3, random } from './noise.js';

export const params = {
	scale: {
		type: 'range',
		label: 'Noise scale',
		group: 'Field',
		min: 0.3,
		max: 6,
		step: 0.05,
		default: 1.6,
		help: 'Noise features across the frame. Low is broad and calm.'
	},
	turns: {
		type: 'range',
		label: 'Turns',
		group: 'Field',
		min: 0.25,
		max: 4,
		step: 0.05,
		default: 1.2
	},
	steps: {
		type: 'range',
		label: 'Angle steps',
		group: 'Field',
		min: 0,
		max: 12,
		step: 1,
		default: 0,
		help: 'Snaps every direction to one of a few. Zero is smooth.'
	},
	drift: {
		type: 'range',
		label: 'Field drift',
		group: 'Field',
		min: 0,
		max: 0.5,
		step: 0.01,
		default: 0.06
	},
	count: {
		type: 'range',
		label: 'Particles',
		group: 'Particles',
		min: 100,
		max: 4000,
		step: 50,
		default: 1200
	},
	speed: {
		type: 'range',
		label: 'Step length',
		group: 'Particles',
		min: 0.5,
		max: 6,
		step: 0.1,
		default: 2.2,
		unit: 'px'
	},
	trail: {
		type: 'range',
		label: 'Trail length',
		group: 'Particles',
		min: 4,
		max: 120,
		step: 1,
		default: 50
	},
	weight: {
		type: 'range',
		label: 'Line weight',
		group: 'Particles',
		min: 0.25,
		max: 4,
		step: 0.05,
		default: 0.9,
		unit: 'px'
	},
	showField: {
		type: 'toggle',
		label: 'Show field',
		group: 'Display',
		default: false
	},
	vortex: {
		type: 'toggle',
		label: 'Pointer bends the field',
		group: 'Display',
		default: true
	},
	ink: { type: 'colour', label: 'Ink', group: 'Display', default: '#141414' },
	paper: { type: 'colour', label: 'Paper', group: 'Display', default: '#f2efe6' }
};

const MAX_COUNT = 4000;
const MAX_TRAIL = 120;

/**
 * @param {HTMLCanvasElement} canvas
 * @param {Record<string, any>} initialParams
 */
export function create(canvas, initialParams) {
	// willReadFrequently keeps this canvas on the CPU rasteriser, which strokes thousands of short paths far more predictably than the GPU one.
	const ctx = /** @type {CanvasRenderingContext2D} */ (
		canvas.getContext('2d', { alpha: false, willReadFrequently: true })
	);
	const noise3 = createNoise3(7);
	const rand = random(11);

	let settings = { ...initialParams };

	// One ring buffer of positions per particle: [x0, y0, x1, y1, ...].
	const trails = new Float32Array(MAX_COUNT * MAX_TRAIL * 2);
	const heads = new Int32Array(MAX_COUNT);
	const lengths = new Int32Array(MAX_COUNT);
	const ages = new Float32Array(MAX_COUNT);
	const lifetimes = new Float32Array(MAX_COUNT);

	let lastTime = 0;
	let vortexX = 0;
	let vortexY = 0;
	let vortexStrength = 0;

	/** Device pixels per CSS pixel, so line weight and step length read the same at any density. */
	const density = () => Math.max(1, canvas.width / Math.max(1, canvas.clientWidth || canvas.width));

	/**
	 * @param {number} i
	 * @param {boolean} stagger spread first-generation ages so they do not all die together
	 */
	function spawn(i, stagger) {
		const x = rand() * canvas.width;
		const y = rand() * canvas.height;
		const base = i * MAX_TRAIL * 2;
		trails[base] = x;
		trails[base + 1] = y;
		heads[i] = 0;
		lengths[i] = 1;
		lifetimes[i] = 3 + rand() * 5;
		ages[i] = stagger ? rand() * lifetimes[i] : 0;
	}

	function spawnAll() {
		for (let i = 0; i < MAX_COUNT; i++) spawn(i, true);
	}

	spawnAll();

	/**
	 * The field itself: one angle per point in the plane.
	 * @param {number} x device pixels
	 * @param {number} y device pixels
	 * @param {number} z time slice through the noise
	 */
	function angleAt(x, y, z) {
		const unit = settings.scale / Math.min(canvas.width, canvas.height);
		// Noise in, direction out. Turns sets how many full rotations the noise range maps to.
		let angle = noise3(x * unit, y * unit, z) * Math.PI * 2 * settings.turns;

		const steps = Math.round(settings.steps);
		if (steps > 0) {
			const slice = (Math.PI * 2) / steps;
			angle = Math.round(angle / slice) * slice;
		}

		if (vortexStrength > 0.001) {
			// Near the pointer the direction blends towards a tangent, so the flow swirls round it.
			const dx = x - vortexX;
			const dy = y - vortexY;
			const radius = Math.min(canvas.width, canvas.height) * 0.22;
			const falloff = Math.exp(-(dx * dx + dy * dy) / (radius * radius)) * vortexStrength;
			const tangent = Math.atan2(dy, dx) + Math.PI * 0.5;
			angle += Math.atan2(Math.sin(tangent - angle), Math.cos(tangent - angle)) * falloff;
		}

		return angle;
	}

	/** @param {number} z */
	function drawField(z) {
		const gap = 28 * density();
		const half = gap * 0.35;
		ctx.beginPath();
		for (let y = gap * 0.5; y < canvas.height; y += gap) {
			for (let x = gap * 0.5; x < canvas.width; x += gap) {
				const a = angleAt(x, y, z);
				const cx = Math.cos(a) * half;
				const cy = Math.sin(a) * half;
				ctx.moveTo(x - cx, y - cy);
				ctx.lineTo(x + cx, y + cy);
			}
		}
		ctx.globalAlpha = 0.25;
		ctx.lineWidth = density();
		ctx.stroke();
		ctx.globalAlpha = 1;
	}

	return {
		/** @param {Record<string, any>} next */
		update(next) {
			settings = { ...next };
		},

		/**
		 * @param {number} time seconds, already scaled by the host's speed control
		 * @param {{ x: number, y: number, inside: boolean }} pointer device pixels
		 */
		frame(time, pointer) {
			if (time < lastTime) spawnAll();
			const dt = Math.min(Math.max(time - lastTime, 0), 1 / 20);
			lastTime = time;

			const target = settings.vortex && pointer.inside ? 1 : 0;
			vortexStrength += (target - vortexStrength) * 0.06;
			if (pointer.inside) {
				vortexX = pointer.x;
				vortexY = pointer.y;
			}

			const count = Math.min(MAX_COUNT, Math.round(settings.count));
			const trail = Math.min(MAX_TRAIL, Math.round(settings.trail));
			const step = settings.speed * density() * dt * 60;
			const z = time * settings.drift;
			const w = canvas.width;
			const h = canvas.height;

			// Advance every particle one step along the field.
			for (let i = 0; i < count; i++) {
				ages[i] += dt;
				const base = i * MAX_TRAIL * 2;
				const head = base + heads[i] * 2;
				const x = trails[head];
				const y = trails[head + 1];
				const a = angleAt(x, y, z);
				const nx = x + Math.cos(a) * step;
				const ny = y + Math.sin(a) * step;

				if (ages[i] > lifetimes[i] || nx < 0 || ny < 0 || nx > w || ny > h) {
					spawn(i, false);
					continue;
				}

				heads[i] = (heads[i] + 1) % MAX_TRAIL;
				trails[base + heads[i] * 2] = nx;
				trails[base + heads[i] * 2 + 1] = ny;
				lengths[i] = Math.min(lengths[i] + 1, MAX_TRAIL);
			}

			ctx.fillStyle = settings.paper;
			ctx.fillRect(0, 0, w, h);
			ctx.strokeStyle = settings.ink;
			ctx.lineCap = 'round';
			ctx.lineJoin = 'round';

			if (settings.showField) drawField(z);

			ctx.lineWidth = settings.weight * density();

			for (let i = 0; i < count; i++) {
				const n = Math.min(lengths[i], trail);
				if (n < 2) continue;
				// Fade in over the first fifth of life and out over the last fifth.
				const t = ages[i] / lifetimes[i];
				ctx.globalAlpha = Math.min(1, t * 5, (1 - t) * 5) * 0.85;

				const base = i * MAX_TRAIL * 2;
				let k = (heads[i] - n + 1 + MAX_TRAIL) % MAX_TRAIL;
				ctx.beginPath();
				ctx.moveTo(trails[base + k * 2], trails[base + k * 2 + 1]);
				for (let s = 1; s < n; s++) {
					k = (k + 1) % MAX_TRAIL;
					ctx.lineTo(trails[base + k * 2], trails[base + k * 2 + 1]);
				}
				ctx.stroke();
			}
			ctx.globalAlpha = 1;
		},

		resize() {
			spawnAll();
		},

		destroy() {}
	};
}
