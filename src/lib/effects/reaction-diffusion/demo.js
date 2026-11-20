/**
 * Reaction–diffusion (Gray–Scott) — raw WebGL2.
 *
 * Lifecycle: `create` on mount, `update` on parameter change, `frame` per tick,
 * `destroy` on unmount. In React that is useEffect(…, []) / useEffect(…, [params])
 * / a requestAnimationFrame loop started in that effect / the effect's cleanup.
 * In Svelte it is $effect, an $effect reading the params rune, the same loop,
 * and the effect's teardown return. On a plain page: call create once the canvas
 * is in the DOM, call update from an input listener, drive frame from
 * requestAnimationFrame, and call destroy on unload.
 *
 * A simulation, not a filter: the state lives in two float textures that take
 * turns being read and written (ping-pong), and each frame runs many small
 * steps. The pattern is never drawn; it grows.
 */

import { createQuadProgram, createTarget } from './gl.js';
import { seedShader, simulateShader, displayShader } from './shader.js';

export const params = {
	pattern: {
		type: 'select',
		label: 'Pattern',
		group: 'Reaction',
		options: ['coral', 'mitosis', 'fingerprint', 'maze', 'worms', 'custom'],
		default: 'coral'
	},
	feed: {
		type: 'range',
		label: 'Feed',
		group: 'Reaction',
		min: 0.01,
		max: 0.1,
		step: 0.0005,
		default: 0.0545,
		help: 'Feed and kill apply when Pattern is custom.'
	},
	kill: {
		type: 'range',
		label: 'Kill',
		group: 'Reaction',
		min: 0.04,
		max: 0.07,
		step: 0.0005,
		default: 0.062
	},
	ratio: {
		type: 'range',
		label: 'Diffusion ratio',
		group: 'Reaction',
		min: 0.3,
		max: 0.7,
		step: 0.01,
		default: 0.5,
		help: 'How fast B spreads relative to A.'
	},
	cell: {
		type: 'range',
		label: 'Grid cell',
		group: 'Simulation',
		min: 1,
		max: 6,
		step: 1,
		default: 3,
		unit: 'px',
		help: 'Device pixels per simulation cell. Sets the pattern scale.'
	},
	rate: {
		type: 'range',
		label: 'Steps per second',
		group: 'Simulation',
		min: 60,
		max: 2400,
		step: 60,
		default: 1200
	},
	brush: {
		type: 'toggle',
		label: 'Pointer seeds B',
		group: 'Simulation',
		default: true
	},
	softness: {
		type: 'range',
		label: 'Edge softness',
		group: 'Display',
		min: 0,
		max: 0.5,
		step: 0.01,
		default: 0.06
	},
	ink: { type: 'colour', label: 'Ink', group: 'Display', default: '#141414' },
	paper: { type: 'colour', label: 'Paper', group: 'Display', default: '#f2efe6' }
};

/** Feed and kill pairs. Tiny moves in this plane give completely different behaviour. */
const PRESETS = {
	coral: { feed: 0.0545, kill: 0.062 },
	mitosis: { feed: 0.0367, kill: 0.0649 },
	fingerprint: { feed: 0.037, kill: 0.06 },
	maze: { feed: 0.029, kill: 0.057 },
	worms: { feed: 0.078, kill: 0.061 }
};

