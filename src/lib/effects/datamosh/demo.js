/**
 * Datamosh — raw WebGL2, with motion estimation in plain JS.
 *
 * Lifecycle: `create` on mount, `update` on parameter change, `frame` per tick,
 * `destroy` on unmount. In React that is useEffect(…, []) / useEffect(…, [params])
 * / a requestAnimationFrame loop started in that effect / the effect's cleanup.
 * In Svelte it is $effect, an $effect reading the params rune, the same loop,
 * and the effect's teardown return. On a plain page: call create once the canvas
 * is in the DOM, call update from an input listener, drive frame from
 * requestAnimationFrame, and call destroy on unload.
 *
 * A tiny video codec rather than a filter: each frame is encoded as motion
 * vectors plus a residual, then decoded onto whatever the last picture was.
 * Moshing is just letting that last picture be the wrong one. The picture is
 * stateful, so it advances once per new `time` and holds when time stands still.
 */

import { createQuadProgram, createTexture, createTarget } from './gl.js';
import { decodeShader, presentShader } from './shader.js';
import { drawShot } from './source.js';
import { estimateMotion } from './motion.js';

export const params = {
	technique: {
		type: 'select',
		label: 'Technique',
		group: 'Mosh',
		options: ['keyframe removal', 'frame repeat', 'clean encode'],
		default: 'keyframe removal'
	},
	residual: {
		type: 'range',
		label: 'Residual',
		group: 'Mosh',
		min: 0,
		max: 1,
		step: 0.01,
		default: 1,
		help: 'The correction each frame carries. Lower it to let the smear run.'
	},
	heal: {
		type: 'range',
		label: 'Keyframe every',
		group: 'Mosh',
		min: 0,
		max: 20,
		step: 1,
		default: 12,
		unit: 's',
		help: 'A keyframe wipes the mosh clean. 0 never heals.'
	},
	block: {
		type: 'range',
		label: 'Macroblock',
		group: 'Encoder',
		min: 16,
		max: 64,
		step: 16,
		default: 32,
		unit: 'px'
	},
	shot: {
		type: 'range',
		label: 'Shot length',
		group: 'Footage',
		min: 2,
		max: 8,
		step: 0.5,
		default: 3,
		unit: 's'
	}
};

/** Luma samples per macroblock edge; must match motion.js. */
const SAMPLES = 4;

/**
 * @param {HTMLCanvasElement} canvas
 * @param {Record<string, any>} initialParams
 */
