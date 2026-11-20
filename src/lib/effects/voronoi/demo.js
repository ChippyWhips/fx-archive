/**
 * Voronoi — raw WebGL2.
 *
 * Lifecycle: `create` on mount, `update` on parameter change, `frame` per tick,
 * `destroy` on unmount. In React that is useEffect(…, []) / useEffect(…, [params])
 * / a requestAnimationFrame loop started in that effect / the effect's cleanup.
 * In Svelte it is $effect, an $effect reading the params rune, the same loop,
 * and the effect's teardown return. On a plain page: call create once the canvas
 * is in the DOM, call update from an input listener, drive frame from
 * requestAnimationFrame, and call destroy on unload.
 *
 * A shader rather than a geometric construction: every pixel simply asks which
 * site is nearest. Placing one site per grid cell means each pixel only has to
 * check its neighbours, so the cost is constant however many cells there are.
 */

import { createQuadProgram } from './gl.js';
import { fragmentShader } from './shader.js';

export const params = {
	cells: {
		type: 'range',
		label: 'Cells across',
		group: 'Sites',
		min: 2,
		max: 40,
		step: 0.5,
		default: 6
	},
	jitter: {
		type: 'range',
		label: 'Jitter',
		group: 'Sites',
		min: 0,
		max: 1,
		step: 0.01,
		default: 0.9,
		help: 'At zero the sites sit on a grid and every cell is a square.'
	},
	speed: {
		type: 'range',
		label: 'Site motion',
		group: 'Sites',
		min: 0,
		max: 2,
		step: 0.01,
		default: 0.4
	},
	pointerSite: {
		type: 'toggle',
		label: 'Pointer adds a site',
		group: 'Sites',
		default: true
	},
	metric: {
		type: 'select',
		label: 'Distance',
		group: 'Cells',
		options: ['euclidean', 'manhattan', 'chebyshev'],
		default: 'euclidean'
	},
	mode: {
		type: 'select',
		label: 'Render',
		group: 'Cells',
		options: ['fill', 'edges', 'distance', 'crackle'],
		default: 'fill'
	},
	edge: {
		type: 'range',
		label: 'Edge width',
		group: 'Cells',
		min: 0,
		max: 0.2,
		step: 0.005,
		default: 0.03
	},
	sites: {
		type: 'toggle',
		label: 'Show sites',
		group: 'Cells',
		default: true
	},
	ink: { type: 'colour', label: 'Ink', group: 'Colour', default: '#141414' },
	paper: { type: 'colour', label: 'Paper', group: 'Colour', default: '#f2efe6' }
};

const METRICS = { euclidean: 0, manhattan: 1, chebyshev: 2 };
const MODES = { fill: 0, edges: 1, distance: 2, crackle: 3 };

/** @param {string} hex */
function toRgb(hex) {
	const n = parseInt(hex.replace('#', ''), 16);
	return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {Record<string, any>} initialParams
 */
export function create(canvas, initialParams) {
	const gl = canvas.getContext('webgl2', { antialias: false, alpha: false });
	if (!gl) throw new Error('WebGL2 is not available');

	const quad = createQuadProgram(gl, fragmentShader);
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
			const w = canvas.width;
			const h = canvas.height;
			const short = Math.min(w, h);
			const cellsPerPixel = settings.cells / short;
			const density = Math.max(1, w / Math.max(1, canvas.clientWidth || w));

			gl.viewport(0, 0, w, h);
			gl.useProgram(quad.program);
			gl.uniform2f(quad.uniform('uResolution'), w, h);
			gl.uniform1f(quad.uniform('uTime'), time);
			gl.uniform1f(quad.uniform('uCells'), settings.cells);
			gl.uniform1f(quad.uniform('uJitter'), settings.jitter);
			gl.uniform1f(quad.uniform('uSpeed'), settings.speed);
			gl.uniform1f(
				quad.uniform('uMetric'),
				/** @type {Record<string, number>} */ (METRICS)[settings.metric] ?? 0
			);
			gl.uniform1f(
				quad.uniform('uMode'),
				/** @type {Record<string, number>} */ (MODES)[settings.mode] ?? 0
			);
			gl.uniform1f(quad.uniform('uEdge'), settings.edge);
			// Site markers stay a fixed 3 CSS pixels whatever the cell size.
			gl.uniform1f(quad.uniform('uDot'), settings.sites ? 3 * density * cellsPerPixel : 0);
			// Pointer into the shader's cell space: centred, y up.
			gl.uniform2f(
				quad.uniform('uPointer'),
				(pointer.x - w / 2) * cellsPerPixel,
				(h / 2 - pointer.y) * cellsPerPixel
			);
			gl.uniform1f(quad.uniform('uPointerOn'), settings.pointerSite && pointer.inside ? 1 : 0);
			gl.uniform3fv(quad.uniform('uInk'), toRgb(settings.ink));
			gl.uniform3fv(quad.uniform('uPaper'), toRgb(settings.paper));
			quad.draw();
		},

		/**
		 * @param {number} width device pixels
		 * @param {number} height device pixels
		 */
		resize(width, height) {
			gl.viewport(0, 0, width, height);
		},

		destroy() {
			quad.destroy();
		}
	};
}
