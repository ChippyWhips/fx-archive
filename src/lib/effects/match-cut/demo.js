/**
 * Match cut: Canvas 2D.
 *
 * Lifecycle: `create` on mount, `update` on parameter change, `frame` per tick,
 * `destroy` on unmount. In React that is useEffect(…, []) / useEffect(…, [params])
 * / a requestAnimationFrame loop started in that effect / the effect's cleanup.
 * In Svelte it is $effect, an $effect reading the params rune, the same loop,
 * and the effect's teardown return. On a plain page: call create once the canvas
 * is in the DOM, call update from an input listener, drive frame from
 * requestAnimationFrame, and call destroy on unload.
 *
 * Two shots on one timeline. Shot A is a record spinning on a turntable, shot B
 * a slice of lemon spinning on a plate. Everything the cut has to match (where
 * the circle sits, how big it is, which way and how fast it turns, and the
 * camera's push in) is a function of one clock, so a matched cut is simply both
 * shots reading the same values at the same moment.
 */

export const params = {
	shotA: {
		type: 'range',
		label: 'Shot A length',
		group: 'Timing',
		min: 1,
		max: 6,
		step: 0.1,
		default: 2.4,
		unit: 's'
	},
	shotB: {
		type: 'range',
		label: 'Shot B length',
		group: 'Timing',
		min: 1.5,
		max: 6,
		step: 0.1,
		default: 3,
		unit: 's',
		help: 'Includes a one-second hold at the end.'
	},
	dissolve: {
		type: 'range',
		label: 'Dissolve',
		group: 'Timing',
		min: 0,
		max: 1.5,
		step: 0.05,
		default: 0,
		unit: 's',
		help: 'Zero is a hard cut. Anything longer is a match dissolve.'
	},
	match: {
		type: 'select',
		label: 'Match',
		group: 'Cut',
		options: ['shape and motion', 'shape only', 'unmatched'],
		default: 'shape and motion'
	},
	push: {
		type: 'range',
		label: 'Camera push',
		group: 'Camera',
		min: 0,
		max: 0.8,
		step: 0.01,
		default: 0.35,
		help: 'How far the camera moves in across both shots.'
	},
	easing: {
		type: 'select',
		label: 'Easing',
		group: 'Camera',
		options: ['ease in-out', 'ease out', 'linear'],
		default: 'ease in-out'
	},
	replay: { type: 'action', label: 'Replay', group: 'Playback', default: 0 }
};

const HOLD = 1;
const FADE = 0.25;
const FPS = 24;
const SPIN = 1.6;

