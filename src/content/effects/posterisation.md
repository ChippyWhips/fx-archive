---
slug: posterisation
name: Posterisation
synonyms:
  - posterization
  - tone banding
  - level reduction
collection: Dithering and quantisation
tags:
  - post-fx
  - print
oneLiner: It reduces a smooth gradient to a small number of flat tones, so what was a continuous ramp becomes visible bands.
whatItIs: |
  Posterisation rounds every value in an image to the nearest of a few evenly spaced levels. Nothing is added and nothing moves: the only change is that the number of distinct tones drops from hundreds to a handful. Where the original had a smooth ramp, the result has flat areas separated by hard contours, and those contours are the shape of the gradient rather than anything in the subject.

  The name comes from screen printing, where each colour is a separate pass of ink and a photograph has to be reduced to a few flat separations before it can be printed at all. The effect is the digital version of that constraint, which is why it reads as poster, risograph or screen print rather than as a digital artefact. It is also the thing that gradients in 8-bit colour do by accident, which is why the same word describes both a deliberate style and a defect.
renderer: canvas2d
motionDependent: false
controlsLayout: overlay
poster: /posters/posterisation.png
parameters:
  - name: Levels
    what: How many tones survive. Three or four reads as screen print, eight or more reads as a slightly degraded photograph, and the useful range for identity work is narrow.
    lock: expose
  - name: Applied to
    what: Each channel independently, or the brightness alone. Per channel produces the hue shifts along band edges that make it look printed; luminance keeps colours true and looks cleaner but flatter.
    lock: lock
  - name: Gamma
    what: Where the bands fall. Below 1 crowds them into the shadows, above 1 into the highlights. This matters more than the number of levels for whether the result reads as intentional.
    lock: expose
  - name: Draw band edges
    what: Outlines the contour between bands. Useful for seeing what the quantisation actually produced, and the basis for turning this into line art.
    lock: lock
related:
  - ordered-dithering
  - error-diffusion-dithering
sources:
  - title: Posterization
    url: https://en.wikipedia.org/wiki/Posterization
    kind: article
  - title: Color quantization
    url: https://en.wikipedia.org/wiki/Color_quantization
    kind: article
---

## How it works

The arithmetic is one line: divide the value by the step size, round, multiply back. With `n` levels there are `n - 1` steps, so a value in 0 to 1 becomes `round(value * (n - 1)) / (n - 1)`. Because the input is only ever one of 256 values, the whole thing collapses into a lookup table built once and indexed per pixel, which is why posterisation is effectively free even on large images.

The decision that matters is which space the rounding happens in. Quantising the raw 8-bit values puts the bands at equal numeric intervals, which is not where the eye expects them: perceptually, the shadows get too few bands and the highlights too many. Applying a gamma curve before rounding and undoing it afterwards moves the bands around, and that control does more for whether the result looks deliberate than the level count does.

The second decision is per channel or per luminance. Banding each channel separately means red, green and blue step at different points, so a band edge in a coloured area shifts hue as well as brightness. That is the artefact that reads as printed ink. Banding the luminance and scaling the channels to match keeps hues true and looks cleaner, but loses the thing that made it interesting.

## Brand tool lens

Posterisation is the effect most likely to be mistaken for a mistake, so a client tool has to be opinionated. Lock the gamma and the channel mode: those two together are the brand's look, and neither has a setting that is obviously right from the control panel. Expose the level count, over a short range. Two to six is a style; two to sixteen is a slider that will eventually be left at twelve and produce something indistinguishable from a compression artefact.

The practical trap is the source. Posterisation applied to a clean vector gradient looks designed; applied to a photograph with noise in it, the noise scatters pixels across band boundaries and the edges turn ragged. If the tool accepts uploaded imagery, it needs a small blur before the quantisation, or the first photograph a client drops in will produce something nobody wants to sign off.

The output format matters too. The flat areas compress beautifully as PNG and badly as JPEG, where the codec will reintroduce exactly the gradients that were removed. If the tool exports, it should not offer JPEG for this one.

## Easily confused with

**Ordered and error-diffusion dithering** also reduce the number of tones, but they use a spatial pattern to fake the missing ones back. Posterisation has no spatial component at all: it is the same operation with the dithering switched off, which is why the two are often controls on the same panel.

**Threshold** is posterisation at two levels. Worth knowing as the limiting case rather than a separate technique.

**Duotone** maps a greyscale image onto two inks across a smooth ramp. It changes the colours, not the number of them, and a duotone that has also been posterised is a different thing again.

**Colour quantisation** chooses a small palette that suits the image, usually by clustering. Posterisation uses a fixed, evenly spaced set regardless of what is in the picture, which is why it bands and a good quantiser does not.
