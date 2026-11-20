---
slug: scale-modulated-grid
name: Scale-modulated grid
synonyms:
  - scale modulation
  - size modulation
  - modulated dot grid
  - variable-size grid
collection: Pattern and systems
tags:
  - generative
oneLiner: A regular grid of one shape where each mark's size is set by a rule, so a pattern or a word appears without any mark moving.
whatItIs: |
  A scale-modulated grid keeps every element in its place and changes only how big it is. A field, which can be a wave, a ripple, noise or a piece of type, gives each cell a value between nought and one, and that value sets the size of the mark drawn there. Read at a distance, the grid becomes an image; read close, it is still only one shape repeated.

  It is the central idea of systematic design from the 1960s onwards. Karl Gerstner's Designing Programmes argued for designing the rule rather than the picture, and Victor Vasarely's Vega paintings swell a grid of circles and squares until it appears to bulge out of the canvas. The same rule drives a huge amount of contemporary identity work, from dot-grid logos to responsive patterns that change with data.

  The name describes the method: modulation in the signal sense, one property of a carrier varied by another signal. The grid is the carrier and scale is the property.
renderer: canvas2d
motionDependent: false
controlsLayout: overlay
poster: /posters/scale-modulated-grid.png
parameters:
  - name: Field
    what: The rule that sets each mark's size. Radial ripples from a point that follows the pointer, wave is a travelling band, noise is organic, and type reads a wordmark into the grid.
    lock: lock
  - name: Element
    what: The repeated shape. Circles are the most neutral, squares meet at full size and turn into a solid, crosses hold their structure even when large, and bars make a line screen.
    lock: lock
  - name: Columns
    what: Grid density. Fewer columns make each mark a graphic object; more columns turn the field into a picture and the marks into texture.
    lock: expose
  - name: Smallest and largest
    what: The range the field maps into. These two numbers set the contrast of the whole system. A smallest above zero keeps the grid visible everywhere, and a largest above one lets neighbours merge.
    lock: lock
  - name: Frequency
    what: How many cycles of the field fit the frame. Too high and the field beats against the grid itself, producing moire.
    lock: expose
  - name: Steps
    what: Quantises the size into a few fixed values. Continuous scale looks generated; three or four steps looks designed, and is far easier to reproduce in print.
    lock: lock
  - name: Rotation with scale
    what: Couples a second property to the same field. One extra coupled property adds a lot of life; two or more and the rule stops being readable.
    lock: lock
related:
  - halftone
  - grid-interruption
  - moire
sources:
  - title: Karl Gerstner
    url: https://en.wikipedia.org/wiki/Karl_Gerstner
    kind: history
  - title: Victor Vasarely
    url: https://en.wikipedia.org/wiki/Victor_Vasarely
    kind: history
  - title: Patterns, The Book of Shaders
    url: https://thebookofshaders.com/09/
    kind: tutorial
---

## How it works

Walk the grid. For each cell, take its centre, feed it to a field function, and get back a number between nought and one. Map that number into a range, multiply by the cell size, and draw the shape at that size. That is the whole effect: size equals rule of position.

The fields in the demo are deliberately simple. Radial is a cosine of distance from a point, wave is a sine of distance along a direction, noise is smooth value noise, and type draws a word into a tiny offscreen canvas at one pixel per cell and reads its brightness back. Animating the field, never the marks, is what keeps the grid locked while the image moves through it.

The two decisions that matter are the mapping and the quantisation. A linear map from field to size makes area grow with the square of the value, so midtones look heavier than they should; that is acceptable for pattern, but it is why halftone screens correct for it. Quantising to a few steps snaps the result to a small set of sizes, which turns a smooth gradient into visible bands and makes the system feel authored.

## Brand tool lens

The element, the range and the step count are the identity, so lock them. The field is the variable that should carry meaning: a radial field centred on a point of interest, a wordmark, a data series, an audio level. Expose frequency over a short range and the grid density as a choice between two or three tested values rather than a slider.

Watch the resolution contract. The grid is defined in cells, not pixels, so an export at twice the size should mean the same number of cells drawn larger, unless the tool deliberately offers a denser grid. Watch print too: very small marks will close up on uncoated stock, so set the smallest size from a proof, not from the screen.

For example, a transport brand could lock a grid of circles in three sizes and drive it from a map of passenger numbers, so every station poster is the same system showing a different place.

## Easily confused with

**Halftone** is the same mechanism applied to reproduce a photograph's tone, with the cell size small enough to disappear. A scale-modulated grid wants the marks to be seen, and the field is usually designed rather than sampled.

**Grid interruption** breaks the grid with randomness. Modulation keeps every mark in its cell and varies it by a rule, so the order is never in doubt.

**Moire** can appear inside a modulated grid when the field's frequency approaches the grid's own. It is a side effect to manage, not the effect.

**Contrast modulation** varies tone or weight instead of size. It produces similar images but keeps the grid's rhythm perfectly even, because every mark occupies the same area.
