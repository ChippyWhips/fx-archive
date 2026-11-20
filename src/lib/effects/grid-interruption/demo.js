/**
 * Grid interruption — Canvas 2D.
 *
 * Lifecycle: `create` on mount, `update` on parameter change, `frame` per tick,
 * `destroy` on unmount. In React that is useEffect(…, []) / useEffect(…, [params])
 * / a requestAnimationFrame loop started in that effect / the effect's cleanup.
 * In Svelte it is $effect, an $effect reading the params rune, the same loop,
 * and the effect's teardown return. On a plain page: call create once the canvas
 * is in the DOM, call update from an input listener, drive frame from
 * requestAnimationFrame, and call destroy on unload.
 *
 * Canvas 2D because the marks are vector strokes, as they were on Molnár's
 * plotter. All randomness is hashed from the cell and the seed, never
 * Math.random, so a seed is a picture you can return to.
 */

import { hash, noise } from './random.js';

export const params = {
	element: {
		type: 'select',
		label: 'Element',
		group: 'Grid',
		options: ['lines', 'squares', 'blocks'],
		default: 'lines'
	},
	columns: {
		type: 'range',
		label: 'Columns',
		group: 'Grid',
		min: 6,
		max: 48,
		step: 1,
		default: 24
	},
	weight: {
		type: 'range',
		label: 'Line weight',
		group: 'Grid',
		min: 0.02,
		max: 0.2,
		step: 0.01,
		default: 0.06,
		help: 'As a fraction of the cell.'
	},
	disorder: {
		type: 'range',
		label: 'Disorder',
		group: 'Disorder',
		min: 0,
		max: 1,
		step: 0.01,
		default: 0.7,
		help: 'How far each element may turn and shift from its place.'
	},
	interruption: {
		type: 'range',
		label: 'Interruption',
		group: 'Disorder',
		min: 0,
		max: 0.6,
		step: 0.01,
		default: 0.3,
		help: 'How much of the grid is missing.'
	},
	distribution: {
		type: 'select',
		label: 'Distribution',
		group: 'Disorder',
		options: ['uniform', 'gradient', 'focus'],
		default: 'focus'
	},
	seed: {
		type: 'range',
		label: 'Seed',
		group: 'Disorder',
		min: 1,
		max: 99,
		step: 1,
		default: 7
	},
	cycle: {
		type: 'range',
		label: 'Redraw every',
		group: 'Motion',
		min: 1,
		max: 10,
		step: 0.5,
		default: 4,
		unit: 's'
	},
	drift: {
		type: 'range',
		label: 'Gap drift',
		group: 'Motion',
		min: 0,
		max: 1,
		step: 0.01,
		default: 0.25
	},
	ink: { type: 'colour', label: 'Ink', group: 'Colour', default: '#f2f0ea' },
	paper: { type: 'colour', label: 'Paper', group: 'Colour', default: '#101010' }
};

/** @param {number} t */
const smooth = (t) => {
	const c = Math.min(1, Math.max(0, t));
	return c * c * (3 - 2 * c);
};

/**
 * @param {HTMLCanvasElement} canvas
 * @param {Record<string, any>} initialParams
 */
export function create(canvas, initialParams) {
	const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d', { alpha: false }));
	let settings = { ...initialParams };

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
			const { width: w, height: h } = canvas;
			const { columns, disorder, interruption, distribution, element } = settings;
			const seed = Math.round(settings.seed);

			ctx.fillStyle = settings.paper;
			ctx.fillRect(0, 0, w, h);

			// A margin of one cell all round, as on a plotter sheet.
			const cell = w / (columns + 2);
			const rows = Math.max(1, Math.floor(h / cell) - 2);
			const left = (w - columns * cell) / 2;
			const top = (h - rows * cell) / 2;

			// The random values hold still, then ease to a fresh set at the end of each cycle.
			const epoch = Math.floor(time / settings.cycle);
			const blend = smooth((time / settings.cycle - epoch - 0.7) / 0.3);
			/** @param {number} i @param {number} j @param {number} channel */
			const random = (i, j, channel) => {
				const a = hash(i, j, seed * 7919 + epoch * 31 + channel);
				const b = hash(i, j, seed * 7919 + (epoch + 1) * 31 + channel);
				return a + (b - a) * blend - 0.5;
			};

			const fx = pointer.inside ? pointer.x : w * (0.5 + 0.3 * Math.cos(time * 0.23));
			const fy = pointer.inside ? pointer.y : h * (0.5 + 0.28 * Math.sin(time * 0.31));
			const radius = Math.min(w, h) * 0.45;

			ctx.beginPath();
			for (let j = 0; j < rows; j++) {
				for (let i = 0; i < columns; i++) {
					const cx = left + (i + 0.5) * cell;
					const cy = top + (j + 0.5) * cell;

					let local = 1;
					if (distribution === 'gradient') local = i / Math.max(1, columns - 1);
					if (distribution === 'focus') local = 1 - smooth(Math.hypot(cx - fx, cy - fy) / radius);
					const d = disorder * local;

					// Gaps come from smooth noise, so they cluster into holes rather than scatter.
					const field = noise(i * 0.3 + time * settings.drift, j * 0.3, seed);
					if (field < interruption * local * 1.4) continue;

					if (element === 'lines') {
						const angle = random(i, j, 0) * Math.PI * d;
						const dx = Math.sin(angle) * cell * 0.4;
						const dy = Math.cos(angle) * cell * 0.4;
						ctx.moveTo(cx - dx, cy - dy);
						ctx.lineTo(cx + dx, cy + dy);
					} else if (element === 'squares') {
						for (let ring = 0; ring < 3; ring++) {
							const s = (0.84 - ring * 0.28) * cell * 0.5;
							const corners = [
								[-s, -s],
								[s, -s],
								[s, s],
								[-s, s]
							];
							corners.forEach(([x, y], k) => {
								const jitter = cell * 0.32 * d;
								const px = cx + x + random(i, j, 10 + ring * 8 + k * 2) * jitter;
								const py = cy + y + random(i, j, 11 + ring * 8 + k * 2) * jitter;
								if (k === 0) ctx.moveTo(px, py);
								else ctx.lineTo(px, py);
							});
							ctx.closePath();
						}
					} else {
						const angle = random(i, j, 0) * Math.PI * 0.5 * d;
						const ox = cx + random(i, j, 1) * cell * 0.7 * d;
						const oy = cy + random(i, j, 2) * cell * 0.7 * d;
						const s = cell * 0.36;
						const c = Math.cos(angle);
						const n = Math.sin(angle);
						ctx.moveTo(ox + (-s * c + s * n), oy + (-s * n - s * c));
						ctx.lineTo(ox + (s * c + s * n), oy + (s * n - s * c));
						ctx.lineTo(ox + (s * c - s * n), oy + (s * n + s * c));
						ctx.lineTo(ox + (-s * c - s * n), oy + (-s * n + s * c));
						ctx.closePath();
					}
				}
			}

			if (element === 'blocks') {
				ctx.fillStyle = settings.ink;
				ctx.fill();
			} else {
				ctx.strokeStyle = settings.ink;
				ctx.lineWidth = Math.max(1, cell * settings.weight);
				ctx.lineCap = 'square';
				ctx.lineJoin = 'miter';
				ctx.stroke();
			}
		}
	};
}
