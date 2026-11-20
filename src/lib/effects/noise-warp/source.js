/**
 * Procedural source content for this demo.
 *
 * Self-contained on purpose: copying this file alongside demo.js is the whole
 * dependency list. A warp is only legible against straight lines, so every
 * source here is built from them.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} time seconds
 * @param {'stripes'|'grid'|'type'} kind
 */
export function drawSource(ctx, time, kind) {
	const { width: w, height: h } = ctx.canvas;
	const unit = Math.min(w, h);

	ctx.save();

	if (kind === 'stripes') {
		// Bands of a fixed palette, like a marbling bath before the comb goes in.
		const colours = ['#13151a', '#e2543f', '#f4ead8', '#2f6ae0', '#f0c24a', '#f4ead8'];
		const band = unit * 0.06;
		const offset = (time * band * 0.4) % (band * colours.length);
		for (let i = -colours.length; i * band < w + h; i++) {
			ctx.fillStyle = colours[((i % colours.length) + colours.length) % colours.length];
			ctx.fillRect(i * band + offset, 0, band + 1, h);
		}
	}

	if (kind === 'grid' || kind === 'type') {
		ctx.fillStyle = '#13151a';
		ctx.fillRect(0, 0, w, h);
		const step = unit * 0.08;
		const offset = (time * step * 0.2) % step;
		ctx.strokeStyle = kind === 'grid' ? '#e8e4da' : '#3a3d46';
		ctx.lineWidth = Math.max(1, unit * 0.005);
		ctx.beginPath();
		for (let x = -step + offset; x < w + step; x += step) {
			ctx.moveTo(x, 0);
			ctx.lineTo(x, h);
		}
		for (let y = -step + offset; y < h + step; y += step) {
			ctx.moveTo(0, y);
			ctx.lineTo(w, y);
		}
		ctx.stroke();
	}

	if (kind === 'type') {
		// Fit the wordmark to the frame: a fixed size overflows on wide canvases.
		const font = (/** @type {number} */ s) => `900 ${s}px ui-sans-serif, system-ui, sans-serif`;
		ctx.font = font(100);
		const size = Math.min(unit * 0.4, (100 * w * 0.8) / ctx.measureText('WARP').width);
		ctx.font = font(size);
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillStyle = '#f4b942';
		ctx.fillText('WARP', w / 2, h / 2);
	}

	ctx.restore();
}
