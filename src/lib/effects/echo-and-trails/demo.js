/**
 * Echo and trails — Canvas 2D.
 *
 * Lifecycle: `create` on mount, `update` on parameter change, `frame` per tick,
 * `destroy` on unmount. In React that is useEffect(…, []) / useEffect(…, [params])
 * / a requestAnimationFrame loop started in that effect / the effect's cleanup.
 * In Svelte it is $effect, an $effect reading the params rune, the same loop,
 * and the effect's teardown return. On a plain page: call create once the canvas
 * is in the DOM, call update from an input listener, drive frame from
 * requestAnimationFrame, and call destroy on unload.
 *
 * Two mechanisms side by side. Echoes redraw the subject at fixed delays and
 * need no memory of earlier frames. Trails keep last frame, fade it, and draw
 * on top, so the image is an accumulation and depends on everything before it.
 */

export const params = {
	mode: {
		type: 'select',
		label: 'Mode',
		group: 'Repeat',
		options: ['echoes', 'trails'],
		default: 'echoes',
		help: 'Echoes are discrete copies. Trails are a fading accumulation.'
	},
	count: {
		type: 'range',
		label: 'Echo count',
		group: 'Repeat',
		min: 1,
		max: 30,
		step: 1,
		default: 12
	},
	delay: {
		type: 'range',
		label: 'Echo delay',
		group: 'Repeat',
		min: 0.02,
		max: 0.4,
		step: 0.01,
		default: 0.09,
		unit: 's'
	},
	falloff: {
		type: 'range',
		label: 'Echo falloff',
		group: 'Repeat',
		min: 0.5,
		max: 1,
		step: 0.01,
		default: 0.86,
		help: 'Strength of each echo relative to the one before it.'
	},
	persistence: {
		type: 'range',
		label: 'Trail persistence',
		group: 'Repeat',
		min: 0.8,
		max: 0.995,
		step: 0.001,
		default: 0.95,
		help: 'Share of the image kept every sixtieth of a second.'
	},
	subject: {
		type: 'select',
		label: 'Subject',
		group: 'Subject',
		options: ['type', 'square', 'ring'],
		default: 'square',
		help: 'Follows the pointer while it is over the canvas.'
	},
	outline: { type: 'toggle', label: 'Outline', group: 'Subject', default: true },
	ink: { type: 'colour', label: 'Ink', group: 'Colour', default: '#f2f0ea' },
	paper: { type: 'colour', label: 'Paper', group: 'Colour', default: '#101010' }
};

