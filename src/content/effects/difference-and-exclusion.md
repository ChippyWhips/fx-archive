---
slug: difference-and-exclusion
name: Difference and exclusion
synonyms:
  - inversion blend modes
  - difference blend
  - negation blend
collection: Compositing and blend modes
tags:
  - post-fx
oneLiner: Two blend modes that subtract one layer from the other, so white inverts what is underneath, black leaves it alone, and identical areas cancel out to black.
whatItIs: |
  Difference takes the absolute difference between the two layers, channel by channel. Black in either layer leaves the other untouched, because anything minus nothing is itself. White inverts it, because one minus a value is its negative. Two identical pixels give black. That last property is the one people remember, and it is also the oldest use of the mode: lay two versions of an image over each other in difference, and anything that has not changed disappears.

  Exclusion is the softer sibling. It behaves identically at black and white, but where the top layer is mid grey it pulls everything towards mid grey rather than producing a strong colour. The arithmetic is the sum of the two values minus twice their product. In practice exclusion looks like a lower-contrast, slightly washed difference, and the two are listed together because they share the same family logic.

  Neither mode darkens nor lightens consistently, and both produce colours that are in neither layer, often their complements. That is why they sit in their own family rather than beside multiply and screen. They are also the blend modes behind the familiar trick of text that inverts as it crosses a photograph or a stripe, which is a one-line CSS rule and appears on a great many portfolio sites.
renderer: canvas2d
motionDependent: false
controlsLayout: overlay
poster: /posters/difference-and-exclusion.png
parameters:
  - name: Blend mode
    what: Difference, exclusion, or normal for comparison. The diagnostic is a mid grey top layer, where difference keeps the contrast and exclusion flattens it to grey.
    lock: lock
  - name: Top layer opacity
    what: Fades between the blended result and the backdrop. At half opacity, difference over a white area gives flat mid grey, which is rarely what anyone wanted.
    lock: lock
  - name: Self offset
    what: Replaces the top layer with a shifted copy of the bottom one. Everything that lines up cancels, only the edges remain, and it is the clearest demonstration of what the mode is computing.
    lock: lock
  - name: Bottom and top layer
    what: What the two layers contain. Stripes against coloured discs shows the inversion. The tonal ramp against the grey ramp gives a readable chart of the function.
    lock: expose
  - name: Show
    what: Isolates either layer, to answer the question of which colour came from where.
    lock: lock
related:
  - multiply-and-screen
  - feedback-loops
  - echo-and-trails
sources:
  - title: Blend modes
    url: https://en.wikipedia.org/wiki/Blend_modes
    kind: article
  - title: Compositing and Blending Level 1
    url: https://www.w3.org/TR/compositing-1/
    kind: article
  - title: blend-mode
    url: https://developer.mozilla.org/en-US/docs/Web/CSS/blend-mode
    kind: tutorial
---

## How it works

As with multiply and screen, the browser already implements both modes to the published specification, so the demo draws two opaque layers to offscreen canvases and composites them with `globalCompositeOperation`. CSS uses the same definitions through `mix-blend-mode: difference` and `exclusion`, and so do the design tools, which means the result here matches the design file.

The empty parts of the top layer are black, not grey. Black is the identity for both modes, so anything not covered by a disc leaves the stripes exactly as they were. The discs are added together, so where they overlap the top layer reaches white, and white inverts. The result is the full complement of the stripes beneath, which is the property the whole family is named after.

The self offset control replaces the top layer with the bottom layer shifted slightly. This is what difference is really for in production: comparing two things that should be the same. Every pixel that matches turns black, and the outline left behind is exactly the region that changed. Video editors use it to check that two frames line up, and motion designers use it as a quick, cheap edge detector.

## Brand tool lens

Difference is a strong look and an unpredictable one. Because the result depends on both layers at every pixel, the same graphic over two different photographs can produce two completely different palettes, including colours that are nowhere in the brand. That is fine when the backdrop is locked, and a problem when it is not.

So lock the mode and, wherever possible, lock the backdrop to black and white or to the brand's neutrals. Over those, difference gives predictable results: white text inverts cleanly, black text vanishes, and nothing off-palette appears. If the backdrop has to be a user photograph, preview the result on the brightest and darkest images in the library before signing it off.

One example: a studio site whose wordmark sits fixed over a scrolling page in difference. Lock the wordmark to pure white so it always reads as the inverse of whatever passes under it. In CSS that is `mix-blend-mode: difference` on the wordmark, with `isolation: isolate` on any container that should not be part of the blend.

Avoid opacity below one. A half-strength difference over white is mid grey and over black is unchanged, which reads as a muddy, unintended layer rather than an effect.

## Easily confused with

**Multiply and screen** darken or lighten consistently. Difference does neither, and it produces colours that appear in neither layer.

**Subtract** takes the top layer away from the bottom without the absolute value, so anything that would go negative clips to black. It is not commutative. Difference is, and gives the same result whichever layer is on top.

**Invert** is a filter on one layer. Difference with a white layer gives the same result, but only where the white is, which is what makes the masked inversion trick possible.

**Feedback loops** often use difference between the current frame and the last, which is where the trailing, edge-only look of many audiovisual works comes from. The blend is the mechanism, the loop is the effect.
