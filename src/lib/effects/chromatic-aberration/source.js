/**
 * Procedural source content for this demo: a moving scene with a wordmark, in
 * colour, because the whole point of this effect is what happens to the three
 * channels relative to each other.
 *
 * Self-contained on purpose — copy it alongside demo.js.
 */

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} time seconds
 */
export function drawSource(ctx, time) {
	const { width: w, height: h } = ctx.canvas;

	ctx.fillStyle = '#0b0b0b';
	ctx.fillRect(0, 0, w, h);

	// Soft drifting bands give the fringing something continuous to act on.
	const bands = ctx.createLinearGradient(0, 0, w, h);
	const shift = (Math.sin(time * 0.3) + 1) / 2;
	bands.addColorStop(0, '#1b1b1b');
	bands.addColorStop(Math.max(0.01, shift * 0.6), '#d8d8d8');
	bands.addColorStop(1, '#2a2a2a');
	ctx.fillStyle = bands;
	ctx.fillRect(0, h * 0.18, w, h * 0.16);

	// A hard-edged ring: the cleanest place to read how far the channels split.
	ctx.strokeStyle = '#f5f5f5';
	ctx.lineWidth = h * 0.012;
	ctx.beginPath();
	ctx.arc(
		w * (0.5 + 0.2 * Math.cos(time * 0.45)),
		h * (0.62 + 0.1 * Math.sin(time * 0.6)),
		h * 0.17,
		0,
		Math.PI * 2
	);
	ctx.stroke();

	// Fit the wordmark to the frame: a fixed size overflows on wide canvases.
	const font = (/** @type {number} */ s) => `900 ${s}px ui-sans-serif, system-ui, sans-serif`;
	ctx.font = font(100);
	const size = Math.min(h * 0.26, (100 * w * 0.78) / ctx.measureText('FRINGE').width);
	ctx.font = font(size);
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillStyle = '#ffffff';
	ctx.fillText('FRINGE', w / 2, h * 0.46);
}
