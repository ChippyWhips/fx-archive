/**
 * Procedural source content for this demo.
 *
 * Self-contained on purpose: copying this file alongside demo.js is the whole
 * dependency list. It has to move, because a still image hides how a sampling
 * effect behaves when the content drifts under a fixed grid.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} time seconds
 * @param {'type'|'portrait'|'shapes'} kind
 */
export function drawSource(ctx, time, kind) {
	const { width: w, height: h } = ctx.canvas;
	const unit = Math.min(w, h);

	ctx.save();
	ctx.fillStyle = '#101010';
	ctx.fillRect(0, 0, w, h);

	if (kind === 'portrait') {
		// A soft tonal subject: this is where pixelation reads as censorship or
		// as a low-resolution image rather than as a graphic device.
		const cx = w * 0.5 + Math.cos(time * 0.3) * w * 0.06;
		const cy = h * 0.52;
		const glow = ctx.createRadialGradient(cx, cy - unit * 0.05, 0, cx, cy, unit * 0.52);
		glow.addColorStop(0, '#f4f4f4');
		glow.addColorStop(0.45, '#8f8f8f');
		glow.addColorStop(1, '#101010');
		ctx.fillStyle = glow;
		ctx.beginPath();
		ctx.ellipse(cx, cy, unit * 0.26, unit * 0.34, 0, 0, Math.PI * 2);
		ctx.fill();

		ctx.fillStyle = '#101010';
		for (const side of [-1, 1]) {
			ctx.beginPath();
			ctx.ellipse(
				cx + side * unit * 0.1,
				cy - unit * 0.08,
				unit * 0.035,
				unit * 0.02,
				0,
				0,
				Math.PI * 2
			);
			ctx.fill();
		}
	}

	if (kind === 'shapes') {
		for (let i = 0; i < 4; i++) {
			const phase = time * 0.3 + i * 1.6;
			const size = unit * (0.1 + 0.05 * i);
			const x = w * 0.5 + Math.cos(phase) * w * 0.26;
			const y = h * 0.5 + Math.sin(phase * 1.27) * h * 0.26;
			ctx.fillStyle = `rgb(${240 - i * 40} ${240 - i * 40} ${240 - i * 40})`;
			ctx.save();
			ctx.translate(x, y);
			ctx.rotate(phase * 0.4);
			ctx.fillRect(-size, -size, size * 2, size * 2);
			ctx.restore();
		}
	}

	if (kind === 'type') {
		// Type is the hard case: a glyph's thin strokes are the first thing a
		// coarse grid destroys, and the threshold where it stops being legible
		// is exactly what this control is for.
		// Fit the wordmark to the frame: a fixed size overflows on wide canvases.
		const font = (/** @type {number} */ s) => `900 ${s}px ui-sans-serif, system-ui, sans-serif`;
		ctx.font = font(100);
		const size = Math.min(unit * 0.3, (100 * w * 0.78) / ctx.measureText('MOSAIC').width);
		ctx.font = font(size);
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillStyle = '#f4f4f4';
		ctx.fillText('MOSAIC', w / 2, h / 2 + Math.sin(time * 0.5) * h * 0.05);
	}

	ctx.restore();
}
