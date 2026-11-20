/**
 * Fragment shader for the halftone demo. A plain JS template string, not a
 * .glsl import, so this folder needs no build-tool plugin to be reused.
 */

export const fragmentShader = /* glsl */ `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColour;

uniform sampler2D uSource;
uniform vec2 uResolution;
uniform float uFrequency;
uniform float uAngle;
uniform float uShape;   // 0 dot, 1 square, 2 line
uniform float uMode;    // 0 single ink, 1 cmyk
uniform float uSharp;
uniform vec3 uInk;
uniform vec3 uPaper;

vec2 aspect() {
	return vec2(uResolution.x / uResolution.y, 1.0);
}

/**
 * Ink coverage at this pixel for one screen: rotate into the screen's grid,
 * read the source once at the cell centre, and grow a mark to match that tone.
 * Sampling at the centre rather than under the pixel is what makes it a screen
 * rather than a texture multiplied over the image.
 */
float screenMark(vec2 uv, float angleDeg, float channel) {
	float a = radians(angleDeg);
	mat2 rot = mat2(cos(a), -sin(a), sin(a), cos(a));

	vec2 centred = (uv - 0.5) * aspect();
	vec2 q = (rot * centred) * uFrequency;
	vec2 cell = floor(q) + 0.5;

	vec2 sampleUv = (transpose(rot) * (cell / uFrequency)) / aspect() + 0.5;
	vec3 rgb = texture(uSource, clamp(sampleUv, 0.0, 1.0)).rgb;

	float value;
	if (uMode < 0.5) {
		value = 1.0 - dot(rgb, vec3(0.299, 0.587, 0.114));
	} else {
		vec3 cmy = 1.0 - rgb;
		float k = min(cmy.x, min(cmy.y, cmy.z));
		if (channel < 0.5) value = cmy.x - k;
		else if (channel < 1.5) value = cmy.y - k;
		else if (channel < 2.5) value = cmy.z - k;
		else value = k;
	}
	value = clamp(value, 0.0, 1.0);

	vec2 local = q - cell;
	float distance;
	float radius;

	if (uShape < 0.5) {
		distance = length(local);
		// Area, not radius, carries the tone: a dot covering half the cell is
		// mid grey, and its radius is the square root of that.
		radius = sqrt(value / 3.14159265);
	} else if (uShape < 1.5) {
		distance = max(abs(local.x), abs(local.y));
		radius = sqrt(value) * 0.5;
	} else {
		distance = abs(local.y);
		radius = value * 0.5;
	}

	// fwidth gives the mark edge exactly one pixel of softening, whatever the
	// screen frequency. Without it the dots alias into their own moire.
	float width = max(fwidth(distance), 1e-5) * mix(1.6, 0.4, uSharp);
	return 1.0 - smoothstep(radius - width, radius + width, distance);
}

void main() {
	if (uMode < 0.5) {
		float ink = screenMark(vUv, uAngle, 0.0);
		fragColour = vec4(mix(uPaper, uInk, ink), 1.0);
		return;
	}

	// The classic four-colour angles. Thirty degrees apart is the widest
	// separation four screens can have, and yellow takes the odd one out
	// because the eye forgives its moire first.
	float c = screenMark(vUv, uAngle + 15.0, 0.0);
	float m = screenMark(vUv, uAngle + 75.0, 1.0);
	float y = screenMark(vUv, uAngle + 0.0, 2.0);
	float k = screenMark(vUv, uAngle + 45.0, 3.0);

	vec3 paper = uPaper;
	paper = mix(paper, paper * vec3(0.00, 0.68, 0.94), c);
	paper = mix(paper, paper * vec3(0.93, 0.07, 0.55), m);
	paper = mix(paper, paper * vec3(1.00, 0.95, 0.05), y);
	paper = mix(paper, paper * vec3(0.06, 0.06, 0.07), k);

	fragColour = vec4(paper, 1.0);
}
`;
