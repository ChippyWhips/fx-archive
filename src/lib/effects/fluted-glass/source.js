/**
 * Procedural source content for this demo.
 *
 * Self-contained on purpose: copying this file alongside demo.js is the whole
 * dependency list. Fluted glass is only legible against something with known
 * straight edges, so the default source is a grid rather than a soft gradient.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} time seconds
 * @param {'grid'|'type'|'scene'} kind
 */
export function drawSource(ctx, time, kind) {
	const { width: w, height: h } = ctx.canvas;
	const unit = Math.min(w, h);

	ctx.save();
	ctx.fillStyle = '#13151a';
	ctx.fillRect(0, 0, w, h);

	if (kind === 'grid' || kind === 'type') {
		const step = unit * 0.11;
		const offset = (time * step * 0.18) % step;
		ctx.strokeStyle = '#e8e4da';
		ctx.lineWidth = Math.max(1, unit * 0.006);
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

	if (kind === 'scene') {
		// Broad soft masses, the way a lobby or a window looks through fluting:
		// nothing readable, everything sliced into vertical bands of colour.
		const masses = [
			['#e2543f', 0.3, 0.36],
			['#2f6ae0', 0.68, 0.58],
			['#f0c24a', 0.46, 0.76]
		];
		for (let i = 0; i < masses.length; i++) {
			const [colour, fx, fy] = masses[i];
			const phase = time * 0.25 + i * 1.9;
			const glow = ctx.createRadialGradient(
				w * Number(fx) + Math.cos(phase) * unit * 0.08,
				h * Number(fy) + Math.sin(phase) * unit * 0.08,
				0,
				w * Number(fx),
				h * Number(fy),
				unit * 0.5
			);
			glow.addColorStop(0, String(colour));
			glow.addColorStop(1, 'rgba(19, 21, 26, 0)');
			ctx.fillStyle = glow;
			ctx.fillRect(0, 0, w, h);
		}
	}

	if (kind === 'type') {
		// Fit the wordmark to the frame: a fixed size overflows on wide canvases.
		const font = (/** @type {number} */ s) => `900 ${s}px ui-sans-serif, system-ui, sans-serif`;
		ctx.font = font(100);
		const size = Math.min(unit * 0.32, (100 * w * 0.76) / ctx.measureText('GLASS').width);
		ctx.font = font(size);
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillStyle = '#f4b942';
		ctx.fillText('GLASS', w / 2, h / 2 + Math.sin(time * 0.5) * h * 0.03);
	}

	ctx.restore();
}
