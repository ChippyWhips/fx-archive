/**
 * Procedural source content for this demo.
 *
 * Self-contained on purpose: copying this file alongside demo.js is the whole
 * dependency list. The gradients are smooth and slow, because posterisation is
 * only legible against tone that would otherwise be continuous.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} time seconds
 * @param {'tonal'|'colour'|'type'} kind
 */
export function drawSource(ctx, time, kind) {
	const { width: w, height: h } = ctx.canvas;
	const unit = Math.min(w, h);

	ctx.save();
	ctx.fillStyle = '#000';
	ctx.fillRect(0, 0, w, h);

	if (kind === 'colour') {
		// Two overlapping coloured lights: banding behaves differently per
		// channel, and that is only visible when the channels disagree.
		ctx.globalCompositeOperation = 'lighter';
		/** @type {[string, number][]} */
		const lights = [
			['#ff3c1a', 0.0],
			['#1a6bff', 2.1],
			['#18d08a', 4.2]
		];
		for (const [colour, phase] of lights) {
			const cx = w * (0.5 + 0.26 * Math.cos(time * 0.33 + phase));
			const cy = h * (0.5 + 0.26 * Math.sin(time * 0.27 + phase));
			const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, unit * 0.75);
			gradient.addColorStop(0, colour);
			gradient.addColorStop(1, '#000000');
			ctx.fillStyle = gradient;
			ctx.fillRect(0, 0, w, h);
		}
	} else {
		const cx = w * (0.5 + 0.3 * Math.cos(time * 0.35));
		const cy = h * (0.5 + 0.3 * Math.sin(time * 0.26));
		const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.hypot(w, h) * 0.62);
		gradient.addColorStop(0, '#ffffff');
		gradient.addColorStop(0.5, '#909090');
		gradient.addColorStop(1, '#050505');
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, w, h);
	}

	if (kind === 'type') {
		ctx.globalCompositeOperation = 'difference';
		// Fit the wordmark to the frame: a fixed size overflows on wide canvases.
		const font = (/** @type {number} */ s) => `900 ${s}px ui-sans-serif, system-ui, sans-serif`;
		ctx.font = font(100);
		const size = Math.min(unit * 0.3, (100 * w * 0.78) / ctx.measureText('BANDS').width);
		ctx.font = font(size);
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillStyle = '#ffffff';
		ctx.fillText('BANDS', w / 2, h / 2 + Math.sin(time * 0.5) * h * 0.05);
	}

	ctx.restore();
}
