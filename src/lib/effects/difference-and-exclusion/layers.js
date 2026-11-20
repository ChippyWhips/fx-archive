/**
 * The two layers this demo composites.
 *
 * Self-contained on purpose: copying this file alongside demo.js is the whole
 * dependency list. Both layers are opaque, because a blend mode is about the
 * arithmetic between two colours, and transparency would hide it behind alpha.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} time seconds
 * @param {'tone'|'type'|'stripes'} kind
 */
export function drawBase(ctx, time, kind) {
	const { width: w, height: h } = ctx.canvas;
	const unit = Math.min(w, h);

	ctx.save();

	if (kind === 'tone') {
		// A full black-to-white ramp: difference flips the top layer where the
		// ramp is white and leaves it alone where the ramp is black.
		const ramp = ctx.createLinearGradient(0, 0, w, 0);
		ramp.addColorStop(0, '#000000');
		ramp.addColorStop(1, '#ffffff');
		ctx.fillStyle = ramp;
		ctx.fillRect(0, 0, w, h);
	}

	if (kind === 'stripes' || kind === 'type') {
		ctx.fillStyle = '#0d0d0d';
		ctx.fillRect(0, 0, w, h);
	}

	if (kind === 'stripes') {
		const step = unit * 0.1;
		ctx.fillStyle = '#ffffff';
		for (let x = -step * 2 + ((time * step * 0.4) % (step * 2)); x < w + step; x += step * 2) {
			ctx.fillRect(x, 0, step, h);
		}
	}

	if (kind === 'type') {
		// Fit the wordmark to the frame: a fixed size overflows on wide canvases.
		const font = (/** @type {number} */ s) => `900 ${s}px ui-sans-serif, system-ui, sans-serif`;
		ctx.font = font(100);
		const size = Math.min(unit * 0.36, (100 * w * 0.84) / ctx.measureText('INVERT').width);
		ctx.font = font(size);
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillStyle = '#ffffff';
		ctx.fillText('INVERT', w / 2, h / 2 + Math.sin(time * 0.5) * h * 0.04);
	}

	ctx.restore();
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} time seconds
 * @param {'discs'|'grey ramp'|'flat colour'} kind
 * @param {string} colour
 * @param {{ x: number, y: number } | null} focus device pixels, or null to orbit
 */
export function drawBlend(ctx, time, kind, colour, focus) {
	const { width: w, height: h } = ctx.canvas;
	const unit = Math.min(w, h);

	ctx.save();
	// Black, not grey. Black is the identity for difference and exclusion, so
	// the empty part of the layer leaves the backdrop exactly as it was.
	ctx.fillStyle = '#000000';
	ctx.fillRect(0, 0, w, h);

	if (kind === 'discs') {
		const colours = ['#e5243b', '#1f6feb', '#f2c400'];
		const cx = focus ? focus.x : w * 0.5;
		const cy = focus ? focus.y : h * 0.5;
		// Additive so the overlaps reach white, which difference turns into a
		// full inversion of whatever is underneath.
		ctx.globalCompositeOperation = 'lighter';
		for (let i = 0; i < colours.length; i++) {
			const phase = time * 0.35 + (i * Math.PI * 2) / 3;
			ctx.fillStyle = colours[i];
			ctx.beginPath();
			ctx.arc(
				cx + Math.cos(phase) * unit * 0.15,
				cy + Math.sin(phase) * unit * 0.15,
				unit * 0.27,
				0,
				Math.PI * 2
			);
			ctx.fill();
		}
	}

	if (kind === 'grey ramp') {
		// The diagnostic layer: a grey sweep in the other direction, so you can
		// read off what each mode does at every pair of input levels.
		const ramp = ctx.createLinearGradient(0, h, 0, 0);
		ramp.addColorStop(0, '#000000');
		ramp.addColorStop(1, '#ffffff');
		ctx.fillStyle = ramp;
		ctx.fillRect(0, 0, w, h);
	}

	if (kind === 'flat colour') {
		ctx.fillStyle = colour;
		ctx.fillRect(0, 0, w, h);
	}

	ctx.restore();
}
