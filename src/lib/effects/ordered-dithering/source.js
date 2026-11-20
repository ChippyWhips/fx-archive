/**
 * Procedural source content for this demo.
 *
 * Every demo needs something to act on, and it has to move: a still image would
 * hide how the effect behaves over time. This draws a slow sweeping gradient
 * with a wordmark over it, because brand work applies these effects to type far
 * more often than to photographs.
 *
 * Self-contained on purpose. Copying this file alongside demo.js is the whole
 * dependency list.
 */

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} time seconds
 * @param {'gradient'|'type'|'shapes'} kind
 */
export function drawSource(ctx, time, kind) {
	const { width: w, height: h } = ctx.canvas;

	ctx.save();
	ctx.fillStyle = '#000';
	ctx.fillRect(0, 0, w, h);

	if (kind === 'gradient' || kind === 'type') {
		// A radial sweep whose centre drifts, so the tonal ramp moves across the
		// grid and you can watch the dither pattern reorganise.
		const cx = w * (0.5 + 0.28 * Math.cos(time * 0.4));
		const cy = h * (0.5 + 0.28 * Math.sin(time * 0.31));
		const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.hypot(w, h) * 0.6);
		gradient.addColorStop(0, '#ffffff');
		gradient.addColorStop(0.55, '#8a8a8a');
		gradient.addColorStop(1, '#000000');
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, w, h);
	}

	if (kind === 'shapes') {
		// Hard-edged shapes: these show how a dither handles flat tone, where an
		// ordered matrix leaves its grid visible.
		for (let i = 0; i < 5; i++) {
			const phase = time * 0.25 + i * 1.3;
			const r = h * (0.12 + 0.05 * i);
			const x = w * 0.5 + Math.cos(phase) * w * 0.26;
			const y = h * 0.5 + Math.sin(phase * 1.3) * h * 0.26;
			ctx.fillStyle = `rgb(${255 - i * 46} ${255 - i * 46} ${255 - i * 46})`;
			ctx.beginPath();
			ctx.arc(x, y, r, 0, Math.PI * 2);
			ctx.fill();
		}
	}

	if (kind === 'type') {
		// Fit the wordmark to the frame: a fixed size overflows on wide canvases.
		const font = (/** @type {number} */ s) => `900 ${s}px ui-sans-serif, system-ui, sans-serif`;
		ctx.font = font(100);
		const size = Math.min(h * 0.3, (100 * w * 0.78) / ctx.measureText('HALFTONE').width);
		ctx.font = font(size);
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillStyle = '#000';
		ctx.globalCompositeOperation = 'difference';
		ctx.fillStyle = '#ffffff';
		ctx.fillText('HALFTONE', w / 2, h / 2 + Math.sin(time * 0.6) * h * 0.04);
	}

	ctx.restore();
}
