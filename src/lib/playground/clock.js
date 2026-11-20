/**
 * A clock the host owns, so pause and speed work for every demo without any
 * demo knowing they exist. Demos receive `time` and never read the wall clock.
 */
export function createClock() {
	let elapsed = 0;
	let speed = 1;
	let last = 0;
	let running = false;

	return {
		/** @param {number} now `performance.now()` in ms */
		tick(now) {
			if (!running) {
				last = now;
				return elapsed;
			}
			// Clamp the delta so a backgrounded tab does not jump the animation
			// forward by several seconds when it resumes.
			const delta = Math.min((now - last) / 1000, 1 / 20);
			last = now;
			elapsed += delta * speed;
			return elapsed;
		},
		/** @param {number} now */
		start(now) {
			last = now;
			running = true;
		},
		stop() {
			running = false;
		},
		reset() {
			elapsed = 0;
		},
		/** @param {number} value */
		setSpeed(value) {
			speed = value;
		},
		get elapsed() {
			return elapsed;
		},
		get running() {
			return running;
		}
	};
}
