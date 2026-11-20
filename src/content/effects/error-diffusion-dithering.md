---
slug: error-diffusion-dithering
name: Error-diffusion dithering
synonyms:
  - Floyd-Steinberg dithering
  - Atkinson dithering
  - diffusion dither
collection: Dithering and quantisation
tags:
  - post-fx
  - print
oneLiner: It quantises each pixel in turn and hands whatever it could not represent to the neighbours it has not reached yet, so the error averages out instead of accumulating.
whatItIs: |
  Error diffusion turns a continuous-tone image into a few colours one pixel at a time, in reading order. Each pixel is rounded to the nearest available tone, and the difference between what it wanted to be and what it became is pushed forward into the pixels that have not been decided yet. Those pixels are nudged slightly lighter or darker as a result, so over any small area the average tone is preserved even though no individual pixel can hold it.

  The result is a grain that wanders rather than a grid that repeats. That is the whole difference from ordered dithering, and it is why error diffusion looks organic and photographic while an ordered matrix looks woven and mechanical. Floyd and Steinberg published the first kernel in 1976; Bill Atkinson's variant, which deliberately discards a quarter of the error, is the look of the early Macintosh.
renderer: canvas2d
motionDependent: false
controlsLayout: overlay
poster: /posters/error-diffusion-dithering.png
parameters:
  - name: Kernel
    what: Which neighbours receive the error and in what proportion. Floyd-Steinberg is the default everywhere; Atkinson throws error away and blows out highlights; Jarvis spreads over a wider area and looks softer.
    lock: lock
  - name: Error passed on
    what: Scales the whole kernel. At zero it is a plain threshold with hard bands, at one it is the real algorithm. Everything between is a blend of the two.
    lock: expose
  - name: Serpentine scan
    what: Reverses every other row so the error does not drift consistently one way. Off, flat areas pick up visible diagonal streaks.
    lock: lock
  - name: Levels
    what: Number of output tones. Two is the classic bitonal look; more levels make the grain finer and the result closer to the original.
    lock: expose
  - name: Cell size
    what: How many screen pixels one quantised pixel becomes. This decides whether the grain reads as texture or as a visible mark.
    lock: expose
  - name: Contrast
    what: Pushes tones apart before quantising, which thins or thickens the grain without changing the kernel.
    lock: expose
related:
  - ordered-dithering
  - posterisation
sources:
  - title: Floyd-Steinberg dithering
    url: https://en.wikipedia.org/wiki/Floyd%E2%80%93Steinberg_dithering
    kind: article
  - title: Dithering - eleven algorithms and source code
    url: https://tannerhelland.com/2012/12/28/dithering-eleven-algorithms-source-code.html
    kind: tutorial
  - title: Ditherpunk
    url: https://beyondloom.com/blog/dither.html
    kind: article
---

## How it works

Work in a float buffer, not in the image data. Convert the source to luma once, then walk the pixels in order. For each one, round to the nearest available level, write that back, and compute the error: the difference between the value the pixel held and the value it was rounded to. Distribute that error to neighbours according to the kernel, weighted and divided by the kernel's divisor.

Floyd-Steinberg's kernel gives 7/16 to the pixel on the right, then 3/16, 5/16 and 1/16 to the three below. Every tap points right or down, and that is not an aesthetic choice: a tap pointing backwards would modify a pixel that has already been decided, and the algorithm would no longer terminate in one pass. This sequential dependency is also why error diffusion cannot be written as a fragment shader. Each pixel needs the finished state of the one before it, and a GPU runs them all at once.

The serpentine scan reverses the direction on alternate rows, mirroring the kernel as it goes. Without it the error always travels right, and large flat areas develop faint diagonal lines where the accumulated error finally tips a pixel over. With it, the drift cancels row by row.

## Brand tool lens

The honest position is that this effect has one good control and several traps. Cell size and levels are the controls that matter: together they decide whether the output reads as a photographic texture or a graphic treatment. Expose those.

The kernel is a trap. It changes the character in ways that are hard to predict from the name, and the difference between Floyd-Steinberg and Jarvis is invisible at small sizes and jarring at large ones. Pick one for the identity and lock it. If the brand wants the early-Macintosh look specifically, that is Atkinson, and that is a decision made once rather than a slider.

The genuine risk in a client tool is scale. Error diffusion is resolution-dependent in a way that ordered dithering is not: the same image dithered at two sizes produces two completely different grains, with no visual relationship between them. If assets are generated at several sizes, the tool must dither at one fixed working resolution and scale the result, or the brand will have two textures it thinks are one.

## Easily confused with

**Ordered dithering** uses a fixed repeating threshold tile, so its pattern is deterministic, tiles seamlessly and is visible as a grid. Error diffusion's pattern depends on the whole image up to that point. If you can see a regular weave, it is ordered; if the grain wanders, it is diffused.

**Blue-noise dithering** gets error diffusion's organic look back into a fixed, tileable mask. It is the right answer when the pattern has to be stable across frames or sizes, which error diffusion is not.

**Film grain** is additive noise laid over an image that keeps its full tonal range. Dithering removes tonal range and uses the pattern to fake it back.

**Halftone screening** also trades tone for pattern, but it does so with dots of varying size on a fixed angled grid, and it exists because of the physics of ink on paper rather than the limits of a palette.
