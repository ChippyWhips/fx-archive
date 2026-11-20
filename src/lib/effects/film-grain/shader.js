/**
 * Film grain fragment shader.
 *
 * A JS template string rather than a .glsl file, so the folder needs no loader
 * and no bundler plugin to run anywhere.
 */

export const fragmentShader = /* glsl */ `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColour;

uniform vec2 uResolution;
uniform float uTime;
uniform float uAmount;     // grain strength
uniform float uSize;       // grain cell, in device pixels
uniform float uResponse;   // how much midtones get more grain than extremes
uniform float uChroma;     // how much the three channels disagree
uniform float uStatic;     // 1 freezes the grain, 0 renews it every frame
uniform float uExposure;

// Hash from integer cell coordinates. Deterministic, so freezing the grain is
// a matter of dropping the time term rather than keeping a buffer around.
float hash(vec3 p) {
	p = fract(p * vec3(0.1031, 0.1030, 0.0973));
	p += dot(p, p.yxz + 33.33);
	return fract((p.x + p.y) * p.z);
}

// Gaussian-ish from two uniform samples. Real grain is not uniform noise: it
// clusters around zero with occasional large grains, and Box-Muller gets that
// shape for far less work than counting silver halide crystals.
float gaussian(vec3 seed) {
	float u1 = max(hash(seed), 1e-5);
	float u2 = hash(seed + 17.0);
	return sqrt(-2.0 * log(u1)) * cos(6.2831853 * u2);
}

// The picture the grain is laid over. Procedural, so this folder needs no
// image file: a drifting key light, a few shapes and a vignette.
vec3 scene(vec2 p, float aspect) {
	vec2 q = (p - 0.5) * vec2(aspect, 1.0);

	vec2 key = vec2(cos(uTime * 0.3) * 0.22, sin(uTime * 0.23) * 0.16);
	float light = 1.0 - smoothstep(0.0, 0.72, length(q - key));
	vec3 colour = vec3(light * 0.95);

	for (int i = 0; i < 3; i++) {
		float f = float(i);
		vec2 c = vec2(cos(uTime * 0.21 + f * 2.2) * 0.3, sin(uTime * 0.27 + f * 1.7) * 0.22);
		float d = length(q - c) - (0.1 + f * 0.035);
		colour += vec3(smoothstep(0.012, -0.012, d)) * (0.18 + f * 0.1);
	}

	float vignette = 1.0 - smoothstep(0.35, 0.95, length(q));
	return clamp(colour * uExposure * vignette, 0.0, 1.0);
}

void main() {
	float aspect = uResolution.x / uResolution.y;
	vec3 colour = scene(vUv, aspect);

	// Grain lives on its own grid, in device pixels, not on the image's
	// features. That independence from content is what makes it read as the
	// film stock rather than as texture painted onto the subject.
	vec2 cell = floor(vUv * uResolution / max(uSize, 0.5));
	float frame = uStatic > 0.5 ? 0.0 : floor(uTime * 24.0);

	// Grain is strongest in the midtones: clear film has no silver to clump
	// and fully exposed film is saturated, so neither end carries much noise.
	float luma = dot(colour, vec3(0.2126, 0.7152, 0.0722));
	float response = mix(1.0, 4.0 * luma * (1.0 - luma), uResponse);

	float mono = gaussian(vec3(cell, frame));
	vec3 noise = vec3(
		mix(mono, gaussian(vec3(cell, frame + 101.0)), uChroma),
		mix(mono, gaussian(vec3(cell, frame + 211.0)), uChroma),
		mix(mono, gaussian(vec3(cell, frame + 307.0)), uChroma)
	);

	colour += noise * uAmount * response;

	fragColour = vec4(clamp(colour, 0.0, 1.0), 1.0);
}
`;
