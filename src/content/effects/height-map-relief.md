---
slug: height-map-relief
name: Height-map relief
synonyms:
  - bump mapping
  - emboss
  - normal mapping
collection: Relief and dimensionality
tags:
  - shader
  - generative
  - 3d
oneLiner: A flat greyscale field read as height, lit from an angle so the slopes become light and shade and the surface appears to stand up.
whatItIs: |
  A height map is a single number per point, nothing more. The dimensionality comes from what is done with it. Take the gradient of that field, the rate at which height changes in each direction, and you have a surface normal. Take the dot product of that normal with a light direction and you have shading. The result is a flat image that the eye reads as a lit solid, even though no geometry was ever built.

  This is the oldest trick in computer graphics that still earns its place. Blinn introduced bump mapping in 1978 precisely to avoid modelling detail as geometry, and the same arithmetic underlies emboss filters, terrain shading in cartography, raised-ink print mockups and most of what people mean by a tactile or material look in identity work.

  The limitation is worth knowing before you rely on it. The surface has no actual depth, so it never occludes itself, it casts no shadows, and its silhouette stays flat. Light it from a very low angle, or rotate the light past the point where a real surface would shadow itself, and the illusion goes. Inside those limits it is indistinguishable from the real thing and costs a fraction as much.
renderer: webgl
motionDependent: false
controlsLayout: overlay
poster: /posters/height-map-relief.png
parameters:
  - name: Surface
    what: Which height field is used. Dunes are plain layered noise, ridges fold the noise at its midpoint so every hill grows a crease, and terraces quantise it into plateaus with soft risers.
    lock: lock
  - name: Feature size
    what: How many features fit across the frame. This is the control that decides whether the result reads as stone, as fabric or as landscape, and it is the one most worth getting right before anything else.
    lock: expose
  - name: Detail
    what: How many layers of noise are summed, each at half the amplitude and twice the frequency. Past four layers you are adding detail finer than the pixel grid, which costs frames and buys aliasing.
    lock: lock
  - name: Relief
    what: Scales the gradient, which is the same thing as scaling the height. The useful range is narrow. Push it and the normals tip past vertical, the shading inverts and the surface reads as foil rather than material.
    lock: expose
  - name: Light direction and elevation
    what: Where the light sits. Direction is the single most powerful control here and the one clients reach for first. Elevation decides how much of the surface is in shadow, and a low light exaggerates everything, including the mistakes.
    lock: expose
  - name: Specular
    what: How sharp and bright the highlight is. It is the difference between matte stock and varnish, and it is also the first thing to look wrong when the relief is pushed too far.
    lock: lock
  - name: Show
    what: Switches between the lit result, the raw height map and the normals. Not a creative control, a teaching one, and worth keeping in an internal tool even if it never ships.
    lock: lock
related:
  - raymarched-metaballs
  - film-grain
  - moire
sources:
  - title: Heightmap
    url: https://en.wikipedia.org/wiki/Heightmap
    kind: article
  - title: Bump mapping
    url: https://en.wikipedia.org/wiki/Bump_mapping
    kind: article
  - title: Phong reflection model
    url: https://en.wikipedia.org/wiki/Phong_reflection_model
    kind: article
---

## How it works

Every pixel asks the height function for its own value and for two neighbours, one a small step across and one a small step down. The two differences are the slope in each direction, and a normal falls straight out of them as `normalize(vec3(-dx, -dy, 1))`. That is the entire mechanism. Three samples and a normalise stand between a grey smudge and something that looks carved.

The lighting is Lambert plus a Blinn-Phong highlight. Diffuse shading is the dot product of the normal and the light direction, clamped at zero, which is a statement about how a rough surface scatters light equally in all directions. The highlight raises the dot product of the normal and the halfway vector to a power, and that power is the only thing separating chalk from polished metal.

The height field here is gradient noise summed over several octaves. Gradient noise rather than value noise, because value noise leaves an extremum at every lattice point and lighting finds them instantly. Each octave doubles the frequency and halves the amplitude, which is what makes the result look natural rather than wobbly. The ridge variant folds the noise with `1 - abs(n * 2 - 1)`, and the crease you see is a genuine discontinuity in the gradient left behind by the fold. The terrace variant has to use a soft riser rather than a hard step, because a hard quantisation gives every step an infinite gradient and a white specular rim.

Two choices are deliberate and worth copying. The step used for the gradient is fixed in the noise domain rather than in pixels, so the relief stays stable when the canvas resizes. And the whole thing is per-pixel with no geometry, so it costs the same whatever the apparent complexity of the surface.

## Brand tool lens

Lock the surface type and the specular. They set the material, and the material is the brand. Expose feature size and light direction, because those are the two things a designer will genuinely want to move, and they are also the two that cannot break the result.

Light direction deserves a warning. There is a long-standing convention that light comes from the upper left, and relief lit from below reads as a dent rather than a bump. If the tool lets people choose freely, half of them will produce an inverted image without noticing. Either constrain the range to the upper half, or put the preview next to a reference shape so the inversion is obvious.

Then the output question. A relief that depends on a specular highlight is a screen effect. Printed, that highlight becomes a flat grey patch and the surface collapses. If the identity needs relief in print, the real answer is an emboss or a spot varnish on the press, and the on-screen version should be built to match that rather than the other way round.

## Easily confused with

**Normal mapping** stores the normal directly, three channels instead of one, which allows overhangs and detail no height field can describe. Height mapping derives the normal. In a tool the difference is that a height map can be painted by hand and a normal map really cannot.

**Displacement mapping** moves actual geometry, so it changes the silhouette and casts shadows. It is what height mapping is pretending to be.

**Emboss**, the filter in image editors, is a single-pass difference between the image and a shifted copy of itself. It is a rough approximation of this with the light direction fixed to the shift, which is why it always looks the same.

**Ambient occlusion** darkens creases based on how enclosed they are. It is often mistaken for relief shading because both make surfaces read as solid, but occlusion has no light direction at all.
