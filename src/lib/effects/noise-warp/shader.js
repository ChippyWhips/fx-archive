/**
 * Fragment shader for the noise warp demo. A plain JS template string, not a
 * .glsl import, so this folder needs no build-tool plugin to be reused.
 */

export const fragmentShader = /* glsl */ `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColour;

uniform sampler2D uSource;
uniform vec2 uResolution;
uniform float uTime;       // already multiplied by the evolve speed
uniform float uScale;      // noise features across the short side
uniform float uAmount;     // displacement, as a fraction of the short side
uniform float uOctaves;
uniform float uRecursion;  // 1 plain warp, 2 warp of a warp
uniform float uView;       // 0 warped, 1 field, 2 source

vec3 hash3(vec3 p) {
	p = vec3(
		dot(p, vec3(127.1, 311.7, 74.7)),
		dot(p, vec3(269.5, 183.3, 246.1)),
		dot(p, vec3(113.5, 271.9, 124.6))
	);
	return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

/** Gradient noise: a random slope at every lattice point, blended smoothly. */
float noise(vec3 p) {
	vec3 i = floor(p);
	vec3 f = fract(p);
	vec3 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
	return mix(
		mix(
			mix(dot(hash3(i), f), dot(hash3(i + vec3(1, 0, 0)), f - vec3(1, 0, 0)), u.x),
			mix(dot(hash3(i + vec3(0, 1, 0)), f - vec3(0, 1, 0)), dot(hash3(i + vec3(1, 1, 0)), f - vec3(1, 1, 0)), u.x),
			u.y
		),
		mix(
			mix(dot(hash3(i + vec3(0, 0, 1)), f - vec3(0, 0, 1)), dot(hash3(i + vec3(1, 0, 1)), f - vec3(1, 0, 1)), u.x),
			mix(dot(hash3(i + vec3(0, 1, 1)), f - vec3(0, 1, 1)), dot(hash3(i + vec3(1, 1, 1)), f - vec3(1, 1, 1)), u.x),
			u.y
		),
		u.z
	);
}

/** Fractal sum: each octave twice the frequency and half the weight of the last. */
float fbm(vec2 p) {
	float sum = 0.0;
	float amp = 0.5;
	mat2 turn = mat2(0.8, 0.6, -0.6, 0.8);
	int octaves = int(uOctaves);
	for (int i = 0; i < 6; i++) {
		if (i >= octaves) break;
		sum += amp * noise(vec3(p, uTime + float(i) * 1.7));
		p = turn * p * 2.03;
		amp *= 0.5;
	}
	return sum;
}

/** Two decorrelated noise lookups make one 2D displacement vector. */
vec2 field(vec2 p) {
	return vec2(fbm(p + vec2(0.0, 0.0)), fbm(p + vec2(5.2, 1.3)));
}

void main() {
	vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
	vec2 p = vUv * aspect * uScale;

	// The warp itself: offset the lookup by a noise field. Feeding that field's
	// output back into its own input is domain warping, and it is what turns
	// soft wobble into folded, marbled structure.
	vec2 offset = field(p);
	if (uRecursion > 1.5) offset = field(p + 4.0 * offset + vec2(1.7, 9.2));

	vec2 uv = vUv + offset * uAmount / aspect;

	if (uView > 1.5) {
		fragColour = vec4(texture(uSource, vUv).rgb, 1.0);
	} else if (uView > 0.5) {
		// Direction as hue on two axes, length as brightness.
		vec2 d = offset * 1.6;
		fragColour = vec4(0.5 + 0.5 * d.x, 0.5 + 0.5 * d.y, 0.5 - 0.25 * (d.x + d.y), 1.0);
	} else {
		fragColour = vec4(texture(uSource, uv).rgb, 1.0);
	}
}
`;