const EASE = {
	'ease in-out': (/** @type {number} */ t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
	'ease out': (/** @type {number} */ t) => 1 - (1 - t) ** 3,
	linear: (/** @type {number} */ t) => t
};

const clamp01 = (/** @type {number} */ v) => Math.min(1, Math.max(0, v));

/**
 * @param {HTMLCanvasElement} canvas
 * @param {Record<string, any>} initialParams
 */
export function create(canvas, initialParams) {
	const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
	let settings = { ...initialParams };
	let width = canvas.width;
	let height = canvas.height;

	// Replay: the next frame's time becomes the new zero.
	let start = 0;
	let restart = false;

	/**
	 * Where the circle is, how big, and how far it has turned, for each shot at
	 * time t. A matched cut is shot B reading shot A's values at the cut.
	 * @param {number} t seconds into the loop
	 * @param {'A' | 'B'} shot
	 */
	function subject(t, shot) {
		const { shotA, shotB, push, match } = settings;
		const ease = EASE[/** @type {keyof typeof EASE} */ (settings.easing)] ?? EASE.linear;
		const moving = Math.max(shotA + shotB - HOLD, 0.01);
		const unit = Math.min(width, height);

		// One continuous camera move across both shots: a push in with a slight pan.
		let k = ease(clamp01(t / moving));
		let spin = SPIN * t;

		if (shot === 'B' && match === 'shape only') {
			// Same circle at the cut, but the motion turns round: the camera pulls
			// back out and the spin reverses.
			const atCut = ease(clamp01(shotA / moving));
			k = atCut - (ease(clamp01(t / moving)) - atCut);
			spin = SPIN * shotA - SPIN * 1.4 * (t - shotA);
		}

		const scale = 1 + push * k;
		const radius = unit * 0.25 * scale;
		let x = width * (0.44 + 0.12 * k);
		let y = height * 0.5;
		let r = radius;

		if (shot === 'B' && match === 'unmatched') {
			x = width * 0.7;
			y = height * 0.36;
			r = unit * 0.16;
			spin = -SPIN * 0.5 * t;
		}
		return { x, y, r, spin };
	}

	/** Shot A: a record on a dark plinth, grooves and a label that shows the spin. */
	function drawRecord(/** @type {{ x: number, y: number, r: number, spin: number }} */ s) {
		ctx.fillStyle = '#1b1916';
		ctx.fillRect(0, 0, width, height);

		const vignette = ctx.createRadialGradient(
			s.x,
			s.y,
			s.r * 0.5,
			s.x,
			s.y,
			Math.max(width, height)
		);
		vignette.addColorStop(0, 'rgba(70, 60, 48, 0.55)');
		vignette.addColorStop(1, 'rgba(0, 0, 0, 0)');
		ctx.fillStyle = vignette;
		ctx.fillRect(0, 0, width, height);

		ctx.save();
		ctx.translate(s.x, s.y);
		ctx.fillStyle = '#0c0c0c';
		ctx.beginPath();
		ctx.arc(0, 0, s.r, 0, Math.PI * 2);
		ctx.fill();

		ctx.lineWidth = Math.max(1, s.r * 0.004);
		for (let i = 0; i < 26; i++) {
			const ring = s.r * (0.42 + (i / 26) * 0.55);
			ctx.strokeStyle = i % 5 === 0 ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.04)';
			ctx.beginPath();
			ctx.arc(0, 0, ring, 0, Math.PI * 2);
			ctx.stroke();
		}

		// The sheen stays put while the disc turns underneath it, as real light does.
		const sheen = ctx.createConicGradient(-0.6, 0, 0);
		sheen.addColorStop(0, 'rgba(255,255,255,0)');
		sheen.addColorStop(0.08, 'rgba(255,255,255,0.13)');
		sheen.addColorStop(0.16, 'rgba(255,255,255,0)');
		sheen.addColorStop(0.5, 'rgba(255,255,255,0)');
		sheen.addColorStop(0.58, 'rgba(255,255,255,0.1)');
		sheen.addColorStop(0.66, 'rgba(255,255,255,0)');
		ctx.fillStyle = sheen;
		ctx.beginPath();
		ctx.arc(0, 0, s.r, 0, Math.PI * 2);
		ctx.arc(0, 0, s.r * 0.36, 0, Math.PI * 2, true);
		ctx.fill();

		ctx.rotate(s.spin);
		ctx.fillStyle = '#e4572e';
		ctx.beginPath();
		ctx.arc(0, 0, s.r * 0.34, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = '#f3ede2';
		ctx.fillRect(-s.r * 0.2, -s.r * 0.2, s.r * 0.4, s.r * 0.05);
		ctx.fillRect(-s.r * 0.2, -s.r * 0.12, s.r * 0.24, s.r * 0.03);
		ctx.fillStyle = '#1b1916';
		ctx.beginPath();
		ctx.arc(0, 0, s.r * 0.025, 0, Math.PI * 2);
		ctx.fill();
		ctx.restore();
	}

	/** Shot B: a lemon slice on a pale plate. Same circle, different object. */
	function drawLemon(/** @type {{ x: number, y: number, r: number, spin: number }} */ s) {
		ctx.fillStyle = '#e8e2d4';
		ctx.fillRect(0, 0, width, height);

		ctx.save();
		ctx.translate(s.x, s.y);
		ctx.fillStyle = '#f6f3ec';
		ctx.beginPath();
		ctx.arc(0, 0, s.r * 1.45, 0, Math.PI * 2);
		ctx.fill();
		ctx.strokeStyle = 'rgba(0,0,0,0.06)';
		ctx.lineWidth = s.r * 0.02;
		ctx.beginPath();
		ctx.arc(0, 0, s.r * 1.18, 0, Math.PI * 2);
		ctx.stroke();

		ctx.rotate(s.spin);
		ctx.fillStyle = '#efc12f';
		ctx.beginPath();
		ctx.arc(0, 0, s.r, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = '#fbf2cf';
		ctx.beginPath();
		ctx.arc(0, 0, s.r * 0.92, 0, Math.PI * 2);
		ctx.fill();

		ctx.fillStyle = '#f5d457';
		ctx.beginPath();
		ctx.arc(0, 0, s.r * 0.84, 0, Math.PI * 2);
		ctx.fill();

		// Pith walls between the segments: the radial lines are what make the turn readable.
		ctx.strokeStyle = '#fbf2cf';
		ctx.lineWidth = s.r * 0.05;
		ctx.lineCap = 'round';
		for (let i = 0; i < 10; i++) {
			const a = (i / 10) * Math.PI * 2;
			ctx.beginPath();
			ctx.moveTo(0, 0);
			ctx.lineTo(Math.cos(a) * s.r * 0.84, Math.sin(a) * s.r * 0.84);
			ctx.stroke();
		}
		ctx.fillStyle = '#fbf2cf';
		ctx.beginPath();
		ctx.arc(0, 0, s.r * 0.12, 0, Math.PI * 2);
		ctx.fill();
		ctx.restore();
	}

	/** Timecode and a strip showing where the cut falls. */
	function drawSlate(/** @type {number} */ t, /** @type {'A' | 'B'} */ shot) {
		const { shotA, shotB } = settings;
		const loop = shotA + shotB;
		const unit = Math.min(width, height);
		const pad = unit * 0.05;
		const size = Math.max(10, unit * 0.034);

		ctx.save();
		// Difference keeps the slate readable on the dark shot and the light one.
		ctx.globalCompositeOperation = 'difference';
		ctx.fillStyle = '#ffffff';
		ctx.strokeStyle = '#ffffff';

		const frames = Math.floor(t * FPS);
		const timecode = `${String(Math.floor(frames / FPS)).padStart(2, '0')}:${String(frames % FPS).padStart(2, '0')}`;
		ctx.font = `${size}px ui-monospace, SFMono-Regular, Menlo, monospace`;
		ctx.textBaseline = 'alphabetic';
		ctx.fillText(`${shot}  ${timecode}`, pad, height - pad - size * 0.9);

		const y = height - pad;
		const x0 = pad;
		const x1 = width - pad;
		ctx.globalAlpha = 0.45;
		ctx.lineWidth = Math.max(1, unit * 0.002);
		ctx.beginPath();
		ctx.moveTo(x0, y);
		ctx.lineTo(x1, y);
		ctx.stroke();
		ctx.globalAlpha = 1;
		const cutX = x0 + (x1 - x0) * (shotA / loop);
		ctx.fillRect(cutX - ctx.lineWidth, y - size * 0.5, ctx.lineWidth * 2, size);
		const playX = x0 + (x1 - x0) * clamp01(t / loop);
		ctx.beginPath();
		ctx.arc(playX, y, Math.max(2, unit * 0.006), 0, Math.PI * 2);
		ctx.fill();
		ctx.restore();
	}

	return {
		/** @param {Record<string, any>} next */
		update(next) {
			if (next.replay !== settings.replay) restart = true;
			settings = { ...next };
		},

		/** @param {number} time seconds, already scaled by the host's speed control */
		frame(time) {
			if (restart) {
				start = time;
				restart = false;
			}
			const { shotA, shotB, dissolve } = settings;
			const loop = shotA + shotB;
			const t = (((time - start) % loop) + loop) % loop;

			// Hard cut at shotA, or a crossfade centred on it.
			const mix =
				dissolve > 0 ? clamp01((t - shotA + dissolve / 2) / dissolve) : t >= shotA ? 1 : 0;

			if (mix < 1) drawRecord(subject(t, 'A'));
			if (mix > 0) {
				ctx.save();
				ctx.globalAlpha = mix;
				drawLemon(subject(t, 'B'));
				ctx.restore();
			}

			// A short fade through black at the loop point, so the restart never
			// reads as a second cut.
			const fade = Math.max(clamp01(1 - t / FADE), clamp01((t - (loop - FADE)) / FADE));
			if (fade > 0) {
				ctx.fillStyle = `rgba(0, 0, 0, ${fade})`;
				ctx.fillRect(0, 0, width, height);
			}

			drawSlate(t, mix < 0.5 ? 'A' : 'B');
		},

		/**
		 * @param {number} w device pixels
		 * @param {number} h device pixels
		 */
		resize(w, h) {
			width = w;
			height = h;
		}
	};
}
