/**
 * Radial blur — raw WebGL2.
 *
 * Lifecycle: `create` on mount, `update` on parameter change, `frame` per tick,
 * `destroy` on unmount. In React that is useEffect(…, []) / useEffect(…, [params])
 * / a requestAnimationFrame loop started in that effect / the effect's cleanup.
 * In Svelte it is $effect, an $effect reading the params rune, the same loop,
 * and the effect's teardown return. On a plain page: call create once the canvas
 * is in the DOM, call update from an input listener, drive frame from
 * requestAnimationFrame, and call destroy on unload.
 *
 * A shader because every pixel averages dozens of samples along the line to
 * the centre. That is a gather, and a 2D canvas cannot gather.
 */

import { createQuadProgram, createCanvasTexture } from './gl.js';
import { fragmentShader } from './shader.js';
import { drawSource } from './source.js';

export const params = {
	source: {
		type: 'select',
		label: 'Source',
		group: 'Source',
		options: ['lights', 'type', 'grid'],
		default: 'lights'
	},
	centre: {
		type: 'select',
		label: 'Centre',
		group: 'Blur',
		options: ['pointer', 'drift', 'fixed'],
		default: 'pointer',
		help: 'Pointer follows the cursor over the canvas and drifts otherwise.'
	},
	strength: {
		type: 'range',
		label: 'Strength',
		group: 'Blur',
		min: 0,
		max: 0.8,
		step: 0.01,
		default: 0.28,
		help: 'How far towards the centre each pixel is smeared.'
	},
	clear: {
		type: 'range',
		label: 'Clear centre',
		group: 'Blur',
		min: 0,
		max: 0.6,
		step: 0.01,
		default: 0.06
	},
	pulse: {
		type: 'range',
		label: 'Pulse',
		group: 'Blur',
		min: 0,
		max: 1,
		step: 0.01,
		default: 0.35,
		help: 'Breathes the strength over time, like a zoom pulled during exposure.'
	},
	gain: {
		type: 'range',
		label: 'Highlight gain',
		group: 'Light',
		min: 0,
		max: 1,
		step: 0.01,
		default: 0.4,
		help: 'Lets bright points throw longer streaks.'
	},
	samples: {
		type: 'range',
		label: 'Samples',
		group: 'Sampling',
		min: 1,
		max: 64,
		step: 1,
		default: 40,
		help: 'Too few and the streaks break into stepped copies.'
	},
	jitter: {
		type: 'range',
		label: 'Jitter',
		group: 'Sampling',
		min: 0,
		max: 1,
		step: 0.01,
		default: 0.6
	}
};

/**
 * @param {HTMLCanvasElement} canvas
 * @param {Record<string, any>} initialParams
 */
export function create(canvas, initialParams) {
	const gl = canvas.getContext('webgl2', { antialias: false, alpha: false });
	if (!gl) throw new Error('WebGL2 is not available');

	const quad = createQuadProgram(gl, fragmentShader);
	const texture = createCanvasTexture(gl);

	const source = document.createElement('canvas');
	const sourceCtx = /** @type {CanvasRenderingContext2D} */ (
		source.getContext('2d', { alpha: false })
	);

	let settings = { ...initialParams };
	const centre = { x: 0.5, y: 0.5 };
	let lastTime = 0;

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
			if (source.width !== canvas.width || source.height !== canvas.height) {
				source.width = canvas.width;
				source.height = canvas.height;
			}

			drawSource(sourceCtx, time, settings.source);

			// Target in uv space, where y runs bottom to top.
			let target = { x: 0.5 + Math.sin(time * 0.37) * 0.18, y: 0.5 + Math.sin(time * 0.53) * 0.14 };
			if (settings.centre === 'fixed') target = { x: 0.5, y: 0.5 };
			if (settings.centre === 'pointer' && pointer?.inside) {
				target = { x: pointer.x / canvas.width, y: 1 - pointer.y / canvas.height };
			}
			const ease = 1 - Math.exp(-Math.max(0, time - lastTime) * 8);
			centre.x += (target.x - centre.x) * (lastTime === 0 ? 1 : ease);
			centre.y += (target.y - centre.y) * (lastTime === 0 ? 1 : ease);
			lastTime = time;

			const breathe = 1 - settings.pulse * 0.5 * (1 + Math.sin(time * 1.3));

			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);

			gl.viewport(0, 0, canvas.width, canvas.height);
			gl.useProgram(quad.program);
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.uniform1i(quad.uniform('uSource'), 0);
			gl.uniform2f(quad.uniform('uResolution'), canvas.width, canvas.height);
			gl.uniform2f(quad.uniform('uCentre'), centre.x, centre.y);
			gl.uniform1f(quad.uniform('uStrength'), settings.strength * breathe);
			gl.uniform1f(quad.uniform('uClear'), settings.clear);
			gl.uniform1f(quad.uniform('uGain'), settings.gain);
			gl.uniform1f(quad.uniform('uSamples'), settings.samples);
			gl.uniform1f(quad.uniform('uJitter'), settings.jitter);
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
			gl.deleteTexture(texture);
			source.width = 0;
			source.height = 0;
		}
	};
}