/** @param {string} hex */
const rgb = (hex) => {
	const n = parseInt(hex.replace('#', ''), 16);
	return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/**
 * @param {string} from
 * @param {string} to
 * @param {number} t
 */
const mix = (from, to, t) => {
	const a = rgb(from);
	const b = rgb(to);
	return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(' ')})`;
};

/**
 * @param {HTMLCanvasElement} canvas
 * @param {Record<string, any>} initialParams
 */
export function create(canvas, initialParams) {
	const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d', { alpha: false }));

	// Trails accumulate in a greyscale mask (white is full ink), coloured on output.
	const mask = document.createElement('canvas');
	const maskCtx = /** @type {CanvasRenderingContext2D} */ (mask.getContext('2d', { alpha: false }));
	const tint = document.createElement('canvas');
	const tintCtx = /** @type {CanvasRenderingContext2D} */ (tint.getContext('2d', { alpha: false }));

	let settings = { ...initialParams };
	let lastTime = -1;

	/** @type {{ t: number, x: number, y: number }[]} recent subject positions, oldest first */
	let history = [];

	/** @param {number} t */
	function path(t) {
		const { width: w, height: h } = canvas;
		return {
			x: w * (0.5 + 0.32 * Math.cos(t * 0.9)),
			y: h * (0.5 + 0.3 * Math.sin(t * 1.7))
		};
	}

	/**
	 * Where the subject was at time t: from history when recorded, otherwise from the path.
	 * @param {number} t
	 */
	function positionAt(t) {
		if (history.length === 0 || t < history[0].t) return path(t);
		for (let k = history.length - 1; k > 0; k--) {
			const b = history[k];
			const a = history[k - 1];
			if (t >= a.t && t <= b.t) {
				const f = b.t > a.t ? (t - a.t) / (b.t - a.t) : 0;
				return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
			}
		}
		const last = history[history.length - 1];
		return { x: last.x, y: last.y };
	}

	/**
	 * @param {CanvasRenderingContext2D} target
	 * @param {number} t
	 * @param {string} colour
	 */
	function drawSubject(target, t, colour) {
		const { x, y } = positionAt(t);
		const unit = Math.min(canvas.width, canvas.height);
		target.save();
		target.translate(x, y);
		target.rotate(t * 0.8);
		target.fillStyle = colour;
		target.strokeStyle = colour;
		target.lineWidth = unit * 0.008;
		target.lineJoin = 'miter';

		if (settings.subject === 'type') {
			target.font = `900 ${unit * 0.16}px ui-sans-serif, system-ui, sans-serif`;
			target.textAlign = 'center';
			target.textBaseline = 'middle';
			if (settings.outline) target.strokeText('ECHO', 0, 0);
			else target.fillText('ECHO', 0, 0);
		} else {
			target.beginPath();
			if (settings.subject === 'square') {
				const s = unit * 0.09;
				target.rect(-s, -s, s * 2, s * 2);
			} else {
				target.arc(0, 0, unit * 0.1, 0, Math.PI * 2);
				if (!settings.outline) target.arc(0, 0, unit * 0.05, 0, Math.PI * 2, true);
			}
			if (settings.outline) target.stroke();
			else target.fill();
		}
		target.restore();
	}

	function clearMask() {
		maskCtx.fillStyle = '#000';
		maskCtx.fillRect(0, 0, mask.width, mask.height);
	}

	/** @param {number} time */
	function drawTrails(time) {
		const dt = Math.max(0, time - lastTime);
		if (dt > 0) {
			// Frame-rate independent: persistence is defined per sixtieth of a second.
			const keep = Math.pow(settings.persistence, dt * 60);
			maskCtx.globalCompositeOperation = 'source-over';
			maskCtx.fillStyle = `rgb(0 0 0 / ${1 - keep})`;
			maskCtx.fillRect(0, 0, mask.width, mask.height);
			// An 8-bit fade stalls a few levels above black; subtracting one level clears the residue.
			maskCtx.globalCompositeOperation = 'difference';
			maskCtx.fillStyle = 'rgb(1 1 1)';
			maskCtx.fillRect(0, 0, mask.width, mask.height);
			maskCtx.globalCompositeOperation = 'source-over';
		}
		drawSubject(maskCtx, time, '#fff');

		// out = paper × (1 − mask) + ink × mask
		ctx.globalCompositeOperation = 'source-over';
		ctx.fillStyle = settings.paper;
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		tintCtx.globalCompositeOperation = 'source-over';
		tintCtx.drawImage(mask, 0, 0);
		tintCtx.globalCompositeOperation = 'difference';
		tintCtx.fillStyle = '#fff';
		tintCtx.fillRect(0, 0, tint.width, tint.height);
		ctx.globalCompositeOperation = 'multiply';
		ctx.drawImage(tint, 0, 0);

		tintCtx.globalCompositeOperation = 'source-over';
		tintCtx.drawImage(mask, 0, 0);
		tintCtx.globalCompositeOperation = 'multiply';
		tintCtx.fillStyle = settings.ink;
		tintCtx.fillRect(0, 0, tint.width, tint.height);
		ctx.globalCompositeOperation = 'lighter';
		ctx.drawImage(tint, 0, 0);
		ctx.globalCompositeOperation = 'source-over';
	}

	/** @param {number} time */
	function drawEchoes(time) {
		ctx.fillStyle = settings.paper;
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		// Oldest first, so each newer copy sits on top of the one before.
		for (let k = Math.round(settings.count); k >= 0; k--) {
			const strength = Math.pow(settings.falloff, k) * (k === 0 ? 1 : 0.85);
			drawSubject(ctx, time - k * settings.delay, mix(settings.paper, settings.ink, strength));
		}
	}

	function resize() {
		mask.width = tint.width = canvas.width;
		mask.height = tint.height = canvas.height;
		clearMask();
		history = [];
	}

	resize();

	return {
		/** @param {Record<string, any>} next */
		update(next) {
			if (next.mode !== settings.mode) clearMask();
			settings = { ...next };
		},

		/**
		 * @param {number} time seconds, already scaled by the host's speed control
		 * @param {{ x: number, y: number, inside: boolean }} pointer device pixels
		 */
		frame(time, pointer) {
			// The clock went backwards: a restart, so forget the past.
			if (time < lastTime) {
				history = [];
				clearMask();
			}

			if (time > lastTime) {
				const at = pointer.inside ? { x: pointer.x, y: pointer.y } : path(time);
				history.push({ t: time, ...at });
				const horizon = time - 31 * 0.4;
				while (history.length > 2 && history[1].t < horizon) history.shift();
			}

			if (settings.mode === 'trails') drawTrails(time);
			else drawEchoes(time);
			lastTime = time;
		},

		resize,

		destroy() {
			mask.width = tint.width = 0;
			mask.height = tint.height = 0;
		}
	};
}
