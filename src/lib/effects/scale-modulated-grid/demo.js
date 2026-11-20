/**
 * Scale-modulated grid — Canvas 2D.
 *
 * Lifecycle: `create` on mount, `update` on parameter change, `frame` per tick,
 * `destroy` on unmount. In React that is useEffect(…, []) / useEffect(…, [params])
 * / a requestAnimationFrame loop started in that effect / the effect's cleanup.
 * In Svelte it is $effect, an $effect reading the params rune, the same loop,
 * and the effect's teardown return. On a plain page: call create once the canvas
 * is in the DOM, call update from an input listener, drive frame from
 * requestAnimationFrame, and call destroy on unload.
 *
 * Canvas 2D because the marks are a few thousand vector shapes, and each one
 * stays crisp at any size. The whole effect is one function from position to
 * scale; everything else is drawing.
 */

export const params = {
	field: {
		type: 'select',
		label: 'Field',
		group: 'Field',
		options: ['radial', 'wave', 'noise', 'type'],
		default: 'radial',
		help: 'The rule that sets each mark’s size. Radial follows the pointer.'
	},
	frequency: {
		type: 'range',
		label: 'Frequency',
		group: 'Field',
		min: 0.5,
		max: 8,
		step: 0.1,
		default: 2.2
	},
	steps: {
		type: 'range',
		label: 'Steps',
		group: 'Field',
		min: 0,
		max: 8,
		step: 1,
		default: 0,
		help: 'Quantises the scale. Zero is continuous.'
	},
	speed: {
		type: 'range',
		label: 'Speed',
		group: 'Field',
		min: 0,
		max: 2,
		step: 0.01,
		default: 0.4
	},
	element: {
		type: 'select',
		label: 'Element',
		group: 'Grid',
		options: ['circle', 'square', 'cross', 'bar'],
		default: 'circle'
	},
	columns: {
		type: 'range',
		label: 'Columns',
		group: 'Grid',
		min: 8,
		max: 80,
		step: 1,
		default: 32
	},
	minimum: {
		type: 'range',
		label: 'Smallest',
		group: 'Grid',
		min: 0,
		max: 1,
		step: 0.01,
		default: 0.06,
		help: 'Mark size as a fraction of the cell.'
	},
	maximum: {
		type: 'range',
		label: 'Largest',
		group: 'Grid',
		min: 0,
		max: 1.4,
		step: 0.01,
		default: 0.92
	},
	rotation: {
		type: 'range',
		label: 'Rotation with scale',
		group: 'Grid',
		min: 0,
		max: 90,
		step: 1,
		default: 0,
		unit: '°'
	},
	ink: { type: 'colour', label: 'Ink', group: 'Colour', default: '#f2f0ea' },
	paper: { type: 'colour', label: 'Paper', group: 'Colour', default: '#101010' }
};

/**
 * @param {number} x
 * @param {number} y
 */
function hash(x, y) {
	let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263);
	h = Math.imul(h ^ (h >>> 13), 1274126177);
	h ^= h >>> 16;
	return (h >>> 0) / 4294967296;
}

/**
 * Value noise in [0, 1): hashed lattice values, smoothly interpolated.
 * @param {number} x
 * @param {number} y
 */
