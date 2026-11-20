/**
 * Dolly zoom: three.js.
 *
 * Lifecycle: `create` on mount, `update` on parameter change, `frame` per tick,
 * `destroy` on unmount. In React that is useEffect(…, []) / useEffect(…, [params])
 * / a requestAnimationFrame loop started in that effect / the effect's cleanup.
 * In Svelte it is $effect, an $effect reading the params rune, the same loop,
 * and the effect's teardown return. On a plain page: call create once the canvas
 * is in the DOM, call update from an input listener, drive frame from
 * requestAnimationFrame, and call destroy on unload.
 *
 * three.js is the one external dependency here. In the copyable snippet it
 * comes from a CDN via an import map, pinned to the same version the site uses.
 *
 * The whole effect is one line: distance = halfHeight / tan(fov / 2). Animate the
 * field of view, solve for the distance that keeps the subject the same size,
 * and the background is left to do the moving.
 */

import * as THREE from 'three';

export const params = {
	direction: {
		type: 'select',
		label: 'Direction',
		group: 'Move',
		options: ['push in, zoom out', 'pull out, zoom in'],
		default: 'push in, zoom out'
	},
	wide: {
		type: 'range',
		label: 'Wide lens',
		group: 'Move',
		min: 40,
		max: 100,
		step: 1,
		default: 78,
		unit: '°'
	},
	tele: {
		type: 'range',
		label: 'Long lens',
		group: 'Move',
		min: 6,
		max: 35,
		step: 1,
		default: 14,
		unit: '°'
	},
	compensate: {
		type: 'toggle',
		label: 'Hold subject size',
		group: 'Move',
		default: true,
		help: 'Off gives a plain dolly over the same distance, for comparison.'
	},
	duration: {
		type: 'range',
		label: 'Duration',
		group: 'Timing',
		min: 1,
		max: 8,
		step: 0.1,
		default: 3.2,
		unit: 's'
	},
	hold: {
		type: 'range',
		label: 'Hold',
		group: 'Timing',
		min: 0,
		max: 3,
		step: 0.1,
		default: 1,
		unit: 's',
		help: 'Pause on the first and last frame of the move.'
	},
	easing: {
		type: 'select',
		label: 'Easing',
		group: 'Timing',
		options: ['ease in-out', 'ease in', 'ease out', 'linear'],
		default: 'ease in-out'
	},
	replay: { type: 'action', label: 'Replay', group: 'Playback', default: 0 }
};

