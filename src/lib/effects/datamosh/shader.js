/**
 * Shaders for the datamosh demo, as plain strings so the folder needs no build plugin.
 * Every texture is stored bottom-up, as GL renders, so pixels are read by texelFetch.
 */

/** One decoded frame: the previous picture moved by motion vectors, plus the residual. */
export const decodeShader = /* glsl */ `#version 300 es
precision highp float;

out vec4 fragColour;

uniform sampler2D uPicture;    // what the decoder showed last frame
uniform sampler2D uSource;     // the true frame now
uniform sampler2D uReference;  // the true frame before, which the encoder predicted from
uniform sampler2D uMotion;     // one vector per macroblock, in pixels, image rows top-down
uniform vec2 uResolution;
uniform float uBlock;
uniform float uResidual;
uniform float uKeyframe;

ivec2 clampTexel(vec2 p) {
	return ivec2(clamp(p, vec2(0.0), uResolution - 1.0));
}

void main() {
	vec2 p = floor(gl_FragCoord.xy);
	vec3 source = texelFetch(uSource, ivec2(p), 0).rgb;

	if (uKeyframe > 0.5) {
		fragColour = vec4(source, 1.0);
		return;
	}

	float imageRow = uResolution.y - 1.0 - p.y;
	ivec2 block = ivec2(floor(p.x / uBlock), floor(imageRow / uBlock));
	vec2 vector = texelFetch(uMotion, block, 0).xy * vec2(1.0, -1.0);

	// A P-frame says: copy this block from there in the last picture, then add the difference.
	// The decoder never checks that the last picture is the one the encoder had in mind.
	ivec2 from = clampTexel(p + vector);
	vec3 moved = texelFetch(uPicture, from, 0).rgb;
	vec3 predicted = texelFetch(uReference, from, 0).rgb;
	vec3 residual = source - predicted;

	fragColour = vec4(moved + residual * uResidual, 1.0);
}
`;

export const presentShader = /* glsl */ `#version 300 es
precision highp float;

out vec4 fragColour;
uniform sampler2D uPicture;

void main() {
	fragColour = vec4(texelFetch(uPicture, ivec2(gl_FragCoord.xy), 0).rgb, 1.0);
}
`;
