/**
 * Block-matching motion estimation, the search every video encoder runs.
 *
 * For each macroblock of the current frame, find the offset into the previous
 * frame that matches it best. Done on a small greyscale copy, where one sample
 * stands for a quarter of a block edge, so the search stays cheap in plain JS.
 */

const SAMPLES = 4;
const RANGE = 4;

/**
 * @param {Uint8Array} current luma, `width` × `height`
 * @param {Uint8Array} previous luma, same size
 * @param {number} width
 * @param {number} height
 * @param {number} cell device pixels per luma sample
 * @param {Float32Array} out two floats per block, in device pixels
 */
export function estimateMotion(current, previous, width, height, cell, out) {
	const blocksX = Math.ceil(width / SAMPLES);
	const blocksY = Math.ceil(height / SAMPLES);

	for (let by = 0; by < blocksY; by++) {
		for (let bx = 0; bx < blocksX; bx++) {
			let best = Infinity;
			let bestX = 0;
			let bestY = 0;

			for (let dy = -RANGE; dy <= RANGE; dy++) {
				for (let dx = -RANGE; dx <= RANGE; dx++) {
					// A small penalty on length, so flat areas settle on zero rather than noise.
					let cost = (Math.abs(dx) + Math.abs(dy)) * 2;
					for (let sy = 0; sy < SAMPLES && cost < best; sy++) {
						const y = Math.min(height - 1, by * SAMPLES + sy);
						const py = Math.min(height - 1, Math.max(0, y + dy));
						for (let sx = 0; sx < SAMPLES; sx++) {
							const x = Math.min(width - 1, bx * SAMPLES + sx);
							const px = Math.min(width - 1, Math.max(0, x + dx));
							cost += Math.abs(current[y * width + x] - previous[py * width + px]);
						}
					}
					if (cost < best) {
						best = cost;
						bestX = dx;
						bestY = dy;
					}
				}
			}

			const i = (by * blocksX + bx) * 2;
			out[i] = bestX * cell;
			out[i + 1] = bestY * cell;
		}
	}
}
