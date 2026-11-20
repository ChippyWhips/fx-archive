/**
 * Particle systems — three.js.
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
 * The simulation runs on the CPU over a flat Float32Array. At these counts that
 * is fast enough, and it keeps the forces readable — which is the point of the
 * entry. A curl-noise GPU version is its own effect.
 */

import * as THREE from 'three';

export const params = {
	count: {
		type: 'range',
		label: 'Count',
		group: 'System',
		min: 500,
		max: 20000,
		step: 500,
		default: 9000
	},
	size: {
		type: 'range',
		label: 'Particle size',
		group: 'System',
		min: 0.5,
		max: 8,
		step: 0.1,
		default: 1.6
	},
	life: {
		type: 'range',
		label: 'Lifetime',
		group: 'System',
		min: 0.5,
		max: 8,
		step: 0.1,
		default: 3.5,
		unit: 's',
		help: 'How long a particle lives before it is respawned at the emitter.'
	},
	speed: {
		type: 'range',
		label: 'Emission speed',
		group: 'Forces',
		min: 0,
		max: 60,
		step: 0.5,
		default: 26
	},
	gravity: {
		type: 'range',
		label: 'Gravity',
		group: 'Forces',
		min: -30,
		max: 30,
		step: 0.5,
		default: -3.5
	},
	turbulence: {
		type: 'range',
		label: 'Turbulence',
		group: 'Forces',
		min: 0,
		max: 30,
		step: 0.1,
		default: 9
	},
	drag: {
		type: 'range',
		label: 'Drag',
		group: 'Forces',
		min: 0,
		max: 1,
		step: 0.01,
		default: 0.06
	},
	follow: {
		type: 'toggle',
		label: 'Follow pointer',
		group: 'Forces',
		default: true
	}
};

const MAX_COUNT = 20000;

/**
 * @param {HTMLCanvasElement} canvas
 * @param {Record<string, any>} initialParams
 */
