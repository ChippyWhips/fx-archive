---
slug: raymarched-metaballs
name: Raymarched metaballs
synonyms:
  - blobby objects
  - isosurfaces
  - signed distance field blending
collection: 3D and particles
tags:
  - 3d
  - shader
  - generative
  - motion-dependent
oneLiner: Spheres defined as a distance field rather than as geometry, blended with a soft minimum so they merge and separate like drops of liquid.
whatItIs: |
  A metaball is not a surface. It is a field: a function that returns, for any point in space, how far that point is from the nearest object. Several of those fields are combined, and the surface is simply wherever the combined value crosses zero. Because the combination is a soft minimum rather than a hard one, two spheres that approach each other do not intersect with a visible crease. Their fields merge over a fixed width, and a neck of surface forms between them.

  Nothing is modelled. There are no vertices, no triangles and no mesh, so the surface can change topology freely: two blobs become one and split again with no special case anywhere in the code. Jim Blinn described the technique in 1982 for visualising molecules, and it has been the standard way to make something read as liquid, mercury or soft matter ever since.
renderer: webgl
motionDependent: true
controlsLayout: overlay
poster: /posters/raymarched-metaballs.png
parameters:
  - name: Blend
    what: The width over which two fields merge. This is the whole effect. At almost zero the blobs are hard spheres that intersect; wide open they behave like a single mass that never quite separates.
    lock: expose
  - name: Radius
    what: The size of each individual field. It interacts strongly with blend and spread, which is why all three cannot sensibly be exposed at once.
    lock: expose
  - name: Blobs
    what: How many fields are active. The cost per frame scales with this, because every ray step evaluates every field.
    lock: lock
  - name: Spread
    what: How far the orbits carry the blobs from the centre. Too wide and they stop meeting; too narrow and they never separate.
    lock: lock
  - name: Orbit speed
    what: How fast the arrangement reorganises. Slow is almost always right, because the merging is the thing worth watching.
    lock: expose
  - name: First blob follows pointer
    what: Attaches one field to the cursor, eased rather than snapped. This is what makes the surface feel like a material rather than an animation.
    lock: lock
  - name: Specular
    what: Strength of the highlight. It carries almost all of the read on what the surface is made of, mercury or matte rubber.
    lock: lock
related:
  - particle-systems
  - chromatic-aberration
sources:
  - title: Metaballs
    url: https://en.wikipedia.org/wiki/Metaballs
    kind: article
  - title: Distance functions
    url: https://iquilezles.org/articles/distfunctions/
    kind: tutorial
  - title: Raymarching distance fields
    url: https://iquilezles.org/articles/raymarchingdf/
    kind: tutorial
---

## How it works

Every object is a signed distance function: for a sphere it is the distance from the point to the centre, minus the radius. Negative inside, zero on the surface, positive outside. Combining two objects with `min` gives their union, but with a hard crease where the surfaces meet. The polynomial smooth minimum replaces that with a blend over a width of k, and those four lines are the entire difference between a pile of spheres and something that reads as liquid.

Rendering uses sphere tracing. Fire a ray from the camera through the pixel, evaluate the field at the current point, and step forward by exactly that distance. Because the field returns the distance to the nearest surface in any direction, that step can never overshoot. Near a surface the steps become tiny and the march converges; in empty space it crosses the scene in a handful of jumps.

The surface normal comes from the gradient of the field, sampled with central differences: four extra evaluations, no stored geometry. That is the deal this technique makes. There is no mesh to build or update, but every ray step evaluates every object, so the cost is the step count multiplied by the field count, and it falls on the fragment shader rather than on the vertex pipeline. Doubling the blob count roughly doubles the frame cost, and there is no level of detail to fall back on.

## Brand tool lens

Metaballs are the most expensive thing in this library to run and the easiest to make look generic. Both facts belong in the tool.

Expose blend and speed, and leave almost everything else locked. Blend is the parameter with character: a tight blend reads as glass beads, a wide one as mercury, and the useful range for a given identity is narrow. Radius, spread and count interact so strongly that exposing all four produces mostly empty frames or a single undifferentiated mass.

The performance ceiling is a hard constraint, not a preference. This is a full-screen fragment shader doing up to ninety-six field evaluations per pixel, and on an integrated GPU at 2x density that is genuinely slow. If this ships in a client tool, cap the resolution it renders at and upscale, cap the blob count, and make sure the thing stops entirely when it is off screen. A hero animation that flattens a laptop's battery is a brand problem.

Finally, decide whether it ever needs to be a still. Metaballs are specifically a motion effect: frozen, they are just blobs. If the identity needs a static version, that is a separate decision about which frame, not a render setting.

## Easily confused with

**Particle systems** also produce an organic mass from simple rules, but they are made of many discrete elements and never form a continuous surface. If you can see individual pieces, it is particles.

**Marching cubes** solves the same problem by extracting a polygon mesh from the field and rendering that. It gives you real geometry you can light, shadow and export, at the cost of a resolution grid and a much heavier update. Raymarching keeps the surface exact and infinite but only exists on screen.

**Gooey SVG filters**, the blur-then-contrast trick, produce a similar look in 2D for a fraction of the cost. That is the right tool when the result is flat shapes on a page rather than a lit surface.

**Fluid simulation** actually solves the physics. Metaballs only imitate the surface behaviour, with no volume conservation and no real dynamics, which is why they merge in ways no liquid would.
