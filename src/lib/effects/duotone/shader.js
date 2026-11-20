/**
 * Fragment shader for the duotone demo. A plain JS template string, not a
 * .glsl import, so this folder needs no build-tool plugin to be reused.
 */

export const fragmentShader = /* glsl */ `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColour;

uniform sampler2D uSource;
uniform float uMode;      // 0 gradient map, 1 two inks
uniform float uContrast;
uniform float uMidpoint;
uniform float uWeight;    // second ink strength, two-ink mode only
uniform vec3 uShadow;
uniform vec3 uHighlight;
uniform vec3 uPaper;

void main() {
	vec3 rgb = texture(uSource, vUv).rgb;

	// Duotone throws colour away first. Everything after this is a function
	// of one number, which is why the source's tonal range matters so much.
	float lum = dot(rgb, vec3(0.2126, 0.7152, 0.0722));

	// Contrast pivots on mid grey; the midpoint is a gamma that slides where
	// mid grey lands, and with it where one colour hands over to the other.
	lum = clamp((lum - 0.5) * uContrast + 0.5, 0.0, 1.0);
	lum = pow(lum, uMidpoint);

	if (uMode < 0.5) {
		// Screen duotone: a gradient map. Black becomes one colour, white the
		// other, and every grey a straight mix between them.
		fragColour = vec4(mix(uShadow, uHighlight, lum), 1.0);
		return;
	}

	// Print duotone: the same greyscale printed twice on paper. Each ink gets
	// its own curve: the dark ink holds only the shadows, the colour ink runs
	// across the whole range and carries the midtones.
	float dark = 1.0 - lum;
	float key = smoothstep(0.35, 1.0, dark);
	float colourInk = pow(dark, 0.6) * uWeight;

	vec3 colour = uPaper;
	colour *= mix(vec3(1.0), uHighlight, colourInk);
	colour *= mix(vec3(1.0), uShadow, key);
	fragColour = vec4(colour, 1.0);
}
`;
