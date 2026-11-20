/**
 * Fragment shader for the motion blur demo. A plain JS template string, not a
 * .glsl import, so this folder needs no build-tool plugin to be reused.
 */

export const fragmentShader = /* glsl */ `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColour;

uniform vec2 uResolution;
uniform float uTime;
uniform float uSpeed;
uniform float uScene;     // 0 wheel, 1 sweep, 2 orbit
uniform float uShutter;   // degrees
uniform float uFps;
uniform float uSamples;
uniform float uJitter;

float hash(vec2 p) {
	p = fract(p * vec2(123.34, 456.21));
	p += dot(p, p + 45.32);
	return fract(p.x * p.y);
}

/**
 * The scene at one exact instant. Everything about this demo depends on being
 * able to ask for the scene at an arbitrary time, which is why it is a function
 * of t rather than a buffer that gets stepped forward.
 */
vec3 scene(vec2 p, float t, float aa) {
	vec3 paper = vec3(0.07, 0.07, 0.08);
	vec3 ink = vec3(0.95, 0.94, 0.90);

	if (uScene < 0.5) {
		float radius = length(p);
		float angle = atan(p.y, p.x) + t * uSpeed * 2.4;
		float spokes = cos(angle * 6.0);
		float mark = smoothstep(0.55 - aa * 6.0, 0.55 + aa * 6.0, spokes);
		float ring = smoothstep(0.42 + aa, 0.42 - aa, radius) * smoothstep(0.1 - aa, 0.1 + aa, radius);
		float hub = smoothstep(0.07 + aa, 0.07 - aa, radius);
		return mix(paper, ink, clamp(mark * ring + hub, 0.0, 1.0));
	}

	if (uScene < 1.5) {
		// A bar on a sine sweep: fastest in the middle of the frame, stationary
		// at each end. One exposure shows both extremes of the same shutter.
		float x = sin(t * uSpeed * 2.0) * 0.52;
		float bar = smoothstep(0.045 + aa, 0.045 - aa, abs(p.x - x));
		float tall = smoothstep(0.42 + aa, 0.42 - aa, abs(p.y));
		return mix(paper, vec3(0.90, 0.26, 0.20), bar * tall);
	}

	float a = t * uSpeed * 1.8;
	vec3 colour = paper;
	for (int i = 0; i < 3; i++) {
		float phase = a + float(i) * 2.0944;
		vec2 centre = vec2(cos(phase), sin(phase)) * 0.3;
		float disc = smoothstep(0.1 + aa, 0.1 - aa, length(p - centre));
		vec3 tint = i == 0 ? vec3(0.90, 0.26, 0.20) : (i == 1 ? vec3(0.22, 0.48, 0.93) : vec3(0.95, 0.78, 0.22));
		colour = mix(colour, tint, disc);
	}
	return colour;
}

void main() {
	vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
	vec2 p = (vUv - 0.5) * aspect;
	float aa = 1.5 / uResolution.y;

	// Shutter angle is the fraction of the frame interval the shutter is open.
	// 180° on a 24fps camera is 1/48 of a second, which is why that number is
	// the one everyone quotes.
	float exposure = (uShutter / 360.0) / max(uFps, 1.0);
	int samples = int(max(uSamples, 1.0));
	float noise = hash(gl_FragCoord.xy) - 0.5;

	vec3 sum = vec3(0.0);
	for (int i = 0; i < 64; i++) {
		if (i >= samples) break;
		float f = (float(i) + 0.5) / float(samples);
		// Jitter spreads each sample inside its own slot. The error becomes
		// noise instead of a row of hard ghosts, which the eye forgives.
		float offset = f - 0.5 + uJitter * noise / float(samples);
		sum += scene(p, uTime + offset * exposure, aa);
	}

	fragColour = vec4(sum / float(samples), 1.0);
}
`;
