/**
 * Bayer threshold matrices.
 *
 * An ordered dither compares each pixel against a fixed threshold that depends
 * only on its position in a small repeating tile. The Bayer tile is built
 * recursively: each step quadruples the tile and spreads the thresholds as far
 * apart as possible, which is what gives the pattern its even, woven look
 * rather than clumping.
 */

/**
 * @param {number} order 1, 2 or 3 — tile size is 2^order
 * @returns {number[][]} values from 0 to size*size-1
 */
export function bayerMatrix(order) {
	/** @type {number[][]} */
	let matrix = [[0]];

	for (let step = 0; step < order; step++) {
		const n = matrix.length;
		const next = Array.from({ length: n * 2 }, () => new Array(n * 2).fill(0));
		for (let y = 0; y < n; y++) {
			for (let x = 0; x < n; x++) {
				const base = matrix[y][x] * 4;
				// The four offsets are what spread neighbouring thresholds apart.
				next[y][x] = base;
				next[y][x + n] = base + 2;
				next[y + n][x] = base + 3;
				next[y + n][x + n] = base + 1;
			}
		}
		matrix = next;
	}

	return matrix;
}

/**
 * Flatten to a 0–1 threshold per cell, which is the form the inner loop wants.
 * @param {number} order
 * @returns {{ size: number, thresholds: Float32Array }}
 */
export function bayerThresholds(order) {
	const matrix = bayerMatrix(order);
	const size = matrix.length;
	const thresholds = new Float32Array(size * size);
	for (let y = 0; y < size; y++) {
		for (let x = 0; x < size; x++) {
			// +0.5 centres each threshold in its band, so mid grey sits mid pattern.
			thresholds[y * size + x] = (matrix[y][x] + 0.5) / (size * size);
		}
	}
	return { size, thresholds };
}
