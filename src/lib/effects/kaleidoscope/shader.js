/**
 * Fragment shader for the kaleidoscope demo. A plain JS template string, not a
 * .glsl import, so this folder needs no build-tool plugin to be reused.
 */

export const fragmentShader = /* glsl */ `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColour;

uniform sampler2D uSource;
uniform vec2 uResolution;
uniform vec2 uCentre;     // where in the source the wedge is cut from, uv
uniform float uSegments;
uniform float uMirror;    // 1 mirror each wedge, 0 rotate only
uniform float uTurn;      // radians, the tube turning
uniform float uZoom;      // source distance per unit of output radius
uniform float uView;      // 0 kaleidoscope, 1 source with the wedge marked

const float TAU = 6.28318530718;

void main() {
	vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
	float wedge = TAU / max(uSegments, 1.0);

	if (uView > 0.5) {
		// Show the source and dim everything the kaleidoscope never reads.
		vec2 d = (vUv - uCentre) * aspect / uZoom;
		float a = mod(atan(d.y, d.x) - uTurn + TAU * 0.5, TAU) - TAU * 0.5;
		float lo = uMirror > 0.5 ? 0.0 : -wedge * 0.5;
		bool inside = a >= lo && a <= wedge * 0.5 && length(d) < 0.5 * length(aspect);
		vec3 c = texture(uSource, vUv).rgb;
		fragColour = vec4(inside ? c : c * 0.28, 1.0);
		return;
	}

	vec2 p = (vUv - 0.5) * aspect;
	float r = length(p);
	float a = mod(atan(p.y, p.x), TAU);

	// Fold the angle into one wedge. Mirroring each wedge about its own centre
	// line is what a pair of real mirrors does, and it leaves no seams.
	// Rotation alone copies the wedge without flipping it, so its edges show.
	float t = mod(a, wedge) - wedge * 0.5;
	if (uMirror > 0.5) t = abs(t);

	float angle = t + uTurn;
	vec2 q = vec2(cos(angle), sin(angle)) * r * uZoom;
	vec3 colour = texture(uSource, uCentre + q / aspect).rgb;

	fragColour = vec4(colour, 1.0);
}
`;
