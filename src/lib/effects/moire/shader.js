/**
 * Moiré fragment shader.
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
uniform float uFrequency;   // lines per unit, layer one
uniform float uRatio;       // layer two frequency, as a multiple of layer one
uniform float uAngle;       // radians between the two layers
uniform float uDuty;        // line thickness, 0 to 1
uniform float uSoftness;    // edge softness, in line widths
uniform float uDrift;       // layer two offset, animated by the host clock
uniform float uPattern;     // 0 lines, 1 concentric, 2 dots
uniform float uMix;         // 0 multiply, 1 difference

// One grating, sampled with a soft edge so the pattern does not alias into
// noise at high frequencies. Without this the moire you see is the sampler's,
// not the gratings'.
float grating(float phase, float softness) {
	float wave = fract(phase);
	float edge = fwidth(phase) * 1.5 + softness;
	return smoothstep(uDuty + edge, uDuty - edge, wave);
}

float layer(vec2 p, float frequency, float angle, float offset) {
	float c = cos(angle);
	float s = sin(angle);
	vec2 r = vec2(p.x * c - p.y * s, p.x * s + p.y * c);

	if (uPattern < 0.5) {
		return grating(r.x * frequency + offset, uSoftness);
	}
	if (uPattern < 1.5) {
		// Concentric rings: the classic demonstration, because two ring sets
		// at slightly different centres produce a hyperbolic interference.
		return grating(length(r - vec2(0.08, 0.0)) * frequency + offset, uSoftness);
	}
	// A dot grid is two gratings crossed at right angles.
	return grating(r.x * frequency + offset, uSoftness) *
	       grating(r.y * frequency + offset, uSoftness);
}

void main() {
	// Aspect-corrected, centred coordinates, so rotating a layer does not
	// stretch it on a non-square canvas.
	vec2 p = (vUv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);

	float a = layer(p, uFrequency, 0.0, 0.0);
	float b = layer(p, uFrequency * uRatio, uAngle, uDrift);

	// Multiply is two sheets of film stacked; difference is the same two
	// sheets as light through one minus light through the other.
	float combined = mix(a * b, abs(a - b), uMix);

	fragColour = vec4(vec3(combined), 1.0);
}
`;
