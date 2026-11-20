/**
 * Procedural source content for this demo.
 *
 * Self-contained on purpose: copying this file alongside demo.js is the whole
 * dependency list. A moving source matters here because error diffusion is not
 * deterministic in place: the pattern reorganises completely as tones drift.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} time seconds
 * @param {'gradient'|'type'|'shapes'} kind
 */
export function drawSource(ctx, time, kind) {
	const { width: w, height: h } = ctx.canvas;
	const unit = Math.min(w, h);

	ctx.save();
	ctx.fillStyle = '#000';
	ctx.fillRect(0, 0, w, h);

	if (kind === 'gradient' || kind === 'type') {
		const cx = w * (0.5 + 0.28 * Math.cos(time * 0.37));
		const cy = h * (0.5 + 0.28 * Math.sin(time * 0.29));
		const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.hypot(w, h) * 0.6);
		gradient.addColorStop(0, '#ffffff');
		gradient.addColorStop(0.55, '#8a8a8a');
		gradient.addColorStop(1, '#000000');
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, w, h);
	}

	if (kind === 'shapes') {
		// Flat tone is the case that separates the algorithms: an ordered matrix
		// leaves a visible grid here, error diffusion leaves a wandering grain.
		for (let i = 0; i < 5; i++) {
			const phase = time * 0.24 + i * 1.3;
			const r = unit * (0.1 + 0.045 * i);
			const x = w * 0.5 + Math.cos(phase) * w * 0.26;
			const y = h * 0.5 + Math.sin(phase * 1.3) * h * 0.26;
			ctx.fillStyle = `rgb(${250 - i * 46} ${250 - i * 46} ${250 - i * 46})`;
			ctx.beginPath();
			ctx.arc(x, y, r, 0, Math.PI * 2);
			ctx.fill();
		}
	}

	if (kind === 'type') {
		// Fit the wordmark to the frame: a fixed size overflows on wide canvases.
		const font = (/** @type {number} */ s) => `900 ${s}px ui-sans-serif, system-ui, sans-serif`;
		ctx.font = font(100);
		const size = Math.min(unit * 0.28, (100 * w * 0.78) / ctx.measureText('DIFFUSE').width);
		ctx.font = font(size);
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.globalCompositeOperation = 'difference';
		ctx.fillStyle = '#ffffff';
		ctx.fillText('DIFFUSE', w / 2, h / 2 + Math.sin(time * 0.55) * h * 0.04);
	}

	ctx.restore();
}
