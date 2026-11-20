/**
 * Procedural source content for this demo.
 *
 * Self-contained on purpose: copying this file alongside demo.js is the whole
 * dependency list. Radial blur is most legible on small bright points against
 * dark, because every point becomes a streak aimed at the centre.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} time seconds
 * @param {'lights'|'type'|'grid'} kind
 */
export function drawSource(ctx, time, kind) {
	const { width: w, height: h } = ctx.canvas;
	const unit = Math.min(w, h);

	ctx.save();
	ctx.fillStyle = '#0d0f14';
	ctx.fillRect(0, 0, w, h);

	if (kind === 'lights') {
		const colours = ['#fff4dc', '#ffb347', '#6fa8ff', '#ff5a3c'];
		// Points drift outward from the middle, as if the camera were travelling.
		for (let i = 0; i < 160; i++) {
			const angle = hash(i * 1.7) * Math.PI * 2;
			const life = (hash(i * 3.1) + time * 0.06) % 1;
			const distance = life * life * Math.hypot(w, h) * 0.6;
			const x = w / 2 + Math.cos(angle) * distance;
			const y = h / 2 + Math.sin(angle) * distance;
			const size = unit * (0.003 + hash(i * 5.3) * 0.009) * (0.4 + life);
			ctx.fillStyle = colours[i % colours.length];
			ctx.beginPath();
			ctx.arc(x, y, size, 0, Math.PI * 2);
			ctx.fill();
		}
		const discs = [
			['#ff5a3c', 0.28, 0.34, 0.07],
			['#f4b942', 0.7, 0.62, 0.09],
			['#2f6ae0', 0.62, 0.26, 0.05]
		];
		for (let i = 0; i < discs.length; i++) {
			const [colour, fx, fy, fr] = discs[i];
			const phase = time * 0.3 + i * 2.1;
			ctx.fillStyle = String(colour);
			ctx.beginPath();
			ctx.arc(
				w * Number(fx) + Math.cos(phase) * unit * 0.05,
				h * Number(fy) + Math.sin(phase) * unit * 0.05,
				unit * Number(fr),
				0,
				Math.PI * 2
			);
			ctx.fill();
		}
	}

	if (kind === 'grid') {
		const step = unit * 0.1;
		const offset = (time * step * 0.25) % step;
		ctx.fillStyle = '#e8e4da';
		for (let x = -step + offset; x < w + step; x += step) {
			for (let y = -step + offset; y < h + step; y += step) {
				ctx.fillRect(x, y, step * 0.42, step * 0.42);
			}
		}
	}

	if (kind === 'type') {
		// Fit the wordmark to the frame: a fixed size overflows on wide canvases.
		const font = (/** @type {number} */ s) => `900 ${s}px ui-sans-serif, system-ui, sans-serif`;
		ctx.font = font(100);
		const size = Math.min(unit * 0.36, (100 * w * 0.8) / ctx.measureText('ZOOM').width);
		ctx.font = font(size);
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillStyle = '#f4b942';
		ctx.fillText('ZOOM', w / 2 + Math.sin(time * 0.4) * w * 0.04, h / 2);
	}

	ctx.restore();
}

/**
 * Deterministic 0..1 from a number, so the light field is the same every run.
 * @param {number} n
 */
function hash(n) {
	const s = Math.sin(n * 127.1) * 43758.5453;
	return s - Math.floor(s);
}
