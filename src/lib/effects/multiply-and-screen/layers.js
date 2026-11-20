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
	ctx.fillStyle = '#808080';
	ctx.fillRect(0, 0, w, h);

	if (kind === 'tone' || kind === 'type') {
		// A full black-to-white ramp. Multiply and screen both pin one end and
		// leave the other alone, and only a full ramp shows which end.
		const ramp = ctx.createLinearGradient(0, 0, w, h);
		ramp.addColorStop(0, '#0b0b0b');
		ramp.addColorStop(0.5, '#9a9a9a');
		ramp.addColorStop(1, '#ffffff');
		ctx.fillStyle = ramp;
		ctx.fillRect(0, 0, w, h);
	}

	if (kind === 'stripes') {
		ctx.fillStyle = '#111111';
		ctx.fillRect(0, 0, w, h);
		const step = unit * 0.12;
		ctx.fillStyle = '#ffffff';
		for (let x = -step + ((time * step * 0.3) % (step * 2)); x < w + step; x += step * 2) {
			ctx.fillRect(x, 0, step, h);
		}
	}

	if (kind === 'type') {
		// Fit the wordmark to the frame: a fixed size overflows on wide canvases.
		const font = (/** @type {number} */ s) => `900 ${s}px ui-sans-serif, system-ui, sans-serif`;
		ctx.font = font(100);
		const size = Math.min(unit * 0.3, (100 * w * 0.78) / ctx.measureText('BLEND').width);
		ctx.font = font(size);
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillStyle = '#101010';
		ctx.fillText('BLEND', w / 2, h / 2 + Math.sin(time * 0.5) * h * 0.04);
	}

	ctx.restore();
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} time seconds
 * @param {'discs'|'grey ramp'|'flat ink'} kind
 * @param {string} ink
 */
export function drawBlend(ctx, time, kind, ink) {
	const { width: w, height: h } = ctx.canvas;
	const unit = Math.min(w, h);

	ctx.save();
	// Mid grey, not black. A blend mode acts on the whole layer and there is no
	// empty part of it: black would multiply the backdrop away everywhere the
	// discs are not, and white would do the same to screen.
	ctx.fillStyle = '#808080';
	ctx.fillRect(0, 0, w, h);

	if (kind === 'discs') {
		const colours = ['#e5243b', '#1f6feb', '#f2c400'];
		for (let i = 0; i < colours.length; i++) {
			const phase = time * 0.35 + (i * Math.PI * 2) / 3;
			ctx.fillStyle = colours[i];
			ctx.beginPath();
			ctx.arc(
				w * 0.5 + Math.cos(phase) * unit * 0.18,
				h * 0.5 + Math.sin(phase) * unit * 0.18,
				unit * 0.3,
				0,
				Math.PI * 2
			);
			ctx.fill();
		}
	}

	if (kind === 'grey ramp') {
		// The diagnostic layer: a flat grey sweep across the other direction, so
		// you can read off exactly what each mode does to every input level.
		const ramp = ctx.createLinearGradient(0, h, w, 0);
		ramp.addColorStop(0, '#000000');
		ramp.addColorStop(1, '#ffffff');
		ctx.fillStyle = ramp;
		ctx.fillRect(0, 0, w, h);
	}

	if (kind === 'flat ink') {
		ctx.fillStyle = ink;
		ctx.fillRect(0, 0, w, h);
	}

	ctx.restore();
}
