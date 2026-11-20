---
slug: pixelation
name: Pixelation
synonyms:
  - mosaic
  - pixelisation
  - blocking
collection: Sampling and mosaic
tags:
  - post-fx
oneLiner: It averages the image over a coarse grid and draws each square as one flat tone, so detail collapses into blocks.
whatItIs: |
  Pixelation resamples an image to a much lower resolution and then enlarges it again without interpolation. Every square in the output holds the average of the area it covers, so fine detail is not blurred away but quantised: it is replaced by the one tone that best represents the whole cell.

  It arrives in design from two very different directions. One is censorship and broadcast anonymity, where the grid is a functional device for destroying identifying detail. The other is the deliberate low-resolution aesthetic of early screens and games, where the grid is the point and the pixel is a unit of drawing in its own right. The same operation reads as either depending almost entirely on how coarse the cells are and how the edges are handled.
renderer: canvas2d
motionDependent: false
controlsLayout: overlay
poster: /posters/pixelation.png
parameters:
  - name: Cell size
    what: The side of one grid square in screen pixels. It decides everything. At a few pixels the effect reads as texture, at thirty it reads as a graphic device, and somewhere between the two the content stops being legible.
    lock: expose
  - name: Cell aspect
    what: The width of a cell relative to its height. Non-square cells are what separate a deliberate screen from a generic mosaic, but they also date the result quickly.
    lock: lock
  - name: Cell shape
    what: Square, circle or diamond. Anything other than a flush square stops being a resample and becomes a screen, closer in character to halftone.
    lock: lock
  - name: Gap
    what: Space between cells, as a fraction of the cell. A small gap turns the grid into a visible structure rather than a continuous surface.
    lock: lock
  - name: Smooth the upscale
    what: Interpolates between cells instead of drawing hard edges. Off is the effect; on is simply a low-resolution image, and it is useful mainly to show the difference.
    lock: lock
related:
  - ordered-dithering
  - posterisation
sources:
  - title: Pixelization
    url: https://en.wikipedia.org/wiki/Pixelization
    kind: article
  - title: CanvasRenderingContext2D.imageSmoothingEnabled
    url: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/imageSmoothingEnabled
    kind: tutorial
  - title: image-rendering
    url: https://developer.mozilla.org/en-US/docs/Web/CSS/image-rendering
    kind: tutorial
---

## How it works

Draw the source into a small offscreen canvas whose dimensions are the full size divided by the cell size. The browser's own downscale does the averaging for you, and it does it correctly: each destination pixel ends up as a weighted mean of the source area it covers. Then draw that small canvas back at full size with `imageSmoothingEnabled` set to false, which makes the upscale a nearest-neighbour expansion and turns every source pixel into a hard square.

That is the entire effect in two draw calls, and the order matters. Sampling the source at single points instead of averaging an area produces the same block structure but with aliasing: thin strokes flicker in and out as the content moves under the grid, because each cell is deciding on the evidence of one pixel rather than all of them.

Anything other than a flush square grid needs a loop. Once the cells are circles, diamonds or separated by a gap, a single `drawImage` cannot express it, so the demo reads the small canvas back with `getImageData` and fills one path per cell. That is slower, and at small cell sizes it is noticeably so, which is a useful thing to feel: the cheap version of this effect is the one that makes rectangles.

## Brand tool lens

Pixelation is one of the few effects where a single control does almost all the work, which makes it an unusually good candidate for a client tool. Expose cell size and nothing else, and it is very hard to produce something off-brand. Expose shape, gap and aspect as well, and you have built a generic mosaic generator that will be used to make things you did not intend.

The judgement to encode in the tool is the lower bound. There is a cell size below which the effect is invisible at the sizes the work will actually be seen, and an upper bound beyond which the subject is unrecognisable. Both depend on the output: a cell that reads well on a poster disappears on a business card. If the tool knows the output size, the slider should be expressed as cells across the artwork rather than pixels, because that is the number that stays true across formats.

One more rule worth building in: the grid should be anchored to the artwork, not to the viewport. If the grid origin moves when the layout changes, the same asset will pixelate differently in two places and the inconsistency will be read as a mistake.

## Easily confused with

**Ordered dithering** also quantises on a fixed grid, but it quantises tone, not position. A dither keeps the full resolution and uses a pattern of dots to fake intermediate tones; pixelation throws the resolution away and keeps the tones.

**Mosaic sampling** usually means the same operation with non-square or irregular cells, and the words are often used interchangeably. If the cells are a uniform square grid, pixelation is the more precise term.

**Halftone** replaces tone with dots of varying size on a rotated grid. It looks superficially similar at a distance but is a print process, and its grid is almost never aligned to the pixel grid.

**Posterisation** reduces the number of tones with no spatial component at all. Pixelation at a fine cell size and posterisation at many levels are easy to confuse in a thumbnail and are completely different operations.
