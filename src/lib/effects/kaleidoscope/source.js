/**
 * Procedural source content for this demo.
 *
 * Self-contained on purpose: copying this file alongside demo.js is the whole
 * dependency list. A kaleidoscope needs loose, asymmetric material to work
 * on, like the beads in the object cell of a real one; anything already
 * symmetrical comes out looking the same.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} time seconds
 * @param {'beads'|'type'|'stripes'} kind
 */
export function drawSource(ctx, time, kind) {
	const { width: w, height: h } = ctx.canvas;
	const unit = Math.min(w, h);
	const colours = ['#e2543f', '#2f6ae0', '#f0c24a', '#f4ead8', '#1f8a70'];

	ctx.save();
	ctx.fillStyle = '#13151a';
	ctx.fillRect(0, 0, w, h);

	if (kind === 'beads') {
		// Loose pieces tumbling slowly, each on its own orbit and spin.
		for (let i = 0; i < 110; i++) {
			const phase = time * (0.12 + hash(i * 2.3) * 0.25) + hash(i * 7.1) * 6.283;
			const x = w * (0.5 + (hash(i * 1.3) - 0.5) * 0.9) + Math.cos(phase) * unit * 0.12;
			const y = h * (0.5 + (hash(i * 4.7) - 0.5) * 0.9) + Math.sin(phase * 1.3) * unit * 0.12;
			const size = unit * (0.05 + hash(i * 9.9) * 0.12);
			ctx.save();
			ctx.translate(x, y);
			ctx.rotate(phase * 0.8);
			ctx.globalAlpha = 0.85;
			ctx.fillStyle = colours[i % colours.length];
			const shape = i % 3;
			ctx.beginPath();
			if (shape === 0) ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
			else if (shape === 1) ctx.rect(-size * 0.7, -size * 0.18, size * 1.4, size * 0.36);
			else {
				ctx.moveTo(0, -size * 0.6);
				ctx.lineTo(size * 0.55, size * 0.4);
				ctx.lineTo(-size * 0.55, size * 0.4);
				ctx.closePath();
			}
			ctx.fill();
			ctx.restore();
		}
	}

	if (kind === 'stripes') {
		const band = unit * 0.05;
		ctx.save();
		ctx.translate(w / 2, h / 2);
		ctx.rotate(0.5 + Math.sin(time * 0.2) * 0.3);
		const span = Math.hypot(w, h);
		const offset = (time * band * 0.5) % (band * colours.length);
		for (let i = -Math.ceil(span / band); i * band < span; i++) {
			ctx.fillStyle = colours[((i % colours.length) + colours.length) % colours.length];
			ctx.fillRect(i * band + offset - span / 2, -span / 2, band * 0.6, span);
		}
		ctx.restore();
	}

	if (kind === 'type') {
		// Fit the wordmark to the frame: a fixed size overflows on wide canvases.
		const font = (/** @type {number} */ s) => `900 ${s}px ui-sans-serif, system-ui, sans-serif`;
		ctx.font = font(100);
		const size = Math.min(unit * 0.5, (100 * w * 0.9) / ctx.measureText('MIRROR').width);
		ctx.font = font(size);
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillStyle = '#f4b942';
		ctx.fillText('MIRROR', w / 2 + Math.sin(time * 0.3) * w * 0.15, h / 2);
	}

	ctx.restore();
}

/**
 * Deterministic 0..1 from a number, so the pieces are the same every run.
 * @param {number} n
 */
function hash(n) {
	const s = Math.sin(n * 127.1) * 43758.5453;
	return s - Math.floor(s);
}