export function create(canvas, initialParams) {
	const gl = canvas.getContext('webgl2', { antialias: false, alpha: false });
	if (!gl) throw new Error('WebGL2 is not available');

	const decode = createQuadProgram(gl, decodeShader);
	const present = createQuadProgram(gl, presentShader);
	const sourceTextures = [createTexture(gl), createTexture(gl)];
	const motionTexture = createTexture(gl);

	const source = document.createElement('canvas');
	// CPU-backed, because every frame is also read back for motion estimation.
	const sourceCtx = /** @type {CanvasRenderingContext2D} */ (
		source.getContext('2d', { alpha: false, willReadFrequently: true })
	);
	const luma = document.createElement('canvas');
	const lumaCtx = /** @type {CanvasRenderingContext2D} */ (
		luma.getContext('2d', { alpha: false, willReadFrequently: true })
	);

	let settings = { ...initialParams };
	/** @type {ReturnType<typeof createTarget>[]} */
	let pictures = [];
	let lumaNow = new Uint8Array(0);
	let lumaBefore = new Uint8Array(0);
	let vectors = new Float32Array(0);
	let frozen = new Float32Array(0);
	let size = { width: 0, height: 0, block: 0 };
	let current = 0;
	let sourceSlot = 1;
	let lastTime = -1;
	let lastShot = -1;
	let frozenShot = -1;
	let fresh = true;

	function allocate() {
		const width = canvas.width;
		const height = canvas.height;
		const block = settings.block;
		if (width === size.width && height === size.height && block === size.block) return;
		size = { width, height, block };

		source.width = width;
		source.height = height;
		luma.width = Math.ceil(width / (block / SAMPLES));
		luma.height = Math.ceil(height / (block / SAMPLES));
		lumaNow = new Uint8Array(luma.width * luma.height);
		lumaBefore = new Uint8Array(luma.width * luma.height);
		vectors = new Float32Array(Math.ceil(width / block) * Math.ceil(height / block) * 2);
		frozen = new Float32Array(vectors.length);

		for (const picture of pictures) picture.destroy();
		pictures = [createTarget(gl, width, height), createTarget(gl, width, height)];
		fresh = true;
	}

	function readLuma() {
		lumaCtx.drawImage(source, 0, 0, luma.width, luma.height);
		const data = lumaCtx.getImageData(0, 0, luma.width, luma.height).data;
		for (let i = 0; i < lumaNow.length; i++) {
			lumaNow[i] = (data[i * 4] * 77 + data[i * 4 + 1] * 150 + data[i * 4 + 2] * 29) >> 8;
		}
	}

	/**
	 * Dragging across the frame writes the pointer's motion into nearby vectors.
	 * @param {{ x: number, y: number, vx: number, vy: number, inside: boolean }} pointer
	 * @param {number} dt
	 */
	function pushVectors(pointer, dt) {
		if (!pointer?.inside) return;
		const block = size.block;
		const across = Math.ceil(size.width / block);
		const reach = Math.min(size.width, size.height) * 0.18;
		const limit = block * 2;
		const dx = Math.max(-limit, Math.min(limit, -pointer.vx * dt));
		const dy = Math.max(-limit, Math.min(limit, -pointer.vy * dt));
		for (let i = 0; i < vectors.length / 2; i++) {
			const cx = ((i % across) + 0.5) * block;
			const cy = (Math.floor(i / across) + 0.5) * block;
			const weight = Math.max(0, 1 - Math.hypot(cx - pointer.x, cy - pointer.y) / reach);
			vectors[i * 2] += Math.round(dx * weight);
			vectors[i * 2 + 1] += Math.round(dy * weight);
		}
	}

	function drawPicture() {
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.viewport(0, 0, canvas.width, canvas.height);
		gl.useProgram(present.program);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, pictures[current].texture);
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
		 * @param {{ x: number, y: number, vx: number, vy: number, inside: boolean }} pointer
		 */
		frame(time, pointer) {
			allocate();
			if (time === lastTime) {
				drawPicture();
				return;
			}

			const dt = Math.max(0, time - lastTime);
			const shot = Math.floor(time / settings.shot);
			const cut = shot !== lastShot;
			const heal =
				settings.heal > 0 &&
				Math.floor(time / settings.heal) !== Math.floor(Math.max(0, lastTime) / settings.heal);
			let keyframe = fresh || time < lastTime || heal;

			drawShot(sourceCtx, time, shot);
			readLuma();

			const now = 1 - sourceSlot;
			gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
			gl.bindTexture(gl.TEXTURE_2D, sourceTextures[now]);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
			gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

			// Keyframe removal: the encoder put an I-frame at the cut, and we delete it.
			// The picture holds, and the next shot's motion is decoded onto the last one.
			const hold = cut && !keyframe && settings.technique === 'keyframe removal';
			if (cut && settings.technique !== 'keyframe removal') keyframe = true;

			let residual = settings.residual;
			if (!keyframe && !hold) {
				estimateMotion(lumaNow, lumaBefore, luma.width, luma.height, size.block / SAMPLES, vectors);

				// Frame repeat: keep replaying one frame's vectors, with no correction, so pixels bloom.
				if (settings.technique === 'frame repeat' && time - shot * settings.shot > 0.6) {
					if (frozenShot !== shot) frozen.set(vectors);
					frozenShot = shot;
					vectors.set(frozen);
					residual = 0;
				}
				pushVectors(pointer, dt);
			}

			if (!hold) {
				const before = sourceTextures[sourceSlot];
				const next = 1 - current;
				gl.bindTexture(gl.TEXTURE_2D, motionTexture);
				gl.texImage2D(
					gl.TEXTURE_2D,
					0,
					gl.RG32F,
					Math.ceil(size.width / size.block),
					Math.ceil(size.height / size.block),
					0,
					gl.RG,
					gl.FLOAT,
					vectors
				);

				gl.bindFramebuffer(gl.FRAMEBUFFER, pictures[next].framebuffer);
				gl.viewport(0, 0, size.width, size.height);
				gl.useProgram(decode.program);
				const textures = [pictures[current].texture, sourceTextures[now], before, motionTexture];
				const names = ['uPicture', 'uSource', 'uReference', 'uMotion'];
				textures.forEach((texture, unit) => {
					gl.activeTexture(gl.TEXTURE0 + unit);
					gl.bindTexture(gl.TEXTURE_2D, texture);
					gl.uniform1i(decode.uniform(names[unit]), unit);
				});
				gl.uniform2f(decode.uniform('uResolution'), size.width, size.height);
				gl.uniform1f(decode.uniform('uBlock'), size.block);
				gl.uniform1f(decode.uniform('uResidual'), residual);
				gl.uniform1f(decode.uniform('uKeyframe'), keyframe ? 1 : 0);
				decode.draw();
				current = next;
			}

			drawPicture();

			[lumaNow, lumaBefore] = [lumaBefore, lumaNow];
			sourceSlot = now;
			lastTime = time;
			lastShot = shot;
			fresh = false;
		},

		resize() {
			allocate();
		},

		destroy() {
			decode.destroy();
			present.destroy();
			for (const texture of [...sourceTextures, motionTexture]) gl.deleteTexture(texture);
			for (const picture of pictures) picture.destroy();
			source.width = 0;
			luma.width = 0;
		}
	};
}