const EASE = {
	'ease in-out': (/** @type {number} */ t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
	'ease in': (/** @type {number} */ t) => t * t * t,
	'ease out': (/** @type {number} */ t) => 1 - (1 - t) ** 3,
	linear: (/** @type {number} */ t) => t
};

/** Height of the frame, in metres, at the subject's distance. */
const FRAME = 4.4;
const EYE = 1.5;
const BG = 0xd8d2c6;

/**
 * @param {HTMLCanvasElement} canvas
 * @param {Record<string, any>} initialParams
 */
export function create(canvas, initialParams) {
	let settings = { ...initialParams };

	const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
	renderer.setPixelRatio(1); // the host already sized the canvas in device pixels
	renderer.setClearColor(BG, 1);

	const scene = new THREE.Scene();
	scene.fog = new THREE.Fog(BG, 20, 150);
	const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);

	scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8170, 1.6));
	const sun = new THREE.DirectionalLight(0xffffff, 1.8);
	sun.position.set(-4, 10, 6);
	scene.add(sun);

	/** @type {{ dispose(): void }[]} */
	const disposables = [];
	/** @template {{ dispose(): void }} T @param {T} item @returns {T} */
	const keep = (item) => (disposables.push(item), item);

	// A long colonnade: the receding columns and floor are what visibly stretch.
	const floor = new THREE.Mesh(
		keep(new THREE.PlaneGeometry(40, 200)),
		keep(new THREE.MeshLambertMaterial({ color: 0xc4bcae }))
	);
	floor.rotation.x = -Math.PI / 2;
	floor.position.z = -80;
	scene.add(floor);

	const runner = new THREE.Mesh(
		keep(new THREE.PlaneGeometry(1.6, 200)),
		keep(new THREE.MeshLambertMaterial({ color: 0x3b3833 }))
	);
	runner.rotation.x = -Math.PI / 2;
	runner.position.set(0, 0.005, -80);
	scene.add(runner);

	const grid = new THREE.GridHelper(200, 100, 0x9d9585, 0x9d9585);
	grid.position.set(0, 0.01, -80);
	keep(grid.geometry);
	keep(/** @type {THREE.Material} */ (grid.material));
	scene.add(grid);

	const COLUMNS = 26;
	const columns = new THREE.InstancedMesh(
		keep(new THREE.BoxGeometry(0.7, 7, 0.7)),
		keep(new THREE.MeshLambertMaterial({ color: 0xf1ece3 })),
		COLUMNS * 2
	);
	const placement = new THREE.Matrix4();
	for (let i = 0; i < COLUMNS; i++) {
		const z = 4 - i * 4;
		placement.setPosition(-2.8, 3.5, z);
		columns.setMatrixAt(i * 2, placement);
		placement.setPosition(2.8, 3.5, z);
		columns.setMatrixAt(i * 2 + 1, placement);
	}
	scene.add(columns);

	const wall = new THREE.Mesh(
		keep(new THREE.PlaneGeometry(14, 10)),
		keep(new THREE.MeshLambertMaterial({ color: 0xece6db }))
	);
	wall.position.set(0, 5, -102);
	scene.add(wall);
	const door = new THREE.Mesh(
		keep(new THREE.PlaneGeometry(2.4, 4.2)),
		keep(new THREE.MeshBasicMaterial({ color: 0x1f1d1a, fog: false }))
	);
	door.position.set(0, 2.1, -101.9);
	scene.add(door);

	// The subject: a simple standing figure, the one thing that must not change size.
	const figure = new THREE.Group();
	const red = keep(new THREE.MeshLambertMaterial({ color: 0xd9472b }));
	const body = new THREE.Mesh(keep(new THREE.CapsuleGeometry(0.27, 0.95, 8, 24)), red);
	body.position.y = 0.8;
	const head = new THREE.Mesh(keep(new THREE.SphereGeometry(0.2, 24, 16)), red);
	head.position.y = 1.65;
	figure.add(body, head);
	scene.add(figure);

	// Replay: the next frame's time becomes the new zero.
	let start = 0;
	let restart = false;

	/** Distance at which a lens of this vertical fov frames FRAME metres. */
	const distanceFor = (/** @type {number} */ fov) => FRAME / 2 / Math.tan((fov * Math.PI) / 360);

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
			const { duration, hold, wide, tele, compensate } = settings;
			const ease = EASE[/** @type {keyof typeof EASE} */ (settings.easing)] ?? EASE.linear;

			// Hold on the first frame, move, hold on the last, then cut back.
			const loop = hold + duration + hold;
			const t = (((time - start) % loop) + loop) % loop;
			const k = ease(Math.min(1, Math.max(0, (t - hold) / duration)));

			const pushIn = settings.direction === 'push in, zoom out';
			const from = pushIn ? tele : wide;
			const to = pushIn ? wide : tele;

			// The camera always travels the full dolly distance. With compensation the
			// lens changes to match; without it the lens stays put and the subject grows.
			const distance = THREE.MathUtils.lerp(distanceFor(from), distanceFor(to), k);
			const fov = compensate ? 2 * Math.atan(FRAME / 2 / distance) * (180 / Math.PI) : from;

			camera.fov = fov;
			camera.updateProjectionMatrix();
			camera.position.set(0, EYE, distance);
			camera.lookAt(0, EYE, 0);

			renderer.render(scene, camera);
		},

		/**
		 * @param {number} width device pixels
		 * @param {number} height device pixels
		 */
		resize(width, height) {
			camera.aspect = width / height;
			camera.updateProjectionMatrix();
			renderer.setSize(width, height, false);
		},

		destroy() {
			columns.dispose();
			for (const item of disposables) item.dispose();
			renderer.dispose();
		}
	};
}
