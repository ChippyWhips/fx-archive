/**
 * Raymarched metaballs fragment shader.
 *
 * A JS template string rather than a .glsl file, so the folder needs no loader
 * and no bundler plugin to run anywhere.
 */

export const fragmentShader = /* glsl */ `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColour;

uniform vec2 uResolution;
uniform float uTime;
uniform float uCount;     // how many balls are active, up to 8
uniform float uRadius;
uniform float uBlend;     // smooth-minimum width: the whole effect
uniform float uSpread;
uniform float uSpeed;
uniform vec2 uPointer;    // -1..1, the eighth ball follows this
uniform float uFollow;
uniform float uShine;

const int MAX_BALLS = 8;
const float MAX_DISTANCE = 12.0;
const int MAX_STEPS = 96;

// Polynomial smooth minimum. Taking min() of two spheres gives their union
// with a hard crease; this blends the two fields over a width of k, which is
// what makes two surfaces merge like liquid instead of intersecting.
float smoothMin(float a, float b, float k) {
	float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
	return mix(b, a, h) - k * h * (1.0 - h);
}

vec3 ballPosition(int i) {
	float f = float(i);
	float t = uTime * uSpeed;
	// Irrational-ish multipliers, so the orbits never fall into a repeating
	// arrangement and the group keeps reorganising.
	return vec3(
		sin(t * (0.7 + f * 0.13) + f * 2.1),
		cos(t * (0.6 + f * 0.17) + f * 1.3),
		sin(t * (0.5 + f * 0.11) + f * 3.7)
	) * uSpread;
}

float map(vec3 p) {
	float d = MAX_DISTANCE;
	int count = int(uCount);

	for (int i = 0; i < MAX_BALLS; i++) {
		if (i >= count) break;
		vec3 c = ballPosition(i);
		if (i == 0) {
			c = mix(c, vec3(uPointer * uSpread * 1.3, 0.0), uFollow);
		}
		float sphere = length(p - c) - uRadius;
		d = i == 0 ? sphere : smoothMin(d, sphere, uBlend);
	}

	return d;
}

// Central differences on the distance field. The surface normal is just the
// gradient of the field, which is why an SDF needs no mesh and no vertices.
vec3 normalAt(vec3 p) {
	vec2 e = vec2(0.0015, 0.0);
	return normalize(vec3(
		map(p + e.xyy) - map(p - e.xyy),
		map(p + e.yxy) - map(p - e.yxy),
		map(p + e.yyx) - map(p - e.yyx)
	));
}

void main() {
	vec2 uv = (vUv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0) * 2.0;

	vec3 origin = vec3(0.0, 0.0, 5.2);
	vec3 direction = normalize(vec3(uv, -1.6));

	// Sphere tracing: step along the ray by the distance to the nearest
	// surface, which is guaranteed safe, so no step ever overshoots.
	float travelled = 0.0;
	bool hit = false;
	for (int i = 0; i < MAX_STEPS; i++) {
		vec3 p = origin + direction * travelled;
		float d = map(p);
		if (d < 0.001) { hit = true; break; }
		travelled += d;
		if (travelled > MAX_DISTANCE) break;
	}

	vec3 colour = vec3(0.04);

	if (hit) {
		vec3 p = origin + direction * travelled;
		vec3 n = normalAt(p);
		vec3 light = normalize(vec3(0.5, 0.8, 0.7));

		float diffuse = max(dot(n, light), 0.0);
		float rim = pow(1.0 - max(dot(n, -direction), 0.0), 3.0);
		float specular = pow(max(dot(reflect(-light, n), -direction), 0.0), 48.0);

		colour = vec3(0.1 + diffuse * 0.75 + rim * 0.35 + specular * uShine);
	}

	fragColour = vec4(colour, 1.0);
}
`;
