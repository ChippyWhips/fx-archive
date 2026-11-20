/**
 * Fragment shader for the radial blur demo. A plain JS template string, not a
 * .glsl import, so this folder needs no build-tool plugin to be reused.
 */

export const fragmentShader = /* glsl */ `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColour;

uniform sampler2D uSource;
uniform vec2 uResolution;
uniform vec2 uCentre;      // in uv, 0..1
uniform float uStrength;   // fraction of the distance to the centre that is smeared
uniform float uSamples;
uniform float uJitter;
uniform float uClear;      // radius around the centre that stays sharp
uniform float uGain;       // extra weight for bright samples

float hash(vec2 p) {
	p = fract(p * vec2(123.34, 456.21));
	p += dot(p, p + 45.32);
	return fract(p.x * p.y);
}

void main() {
	vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
	vec2 toPixel = vUv - uCentre;
	float distance = length(toPixel * aspect);

	// The blur grows with distance from the centre for free, because every
	// sample is a scaled copy of the offset. The clear zone only adds a ramp.
	float amount = uStrength * smoothstep(uClear, uClear + 0.25, distance);

	int samples = int(max(uSamples, 1.0));
	float noise = hash(gl_FragCoord.xy);

	vec3 sum = vec3(0.0);
	float weights = 0.0;
	for (int i = 0; i < 64; i++) {
		if (i >= samples) break;
		// Each sample is the image scaled towards the centre by a little more.
		// That is the whole effect: an average of zoomed copies.
		float f = (float(i) + mix(0.5, noise, uJitter)) / float(samples);
		vec2 uv = uCentre + toPixel * (1.0 - amount * f);
		vec3 c = texture(uSource, uv).rgb;
		// Weighting bright samples lets highlights throw longer streaks, which
		// is the difference between a zoom burst and light rays.
		float w = 1.0 + uGain * 6.0 * pow(dot(c, vec3(0.299, 0.587, 0.114)), 3.0);
		sum += c * w;
		weights += w;
	}

	fragColour = vec4(sum / weights, 1.0);
}
`;
