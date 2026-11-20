/**
 * The fragment shader, as a string rather than a .glsl file, so this folder
 * needs no bundler plugin to work anywhere.
 */
export const fragmentShader = /* glsl */ `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColour;

uniform sampler2D uSource;
uniform vec2 uResolution;
uniform float uAmount;     // base split, in fractions of the short edge
uniform float uFalloff;    // 0 = even across the frame, 1 = centre stays sharp
uniform float uBarrel;     // lens-style radial distortion
uniform float uVelocity;   // extra split driven by pointer speed
uniform vec2 uDirection;   // unit vector the channels split along
uniform float uRadial;     // 0 = directional split, 1 = split outwards

/**
 * Sample one channel at its own offset. Real chromatic aberration happens
 * because a lens refracts wavelengths by slightly different amounts, so red and
 * blue focus at different distances. We fake that by sampling red and blue a
 * little either side of green, which stays put.
 */
float sampleChannel(vec2 uv, vec2 offset, int channel) {
	vec2 p = uv + offset;
	// Outside the frame there is nothing to sample, so fade rather than smear.
	if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0) return 0.0;
	vec3 colour = texture(uSource, p).rgb;
	return channel == 0 ? colour.r : (channel == 1 ? colour.g : colour.b);
}

void main() {
	vec2 uv = vUv;
	vec2 centred = uv - 0.5;
	// Correct for aspect so the falloff is a circle, not an ellipse.
	vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
	float radius = length(centred * aspect) / length(vec2(0.5) * aspect);

	// Barrel distortion: the lens bulge that usually comes with the fringing.
	uv = 0.5 + centred * (1.0 + uBarrel * radius * radius);

	// Fringing is strongest at the edge of a lens, so weight by radius. At
	// falloff 0 the split is even, which reads as a deliberate graphic device
	// rather than a lens.
	float weight = mix(1.0, radius * radius, uFalloff);

	// Pointer velocity widens the split. This effect only really makes sense in
	// motion, so the demo ties it to movement rather than leaving it static.
	float amount = (uAmount + uVelocity) * weight;

	// Either split along a fixed axis, or outwards from the centre like a lens.
	vec2 radialDir = radius > 0.0001 ? normalize(centred) : vec2(0.0);
	vec2 dir = mix(uDirection, radialDir, uRadial);
	vec2 offset = dir * amount;

	float r = sampleChannel(uv, offset, 0);
	float g = sampleChannel(uv, vec2(0.0), 1);
	float b = sampleChannel(uv, -offset, 2);

	fragColour = vec4(r, g, b, 1.0);
}
`;
