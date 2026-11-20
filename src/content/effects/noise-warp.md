---
slug: noise-warp
name: Noise warp
synonyms:
  - domain warping
  - turbulence displacement
  - liquify
collection: Distortion
tags:
  - post-fx
  - shader
oneLiner: The image is pushed around by a smooth random field, so straight lines turn liquid, and pushed by a field that is itself warped they fold into marbling.
whatItIs: |
  Noise warp displaces every pixel of an image by an amount read from a noise field: a smooth, random-looking surface that varies continuously across the frame. Two lookups give a direction for each pixel, and the source is sampled from there instead. Nearby pixels move by nearly the same amount, so the image bends rather than breaks.

  The noise is usually Perlin noise or one of its descendants, Ken Perlin's 1983 answer to computer imagery looking too clean. Layered at several scales it becomes fractal noise, or fbm, which has the same large and small irregularity as clouds, coastlines and smoke.

  The step that gives the effect its character is domain warping: using the noise to distort the coordinates the noise is read at, before using it to distort the image. A plain noise warp wobbles. A warped warp folds back on itself, pulling lines into the swirls and tongues of marbled paper and oil on water, which is why it is the move behind most liquid brand backgrounds.
renderer: webgl
motionDependent: false
controlsLayout: overlay
poster: /posters/noise-warp.png
parameters:
  - name: Amount
    what: How far a pixel can be pushed, as a share of the frame. The most obvious control, and the one people reach for first, but on its own it only makes a wobble bigger.
    lock: expose
  - name: Scale
    what: How many noise features fit across the frame. Low is a slow, liquid bend; high is crumpled foil. Together with amount it fixes the whole mood, so treat the pair as one decision.
    lock: lock
  - name: Warp the warp
    what: Feeds the field back into its own input before it moves the image. Off is a plain noise warp. On is domain warping, and it is the difference between heat haze and marbling.
    lock: lock
  - name: Octaves
    what: Layers of finer noise added on top of the base. One octave is smooth and rubbery; more adds ragged detail at the edges of every fold. Past four the extra detail is mostly lost in the source.
    lock: lock
  - name: Evolve
    what: Moves the noise through time rather than sliding it across the frame, so the field boils in place. The speed that reads as calm is far slower than people expect.
    lock: expose
  - name: View
    what: Shows the warped image, the displacement field as colour, or the untouched source. The field view is the quickest way to understand what amount and scale are actually doing.
    lock: lock
related:
  - fluted-glass
  - flow-fields
  - feedback-loops
sources:
  - title: 'The Book of Shaders: Fractal Brownian motion'
    url: https://thebookofshaders.com/13/
    kind: tutorial
  - title: 'The Book of Shaders: Noise'
    url: https://thebookofshaders.com/11/
    kind: tutorial
  - title: Perlin noise
    url: https://en.wikipedia.org/wiki/Perlin_noise
    kind: history
---

## How it works

Start with gradient noise: a lattice of points, each given a random slope, with a smooth curve blended between them. Sum several copies, each at double the frequency and half the strength of the last, and you have fbm. Read it twice, at two offsets far enough apart to be unrelated, and the pair of values is a displacement vector for every point in the frame.

The plain warp then samples the source at the pixel's position plus that vector. That is the entire mechanism, and it is a few lines of shader.

Domain warping inserts one step in front. Compute the vector, add it to the position, and compute the vector again at the new position. Because the second lookup lands somewhere the first one chose, the field stretches into long tongues and curls back on itself. Inigo Quilez popularised the technique in shader circles; The Book of Shaders' fbm chapter walks through the same construction.

Animation comes from the third dimension. The noise here is three-dimensional, and time is the third axis, so the field changes shape without translating. Scrolling a 2D noise across the frame instead looks like the image is on a conveyor belt, which is rarely what anyone wanted.

Mirrored texture wrapping matters more than it sounds. A large push reads from beyond the edge of the source, and clamping would smear the border pixels across the frame.

## Brand tool lens

Noise warp is a family of looks rather than one, and the tool should commit to a member of the family. Scale, octaves and the recursion switch are that commitment: lock them together as a named style, in the same way a brand chooses one marbling pattern for its endpapers rather than a marbling generator.

Expose amount and evolve. Amount lets someone dial between a calm and a dramatic version of the same pattern, and evolve is the speed of an animated background, which genuinely varies by context. A seed control is the other useful thing to expose, so someone can regenerate a frame they dislike without changing its character.

The source matters as much as the warp. Bands of the brand palette, as here, give a recognisable result every time. Photography gives something unpredictable. For example, a bank's tool might lock the palette stripes and the warp style, and let teams choose amount from three steps and a seed, which produces endless variation that is always visibly the same material.

## Easily confused with

**Fluted glass** displaces the image too, but by a repeating, regular profile. Noise warp has no period and no material, only a field.

**Flow fields** use the same kind of noise to steer particles or strokes, drawing new marks along its direction. Noise warp moves existing pixels; it draws nothing.

**Ripple and wave distortion** use a regular sine rather than noise, so their displacement repeats and radiates. Noise warp never repeats.

**Liquify**, the Photoshop tool, is a displacement painted by hand. Same mechanism, but authored, not generated.
