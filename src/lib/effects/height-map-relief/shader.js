/**
 * Fragment shader for the height-map relief demo. A plain JS template string,
 * not a .glsl import, so this folder needs no build-tool plugin to be reused.
 */

export const fragmentShader = /* glsl */ `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColour;

uniform vec2 uResolution;
uniform float uScale;
uniform float uOctaves;
uniform float uSurface;   // 0 dunes, 1 ridges, 2 terraces
uniform float uRelief;
uniform float uLightAngle;
uniform float uLightHeight;
uniform float uSpecular;
uniform float uDrift;
uniform float uView;      // 0 lit, 1 height, 2 normals

vec2 hash2(vec2 p) {
	// A sine-based hash repeats visibly once the coordinates get large, and
	// octaves push them large on purpose. This one stays uncorrelated.
	const vec2 k = vec2(0.3183099, 0.3678794);
	p = p * k + k.yx;
	return -1.0 + 2.0 * fract(16.0 * k * fract(p.x * p.y * (p.x + p.y)));
}

/**
 * Gradient noise, not value noise. Value noise interpolates a random number per
 * lattice point and leaves a visible extremum at every one of them, which the
 * lighting finds immediately. Gradient noise interpolates a random direction
 * and is zero at the lattice, so the surface has no preferred grid.
 */
float gradientNoise(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	// Quintic, not smoothstep. Its second derivative is zero at the cell
	// boundary, and the normal is a first derivative, so a cubic fade leaves
	// the lattice visible as a grid of creases once the surface is lit.
	vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);

	float a = dot(hash2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0));
	float b = dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
	float c = dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
	float d = dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));

	return mix(mix(a, b, u.x), mix(c, d, u.x), u.y) * 0.5 + 0.5;
}

/** The height map itself: one scalar per point, before any lighting exists. */
float height(vec2 p) {
	float sum = 0.0;
	float amp = 0.5;
	float norm = 0.0;

	for (int i = 0; i < 6; i++) {
		if (float(i) >= uOctaves) break;
		float n = gradientNoise(p);
		// Ridges: folding the noise at its midpoint turns smooth hills into
		// creases, because the fold leaves a gradient discontinuity behind.
		if (uSurface > 0.5 && uSurface < 1.5) n = 1.0 - abs(n * 2.0 - 1.0);
		sum += n * amp;
		norm += amp;
		p = p * 2.03 + 17.1;
		// Well below one half. Slope scales as amplitude times frequency, so at
		// a half every octave adds equal slope and the surface lights up as
		// crumpled foil however large the feature size claims to be.
		amp *= 0.32;
	}

	float h = sum / max(norm, 1e-4);

	if (uSurface > 1.5) {
		// Terraces: plateaus with a short soft riser. A hard quantisation would
		// give every step an infinite gradient and a white specular rim.
		float levels = 7.0;
		float t = h * levels;
		h = (floor(t) + smoothstep(0.0, 0.3, fract(t))) / levels;
	}

	return h;
}

void main() {
	vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
	vec2 p = (vUv - 0.5) * aspect * uScale + vec2(uDrift, uDrift * 0.4);

	float h = height(p);

	// The normal is the gradient of the height field. Two extra samples are all
	// that stands between a grey map and something that looks three dimensional.
	const float eps = 0.015;
	float dx = (height(p + vec2(eps, 0.0)) - h) / eps;
	float dy = (height(p + vec2(0.0, eps)) - h) / eps;
	vec3 normal = normalize(vec3(-dx * uRelief, -dy * uRelief, 1.0));

	float azimuth = radians(uLightAngle);
	float flat_ = 1.0 - uLightHeight;
	vec3 light = normalize(vec3(cos(azimuth) * flat_, sin(azimuth) * flat_, max(uLightHeight, 0.05)));
	vec3 view = vec3(0.0, 0.0, 1.0);
	vec3 half_ = normalize(light + view);

	float diffuse = max(dot(normal, light), 0.0);
	float specular = pow(max(dot(normal, half_), 0.0), mix(8.0, 140.0, uSpecular)) * uSpecular;

	// Summed gradient noise clusters hard around its midpoint, so the raw
	// height covers only the middle of the range. Stretch it before it becomes
	// a colour, or the material reads as flat grey whatever the lighting does.
	float shade = clamp((h - 0.5) * 2.4 + 0.5, 0.0, 1.0);
	vec3 base = mix(vec3(0.07, 0.07, 0.08), vec3(0.95, 0.94, 0.90), shade * 0.78 + 0.12);
	// A real surface is never only lit by its key light. Without an ambient
	// floor every slope facing away goes to pure black, and the relief reads as
	// crumpled foil rather than as a material.
	vec3 lit = base * (0.22 + 1.0 * diffuse) + vec3(specular);

	vec3 result = lit;
	if (uView > 0.5 && uView < 1.5) result = vec3(shade);
	if (uView > 1.5) result = normal * 0.5 + 0.5;

	fragColour = vec4(result, 1.0);
}
`;