/** Steps run in one frame at most, so a stalled tab does not freeze when it resumes. */
const MAX_STEPS_PER_FRAME = 40;

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
	const context = canvas.getContext('webgl2', { antialias: false, alpha: false });
	if (!context) throw new Error('WebGL2 is not available');
	const gl = context;
	// Rendering into float textures is an extension, though every desktop WebGL2 has it.
	if (!gl.getExtension('EXT_color_buffer_float')) {
		throw new Error('EXT_color_buffer_float is not available');
	}

	const seed = createQuadProgram(gl, seedShader);
	const simulate = createQuadProgram(gl, simulateShader);
	const display = createQuadProgram(gl, displayShader);

	let settings = { ...initialParams };
	/** @type {ReturnType<typeof createTarget>[]} */
	let targets = [];
	let current = 0;
	let lastTime = 0;
	let pending = 0;

	function reset() {
		for (const target of targets) target.destroy();
		const cell = Math.max(1, Math.round(settings.cell));
		const width = Math.max(1, Math.ceil(canvas.width / cell));
		const height = Math.max(1, Math.ceil(canvas.height / cell));
		targets = [createTarget(gl, width, height), createTarget(gl, width, height)];
		current = 0;
		pending = 0;

		gl.bindFramebuffer(gl.FRAMEBUFFER, targets[0].framebuffer);
		gl.viewport(0, 0, width, height);
		gl.useProgram(seed.program);
		gl.uniform1f(seed.uniform('uSpacing'), 36);
		seed.draw();
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	}

	reset();

	return {
		/** @param {Record<string, any>} next */
		update(next) {
			const cellChanged = Math.round(next.cell) !== Math.round(settings.cell);
			settings = { ...next };
			if (cellChanged) reset();
		},

		/**
		 * @param {number} time seconds, already scaled by the host's speed control
		 * @param {{ x: number, y: number, vx: number, vy: number, down: boolean, inside: boolean }} pointer device pixels
		 */
		frame(time, pointer) {
			if (time < lastTime) reset();
			const dt = Math.min(Math.max(time - lastTime, 0), 1 / 20);
			lastTime = time;

			// Steps come from elapsed time, so the speed control and pause act on the simulation.
			pending += dt * settings.rate;
			const steps = Math.min(MAX_STEPS_PER_FRAME, Math.floor(pending));
			pending -= steps;

			const preset = /** @type {Record<string, { feed: number, kill: number }>} */ (PRESETS)[
				settings.pattern
			];
			const feed = preset ? preset.feed : settings.feed;
			const kill = preset ? preset.kill : settings.kill;

			const cell = Math.max(1, Math.round(settings.cell));
			const moving = Math.hypot(pointer.vx, pointer.vy) > 40;
			const brushOn = settings.brush && pointer.inside && (pointer.down || moving);
			const { width, height } = targets[0];

			gl.useProgram(simulate.program);
			gl.uniform1f(simulate.uniform('uFeed'), feed);
			gl.uniform1f(simulate.uniform('uKill'), kill);
			gl.uniform1f(simulate.uniform('uDiffA'), 1.0);
			gl.uniform1f(simulate.uniform('uDiffB'), settings.ratio);
			gl.uniform3f(
				simulate.uniform('uBrush'),
				pointer.x / cell,
				(canvas.height - pointer.y) / cell,
				Math.max(3, 24 / cell)
			);
			gl.uniform1f(simulate.uniform('uBrushOn'), brushOn ? 1 : 0);
			gl.uniform1i(simulate.uniform('uState'), 0);
			gl.activeTexture(gl.TEXTURE0);
			gl.viewport(0, 0, width, height);

			for (let i = 0; i < steps; i++) {
				const read = targets[current];
				const write = targets[1 - current];
				gl.bindFramebuffer(gl.FRAMEBUFFER, write.framebuffer);
				gl.bindTexture(gl.TEXTURE_2D, read.texture);
				simulate.draw();
				current = 1 - current;
			}

			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			gl.viewport(0, 0, canvas.width, canvas.height);
			gl.useProgram(display.program);
			gl.bindTexture(gl.TEXTURE_2D, targets[current].texture);
			gl.uniform1i(display.uniform('uState'), 0);
			gl.uniform1f(display.uniform('uSoftness'), settings.softness);
			gl.uniform3fv(display.uniform('uInk'), toRgb(settings.ink));
			gl.uniform3fv(display.uniform('uPaper'), toRgb(settings.paper));
			display.draw();
		},

		resize() {
			reset();
		},

		destroy() {
			for (const target of targets) target.destroy();
			seed.destroy();
			simulate.destroy();
			display.destroy();
		}
	};
}
