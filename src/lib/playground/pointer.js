/**
 * Pointer position and velocity in device pixels, smoothed so velocity-driven
 * effects (chromatic aberration, trails) don't flicker between frames.
 */

/** @typedef {{ x: number, y: number, vx: number, vy: number, down: boolean, inside: boolean }} Pointer */

/**
 * @param {HTMLElement} element
 * @returns {{ pointer: Pointer, settle: (dt: number) => void, destroy: () => void }}
 */
export function trackPointer(element) {
	/** @type {Pointer} */
	const pointer = { x: 0, y: 0, vx: 0, vy: 0, down: false, inside: false };

	let lastX = 0;
	let lastY = 0;
	let lastTime = 0;
	let seeded = false;

	/** @param {PointerEvent} event */
	function onMove(event) {
		const rect = element.getBoundingClientRect();
		const scale = (element.querySelector('canvas')?.width ?? rect.width) / rect.width;
		const x = (event.clientX - rect.left) * scale;
		const y = (event.clientY - rect.top) * scale;
		const now = event.timeStamp;

		if (seeded) {
			const dt = Math.max((now - lastTime) / 1000, 1 / 240);
			// Exponential smoothing: responsive, but without per-frame jitter.
			pointer.vx += ((x - lastX) / dt - pointer.vx) * 0.3;
			pointer.vy += ((y - lastY) / dt - pointer.vy) * 0.3;
		}

		pointer.x = x;
		pointer.y = y;
		lastX = x;
		lastY = y;
		lastTime = now;
		seeded = true;
	}

	const onEnter = () => (pointer.inside = true);
	const onLeave = () => {
		pointer.inside = false;
		pointer.down = false;
		seeded = false;
	};
	const onDown = () => (pointer.down = true);
	const onUp = () => (pointer.down = false);

	element.addEventListener('pointermove', onMove, { passive: true });
	element.addEventListener('pointerenter', onEnter);
	element.addEventListener('pointerleave', onLeave);
	element.addEventListener('pointerdown', onDown);
	window.addEventListener('pointerup', onUp);

	return {
		pointer,
		/**
		 * Decay velocity towards zero when the pointer stops, so effects settle
		 * instead of freezing at the last speed.
		 * @param {number} dt seconds since the previous frame
		 */
		settle(dt) {
			const decay = Math.exp(-dt * 6);
			pointer.vx *= decay;
			pointer.vy *= decay;
		},
		destroy() {
			element.removeEventListener('pointermove', onMove);
			element.removeEventListener('pointerenter', onEnter);
			element.removeEventListener('pointerleave', onLeave);
			element.removeEventListener('pointerdown', onDown);
			window.removeEventListener('pointerup', onUp);
		}
	};
}
