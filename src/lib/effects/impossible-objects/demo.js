/**
 * Impossible objects: three.js.
 *
 * Lifecycle: `create` on mount, `update` on parameter change, `frame` per tick,
 * `destroy` on unmount. In React that is useEffect(…, []) / useEffect(…, [params])
 * / a requestAnimationFrame loop started in that effect / the effect's cleanup.
 * In Svelte it is $effect, an $effect reading the params rune, the same loop,
 * and the effect's teardown return. On a plain page: call create once the canvas
 * is in the DOM, call update from an input listener, drive frame from
 * requestAnimationFrame, and call destroy on unload.
 *
 * The object is real 3D geometry: three beams along x, then y, then z, which do
 * not meet. Seen along the (1, 1, 1) diagonal with an orthographic camera, the
 * far end of the last beam lands exactly on the start of the first, and a cut in
 * the last beam hides the overlap. The camera swings off that axis and back so
 * you see the triangle close, open and close again.
 */

import * as THREE from 'three';

export const params = {
	angle: {
		type: 'range',
		label: 'Reveal angle',
		group: 'Camera',
		min: 0,
		max: 90,
		step: 1,
		default: 25,
		unit: '°',
		help: 'How far the camera swings off the one viewpoint that works.'
	},
	hold: {
		type: 'range',
		label: 'Hold',
		group: 'Camera',
		min: 0.5,
		max: 6,
		step: 0.1,
		default: 2.6,
		unit: 's'
	},
	turn: {
		type: 'range',
		label: 'Turn duration',
		group: 'Camera',
		min: 0.5,
		max: 5,
		step: 0.1,
		default: 2.2,
		unit: 's'
	},
	easing: {
		type: 'select',
		label: 'Easing',
		group: 'Camera',
		options: ['ease in-out', 'ease out', 'linear'],
		default: 'ease in-out'
	},
	follow: {
		type: 'toggle',
		label: 'Pointer orbits',
		group: 'Camera',
		default: true
	},
	thickness: {
		type: 'range',
		label: 'Beam thickness',
		group: 'Object',
		min: 0.1,
		max: 0.4,
		step: 0.01,
		default: 0.22
	},
	palette: {
		type: 'select',
		label: 'Palette',
		group: 'Object',
		options: ['stone', 'signal'],
		default: 'stone'
	}
};

const PALETTES = {
	stone: { faces: [0xe9e4da, 0xa39d92, 0x77736b], back: 0x45423d, bg: 0x111111 },
	signal: { faces: [0xf2c14e, 0xe4572e, 0x2e6f95], back: 0x3a3a3a, bg: 0x0e0e0e }
};

