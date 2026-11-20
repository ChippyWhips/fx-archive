/**
 * Procedural "footage" for this demo: three shots that cut from one to the next.
 *
 * Self-contained on purpose: copying this file alongside demo.js is the whole
 * dependency list. A datamosh lives at the cut, so the source has to have cuts,
 * and each shot moves differently so the borrowed motion is easy to read.
 */

export const SHOTS = ['type', 'spin', 'pan'];

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} time seconds
 * @param {number} shot index into SHOTS
 */
export function drawShot(ctx, time, shot) {
	const { width: w, height: h } = ctx.canvas;
	const unit = Math.min(w, h);
	const kind = SHOTS[shot % SHOTS.length];

	ctx.save();

	if (kind === 'type') {
		const bands = ['#ff5a36', '#ffc93c', '#2ec4b6', '#3a86ff', '#8338ec'];
		const bandWidth = w / (bands.length - 1);
		const slide = (time * 0.04 * w) % bandWidth;
		for (let i = -1; i < bands.length; i++) {
			ctx.fillStyle = bands[(i + bands.length) % bands.length];
			ctx.fillRect(i * bandWidth + slide, 0, bandWidth + 1, h);
		}

		const font = (/** @type {number} */ s) => `900 ${s}px ui-sans-serif, system-ui, sans-serif`;
		ctx.font = font(100);
		const size = Math.min(unit * 0.42, (100 * w * 0.82) / ctx.measureText('MOSH').width);
		ctx.font = font(size);
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillStyle = '#111111';
		ctx.fillText('MOSH', w / 2, h / 2 + Math.sin(time * 0.8) * h * 0.04);
	}

	if (kind === 'spin') {
		const angle = time * 0.9;
		// Soft tones on purpose: a smooth shot carries little residual, so its motion
		// drags the previous shot around instead of painting over it.
		const sweep = ctx.createConicGradient(angle, w / 2, h / 2);
		['#2a2a33', '#9a9aa6', '#2a2a33', '#9a9aa6', '#2a2a33'].forEach((colour, i, all) =>
			sweep.addColorStop(i / (all.length - 1), colour)
		);
		ctx.fillStyle = sweep;
		ctx.fillRect(0, 0, w, h);
		ctx.fillStyle = '#e5243b';
		ctx.beginPath();
		ctx.arc(
			w / 2 + Math.cos(angle) * unit * 0.22,
			h / 2 + Math.sin(angle) * unit * 0.22,
			unit * 0.08,
			0,
			Math.PI * 2
		);
		ctx.fill();
	}

	if (kind === 'pan') {
		// Soft diagonal bands sliding sideways, like a camera panning past.
		const length = w + h;
		const pitch = unit * 0.32;
		const offset = (time * unit * 0.5) % pitch;
		const bands = ctx.createLinearGradient(0, 0, length / 2, length / 2);
		for (let k = -1; k * pitch < length; k++) {
			const at = (k * pitch + offset) / length;
			if (at >= 0 && at <= 1) bands.addColorStop(at, '#3a3420');
			const mid = at + pitch / 2 / length;
			if (mid >= 0 && mid <= 1) bands.addColorStop(mid, '#b8a35a');
		}
		ctx.fillStyle = bands;
		ctx.fillRect(0, 0, w, h);
		ctx.fillStyle = '#1f6feb';
		ctx.beginPath();
		ctx.arc(
			w * 0.5 + Math.sin(time * 1.2) * w * 0.3,
			h * 0.5 + Math.cos(time * 0.9) * h * 0.2,
			unit * 0.16,
			0,
			Math.PI * 2
		);
		ctx.fill();
	}

	ctx.restore();
}
