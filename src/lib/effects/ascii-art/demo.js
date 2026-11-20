/**
 * ASCII art — Canvas 2D.
 *
 * Lifecycle: `create` on mount, `update` on parameter change, `frame` per tick,
 * `destroy` on unmount. In React that is useEffect(…, []) / useEffect(…, [params])
 * / a requestAnimationFrame loop started in that effect / the effect's cleanup.
 * In Svelte it is $effect, an $effect reading the params rune, the same loop,
 * and the effect's teardown return. On a plain page: call create once the canvas
 * is in the DOM, call update from an input listener, drive frame from
 * requestAnimationFrame, and call destroy on unload.
 *
 * Canvas 2D because the effect ends in text rendering, and a shader has no
 * glyphs. The grid resample is trivial; the typography is the whole problem.
 */

import { drawSource } from './source.js';

/** Dark to light. The first character is the one that stands for black. */
const RAMPS = {
	classic: ' .:-=+*#%@',
	minimal: ' .*#',
	blocks: ' ░▒▓█',
	dense: ' .\'`^",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$'
};

/** A monospace advance is about 0.6 of its em. Used to keep the grid square-ish. */
const ADVANCE = 0.6;

export const params = {
	source: {
		type: 'select',
		label: 'Source',
		group: 'Source',
		options: ['type', 'gradient', 'shapes'],
		default: 'type'
	},
	cell: {
		type: 'range',
		label: 'Row height',
		group: 'Grid',
		min: 10,
		max: 48,
		step: 1,
		default: 26,
		unit: 'px',
		help: 'One character per cell. Column width follows at 0.6 of this.'
	},
	ramp: {
		type: 'select',
		label: 'Ramp',
		group: 'Grid',
		options: ['classic', 'minimal', 'blocks', 'dense'],
		default: 'classic'
	},
	contrast: {
		type: 'range',
		label: 'Contrast',
		group: 'Tone',
		min: 0.3,
		max: 3,
		step: 0.05,
		default: 1.2,
		help: 'Stretches tone around mid grey before it is mapped to a character.'
	},
	invert: { type: 'toggle', label: 'Invert', group: 'Tone', default: false },
	ink: { type: 'colour', label: 'Ink', group: 'Colour', default: '#f2f0ea' },
	paper: { type: 'colour', label: 'Paper', group: 'Colour', default: '#101010' }
};

/**
 * @param {HTMLCanvasElement} canvas
 * @param {Record<string, any>} initialParams
 */
export function create(canvas, initialParams) {
	const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d', { alpha: false }));

	// The source is drawn at one pixel per cell. Letting the browser do the
	// downscale means each cell is an average of its area, not a point sample.
	const source = document.createElement('canvas');
	const sourceCtx = /** @type {CanvasRenderingContext2D} */ (
		source.getContext('2d', { alpha: false, willReadFrequently: true })
	);

	// Every glyph is drawn once into a strip and then blitted per cell.
	// fillText re-shapes and re-rasterises on every call, which at twenty
	// thousand cells a frame is the difference between smooth and unusable.
	const atlas = document.createElement('canvas');
	const atlasCtx = /** @type {CanvasRenderingContext2D} */ (atlas.getContext('2d'));

	let settings = { ...initialParams };
	let cellWidth = 1;
	let cellHeight = 1;
	let glyphs = '';

	function buildAtlas() {
		glyphs = /** @type {Record<string, string>} */ (RAMPS)[settings.ramp] ?? RAMPS.classic;
		cellHeight = Math.max(4, Math.round(settings.cell));
		cellWidth = Math.max(3, Math.round(cellHeight * ADVANCE));

		atlas.width = cellWidth * glyphs.length;
		atlas.height = cellHeight;
		atlasCtx.clearRect(0, 0, atlas.width, atlas.height);
		atlasCtx.font = `${cellHeight}px ui-monospace, SFMono-Regular, Menlo, monospace`;
		atlasCtx.textAlign = 'center';
		atlasCtx.textBaseline = 'middle';
		atlasCtx.fillStyle = settings.ink;
		for (let i = 0; i < glyphs.length; i++) {
			atlasCtx.fillText(glyphs[i], i * cellWidth + cellWidth / 2, cellHeight * 0.54);
		}

		source.width = Math.max(1, Math.ceil(canvas.width / cellWidth));
		source.height = Math.max(1, Math.ceil(canvas.height / cellHeight));
	}

	buildAtlas();

	return {
		/** @param {Record<string, any>} next */
		update(next) {
			const rebuild =
				next.cell !== settings.cell || next.ramp !== settings.ramp || next.ink !== settings.ink;
			settings = { ...next };
			if (rebuild) buildAtlas();
		},

		/** @param {number} time seconds, already scaled by the host's speed control */
		frame(time) {
			const cols = source.width;
			const rows = source.height;
			drawSource(sourceCtx, time, settings.source);
			const pixels = sourceCtx.getImageData(0, 0, cols, rows).data;

			ctx.fillStyle = settings.paper;
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			const last = glyphs.length - 1;
			for (let y = 0; y < rows; y++) {
				for (let x = 0; x < cols; x++) {
					const i = (y * cols + x) * 4;
					// Rec. 601 luma: the eye weights green far above blue, and a
					// flat average turns a saturated blue into mid grey.
					let luma = (0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2]) / 255;
					luma = (luma - 0.5) * settings.contrast + 0.5;
					if (settings.invert) luma = 1 - luma;

					const index = Math.max(0, Math.min(last, Math.round(luma * last)));
					if (index === 0) continue;

					ctx.drawImage(
						atlas,
						index * cellWidth,
						0,
						cellWidth,
						cellHeight,
						x * cellWidth,
						y * cellHeight,
						cellWidth,
						cellHeight
					);
				}
			}
		},

		resize() {
			buildAtlas();
		},

		destroy() {
			source.width = 0;
			source.height = 0;
			atlas.width = 0;
			atlas.height = 0;
		}
	};
}
