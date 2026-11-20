---
slug: ordered-dithering
name: Ordered dithering
synonyms:
  - Bayer dithering
  - patterned dithering
  - halftone dithering
collection: Dithering and quantisation
tags:
  - post-fx
  - print
oneLiner: It fakes extra tones by comparing each pixel against a fixed repeating threshold pattern, so a two-colour image still reads as shaded.
whatItIs: |
  Ordered dithering turns a continuous-tone image into a small number of colours by comparing every pixel against a threshold that depends only on where that pixel sits in a repeating tile. Because the tile never changes, the result is deterministic and the pattern is visible: a regular, woven texture that reads as shading from a distance and as structure up close.

  The name comes from the Bayer matrix, published by Bryce Bayer in 1973 — the same Bayer as the colour filter array in camera sensors. "Ordered" distinguishes it from error diffusion, where the threshold depends on what has already been drawn.
renderer: canvas2d
motionDependent: false
controlsLayout: overlay
poster: /posters/ordered-dithering.png
parameters:
  - name: Matrix order
    what: Size of the repeating threshold tile, from 2×2 to 8×8. Larger tiles hold more distinct tones but make the woven pattern more visible.
    lock: lock
  - name: Cell size
    what: How many screen pixels one source pixel becomes. This is the single control that decides whether the result reads as texture or as a graphic device.
    lock: expose
  - name: Levels
    what: Number of output tones. Two is the classic bitonal look; more levels soften it towards a posterised image.
    lock: expose
  - name: Contrast
    what: Pushes tones apart before thresholding, which thins or thickens the pattern without changing the matrix.
    lock: expose
  - name: Invert
    what: Swaps light and dark. Useful when the artwork is going on a dark substrate.
    lock: expose
related:
  - chromatic-aberration
sources:
  - title: Ditherpunk — The article I wish I had about monochrome image dithering
    url: https://surma.dev/things/ditherpunk/
    kind: article
  - title: Ordered dithering
    url: https://en.wikipedia.org/wiki/Ordered_dithering
    kind: article
  - title: Dithering on the GPU
    url: https://alex-charlton.com/posts/Dithering_on_the_GPU/
    kind: tutorial
---

## How it works

Build the threshold tile recursively. Start with a single value, then at each step quadruple the tile and place the four copies at offsets of 0, 2, 3 and 1 times the previous range. That particular ordering is the whole trick: it guarantees that any two thresholds which are numerically close end up as far apart on the tile as possible, so the dots switch on in a spread-out sequence rather than clumping into blobs.

Rendering is then two lines per pixel. Take the brightness, add the tile's threshold for that position scaled to one output step, and round to the nearest available level. Where the brightness sits exactly between two levels, half the cells round up and half round down, and the eye averages them back into the missing tone.

## Brand tool lens

Cell size is the parameter that defines the look, and it is the one to expose. At one or two pixels it reads as film grain or paper texture; at six or more it becomes an obvious graphic device, closer to a halftone screen. Everything else is secondary.

Matrix order should usually be locked. An 8×8 Bayer tile is the sensible default for brand work, and letting a client drop to 2×2 produces a coarse checkerboard that rarely looks deliberate. Levels and contrast are safe to expose — they let someone tune the artwork to the substrate without being able to break the system.

In a poster generator for a client, that means one slider labelled "Texture" driving cell size from 2 to 8, contrast as a secondary control, and the matrix fixed at 8×8 in the code.

## Easily confused with

**Error-diffusion dithering** (Floyd–Steinberg, Atkinson) also produces a two-colour image, but its threshold depends on the error carried over from neighbouring pixels, so the dots look organic and non-repeating. If you can see a regular grid, it is ordered; if the grain wanders, it is error diffusion.

**Halftone screening** uses dots of varying _size_ on a fixed grid, usually rotated to a screen angle. Ordered dithering uses dots of fixed size and varying _density_. Halftone is a print process; ordered dithering is a quantisation algorithm that happens to resemble one.

**Posterisation** reduces the number of tones with no spatial pattern at all, which produces hard bands rather than texture.
