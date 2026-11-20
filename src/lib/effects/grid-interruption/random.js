/**
 * Seeded randomness for this demo. Every value is a pure function of its
 * inputs, so the same seed always draws the same picture.
 */

/**
 * Integer hash of a grid cell and a seed, returned in [0, 1).
 * @param {number} x
 * @param {number} y
 * @param {number} seed
 */
export function hash(x, y, seed) {
	let h =
		Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(seed | 0, 2246822519);
	h = Math.imul(h ^ (h >>> 13), 1274126177);
	h ^= h >>> 16;
	return (h >>> 0) / 4294967296;
}

/** @param {number} t */
const smooth = (t) => t * t * (3 - 2 * t);

/**
 * Value noise: hashed lattice values, smoothly interpolated, in [0, 1).
 * @param {number} x
 * @param {number} y
 * @param {number} seed
 */
export function noise(x, y, seed) {
	const ix = Math.floor(x);
	const iy = Math.floor(y);
	const fx = smooth(x - ix);
	const fy = smooth(y - iy);
	const a = hash(ix, iy, seed);
	const b = hash(ix + 1, iy, seed);
	const c = hash(ix, iy + 1, seed);
	const d = hash(ix + 1, iy + 1, seed);
	return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}
