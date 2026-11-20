/**
 * Shaders for the feedback loop demo, as plain strings so the folder needs no build plugin.
 */

/** One trip round the loop: last frame, transformed and faded, with the seed composited on top. */
export const loopShader = /* glsl */ `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColour;

uniform sampler2D uPrevious;
uniform sampler2D uSeed;
uniform vec2 uResolution;
uniform vec2 uCentre;     // 0..1, the point the loop zooms and turns about
uniform float uZoom;
uniform float uTurn;      // radians
uniform float uGain;
uniform float uHue;       // radians
uniform int uBlend;       // 0 screen, 1 add, 2 over, 3 difference
uniform int uEdge;        // 0 black, 1 mirror, 2 wrap

vec3 rotateHue(vec3 c, float angle) {
	// Spin the chroma in YIQ, leaving brightness alone.
	const mat3 toYiq = mat3(0.299, 0.596, 0.211, 0.587, -0.274, -0.523, 0.114, -0.322, 0.312);
	const mat3 toRgb = mat3(1.0, 1.0, 1.0, 0.956, -0.272, -1.106, 0.621, -0.647, 1.703);
	vec3 yiq = toYiq * c;
	float s = sin(angle);
	float k = cos(angle);
	yiq.yz = mat2(k, s, -s, k) * yiq.yz;
	return toRgb * yiq;
}

vec3 readPrevious(vec2 uv) {
	if (uEdge == 1) uv = 1.0 - abs(mod(uv, 2.0) - 1.0);
	else if (uEdge == 2) uv = fract(uv);
	else if (any(lessThan(uv, vec2(0.0))) || any(greaterThan(uv, vec2(1.0)))) return vec3(0.0);
	return texture(uPrevious, uv).rgb;
}

void main() {
	vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
	vec2 p = (vUv - uCentre) * aspect;

	// The camera sees the screen zoomed and turned, so each pixel reads from where it came from.
	float s = sin(-uTurn);
	float k = cos(-uTurn);
	p = mat2(k, s, -s, k) * p / uZoom;

	vec3 previous = readPrevious(p / aspect + uCentre);
	previous = max(rotateHue(previous, uHue), 0.0) * uGain;

	vec4 seed = texture(uSeed, vUv);
	vec3 ink = seed.rgb;

	vec3 colour;
	if (uBlend == 0) colour = 1.0 - (1.0 - previous) * (1.0 - ink);
	else if (uBlend == 1) colour = previous + ink;
	else if (uBlend == 2) colour = mix(previous, ink / max(seed.a, 1e-4), seed.a);
	else colour = abs(previous - ink);

	fragColour = vec4(clamp(colour, 0.0, 1.0), 1.0);
}
`;

export const presentShader = /* glsl */ `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColour;
uniform sampler2D uPicture;

void main() {
	fragColour = vec4(texture(uPicture, vUv).rgb, 1.0);
}
`;
