/**
 * Procedural source content for this demo.
 *
 * Self-contained on purpose: copying this file alongside demo.js is the whole
 * dependency list. Pixel sorting needs strong tonal and colour range, so every
 * source spans dark to light with saturated colour in between.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} time seconds
 * @param {'landscape'|'type'|'shapes'} kind
 */
export function drawSource(ctx, time, kind) {
	const { width: w, height: h } = ctx.canvas;
	const unit = Math.min(w, h);

	ctx.save();

	if (kind === 'landscape') {
		const sky = ctx.createLinearGradient(w * 0.2, 0, w * 0.6, h * 0.7);
		sky.addColorStop(0, '#0d1030');
		sky.addColorStop(0.45, '#c2306b');
		sky.addColorStop(0.75, '#ff9a3c');
		sky.addColorStop(1, '#ffe7a8');
		ctx.fillStyle = sky;
		ctx.fillRect(0, 0, w, h);

		const sunY = h * (0.42 + Math.sin(time * 0.25) * 0.06);
		const sun = ctx.createRadialGradient(w * 0.62, sunY, 0, w * 0.62, sunY, unit * 0.2);
		sun.addColorStop(0, '#fffaf0');
		sun.addColorStop(0.7, '#ffd27a');
		sun.addColorStop(1, 'rgba(255, 150, 80, 0)');
		ctx.fillStyle = sun;
		ctx.fillRect(0, 0, w, h);

		// Cloud bars of varying tone give each row something to sort.
		for (let i = 0; i < 16; i++) {
			const y = h * (0.06 + ((i * 0.37) % 1) * 0.5);
			const x = (((i * 0.61 + time * (0.01 + (i % 4) * 0.008)) % 1.4) - 0.2) * w;
			const length = w * (0.12 + ((i * 0.29) % 1) * 0.3);
			ctx.fillStyle = i % 3 === 0 ? 'rgba(255, 214, 170, 0.55)' : 'rgba(60, 20, 70, 0.45)';
			ctx.beginPath();
			ctx.ellipse(x, y, length / 2, h * (0.008 + (i % 5) * 0.004), 0, 0, Math.PI * 2);
			ctx.fill();
		}

		// Three ridges at different speeds: parallax keeps the sort intervals moving.
		const ridges = [
			['#7a2f6a', '#2a0f33'],
			['#4a1c4f', '#140818'],
			['#24102c', '#050208']
		];
		ridges.forEach(([lit, shade], i) => {
			const base = h * (0.62 + i * 0.12);
			const drift = time * (12 + i * 22);
			const fill = ctx.createLinearGradient(0, base - h * 0.14, 0, h);
			fill.addColorStop(0, lit);
			fill.addColorStop(0.5, shade);
			ctx.fillStyle = fill;
			ctx.beginPath();
			ctx.moveTo(0, h);
			for (let x = 0; x <= w; x += Math.max(2, w / 120)) {
				const u = (x + drift * (w / 600)) / w;
				const y = base - Math.abs(Math.sin(u * (5 + i * 3) + i)) * h * (0.14 - i * 0.03);
				ctx.lineTo(x, y);
			}
			ctx.lineTo(w, h);
			ctx.closePath();
			ctx.fill();
		});
	}

	if (kind === 'type') {
		const field = ctx.createLinearGradient(0, 0, w, h);
		field.addColorStop(0, '#1b2cc1');
		field.addColorStop(0.5, '#6a2bd9');
		field.addColorStop(1, '#ff5470');
		ctx.fillStyle = field;
		ctx.fillRect(0, 0, w, h);

		const font = (/** @type {number} */ s) => `900 ${s}px ui-sans-serif, system-ui, sans-serif`;
		ctx.font = font(100);
		const size = Math.min(unit * 0.42, (100 * w * 0.84) / ctx.measureText('SORT').width);
		ctx.font = font(size);
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillStyle = '#fdf6e3';
		ctx.fillText('SORT', w / 2 + Math.sin(time * 0.4) * w * 0.05, h / 2);
		ctx.fillStyle = '#0a0a12';
		ctx.fillRect(0, h * 0.86, w, h * 0.14);
	}

	if (kind === 'shapes') {
		ctx.fillStyle = '#0a0a0c';
		ctx.fillRect(0, 0, w, h);
		const colours = ['#f2c400', '#e5243b', '#1f6feb', '#f4f4f4'];
		colours.forEach((colour, i) => {
			const phase = time * 0.35 + i * 1.7;
			const x = w * 0.5 + Math.cos(phase) * w * 0.28;
			const y = h * 0.5 + Math.sin(phase * 1.3) * h * 0.26;
			const glow = ctx.createRadialGradient(x, y, 0, x, y, unit * 0.22);
			glow.addColorStop(0, colour);
			glow.addColorStop(1, 'rgba(10, 10, 12, 0)');
			ctx.fillStyle = glow;
			ctx.fillRect(0, 0, w, h);
		});
	}

	ctx.restore();
}
