/**
 * Procedural source content for this demo.
 *
 * Self-contained on purpose: copying this file alongside demo.js is the whole
 * dependency list. Duotone needs a full tonal range to be worth looking at,
 * so the default is a small lit scene rather than flat shapes.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} time seconds
 * @param {'scene'|'type'|'colour'} kind
 */
export function drawSource(ctx, time, kind) {
	const { width: w, height: h } = ctx.canvas;
	const unit = Math.min(w, h);

	ctx.save();

	if (kind === 'scene' || kind === 'type') {
		// Backdrop: a lit wall falling off into shadow, so both ends of the
		// ramp are always present somewhere in the frame.
		const wall = ctx.createLinearGradient(0, 0, w, h);
		wall.addColorStop(0, '#d8d4cc');
		wall.addColorStop(1, '#2a2a2a');
		ctx.fillStyle = wall;
		ctx.fillRect(0, 0, w, h);
		const floor = ctx.createLinearGradient(0, h * 0.68, 0, h);
		floor.addColorStop(0, '#5a5650');
		floor.addColorStop(1, '#141414');
		ctx.fillStyle = floor;
		ctx.fillRect(0, h * 0.68, w, h * 0.32);
	}

	if (kind === 'scene') {
		const light = { x: Math.cos(time * 0.4) * 0.5, y: -0.6 };
		const spheres = [
			{ x: 0.3, r: 0.17, tone: 235, phase: 0 },
			{ x: 0.55, r: 0.22, tone: 170, phase: 2 },
			{ x: 0.78, r: 0.13, tone: 120, phase: 4 }
		];
		for (const s of spheres) {
			const cx = w * s.x + Math.sin(time * 0.5 + s.phase) * unit * 0.04;
			const r = unit * s.r;
			const cy = h * 0.7 - r - Math.abs(Math.sin(time * 0.9 + s.phase)) * unit * 0.08;

			// Contact shadow on the floor, darkest directly underneath.
			ctx.save();
			ctx.translate(cx, h * 0.72);
			ctx.scale(1, 0.22);
			const shadow = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.3);
			shadow.addColorStop(0, 'rgba(0,0,0,0.75)');
			shadow.addColorStop(1, 'rgba(0,0,0,0)');
			ctx.fillStyle = shadow;
			ctx.fillRect(-r * 1.3, -r * 1.3, r * 2.6, r * 2.6);
			ctx.restore();

			// Shading: a highlight offset towards the light, falling to black.
			const shade = ctx.createRadialGradient(
				cx + light.x * r * 0.7,
				cy + light.y * r * 0.7,
				r * 0.05,
				cx,
				cy,
				r
			);
			shade.addColorStop(0, `rgb(255,255,255)`);
			shade.addColorStop(0.35, `rgb(${s.tone},${s.tone},${s.tone})`);
			shade.addColorStop(1, '#0a0a0a');
			ctx.fillStyle = shade;
			ctx.beginPath();
			ctx.arc(cx, cy, r, 0, Math.PI * 2);
			ctx.fill();
		}
	}

	if (kind === 'type') {
		const font = (/** @type {number} */ s) => `900 ${s}px ui-sans-serif, system-ui, sans-serif`;
		ctx.font = font(100);
		const size = Math.min(unit * 0.34, (100 * w * 0.8) / ctx.measureText('TWO').width);
		ctx.font = font(size);
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		const y = h * 0.45 + Math.sin(time * 0.5) * h * 0.03;
		const fill = ctx.createLinearGradient(0, y - size / 2, 0, y + size / 2);
		fill.addColorStop(0, '#ffffff');
		fill.addColorStop(1, '#6e6e6e');
		ctx.fillStyle = 'rgba(0,0,0,0.6)';
		ctx.fillText('TWO', w / 2 + size * 0.06, y + size * 0.08);
		ctx.fillStyle = fill;
		ctx.fillText('TWO', w / 2, y);
	}

	if (kind === 'colour') {
		// Saturated hues of very different brightness: duotone keeps only the
		// brightness, so pure yellow and pure blue end up far apart.
		const hues = ['#f2c400', '#e5243b', '#1f6feb', '#2ca05a'];
		ctx.fillStyle = '#7a7a7a';
		ctx.fillRect(0, 0, w, h);
		for (let i = 0; i < hues.length; i++) {
			const phase = time * 0.3 + (i * Math.PI) / 2;
			ctx.fillStyle = hues[i];
			ctx.beginPath();
			ctx.arc(
				w * 0.5 + Math.cos(phase) * unit * 0.24,
				h * 0.5 + Math.sin(phase) * unit * 0.24,
				unit * 0.2,
				0,
				Math.PI * 2
			);
			ctx.fill();
		}
	}

	ctx.restore();
}
