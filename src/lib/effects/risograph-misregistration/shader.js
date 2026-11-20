/**
 * Fragment shader for the risograph misregistration demo. A plain JS template
 * string, not a .glsl import, so this folder needs no build-tool plugin.
 */

export const fragmentShader = /* glsl */ `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColour;

uniform sampler2D uSource;   // one ink layer per channel: r, g, b
uniform vec2 uResolution;
uniform float uSheet;        // index of the print currently on screen
uniform float uDrums;        // 2 or 3
uniform float uOffset;       // maximum shift, fraction of the short side
uniform float uSkew;         // maximum rotation, degrees
uniform float uGrain;
uniform float uUneven;
uniform vec3 uInk0;
uniform vec3 uInk1;
uniform vec3 uInk2;
uniform vec3 uPaper;

float hash(vec2 p) {
	p = fract(p * vec2(123.34, 456.21));
	p += dot(p, p + 45.32);
	return fract(p.x * p.y);
}

float valueNoise(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	vec2 u = f * f * (3.0 - 2.0 * f);
	return mix(
		mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
		mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
		u.y
	);
}

/**
 * Where this drum's layer lands on the sheet. Each pass through the machine
 * picks up its own small shift and twist, and the same artwork no longer lines
 * up with itself. That is the whole effect.
 */
vec2 registered(vec2 uv, float drum) {
	vec2 seed = vec2(uSheet * 1.37 + drum * 7.11, drum * 3.17 + 0.5);
	vec2 shift = (vec2(hash(seed), hash(seed + 11.3)) * 2.0 - 1.0) * uOffset;
	float twist = radians((hash(seed + 23.7) * 2.0 - 1.0) * uSkew);

	vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
	vec2 p = (uv - 0.5) * aspect;
	p = mat2(cos(twist), -sin(twist), sin(twist), cos(twist)) * p - shift;
	return p / aspect + 0.5;
}

/** Ink actually deposited by one drum at this pixel, 0 to 1. */
float drumInk(vec2 uv, float drum) {
	vec2 q = registered(uv, drum);
	vec4 layers = texture(uSource, clamp(q, 0.0, 1.0));
	float coverage = drum < 0.5 ? layers.r : (drum < 1.5 ? layers.g : layers.b);
	if (q.x < 0.0 || q.x > 1.0 || q.y < 0.0 || q.y > 1.0) coverage = 0.0;

	// The master is a stencil burnt by a thermal head, so tone becomes a
	// scatter of dots. A per-pixel random threshold is a fair stand-in.
	float cell = mix(1.0, 3.0, uGrain);
	float soft = mix(0.5, 0.04, uGrain);
	// Kept within [soft, 1 - soft] so bare paper stays bare and solids stay solid.
	float noise = hash(floor(gl_FragCoord.xy / cell) + drum * 19.1 + uSheet * 0.73);
	float threshold = soft + (1.0 - 2.0 * soft) * noise;
	float ink = smoothstep(threshold - soft, threshold + soft, coverage);

	// Rollers never lay ink down evenly: broad blotches of lighter coverage.
	float blotch = valueNoise(uv * vec2(3.0, 5.0) + vec2(drum * 4.0, uSheet * 2.3));
	return ink * (1.0 - uUneven * 0.7 * blotch);
}

void main() {
	// Paper is not a flat colour either: a faint fibre tooth under the ink.
	float tooth = hash(floor(gl_FragCoord.xy / 1.5)) * 0.04;
	vec3 colour = uPaper - tooth;

	// Riso inks are translucent, so each pass multiplies over what is already
	// on the sheet. Overprinting two inks makes a third colour for free.
	colour *= mix(vec3(1.0), uInk0, drumInk(vUv, 0.0));
	colour *= mix(vec3(1.0), uInk1, drumInk(vUv, 1.0));
	if (uDrums > 2.5) colour *= mix(vec3(1.0), uInk2, drumInk(vUv, 2.0));

	fragColour = vec4(colour, 1.0);
}
`;
