---
slug: flow-fields
name: Flow fields
synonyms:
  - vector fields
  - noise fields
  - Perlin flow
  - particle flow
collection: Generative fields
tags:
  - generative
oneLiner: Every point on the canvas is given a direction, and thousands of lines simply follow those directions, so the drawing reveals an invisible current.
whatItIs: |
  A flow field is a grid of angles laid over the canvas: at every point, an arrow saying which way to go. On its own it draws nothing. The image appears when something travels through it. Drop a particle anywhere, move it a short step in the direction under it, read the new direction, step again, and the path it leaves curves smoothly with the field. Do that from thousands of starting points and the lines bunch, part and swirl together like iron filings round a magnet or water round a stone.

  The directions almost always come from a noise function, usually Perlin noise, because noise changes smoothly from point to point and so the paths never kink. The term comes from physics and fluid dynamics, where a vector field describes how something moves through space. In generative art it is one of the most recognisable techniques there is, popularised by Tyler Hobbs and the wider pen-plotter scene.
renderer: canvas2d
motionDependent: false
controlsLayout: overlay
poster: /posters/flow-fields.png
parameters:
  - name: Noise scale
    what: How many noise features fit across the frame. This sets the scale of the whole composition, from one broad sweep to many small eddies, and it is the first thing that gives a field its character.
    lock: expose
  - name: Turns
    what: How much rotation the noise range maps to. Low values give gentle, parallel drift; high values make lines curl back on themselves and pile up into dense seams.
    lock: lock
  - name: Angle steps
    what: Snaps every direction to one of a few angles. At zero the curves are smooth; at four or six the same field becomes stepped, architectural and much more graphic.
    lock: lock
  - name: Field drift
    what: Moves slowly through a third dimension of noise, so the field itself evolves. At zero the field is fixed and only the particles move.
    lock: expose
  - name: Particles
    what: How many paths are drawn at once. Density controls the tone of the image far more than line weight does.
    lock: expose
  - name: Step length
    what: How far a particle travels per step. Long steps cut corners and turn curves into polylines; short steps follow the field faithfully.
    lock: lock
  - name: Trail length
    what: How many steps of each path stay visible. Short trails read as particles in motion; long ones read as drawn lines.
    lock: expose
  - name: Line weight
    what: The stroke width. Together with count it decides whether the result looks like a pen plot or a dense engraving.
    lock: lock
  - name: Pointer bends the field
    what: Blends the field towards a vortex round the cursor, so the lines swirl around it. Useful in a playground, rarely in a deliverable.
    lock: lock
related:
  - noise-warp
  - particle-systems
  - echo-and-trails
sources:
  - title: Flow fields
    url: https://www.tylerxhobbs.com/words/flow-fields
    kind: tutorial
  - title: Autonomous agents (flow field following)
    url: https://natureofcode.com/autonomous-agents/
    kind: tutorial
  - title: Perlin noise
    url: https://en.wikipedia.org/wiki/Perlin_noise
    kind: history
---

## How it works

Sample a 3D noise function at the point's x and y, scaled so that a handful of features fit across the frame. Noise returns a value roughly between minus one and one; multiply it by a full turn, and you have an angle. That is the entire field. It is never stored as a grid in this demo, because noise is cheap enough to evaluate exactly where each particle stands.

Each particle then repeats one step: read the angle under it, move a few pixels in that direction, record the new position. Particles that leave the frame or reach the end of their lifetime respawn somewhere random, which keeps the coverage even. The third noise coordinate is time, so the field slowly reshapes and the paths drift with it.

The characteristic dense seams are not drawn on purpose. Wherever the field points inwards from both sides, every particle nearby gets funnelled into the same line, and the drawing darkens there on its own. Quantising the angle to a few steps changes that structure entirely, which is why it is one of the most useful single controls.

The demo redraws every trail from a short history each frame instead of fading the previous frame, so lines stay crisp and never leave a grey residue.

## Brand tool lens

The noise seed and the noise scale are the identity. Two flow fields with the same line weight and palette but different scales look like two different brands; two with different seeds but the same scale look like siblings. So lock the scale range tightly, and treat the seed as the thing a client tool exposes: a "generate another" button that keeps everything else fixed produces endless variations that all belong together.

Lock the angle mapping, the step length and the line weight. Expose density and trail length, which move the result between airy and dense without changing what it is. If the brand uses quantised angles, that is a fixed decision, not a slider.

For print or plotter output, render vector paths rather than pixels, and decide whether lines are allowed to cross. Hobbs's non-colliding variant, where a line stops before it touches another, is a separate algorithm with a quieter, more designed look, and it should be specified as such.

## Easily confused with

**Noise warp** uses the same noise to push the pixels of an existing image around. A flow field uses it to steer new marks. If there is a source image being distorted, it is a warp.

**Particle systems** are the broader category. A flow field is one particular force acting on particles, and the trails are what make it a drawing rather than a simulation.

**Curl noise** is a refinement of the same idea: it takes the curl of the noise rather than the noise itself, which guarantees the field never converges, so lines circulate forever instead of bunching into seams.

**Streamlines** in scientific visualisation draw the same paths from a measured or simulated field rather than an invented one, and they are placed evenly on purpose to show the data rather than to make a texture.
