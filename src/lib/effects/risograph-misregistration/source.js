/**
 * Procedural artwork, already separated: one ink layer per colour channel.
 *
 * Self-contained on purpose: copying this file alongside demo.js is the whole
 * dependency list. A riso is fed one greyscale master per ink, so the source
 * here is drawn the same way. Red holds drum one, green drum two, blue drum
 * three, and additive compositing keeps the three channels independent.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} time seconds
 * @param {'poster'|'type'|'tone'} kind
 */
export function drawSource(ctx, time, kind) {
	const { width: w, height: h } = ctx.canvas;
	const unit = Math.min(w, h);
	const DRUM = ['255,0,0', '0,255,0', '0,0,255'];

	/** @param {number} drum @param {number} [alpha] */
	const ink = (drum, alpha = 1) => `rgba(${DRUM[drum]},${alpha})`;

	/** @param {string} text @param {number} fit */
	const fitType = (text, fit) => {
		const font = (/** @type {number} */ s) => `900 ${s}px ui-sans-serif, system-ui, sans-serif`;
		ctx.font = font(100);
		ctx.font = font(Math.min(unit * 0.42, (100 * w * fit) / ctx.measureText(text).width));
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
	};

	ctx.save();
	ctx.globalCompositeOperation = 'source-over';
	ctx.fillStyle = '#000000';
	ctx.fillRect(0, 0, w, h);
	ctx.globalCompositeOperation = 'lighter';

	if (kind === 'poster') {
		// Drum three: a broad tonal wash, where the grain shows.
		const wash = ctx.createLinearGradient(0, h, w, 0);
		wash.addColorStop(0, ink(2, 0.9));
		wash.addColorStop(0.6, ink(2, 0.15));
		wash.addColorStop(1, ink(2, 0));
		ctx.fillStyle = wash;
		ctx.fillRect(0, 0, w, h);

		// Drum two: hard stripes and a disc, the edges that betray misregistration.
		ctx.fillStyle = ink(1);
		const band = unit * 0.06;
		const drift = (time * band * 0.6) % (band * 2);
		for (let y = -band * 2 + drift; y < h * 0.42; y += band * 2) ctx.fillRect(0, y, w, band);
		ctx.beginPath();
		ctx.arc(w * (0.62 + 0.08 * Math.sin(time * 0.4)), h * 0.62, unit * 0.24, 0, Math.PI * 2);
		ctx.fill();

		// Drum one: the wordmark and a second disc overlapping the first.
		ctx.fillStyle = ink(0);
		ctx.beginPath();
		ctx.arc(w * (0.4 + 0.06 * Math.cos(time * 0.35)), h * 0.58, unit * 0.22, 0, Math.PI * 2);
		ctx.fill();
		fitType('RISO', 0.7);
		ctx.fillText('RISO', w / 2, h * 0.3 + Math.sin(time * 0.5) * h * 0.03);
	}

	if (kind === 'type') {
		// The same word on two drums. Perfectly registered it is one colour;
		// any shift splits it into two edges and an overprint between them.
		fitType('PRINT', 0.82);
		const y = h / 2 + Math.sin(time * 0.5) * h * 0.04;
		ctx.fillStyle = ink(0);
		ctx.fillText('PRINT', w / 2, y);
		ctx.fillStyle = ink(1);
		ctx.fillText('PRINT', w / 2, y);
		ctx.fillStyle = ink(2, 0.6);
		ctx.fillRect(0, h * 0.78, w, h * 0.1);
	}

	if (kind === 'tone') {
		// A shaded sphere split into a dark key and a lighter body colour.
		const cx = w * (0.5 + 0.12 * Math.cos(time * 0.3));
		const cy = h * (0.5 + 0.08 * Math.sin(time * 0.4));
		const r = unit * 0.36;
		for (const [drum, inner, outer] of /** @type {const} */ ([
			[0, 0, 1],
			[1, 0.15, 0.9],
			[2, 0.5, 0.2]
		])) {
			const shade = ctx.createRadialGradient(cx - r * 0.4, cy - r * 0.4, 0, cx, cy, r);
			shade.addColorStop(0, ink(drum, inner));
			shade.addColorStop(1, ink(drum, outer));
			ctx.fillStyle = shade;
			ctx.beginPath();
			ctx.arc(cx, cy, r, 0, Math.PI * 2);
			ctx.fill();
		}
	}

	ctx.restore();
}
