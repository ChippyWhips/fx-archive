/**
 * Procedural source content for this demo.
 *
 * Self-contained on purpose: copying this file alongside demo.js is the whole
 * dependency list. It is drawn on a 2D canvas and uploaded as a texture each
 * frame, which keeps the source and the screening step separately readable.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} time seconds
 * @param {'type'|'tone'|'colour'} kind
 */
export function drawSource(ctx, time, kind) {
	const { width: w, height: h } = ctx.canvas;
	const unit = Math.min(w, h);

	ctx.save();
	ctx.fillStyle = '#ffffff';
	ctx.fillRect(0, 0, w, h);

	if (kind === 'tone' || kind === 'type') {
		// A full black-to-white ramp, because the only honest test of a screen
		// is whether it holds its steps at both ends at once.
		const cx = w * (0.5 + 0.22 * Math.cos(time * 0.33));
		const cy = h * (0.5 + 0.22 * Math.sin(time * 0.27));
		const ramp = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.hypot(w, h) * 0.6);
		ramp.addColorStop(0, '#000000');
		ramp.addColorStop(0.55, '#8c8c8c');
		ramp.addColorStop(1, '#ffffff');
		ctx.fillStyle = ramp;
		ctx.fillRect(0, 0, w, h);
	}

	if (kind === 'colour') {
		// Saturated overlapping inks: this is where the rosette shows itself,
		// and where a wrong screen angle turns into moire.
		ctx.fillStyle = '#f2efe6';
		ctx.fillRect(0, 0, w, h);
		const inks = ['#e5243b', '#1f6feb', '#f2c400'];
		ctx.globalCompositeOperation = 'multiply';
		for (let i = 0; i < inks.length; i++) {
			const phase = time * 0.3 + (i * Math.PI * 2) / 3;
			ctx.fillStyle = inks[i];
			ctx.beginPath();
			ctx.arc(
				w * 0.5 + Math.cos(phase) * unit * 0.16,
				h * 0.5 + Math.sin(phase) * unit * 0.16,
				unit * 0.3,
				0,
				Math.PI * 2
			);
			ctx.fill();
		}
		ctx.globalCompositeOperation = 'source-over';
	}

	if (kind === 'type') {
		// Fit the wordmark to the frame: a fixed size overflows on wide canvases.
		const font = (/** @type {number} */ s) => `900 ${s}px ui-sans-serif, system-ui, sans-serif`;
		ctx.font = font(100);
		const size = Math.min(unit * 0.3, (100 * w * 0.76) / ctx.measureText('PRESS').width);
		ctx.font = font(size);
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.globalCompositeOperation = 'difference';
		ctx.fillStyle = '#ffffff';
		ctx.fillText('PRESS', w / 2, h / 2 + Math.sin(time * 0.5) * h * 0.04);
	}

	ctx.restore();
}