const EASE = {
	'ease in-out': (/** @type {number} */ t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
	'ease out': (/** @type {number} */ t) => 1 - (1 - t) ** 3,
	linear: (/** @type {number} */ t) => t
};

const L = 4;
const MAGIC = new THREE.Vector3(1, 1, 1).normalize();
// Screen-up for the magic view, chosen so the x beam sits level and the triangle points up.
const UP = new THREE.Vector3(0, 1, -1).normalize();
// Tilted off vertical: a pure turntable swing looks straight down a beam at about 35°.
const SWING = UP.clone().addScaledVector(UP.clone().cross(MAGIC), 0.6).normalize();

/**
 * @param {HTMLCanvasElement} canvas
 * @param {Record<string, any>} initialParams
 */
export function create(canvas, initialParams) {
	let settings = { ...initialParams };

	const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
	renderer.setPixelRatio(1); // the host already sized the canvas in device pixels

	const scene = new THREE.Scene();
	const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
	const pivot = new THREE.Vector3();
	const offset = new THREE.Vector2();

	// Flat shading by face direction, like a drawn Penrose triangle: one tone per
	// axis, so the eye reads the faces as consistent planes.
	const uniforms = {
		uTones: { value: [new THREE.Color(), new THREE.Color(), new THREE.Color()] },
		uBack: { value: new THREE.Color() },
		uCut: { value: 0 },
		uBoxMin: { value: new THREE.Vector3() },
		uBoxMax: { value: new THREE.Vector3() }
	};

	const vertexShader = /* glsl */ `
		varying vec3 vWorld;
		varying vec3 vNormal;
		void main() {
			vNormal = normal;
			vec4 world = modelMatrix * vec4(position, 1.0);
			vWorld = world.xyz;
			gl_Position = projectionMatrix * viewMatrix * world;
		}
	`;

	const fragmentShader = /* glsl */ `
		uniform vec3 uTones[3];
		uniform vec3 uBack;
		uniform float uCut;
		uniform vec3 uBoxMin;
		uniform vec3 uBoxMax;
		varying vec3 vWorld;
		varying vec3 vNormal;
		void main() {
			if (uCut > 0.5) {
				// The cut: remove any point whose line of sight along (1, 1, 1) passes
				// through the first beam. From the magic viewpoint the first beam then
				// shows through exactly where the last beam would have covered it.
				vec3 t1 = uBoxMin - vWorld;
				vec3 t2 = uBoxMax - vWorld;
				vec3 lo = min(t1, t2);
				vec3 hi = max(t1, t2);
				if (max(max(lo.x, lo.y), lo.z) <= min(min(hi.x, hi.y), hi.z)) discard;
			}
			if (!gl_FrontFacing) {
				gl_FragColor = vec4(uBack, 1.0);
				return;
			}
			vec3 n = abs(vNormal);
			float side = dot(vNormal, vec3(1.0)) < 0.0 ? 0.72 : 1.0;
			vec3 tone = n.x > 0.5 ? uTones[0] : n.y > 0.5 ? uTones[1] : uTones[2];
			gl_FragColor = vec4(tone * side, 1.0);
		}
	`;

	// Both materials share the same uniform objects, apart from uCut.
	const solid = new THREE.ShaderMaterial({
		uniforms: { ...uniforms, uCut: { value: 0 } },
		vertexShader,
		fragmentShader,
		side: THREE.DoubleSide
	});
	const cut = new THREE.ShaderMaterial({
		uniforms: { ...uniforms, uCut: { value: 1 } },
		vertexShader,
		fragmentShader,
		side: THREE.DoubleSide
	});

	/** @type {THREE.Mesh[]} */
	let beams = [];

	/** Axis-aligned box from min and max corners, in world space. */
	function box(/** @type {number[]} */ min, /** @type {number[]} */ max) {
		const geometry = new THREE.BoxGeometry(max[0] - min[0], max[1] - min[1], max[2] - min[2]);
		geometry.translate((min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2);
		return geometry;
	}

	function build() {
		for (const mesh of beams) {
			scene.remove(mesh);
			mesh.geometry.dispose();
		}
		const w = settings.thickness * L;
		const e = L + w;
		// Three beams that never touch end to start: x, then y, then z. Neighbours
		// overlap at the corners so no seam shows.
		const xMin = [0, 0, 0];
		const xMax = [e, w, w];
		// The later beams are a hair thinner, so their faces sit just inside the
		// coplanar faces they overlap and no antialiased seam is drawn.
		const i = 0.0005;
		beams = [
			new THREE.Mesh(box(xMin, xMax), solid),
			new THREE.Mesh(box([L + i, 0, i], [e - i, e, w - i]), solid),
			new THREE.Mesh(box([L + 2 * i, L + 2 * i, 0], [e - 2 * i, e - 2 * i, e]), cut)
		];
		for (const mesh of beams) scene.add(mesh);

		// Shrunk a hair so the cut edge never leaves a background-coloured crack.
		uniforms.uBoxMin.value.set(xMin[0] + i, xMin[1] + i, xMin[2] + i);
		uniforms.uBoxMax.value.set(xMax[0] - i, xMax[1] - i, xMax[2] - i);

		// Orbit around the object's 3D centre, but frame the triangle's centre as
		// seen from the magic viewpoint: the difference becomes a fixed screen offset.
		pivot.setScalar(e / 2);
		const centre = new THREE.Vector3((2 * L + 1.5 * w) / 3, (L + 1.5 * w) / 3, w / 2).sub(pivot);
		const right = UP.clone().cross(MAGIC);
		offset.set(centre.dot(right), centre.dot(UP));
	}

	function applyPalette() {
		const palette =
			PALETTES[/** @type {keyof typeof PALETTES} */ (settings.palette)] ?? PALETTES.stone;
		// Linear, so the hex values reach the screen unconverted: this shader skips three's colour management.
		palette.faces.forEach((hex, i) =>
			uniforms.uTones.value[i].setHex(hex, THREE.LinearSRGBColorSpace)
		);
		uniforms.uBack.value.setHex(palette.back, THREE.LinearSRGBColorSpace);
		renderer.setClearColor(palette.bg, 1);
	}

	build();
	applyPalette();

	let aspect = 1;
	let orbit = 0;
	let lastTime = 0;

	/** Swing angle, in radians, from the looping timeline. */
	function timeline(/** @type {number} */ time) {
		const { hold, turn, angle } = settings;
		const ease = EASE[/** @type {keyof typeof EASE} */ (settings.easing)] ?? EASE.linear;
		const out = hold * 0.6;
		const loop = hold + turn + out + turn;
		const t = time % loop;
		let k = 1 - ease((t - hold - turn - out) / turn);
		if (t < hold) k = 0;
		else if (t < hold + turn) k = ease((t - hold) / turn);
		else if (t < hold + turn + out) k = 1;
		return (k * angle * Math.PI) / 180;
	}

	return {
		/** @param {Record<string, any>} next */
		update(next) {
			const rebuild = next.thickness !== settings.thickness;
			settings = { ...next };
			if (rebuild) build();
			applyPalette();
		},

		/**
		 * @param {number} time seconds, already scaled by the host's speed control
		 * @param {{ x: number, inside: boolean }} pointer
		 */
		frame(time, pointer) {
			const dt = Math.min(Math.max(time - lastTime, 0), 1 / 20);
			lastTime = time;

			if (settings.follow && pointer.inside) {
				const goal = ((pointer.x / canvas.width) * 2 - 1) * (Math.PI / 2);
				orbit += (goal - orbit) * Math.min(1, dt * 8);
			} else {
				orbit = timeline(time);
			}

			const direction = MAGIC.clone().applyAxisAngle(SWING, orbit);
			camera.position.copy(pivot).addScaledVector(direction, 30);
			camera.up.copy(UP);
			camera.lookAt(pivot);

			// Fit the triangle in whichever dimension is tighter, widening as the
			// camera swings and the beams' depth turns sideways.
			const size = (L + settings.thickness * L) * 0.78 * (1 + 0.5 * Math.abs(Math.sin(orbit)));
			const half = aspect >= 1 ? size : size / aspect;
			// Nudged so the triangle's bounding box, not its centre, sits mid-frame.
			const x = offset.x;
			const y = offset.y - half * 0.12;
			camera.left = x - half * aspect;
			camera.right = x + half * aspect;
			camera.top = y + half;
			camera.bottom = y - half;
			camera.updateProjectionMatrix();

			renderer.render(scene, camera);
		},

		/**
		 * @param {number} width device pixels
		 * @param {number} height device pixels
		 */
		resize(width, height) {
			aspect = width / height;
			renderer.setSize(width, height, false);
		},

		destroy() {
			for (const mesh of beams) mesh.geometry.dispose();
			solid.dispose();
			cut.dispose();
			renderer.dispose();
		}
	};
}
