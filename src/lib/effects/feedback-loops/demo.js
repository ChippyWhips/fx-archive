/**
 * Feedback loops — raw WebGL2.
 *
 * Lifecycle: `create` on mount, `update` on parameter change, `frame` per tick,
 * `destroy` on unmount. In React that is useEffect(…, []) / useEffect(…, [params])
 * / a requestAnimationFrame loop started in that effect / the effect's cleanup.
 * In Svelte it is $effect, an $effect reading the params rune, the same loop,
 * and the effect's teardown return. On a plain page: call create once the canvas
 * is in the DOM, call update from an input listener, drive frame from
 * requestAnimationFrame, and call destroy on unload.
 *
 * Two textures take turns: each frame reads the last one, transforms it, adds
 * the seed and writes the other. That ping-pong is the camera pointed at its own
 * monitor. Per-frame amounts are scaled by elapsed time, so the speed control and
 * pause behave, and the loop holds still when time does.
 */

import { createQuadProgram, createTexture, createTarget } from './gl.js';
import { loopShader, presentShader } from './shader.js';
import { drawSeed } from './source.js';

export const params = {
	seed: {
		type: 'select',
		label: 'Seed',
		group: 'Seed',
		options: ['dots', 'ring', 'type'],
		default: 'dots',
		help: 'The only new image the loop receives. Draw on the canvas to add more.'
	},
	zoom: {
		type: 'range',
		label: 'Zoom per frame',
		group: 'Loop',
		min: 0.95,
		max: 1.05,
		step: 0.001,
		default: 1.02
	},
	turn: {
		type: 'range',
		label: 'Turn per frame',
		group: 'Loop',
		min: -4,
		max: 4,
		step: 0.1,
		default: 1.2,
		unit: '°'
	},
	gain: {
		type: 'range',
		label: 'Feedback gain',
		group: 'Loop',
		min: 0,
		max: 1,
		step: 0.005,
		default: 0.97,
		help: 'How much of each frame survives the trip. Near 1 it never fades.'
	},
	hue: {
		type: 'range',
		label: 'Hue shift per frame',
		group: 'Loop',
		min: 0,
		max: 20,
		step: 0.5,
		default: 5,
		unit: '°'
	},
	edge: {
		type: 'select',
		label: 'Edges',
		group: 'Loop',
		options: ['black', 'mirror', 'wrap'],
		default: 'black',
		help: 'What the camera sees beyond the edge of the monitor.'
	},
	blend: {
		type: 'select',
		label: 'Seed blend',
		group: 'Composite',
		options: ['screen', 'add', 'over', 'difference'],
		default: 'screen'
	}
};

const BLENDS = { screen: 0, add: 1, over: 2, difference: 3 };
const EDGES = { black: 0, mirror: 1, wrap: 2 };

/**
 * @param {HTMLCanvasElement} canvas
 * @param {Record<string, any>} initialParams
 */
export function create(canvas, initialParams) {
	const gl = canvas.getContext('webgl2', { antialias: false, alpha: false });
	if (!gl) throw new Error('WebGL2 is not available');

	const float = Boolean(gl.getExtension('EXT_color_buffer_float'));
	const loop = createQuadProgram(gl, loopShader);
	const present = createQuadProgram(gl, presentShader);
	const seedTexture = createTexture(gl);

	const seed = document.createElement('canvas');
	const seedCtx = /** @type {CanvasRenderingContext2D} */ (seed.getContext('2d'));

	let settings = { ...initialParams };
	/** @type {ReturnType<typeof createTarget>[]} */
	let frames = [];
	let current = 0;
	let lastTime = -1;

	function allocate() {
		if (seed.width === canvas.width && seed.height === canvas.height && frames.length) return;
		seed.width = canvas.width;
		seed.height = canvas.height;
		for (const target of frames) target.destroy();
		frames = [0, 1].map(() => createTarget(gl, canvas.width, canvas.height, float));
	}

	function drawFrame() {
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.viewport(0, 0, canvas.width, canvas.height);
		gl.useProgram(present.program);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, frames[current].texture);
		gl.uniform1i(present.uniform('uPicture'), 0);
		present.draw();
	}

	allocate();

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
			allocate();
			if (time <= lastTime && time > 0) {
				drawFrame();
				return;
			}

			// One frame at 60fps is one trip round the loop; other rates take a fraction.
			const trips = Math.min(4, Math.max(0, time - lastTime) * 60);
			lastTime = time;

			drawSeed(seedCtx, time, settings.seed, pointer);
			gl.bindTexture(gl.TEXTURE_2D, seedTexture);
			gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
			gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, seed);
			gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
			gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

			const next = 1 - current;
			gl.bindFramebuffer(gl.FRAMEBUFFER, frames[next].framebuffer);
			gl.viewport(0, 0, canvas.width, canvas.height);
			gl.useProgram(loop.program);
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, frames[current].texture);
			gl.uniform1i(loop.uniform('uPrevious'), 0);
			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_2D, seedTexture);
			gl.uniform1i(loop.uniform('uSeed'), 1);
			gl.uniform2f(loop.uniform('uResolution'), canvas.width, canvas.height);
			gl.uniform2f(loop.uniform('uCentre'), 0.5, 0.5);
			gl.uniform1f(loop.uniform('uZoom'), Math.pow(settings.zoom, trips));
			gl.uniform1f(loop.uniform('uTurn'), ((settings.turn * Math.PI) / 180) * trips);
			gl.uniform1f(loop.uniform('uGain'), Math.pow(settings.gain, trips));
			gl.uniform1f(loop.uniform('uHue'), ((settings.hue * Math.PI) / 180) * trips);
			gl.uniform1i(
				loop.uniform('uBlend'),
				/** @type {Record<string, number>} */ (BLENDS)[settings.blend] ?? 0
			);
			gl.uniform1i(
				loop.uniform('uEdge'),
				/** @type {Record<string, number>} */ (EDGES)[settings.edge] ?? 0
			);
			loop.draw();
			current = next;

			drawFrame();
		},

		resize() {
			allocate();
		},

		destroy() {
			loop.destroy();
			present.destroy();
			gl.deleteTexture(seedTexture);
			for (const target of frames) target.destroy();
			seed.width = 0;
		}
	};
}
