/**
 * Kaleidoscope — raw WebGL2.
 *
 * Lifecycle: `create` on mount, `update` on parameter change, `frame` per tick,
 * `destroy` on unmount. In React that is useEffect(…, []) / useEffect(…, [params])
 * / a requestAnimationFrame loop started in that effect / the effect's cleanup.
 * In Svelte it is $effect, an $effect reading the params rune, the same loop,
 * and the effect's teardown return. On a plain page: call create once the canvas
 * is in the DOM, call update from an input listener, drive frame from
 * requestAnimationFrame, and call destroy on unload.
 *
 * A shader because every output pixel works out which point of one wedge it
 * is a reflection of, and reads the source there. That is a gather, and 2D
 * cannot gather.
 */

import { createQuadProgram, createCanvasTexture } from './gl.js';
import { fragmentShader } from './shader.js';
import { drawSource } from './source.js';

export const params = {
	source: {
		type: 'select',
		label: 'Object cell',
		group: 'Source',
		options: ['beads', 'stripes', 'type'],
		default: 'beads'
	},
	view: {
		type: 'select',
		label: 'View',
		group: 'Source',
		options: ['kaleidoscope', 'source'],
		default: 'kaleidoscope',
		help: 'Source shows the wedge that is being reflected.'
	},
	segments: {
		type: 'range',
		label: 'Segments',
		group: 'Symmetry',
		min: 2,
		max: 24,
		step: 1,
		default: 8
	},
	mirror: {
		type: 'toggle',
		label: 'Mirror',
		group: 'Symmetry',
		default: true,
		help: 'Off copies the wedge by rotation alone, so the seams show.'
	},
	zoom: {
		type: 'range',
		label: 'Zoom',
		group: 'Sampling',
		min: 0.1,
		max: 2,
		step: 0.01,
		default: 0.9,
		help: 'How much of the source one wedge takes in.'
	},
	turn: {
		type: 'range',
		label: 'Turn',
		group: 'Motion',
		min: -1,
		max: 1,
		step: 0.01,
		default: 0.12,
		help: 'Rotates the wedge over the source, like turning the tube.'
	},
	wander: {
		type: 'range',
		label: 'Wander',
		group: 'Motion',
		min: 0,
		max: 0.4,
		step: 0.01,
		default: 0.12,
		help: 'Drifts the wedge across the source. The pointer steers it directly.'
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
	// Mirrored repeat, so a wedge that reaches past the source edge stays seamless.
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);

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
			let target = {
				x: 0.5 + Math.sin(time * 0.23) * settings.wander,
				y: 0.5 + Math.cos(time * 0.31) * settings.wander
			};
			if (pointer?.inside) {
				target = { x: pointer.x / canvas.width, y: 1 - pointer.y / canvas.height };
			}
			const ease = lastTime === 0 ? 1 : 1 - Math.exp(-Math.max(0, time - lastTime) * 6);
			centre.x += (target.x - centre.x) * ease;
			centre.y += (target.y - centre.y) * ease;
			lastTime = time;

			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);

			gl.viewport(0, 0, canvas.width, canvas.height);
			gl.useProgram(quad.program);
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.uniform1i(quad.uniform('uSource'), 0);
			gl.uniform2f(quad.uniform('uResolution'), canvas.width, canvas.height);
			gl.uniform2f(quad.uniform('uCentre'), centre.x, centre.y);
			gl.uniform1f(quad.uniform('uSegments'), settings.segments);
			gl.uniform1f(quad.uniform('uMirror'), settings.mirror ? 1 : 0);
			gl.uniform1f(quad.uniform('uTurn'), time * settings.turn);
			gl.uniform1f(quad.uniform('uZoom'), settings.zoom);
			gl.uniform1f(quad.uniform('uView'), settings.view === 'source' ? 1 : 0);
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
