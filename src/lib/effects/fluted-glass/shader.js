/**
 * Fragment shader for the fluted glass demo. A plain JS template string, not a
 * .glsl import, so this folder needs no build-tool plugin to be reused.
 */

export const fragmentShader = /* glsl */ `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColour;

uniform sampler2D uSource;
uniform vec2 uResolution;
uniform float uCount;
uniform float uProfile;   // 0 round, 1 bevel, 2 wave
uniform float uIor;
uniform float uDepth;
uniform float uDispersion;
uniform float uSeam;
uniform float uVertical;
uniform float uPan;

/**
 * Lateral shift through a slab of glass whose surface is tilted so that the
 * sine of the angle of incidence is sinI. This is Snell's law and nothing else:
 * the ray bends on the way in, travels uDepth, and comes out displaced.
 */
float refractShift(float sinI, float ior, float depth) {
	float i = clamp(sinI, -0.97, 0.97);
	float t = i / max(ior, 1.0001);
	float tanI = i / sqrt(1.0 - i * i);
	float tanT = t / sqrt(1.0 - t * t);
	return depth * (tanI - tanT);
}

/** Position across one flute, in -1..1. */
float fluteCoord(float across, out float seam) {
	float q = across * uCount + uPan;
	float local = fract(q) * 2.0 - 1.0;
	seam = abs(local);
	return local;
}

float profileSine(float local) {
	if (uProfile < 0.5) return local;                       // half cylinder
	if (uProfile < 1.5) return sign(local) * 0.55;          // flat bevel, two faces
	return sin(local * 3.14159265) * 0.8;                   // soft wave
}

void main() {
	bool vertical = uVertical > 0.5;
	float across = vertical ? vUv.x : vUv.y;

	float seam;
	float local = fluteCoord(across, seam);
	float sinI = profileSine(local);

	// Three samples at slightly different refractive indices. Dispersion is not
	// decoration here: a real flute splits white edges into colour, and leaving
	// it out is what makes a glass shader look like a plain warp.
	vec3 colour;
	for (int c = 0; c < 3; c++) {
		float spread = (float(c) - 1.0) * uDispersion * 0.08;
		float shift = refractShift(sinI, uIor + spread, uDepth);
		vec2 uv = vUv;
		if (vertical) uv.x += shift;
		else uv.y += shift;
		colour[c] = texture(uSource, clamp(uv, 0.001, 0.999))[c];
	}

	// The seam between two flutes is a near grazing angle, so it reads as a
	// dark line. Rendering it makes the ribs read as objects rather than a warp.
	float edge = smoothstep(1.0 - 0.35, 1.0, seam);
	colour *= mix(1.0, 1.0 - uSeam, edge);

	// A thin highlight where the flute is flat to the viewer.
	float crown = smoothstep(0.28, 0.0, abs(local));
	colour += crown * 0.08 * (1.0 - uSeam * 0.5);

	fragColour = vec4(colour, 1.0);
}
`;
