/**
 * Height-map relief — raw WebGL2.
 *
 * Lifecycle: `create` on mount, `update` on parameter change, `frame` per tick,
 * `destroy` on unmount. In React that is useEffect(…, []) / useEffect(…, [params])
 * / a requestAnimationFrame loop started in that effect / the effect's cleanup.
 * In Svelte it is $effect, an $effect reading the params rune, the same loop,
 * and the effect's teardown return. On a plain page: call create once the canvas
 * is in the DOM, call update from an input listener, drive frame from
 * requestAnimationFrame, and call destroy on unload.
 *
 * A shader because the whole effect is per-pixel: a height sample, two more for
 * the gradient, and a dot product. No geometry exists at any point.
 */

import { createQuadProgram } from './gl.js';
import { fragmentShader } from './shader.js';

export const params = {
	surface: {
		type: 'select',
		label: 'Surface',
		group: 'Height map',
		options: ['ridges', 'dunes', 'terraces'],
		default: 'ridges'
	},
	scale: {
		type: 'range',
		label: 'Feature size',
		group: 'Height map',
		min: 1,
		max: 14,
		step: 0.1,
		default: 3,
		help: 'How many features fit across the frame.'
	},
	octaves: {
		type: 'range',
		label: 'Detail',
		group: 'Height map',
		min: 1,
		max: 6,
		step: 1,
		default: 3,
		help: 'Layers of noise. Each adds half the amplitude at twice the frequency.'
	},
	relief: {
		type: 'range',
		label: 'Relief',
		group: 'Lighting',
		min: 0,
		max: 6,
		step: 0.01,
		default: 1.6,
		help: 'Scales the gradient, which is the same as scaling the height.'
	},
	lightAngle: {
		type: 'range',
		label: 'Light direction',
		group: 'Lighting',
		min: 0,
		max: 360,
		step: 1,
		default: 125,
		unit: '°'
	},
	lightHeight: {
		type: 'range',
		label: 'Light elevation',
		group: 'Lighting',
		min: 0,
		max: 1,
		step: 0.01,
		default: 0.55
	},
	specular: {
		type: 'range',
		label: 'Specular',
		group: 'Lighting',
		min: 0,
		max: 1,
		step: 0.01,
		default: 0.2
	},
	drift: {
		type: 'range',
		label: 'Drift',
		group: 'Motion',
		min: 0,
		max: 1,
		step: 0.01,
		default: 0.12
	},
	view: {
		type: 'select',
		label: 'Show',
		group: 'Motion',
		options: ['lit', 'height', 'normals'],
		default: 'lit'
	}
};

const SURFACES = { dunes: 0, ridges: 1, terraces: 2 };
const VIEWS = { lit: 0, height: 1, normals: 2 };

/**
 * @param {HTMLCanvasElement} canvas
 * @param {Record<string, any>} initialParams
 */
export function create(canvas, initialParams) {
	const gl = canvas.getContext('webgl2', { antialias: false, alpha: false });
	if (!gl) throw new Error('WebGL2 is not available');

	const quad = createQuadProgram(gl, fragmentShader);
	let settings = { ...initialParams };

	/**
	 * @param {Record<string, number>} table
	 * @param {string} key
	 */
	const index = (table, key) => table[key] ?? 0;

	return {
		/** @param {Record<string, any>} next */
		update(next) {
			settings = { ...next };
		},

		/** @param {number} time seconds, already scaled by the host's speed control */
		frame(time) {
			gl.viewport(0, 0, canvas.width, canvas.height);
			gl.useProgram(quad.program);
			gl.uniform2f(quad.uniform('uResolution'), canvas.width, canvas.height);
			gl.uniform1f(quad.uniform('uScale'), settings.scale);
			gl.uniform1f(quad.uniform('uOctaves'), settings.octaves);
			gl.uniform1f(quad.uniform('uSurface'), index(SURFACES, settings.surface));
			gl.uniform1f(quad.uniform('uRelief'), settings.relief);
			gl.uniform1f(quad.uniform('uLightAngle'), settings.lightAngle);
			gl.uniform1f(quad.uniform('uLightHeight'), settings.lightHeight);
			gl.uniform1f(quad.uniform('uSpecular'), settings.specular);
			gl.uniform1f(quad.uniform('uDrift'), time * settings.drift);
			gl.uniform1f(quad.uniform('uView'), index(VIEWS, settings.view));
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
