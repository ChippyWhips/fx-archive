---
slug: multiply-and-screen
name: Multiply and screen
synonyms:
  - blend modes
  - layer modes
  - compositing operators
collection: Compositing and blend modes
tags:
  - post-fx
  - print
oneLiner: Two layers combined by arithmetic rather than by stacking, where multiply can only darken, screen can only lighten, and each is the other seen upside down.
whatItIs: |
  A blend mode is a function of two colours. Multiply takes the product of the two channel values, so anything times white stays the same and anything times black goes black. Screen inverts both, multiplies, and inverts the result, which makes it the exact mirror image. Multiply can never lighten and screen can never darken, and knowing only that will get you most of the way through a layer panel.

  Both have physical ancestors, which is why they feel natural. Multiply is two transparent inks on the same sheet, each absorbing part of the light that passes through. Screen is two projectors aimed at the same wall, each adding light. Everything else in the list is built from these two. Overlay and hard light apply multiply to the dark half and screen to the light half, differing only in which layer decides which half is which.

  The important divide is commutativity. Multiply, screen, darken and lighten give the same result whichever layer is on top. Overlay, the dodges and the burns do not, because one layer is being used as a control signal for what happens to the other. Swapping the order is the quickest test of which kind you are looking at.
renderer: canvas2d
motionDependent: false
controlsLayout: overlay
poster: /posters/multiply-and-screen.png
parameters:
  - name: Blend mode
    what: The function applied between the two layers. Worth stepping through the whole list once with the grey ramp as the top layer, because that reads as a direct plot of what each mode does to every input level.
    lock: expose
  - name: Top layer opacity
    what: Fades between the blended result and the backdrop. Not part of the blend at all, it is applied afterwards, which is why a half-opacity multiply is not the same as any other mode.
    lock: expose
  - name: Swap the layers
    what: Changes which layer is the backdrop. Multiply and screen are unaffected. Overlay, the dodges and the burns change completely, which is the clearest demonstration of why order is part of the specification.
    lock: lock
  - name: Bottom and top layer
    what: What the two layers contain. The grey ramp against the tonal ramp is the diagnostic pair, since the result is a readable chart of the function. The discs are the pair that looks like design work.
    lock: lock
  - name: Show
    what: Isolates either layer. Not a creative control, but the fastest way to answer the question of where a particular bit of the result came from.
    lock: lock
related:
  - posterisation
  - halftone
  - film-grain
sources:
  - title: Blend modes
    url: https://en.wikipedia.org/wiki/Blend_modes
    kind: article
  - title: Compositing and Blending Level 1
    url: https://www.w3.org/TR/compositing-1/
    kind: article
  - title: mix-blend-mode
    url: https://developer.mozilla.org/en-US/docs/Web/CSS/mix-blend-mode
    kind: tutorial
---

## How it works

The browser implements these already, to the same specification Photoshop and CSS use, so the demo draws two opaque layers to offscreen canvases and sets `globalCompositeOperation` between them. Reimplementing the arithmetic in a shader would teach the formulas and hide the more useful fact, which is that every platform ships this and the results match.

Both layers are deliberately opaque. A blend mode is defined on colour, and alpha is handled separately by the compositing step that follows. Mixing the two is where most confusion about blend modes comes from: a half-transparent multiply layer is doing two different operations in sequence, and people attribute the result to the mode.

Working in sRGB rather than linear light is also deliberate, because it is what the design tools do. It means multiply and screen are not physically correct, since real ink and real light do not combine in a gamma-encoded space. It also means the result on this page matches the result in the design file, which matters more.

The one thing the browser will not do is tell you when a mode is unavailable. Not every blend mode exists in every context, print profiles support a smaller set than screens do, and a PDF exported with an unsupported mode will be flattened by whoever opens it.

## Brand tool lens

Multiply is the only blend mode that is safe to build an identity on, and it is safe for a specific reason: it survives print. Two inks overprinting on a press really do multiply, so a multiply built on screen is a prediction of what the press will do rather than a decoration that will have to be explained later. Screen has no equivalent on paper at all.

So in a client tool, expose the mode only if the output is screen-only, and otherwise fix it. If an identity uses overprinting colour pairs, lock the pairs too. The failure case is not that someone picks an ugly mode, it is that they pick a mode that cannot be reproduced and nobody notices until the proof arrives.

Three practical warnings. A multiply layer over white is invisible, which generates more support questions than anything else in this list. A blend mode on an exported PNG is already baked in, so the layer order has to be correct at export time and cannot be changed later. And in CSS, `mix-blend-mode` blends against whatever is behind the element in its stacking context, which is frequently not what the designer drew, so `isolation: isolate` on the parent is part of the specification rather than a fix.

## Easily confused with

**Alpha compositing** stacks one image over another using transparency. It is a different operation entirely, and it is what happens after the blend mode has produced a colour.

**Difference and exclusion** are also blend modes, but they are subtractive rather than darkening or lightening, and they produce colours in neither layer. They are their own entry.

**Overprint**, in print production, is the instruction to leave the layer underneath in place rather than knocking it out. Multiply is the on-screen preview of overprint, not the same thing, and the preview is only as accurate as the colour profile behind it.

**Opacity** is applied after the blend and is not a mode. A fifty percent multiply is a blend followed by a fade, which is why it cannot be expressed as any other single operation.
