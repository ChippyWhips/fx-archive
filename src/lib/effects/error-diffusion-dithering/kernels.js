/**
 * Error-diffusion kernels.
 *
 * Each entry is a list of [dx, dy, weight]. Weights are divided by the
 * divisor, and every kernel only ever pushes error forward: right on the
 * current row, or down. Pushing error backwards would mean revisiting pixels
 * already decided, which is what makes this a single-pass algorithm.
 */

export const KERNELS = {
	'floyd-steinberg': {
		divisor: 16,
		taps: [
			[1, 0, 7],
			[-1, 1, 3],
			[0, 1, 5],
			[1, 1, 1]
		]
	},

	// Atkinson passes on only 6/8 of the error. The missing quarter is why it
	// blows out highlights and crushes shadows, and why early Macintosh images
	// look the way they do.
	atkinson: {
		divisor: 8,
		taps: [
			[1, 0, 1],
			[2, 0, 1],
			[-1, 1, 1],
			[0, 1, 1],
			[1, 1, 1],
			[0, 2, 1]
		]
	},

	'jarvis-judice-ninke': {
		divisor: 48,
		taps: [
			[1, 0, 7],
			[2, 0, 5],
			[-2, 1, 3],
			[-1, 1, 5],
			[0, 1, 7],
			[1, 1, 5],
			[2, 1, 3],
			[-2, 2, 1],
			[-1, 2, 3],
			[0, 2, 5],
			[1, 2, 3],
			[2, 2, 1]
		]
	},

	sierra: {
		divisor: 4,
		taps: [
			[1, 0, 2],
			[-1, 1, 1],
			[0, 1, 1]
		]
	}
};
