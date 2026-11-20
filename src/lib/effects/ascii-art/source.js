/**
 * Procedural source content for this demo.
 *
 * Self-contained on purpose: copying this file alongside demo.js is the whole
 * dependency list. It moves, because a still image hides the thing worth
 * watching here, which is tone crossing a glyph boundary.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} time seconds
 * @param {'type'|'gradient'|'shapes'} kind
 */
export function drawSource(ctx, time, kind) {
	const { width: w, height: h } = ctx.canvas;
	const unit = Math.min(w, h);

	ctx.save();
	ctx.fillStyle = '#000';
	ctx.fillRect(0, 0, w, h);

	if (kind === 'gradient' || kind === 'type') {
		const cx = w * (0.5 + 0.26 * Math.cos(time * 0.37));
		const cy = h * (0.5 + 0.26 * Math.sin(time * 0.29));
		const sweep = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.hypot(w, h) * 0.62);
		sweep.addColorStop(0, '#d8d8d8');
		sweep.addColorStop(0.5, '#6a6a6a');
		sweep.addColorStop(1, '#0a0a0a');
		ctx.fillStyle = sweep;
		ctx.fillRect(0, 0, w, h);
	}

	if (kind === 'shapes') {
		// Flat tone with hard edges: the case where a ramp shows its steps,
		// because a whole region lands on one glyph with nothing to hide it.
		for (let i = 0; i < 4; i++) {
			const phase = time * 0.28 + i * 1.55;
			const r = unit * (0.1 + 0.05 * i);
			ctx.fillStyle = `rgb(${245 - i * 52} ${245 - i * 52} ${245 - i * 52})`;
			ctx.beginPath();
			ctx.arc(
				w * 0.5 + Math.cos(phase) * w * 0.25,
				h * 0.5 + Math.sin(phase * 1.31) * h * 0.25,
				r,
				0,
				Math.PI * 2
			);
			ctx.fill();
		}
	}

	if (kind === 'type') {
		// Fit the wordmark to the frame: a fixed size overflows on wide canvases.
		const font = (/** @type {number} */ s) => `900 ${s}px ui-sans-serif, system-ui, sans-serif`;
		ctx.font = font(100);
		const size = Math.min(unit * 0.32, (100 * w * 0.74) / ctx.measureText('ASCII').width);
		ctx.font = font(size);
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		// Black, so the wordmark lands on the blank end of the ramp and is read
		// as the absence of characters. Light type would be spelled in glyphs
		// barely denser than the ones beside it, and would vanish.
		ctx.fillStyle = '#000000';
		ctx.fillText('ASCII', w / 2, h / 2 + Math.sin(time * 0.55) * h * 0.05);
	}

	ctx.restore();
}