export function create(canvas, initialParams) {
	let settings = { ...initialParams };

	const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
	renderer.setPixelRatio(1); // the host already sized the canvas in device pixels
	renderer.setClearColor(0x0b0b0b, 1);

	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 500);
	camera.position.set(0, 0, 72);

	// One buffer at the maximum count, with only the first `count` drawn. This
	// avoids reallocating GPU memory every time the count slider moves.
	const positions = new Float32Array(MAX_COUNT * 3);
	const velocities = new Float32Array(MAX_COUNT * 3);
	const ages = new Float32Array(MAX_COUNT);
	const lifetimes = new Float32Array(MAX_COUNT);
	const alphas = new Float32Array(MAX_COUNT);

	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
	geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));

	// A round, soft point sprite drawn in the shader: no texture to load, so the
	// folder stays self-contained.
	const material = new THREE.ShaderMaterial({
		transparent: true,
		depthWrite: false,
		blending: THREE.AdditiveBlending,
		uniforms: { uSize: { value: 1.6 } },
		vertexShader: /* glsl */ `
			attribute float aAlpha;
			uniform float uSize;
			varying float vAlpha;
			void main() {
				vAlpha = aAlpha;
				vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
				// Perspective-correct point size: particles shrink with distance.
				gl_PointSize = uSize * (300.0 / -viewPosition.z);
				gl_Position = projectionMatrix * viewPosition;
			}
		`,
		fragmentShader: /* glsl */ `
			precision highp float;
			varying float vAlpha;
			void main() {
				// gl_PointCoord runs 0-1 across the sprite; discard outside the disc.
				float d = length(gl_PointCoord - 0.5);
				if (d > 0.5) discard;
				float edge = smoothstep(0.5, 0.15, d);
				gl_FragColor = vec4(vec3(1.0), edge * vAlpha);
			}
		`
	});

	const points = new THREE.Points(geometry, material);
	scene.add(points);

	const emitter = new THREE.Vector3();

	/** Respawn one particle at the emitter with a random outward velocity. */
	function spawn(/** @type {number} */ i, /** @type {boolean} */ stagger) {
		const i3 = i * 3;
		positions[i3] = emitter.x;
		positions[i3 + 1] = emitter.y;
		positions[i3 + 2] = emitter.z;

		// Direction sampled evenly over a sphere, so the cloud has no seams.
		const theta = Math.random() * Math.PI * 2;
		const z = Math.random() * 2 - 1;
		const r = Math.sqrt(1 - z * z);
		const speed = settings.speed * (0.4 + Math.random() * 0.6);
		velocities[i3] = Math.cos(theta) * r * speed;
		velocities[i3 + 1] = Math.sin(theta) * r * speed;
		velocities[i3 + 2] = z * speed;

		lifetimes[i] = settings.life * (0.6 + Math.random() * 0.8);
		// Stagger ages on first fill, so the system starts mid-flow rather than
		// firing every particle at once.
		ages[i] = stagger ? Math.random() * lifetimes[i] : 0;
	}

	for (let i = 0; i < MAX_COUNT; i++) spawn(i, true);

	let count = Math.round(settings.count);
	geometry.setDrawRange(0, count);
	let lastTime = 0;

	return {
		/** @param {Record<string, any>} next */
		update(next) {
			settings = { ...next };
			count = Math.round(settings.count);
			geometry.setDrawRange(0, count);
			material.uniforms.uSize.value = settings.size;
		},

		/**
		 * @param {number} time seconds, already scaled by the host's speed control
		 * @param {{ x: number, y: number, inside: boolean }} pointer
		 */
		frame(time, pointer) {
			const dt = Math.min(Math.max(time - lastTime, 0), 1 / 20);
			lastTime = time;

			if (settings.follow && pointer.inside) {
				// Project the pointer onto the z = 0 plane, so the emitter sits
				// under the cursor rather than somewhere behind the scene.
				const ndcX = (pointer.x / canvas.width) * 2 - 1;
				const ndcY = -((pointer.y / canvas.height) * 2 - 1);
				const halfHeight = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
				emitter.set(ndcX * halfHeight * camera.aspect, ndcY * halfHeight, 0);
			} else {
				emitter.set(Math.cos(time * 0.7) * 18, Math.sin(time * 0.9) * 12, 0);
			}

			const { gravity, turbulence, drag } = settings;
			const damping = Math.exp(-drag * dt * 6);

			for (let i = 0; i < count; i++) {
				const i3 = i * 3;

				ages[i] += dt;
				if (ages[i] >= lifetimes[i]) spawn(i, false);

				// Cheap stand-in for a noise field: three offset sine waves. It is
				// not curl noise, but it is divergence-free enough to look like
				// drifting air and short enough to read in one go.
				const px = positions[i3];
				const py = positions[i3 + 1];
				const pz = positions[i3 + 2];
				velocities[i3] += Math.sin(py * 0.08 + time * 0.8) * turbulence * dt;
				velocities[i3 + 1] += Math.sin(pz * 0.08 + time * 0.6) * turbulence * dt + gravity * dt;
				velocities[i3 + 2] += Math.sin(px * 0.08 + time * 0.7) * turbulence * dt;

				velocities[i3] *= damping;
				velocities[i3 + 1] *= damping;
				velocities[i3 + 2] *= damping;

				positions[i3] += velocities[i3] * dt;
				positions[i3 + 1] += velocities[i3 + 1] * dt;
				positions[i3 + 2] += velocities[i3 + 2] * dt;

				// Fade in over the first tenth of life and out over the last third,
				// so particles never pop in or out.
				const t = ages[i] / lifetimes[i];
				alphas[i] = Math.min(t / 0.1, 1) * Math.min((1 - t) / 0.3, 1);
			}

			geometry.attributes.position.needsUpdate = true;
			geometry.attributes.aAlpha.needsUpdate = true;
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
			geometry.dispose();
			material.dispose();
			renderer.dispose();
		}
	};
}
