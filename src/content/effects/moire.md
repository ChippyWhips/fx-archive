---
slug: moire
name: Moire
synonyms:
  - moire pattern
  - interference pattern
  - beat pattern
collection: Periodic structures and interference
tags:
  - print
  - generative
  - motion-dependent
oneLiner: Two regular patterns laid over each other produce a third, much larger pattern that is in neither of them.
whatItIs: |
  Moire appears whenever two periodic structures overlap at slightly different scales or angles. Where their marks coincide the result is dark, where they fall between each other it is light, and because the two frequencies drift in and out of step across the frame, those coincidences repeat at a spacing far larger than either original. That large, slow pattern is the moire, and it exists in neither layer on its own.

  It is the same phenomenon as a beat frequency in sound, and it is extremely sensitive: a rotation of one degree or a scale difference of one percent produces a completely different figure. That sensitivity is why it is both a defect and a technique. It is the artefact that ruins a photograph of a striped shirt or a printed halftone, and it is the mechanism behind op art, anti-counterfeiting guilloche and lenticular printing.
renderer: webgl
motionDependent: true
controlsLayout: overlay
poster: /posters/moire.png
parameters:
  - name: Frequency
    what: Lines across the frame in the first layer. Raising it makes the beat pattern finer and brings the whole effect closer to the point where it becomes noise.
    lock: expose
  - name: Second layer scale
    what: The second layer's frequency as a multiple of the first. One percent either side of exact is where the strongest, widest patterns live.
    lock: expose
  - name: Angle between layers
    what: Rotation between the layers, in degrees. Small angles give wide sweeping bands, larger angles give a tight rosette. The most useful range is under five degrees.
    lock: expose
  - name: Pattern
    what: Lines, concentric rings or a dot grid. Rings and dots are the strongest demonstrations; lines are the version that survives being used as a brand device.
    lock: lock
  - name: Line weight
    what: How much of each cycle is ink. At 0.5 the layers are balanced; pushed either way the moire gains contrast but loses its symmetry.
    lock: lock
  - name: Edge softness
    what: Blurs the grating edges. Some softness is necessary, because a hard-edged grating at high frequency aliases and you end up looking at the sampler's moire instead.
    lock: lock
  - name: Drift
    what: Slides the second layer over time. Tiny movements produce enormous changes in the pattern, which is the whole point in motion.
    lock: expose
related:
  - ordered-dithering
  - pixelation
sources:
  - title: Moire pattern
    url: https://en.wikipedia.org/wiki/Moir%C3%A9_pattern
    kind: article
  - title: Op art
    url: https://en.wikipedia.org/wiki/Op_art
    kind: history
---

## How it works

Each layer is a grating: a function that repeats, turned into ink by a threshold. Rotate the coordinate system for the second layer, scale its frequency slightly differently, and combine the two. Multiply gives you the look of two printed sheets stacked, since ink over ink stays dark. Difference gives the inverse figure, which often reads more strongly on screen.

The part that needs care is sampling. A grating at sixty lines across a frame is already close to the pixel grid, and drawing it with hard edges means each pixel takes a single sample of a function that oscillates faster than the pixels can represent. The result is a moire, but it is the moire between the grating and the display, not between the two layers. Using `fwidth` to measure how fast the phase changes per pixel, and softening the edge by that much, filters the grating to the resolution actually available. The pattern you then see is the real one.

In motion this becomes the most sensitive effect in the library. A drift of a few hundredths of a cycle per second visibly sweeps the whole figure across the frame, because the beat amplifies small changes by the ratio between the two frequencies.

## Brand tool lens

Moire is a dangerous thing to put in a client tool, because almost every combination produces something, and only a narrow band of them produces something good. The honest approach is to lock the pattern type, the line weight and the edge softness, expose frequency and angle over deliberately short ranges, and pick those ranges by eye rather than by what the maths allows.

The more serious constraint is output. A moire designed on screen will not survive printing: the printer's own halftone screen is a third periodic structure, and it will interfere with both layers to produce something nobody chose. If the identity uses moire in print, the artwork has to be generated at the final resolution, with the screen angle known, and proofed on the actual stock. In a tool, that means the export resolution is not a convenience setting, it is part of the artwork.

The same is true of screens. A moire that reads cleanly at 2x will alias into mush on a standard-density display, and it will do something different again when a video codec gets hold of it. If the asset is going to video, test it compressed before it is approved.

## Easily confused with

**Op art** is the art movement that used moire and related interference deliberately, Bridget Riley and Victor Vasarely in particular. Moire is the mechanism, op art is one thing made with it.

**Aliasing** is the general failure of sampling a signal too sparsely. Moire is what aliasing looks like when the signal being undersampled is itself a regular pattern, so every moire is aliasing but not every aliasing artefact is a moire.

**Halftone** is a single periodic screen. It only produces moire when it meets another one, which is why four-colour printing rotates each screen to a different angle.

**Interference patterns** in the physical sense, like Newton's rings, come from waves adding and cancelling. Moire is a purely geometric overlap, and no waves are involved, although the arithmetic rhymes.
