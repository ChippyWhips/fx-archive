/**
 * Voronoi fragment shader.
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
uniform float uCells;       // cells across the short side
uniform float uJitter;      // 0 = sites on a grid, 1 = anywhere in their cell
uniform float uSpeed;       // how fast the sites wander
uniform float uMetric;      // 0 euclidean, 1 manhattan, 2 chebyshev
uniform float uMode;        // 0 fill, 1 edges, 2 distance, 3 crackle
uniform float uEdge;        // edge width, in cells
uniform float uDot;         // site marker radius, in cells; 0 hides them
uniform vec2 uPointer;      // pointer position, in cells
uniform float uPointerOn;
uniform vec3 uInk;
uniform vec3 uPaper;

vec2 hash2(vec2 p) {
	p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
	return fract(sin(p) * 43758.5453);
}

// The metric decides the shape of every cell: straight bisectors in euclidean,
// 45 degree facets in manhattan, axis-aligned steps in chebyshev.
float metric(vec2 v) {
	if (uMetric < 0.5) return length(v);
	if (uMetric < 1.5) return abs(v.x) + abs(v.y);
	return max(abs(v.x), abs(v.y));
}

// One site per grid cell, offset within it and orbiting slowly.
vec2 site(vec2 cell) {
	vec2 h = hash2(cell);
	return cell + 0.5 + uJitter * 0.5 * sin(uTime * uSpeed + 6.2831 * h);
}

void main() {
	vec2 p = (gl_FragCoord.xy - 0.5 * uResolution) / min(uResolution.x, uResolution.y) * uCells;
	vec2 base = floor(p);

	// F1 and F2: distance to the nearest and second-nearest site. Searching
	// 5x5 neighbours rather than 3x3 keeps F2 correct at full jitter.
	float f1 = 1e9;
	float f2 = 1e9;
	vec2 nearest = vec2(0.0);
	vec2 id = vec2(0.0);

	for (int j = -2; j <= 2; j++) {
		for (int i = -2; i <= 2; i++) {
			vec2 cell = base + vec2(float(i), float(j));
			vec2 s = site(cell);
			float d = metric(p - s);
			if (d < f1) {
				f2 = f1;
				f1 = d;
				nearest = s;
				id = cell;
			} else if (d < f2) {
				f2 = d;
			}
		}
	}

	// The pointer is one more site, so moving it reshapes its neighbours live.
	if (uPointerOn > 0.5) {
		float d = metric(p - uPointer);
		if (d < f1) {
			f2 = f1;
			f1 = d;
			nearest = uPointer;
			id = vec2(-91.0, 37.0);
		} else if (d < f2) {
			f2 = d;
		}
	}

	// F2 - F1 is zero exactly on a boundary, which makes it a cheap edge detector.
	float border = f2 - f1;

	// For euclidean distance there is an exact answer: a second pass measures
	// the distance to each bisector between the nearest site and a neighbour,
	// so edges keep an even width instead of swelling where sites crowd.
	if (uMetric < 0.5) {
		vec2 mr = nearest - p;
		border = 1e9;
		for (int j = -2; j <= 2; j++) {
			for (int i = -2; i <= 2; i++) {
				vec2 r = site(base + vec2(float(i), float(j))) - p;
				if (dot(mr - r, mr - r) > 1e-6) {
					border = min(border, dot(0.5 * (mr + r), normalize(r - mr)));
				}
			}
		}
		if (uPointerOn > 0.5) {
			vec2 r = uPointer - p;
			if (dot(mr - r, mr - r) > 1e-6) {
				border = min(border, dot(0.5 * (mr + r), normalize(r - mr)));
			}
		}
		border *= 2.0;
	}
	float aa = fwidth(border);
	float line = 1.0 - smoothstep(uEdge - aa, uEdge + aa, border);

	float tone;
	if (uMode < 0.5) {
		// Each cell gets one of four flat tones, keyed to its site.
		float level = floor(hash2(id + 17.0).x * 4.0) / 3.0;
		tone = mix(0.12, 0.88, level);
		tone = mix(tone, 0.0, line);
	} else if (uMode < 1.5) {
		tone = line;
	} else if (uMode < 2.5) {
		tone = 1.0 - clamp(f1 * 1.6, 0.0, 1.0);
	} else {
		tone = 1.0 - smoothstep(0.0, 0.45, border);
	}

	float siteDistance = length(p - nearest);
	float dotAa = fwidth(siteDistance);
	float marker = (1.0 - smoothstep(uDot - dotAa, uDot + dotAa, siteDistance)) * step(0.0001, uDot);
	// Markers flip to whichever ink reads against the cell beneath.
	tone = mix(tone, tone > 0.5 ? 0.0 : 1.0, marker);

	fragColour = vec4(mix(uPaper, uInk, tone), 1.0);
}
`;
