/**
 * Reaction–diffusion shaders: seed, simulate, display.
 *
 * JS template strings rather than .glsl files, so the folder needs no loader
 * and no bundler plugin to run anywhere.
 */

/** Fills the grid with chemical A and scatters small drops of B to start the reaction. */
export const seedShader = /* glsl */ `#version 300 es
precision highp float;

out vec4 state;

uniform float uSpacing;  // grid cells between candidate drops

float hash(vec2 p) {
	return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
	vec2 cell = floor(gl_FragCoord.xy / uSpacing);
	vec2 centre = (cell + 0.25 + 0.5 * vec2(hash(cell), hash(cell + 7.0))) * uSpacing;
	float present = step(0.55, hash(cell + 3.0));
	float drop = present * step(distance(gl_FragCoord.xy, centre), uSpacing * 0.08);
	// Pearson's starting state, with a little noise: a perfectly symmetric drop
	// dies out in some regimes instead of dividing.
	float noise = 0.1 * hash(gl_FragCoord.xy);
	state = vec4(mix(1.0, 0.5, drop), drop * (0.25 + noise), 0.0, 1.0);
}
`;

/** One step of the Gray–Scott model. Run many times per frame. */
export const simulateShader = /* glsl */ `#version 300 es
precision highp float;

out vec4 state;

uniform sampler2D uState;
uniform float uFeed;     // rate A is replenished
uniform float uKill;     // rate B is removed
uniform float uDiffA;
uniform float uDiffB;
uniform vec3 uBrush;     // x, y, radius in grid cells
uniform float uBrushOn;

void main() {
	ivec2 size = textureSize(uState, 0);
	ivec2 c = ivec2(gl_FragCoord.xy);

	// Neighbours wrap at the edges, so the pattern tiles with no border artefacts.
	#define AT(dx, dy) texelFetch(uState, (c + ivec2(dx, dy) + size) % size, 0).rg

	vec2 here = AT(0, 0);

	// The Laplacian: how much a cell differs from its surroundings. This is the
	// diffusion term, a 3x3 weighted average minus the centre.
	vec2 laplacian = -here
		+ 0.2 * (AT(1, 0) + AT(-1, 0) + AT(0, 1) + AT(0, -1))
		+ 0.05 * (AT(1, 1) + AT(-1, 1) + AT(1, -1) + AT(-1, -1));

	float a = here.r;
	float b = here.g;

	// The reaction: A + 2B -> 3B. B consumes A to make more of itself.
	float reaction = a * b * b;

	a += uDiffA * laplacian.r - reaction + uFeed * (1.0 - a);
	b += uDiffB * laplacian.g + reaction - (uKill + uFeed) * b;

	if (uBrushOn > 0.5 && distance(gl_FragCoord.xy, uBrush.xy) < uBrush.z) {
		b = max(b, 0.6);
	}

	state = vec4(clamp(a, 0.0, 1.0), clamp(b, 0.0, 1.0), 0.0, 1.0);
}
`;

/** Upsamples the grid to the canvas and turns the concentration into ink. */
export const displayShader = /* glsl */ `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColour;

uniform sampler2D uState;
uniform float uSoftness;
uniform vec3 uInk;
uniform vec3 uPaper;

// Manual bilinear filtering: float textures are not filterable everywhere,
// and nearest sampling would show the simulation grid as blocks.
float sampleValue(vec2 uv) {
	vec2 size = vec2(textureSize(uState, 0));
	vec2 p = uv * size - 0.5;
	vec2 f = fract(p);
	ivec2 i = ivec2(floor(p));
	ivec2 s = ivec2(size);
	#define V(dx, dy) dot(texelFetch(uState, (i + ivec2(dx, dy) + s) % s, 0).rg, vec2(1.0, -1.0))
	return mix(mix(V(0, 0), V(1, 0), f.x), mix(V(0, 1), V(1, 1), f.x), f.y);
}

void main() {
	// A minus B: high where only A remains, low where B has taken hold.
	float value = sampleValue(vUv);
	float ink = 1.0 - smoothstep(0.5 - uSoftness - 0.01, 0.5 + uSoftness + 0.01, value);
	fragColour = vec4(mix(uPaper, uInk, ink), 1.0);
}
`;