function noise(x, y) {
	const ix = Math.floor(x);
	const iy = Math.floor(y);
	const fx = (x - ix) * (x - ix) * (3 - 2 * (x - ix));
	const fy = (y - iy) * (y - iy) * (3 - 2 * (y - iy));
	const a = hash(ix, iy);
	const b = hash(ix + 1, iy);
	const c = hash(ix, iy + 1);
	const d = hash(ix + 1, iy + 1);
	return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {Record<string, any>} initialParams
 */
export function create(canvas, initialParams) {
	const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d', { alpha: false }));

	// The type field is drawn at one pixel per cell, so reading it back is one lookup per mark.
	const mask = document.createElement('canvas');
	const maskCtx = /** @type {CanvasRenderingContext2D} */ (
		mask.getContext('2d', { willReadFrequently: true })
	);

	let settings = { ...initialParams };

	/**
	 * @param {number} cols
	 * @param {number} rows
	 * @param {number} time
	 */
	function typeField(cols, rows, time) {
		if (mask.width !== cols || mask.height !== rows) {
			mask.width = cols;
			mask.height = rows;
		}
		maskCtx.fillStyle = '#000';
		maskCtx.fillRect(0, 0, cols, rows);
		const font = (/** @type {number} */ s) => `900 ${s}px ui-sans-serif, system-ui, sans-serif`;
		maskCtx.font = font(100);
		const size = Math.min(rows * 0.7, (100 * cols * 0.8) / maskCtx.measureText('GRID').width);
		maskCtx.font = font(size);
		maskCtx.textAlign = 'center';
		maskCtx.textBaseline = 'middle';
		maskCtx.fillStyle = '#fff';
		maskCtx.fillText('GRID', cols / 2 + Math.sin(time * 0.5) * cols * 0.04, rows / 2);
		return maskCtx.getImageData(0, 0, cols, rows).data;
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
			const { width: w, height: h } = canvas;
			const { field, frequency, steps, element } = settings;
			const phase = time * settings.speed;

			ctx.fillStyle = settings.paper;
			ctx.fillRect(0, 0, w, h);

			const cols = Math.round(settings.columns);
			const cell = w / cols;
			const rows = Math.ceil(h / cell);
			const top = (h - rows * cell) / 2;

			const px = pointer.inside ? pointer.x : w * (0.5 + 0.22 * Math.cos(time * 0.3));
			const py = pointer.inside ? pointer.y : h * (0.5 + 0.2 * Math.sin(time * 0.41));
			const type = field === 'type' ? typeField(cols, rows, time) : null;
			const wave = (/** @type {number} */ v) => 0.5 + 0.5 * Math.sin(v * Math.PI * 2);

			ctx.beginPath();
			for (let j = 0; j < rows; j++) {
				for (let i = 0; i < cols; i++) {
					const x = (i + 0.5) * cell;
					const y = top + (j + 0.5) * cell;
					// Height-normalised coordinates, so frequency means cycles per frame height.
					const u = (x - w / 2) / h;
					const v = (y - h / 2) / h;

					let f;
					if (field === 'radial') {
						f = wave((Math.hypot(x - px, y - py) / h) * frequency - phase);
					} else if (field === 'wave') {
						f = wave((u * 0.87 + v * 0.5) * frequency - phase);
					} else if (field === 'noise') {
						f = noise(u * frequency * 1.5 + 50, v * frequency * 1.5 - phase * 0.8);
						f = Math.min(1, Math.max(0, (f - 0.5) * 1.8 + 0.5));
					} else {
						const ink = /** @type {Uint8ClampedArray} */ (type)[(j * cols + i) * 4] / 255;
						f = ink * 0.75 + 0.25 * wave((u + v) * frequency - phase);
					}

					// The one line that makes it a system rather than a texture: size = rule(position).
					if (steps > 0) f = Math.round(f * steps) / steps;
					const size = (settings.minimum + (settings.maximum - settings.minimum) * f) * cell;
					if (size <= 0.25) continue;

					const r = size / 2;
					const angle = (f * settings.rotation * Math.PI) / 180;
					const c = Math.cos(angle);
					const s = Math.sin(angle);
					/** @param {number[][]} points corners relative to the centre */
					const polygon = (points) => {
						points.forEach(([a, b], k) => {
							const qx = x + a * c - b * s;
							const qy = y + a * s + b * c;
							if (k === 0) ctx.moveTo(qx, qy);
							else ctx.lineTo(qx, qy);
						});
						ctx.closePath();
					};

					if (element === 'circle') {
						ctx.moveTo(x + r, y);
						ctx.arc(x, y, r, 0, Math.PI * 2);
					} else if (element === 'square') {
						polygon([
							[-r, -r],
							[r, -r],
							[r, r],
							[-r, r]
						]);
					} else if (element === 'cross') {
						const t = r * 0.3;
						polygon([
							[-r, -t],
							[r, -t],
							[r, t],
							[-r, t]
						]);
						polygon([
							[-t, -r],
							[t, -r],
							[t, r],
							[-t, r]
						]);
					} else {
						// Full cell width, modulated height: rows of bars read as a line screen.
						const half = cell * 0.5 + 0.5;
						polygon([
							[-half, -r],
							[half, -r],
							[half, r],
							[-half, r]
						]);
					}
				}
			}
			ctx.fillStyle = settings.ink;
			// Nonzero so overlapping cross arms stay solid.
			ctx.fill('nonzero');
		},

		destroy() {
			mask.width = 0;
			mask.height = 0;
		}
	};
}
