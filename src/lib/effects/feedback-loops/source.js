/**
 * The seed: the only new image the loop ever receives, drawn on a transparent canvas.
 *
 * Self-contained on purpose: copying this file alongside demo.js is the whole
 * dependency list. Seeds are small and moving, so everything else on screen is
 * visibly the loop's own echo of them.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} time seconds
 * @param {'ring'|'type'|'dots'} kind
 * @param {{ x: number, y: number, inside: boolean }} [pointer] device pixels
 */
export function drawSeed(ctx, time, kind, pointer) {
	const { width: w, height: h } = ctx.canvas;
	const unit = Math.min(w, h);

	ctx.clearRect(0, 0, w, h);
	ctx.save();

	if (kind === 'ring') {
		ctx.strokeStyle = '#ff4d2e';
		ctx.lineWidth = unit * 0.012;
		ctx.beginPath();
		ctx.ellipse(
			w / 2,
			h / 2,
			unit * (0.1 + Math.sin(time * 0.7) * 0.03),
			unit * 0.1,
			time * 0.5,
			0,
			Math.PI * 2
		);
		ctx.stroke();
	}

	if (kind === 'type') {
		const font = (/** @type {number} */ s) => `900 ${s}px ui-sans-serif, system-ui, sans-serif`;
		ctx.font = font(unit * 0.12);
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillStyle = '#f5f1e8';
		ctx.translate(w / 2, h / 2);
		ctx.rotate(Math.sin(time * 0.6) * 0.3);
		ctx.fillText('LOOP', 0, 0);
	}

	if (kind === 'dots') {
		const colours = ['#ff4d2e', '#2ec4b6', '#ffc93c'];
		colours.forEach((colour, i) => {
			const phase = time * 0.9 + (i * Math.PI * 2) / 3;
			ctx.fillStyle = colour;
			ctx.beginPath();
			ctx.arc(
				w / 2 + Math.cos(phase) * unit * 0.2,
				h / 2 + Math.sin(phase * 1.3) * unit * 0.14,
				unit * 0.025,
				0,
				Math.PI * 2
			);
			ctx.fill();
		});
	}

	// The pointer is a second seed: draw into the loop and watch it come back.
	if (pointer?.inside) {
		ctx.fillStyle = '#ffffff';
		ctx.beginPath();
		ctx.arc(pointer.x, pointer.y, unit * 0.018, 0, Math.PI * 2);
		ctx.fill();
	}

	ctx.restore();
}
