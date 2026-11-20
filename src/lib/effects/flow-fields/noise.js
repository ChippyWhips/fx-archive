/**
 * Seeded 3D gradient (Perlin) noise.
 *
 * Kept in this folder rather than pulled from a package, so the effect can be
 * lifted whole. The seed makes every run, and every poster, identical.
 */

/**
 * Small, fast, seedable PRNG (mulberry32).
 * @param {number} seed
 */
export function random(seed) {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** @param {number} seed */
export function createNoise3(seed) {
	const rand = random(seed);
	const perm = new Uint8Array(512);
	const base = Array.from({ length: 256 }, (_, i) => i);
	for (let i = 255; i > 0; i--) {
		const j = Math.floor(rand() * (i + 1));
		[base[i], base[j]] = [base[j], base[i]];
	}
	for (let i = 0; i < 512; i++) perm[i] = base[i & 255];

	const fade = (/** @type {number} */ t) => t * t * t * (t * (t * 6 - 15) + 10);
	const lerp = (/** @type {number} */ a, /** @type {number} */ b, /** @type {number} */ t) =>
		a + (b - a) * t;

	/** Dot product with one of 12 cube-edge gradients, picked by hash. */
	function grad(
		/** @type {number} */ hash,
		/** @type {number} */ x,
		/** @type {number} */ y,
		/** @type {number} */ z
	) {
		const h = hash & 15;
		const u = h < 8 ? x : y;
		const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
		return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
	}

	/** Returns roughly -1..1. */
	return function noise3(
		/** @type {number} */ x,
		/** @type {number} */ y,
		/** @type {number} */ z
	) {
		const X = Math.floor(x) & 255;
		const Y = Math.floor(y) & 255;
		const Z = Math.floor(z) & 255;
		x -= Math.floor(x);
		y -= Math.floor(y);
		z -= Math.floor(z);
		const u = fade(x);
		const v = fade(y);
		const w = fade(z);

		const A = perm[X] + Y;
		const AA = perm[A] + Z;
		const AB = perm[A + 1] + Z;
		const B = perm[X + 1] + Y;
		const BA = perm[B] + Z;
		const BB = perm[B + 1] + Z;

		return lerp(
			lerp(
				lerp(grad(perm[AA], x, y, z), grad(perm[BA], x - 1, y, z), u),
				lerp(grad(perm[AB], x, y - 1, z), grad(perm[BB], x - 1, y - 1, z), u),
				v
			),
			lerp(
				lerp(grad(perm[AA + 1], x, y, z - 1), grad(perm[BA + 1], x - 1, y, z - 1), u),
				lerp(grad(perm[AB + 1], x, y - 1, z - 1), grad(perm[BB + 1], x - 1, y - 1, z - 1), u),
				v
			),
			w
		);
	};
}
