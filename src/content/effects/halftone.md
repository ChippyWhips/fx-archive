---
slug: halftone
name: Halftone
synonyms:
  - screening
  - dot screen
  - AM screening
collection: Print and screen
tags:
  - print
  - post-fx
  - shader
oneLiner: Continuous tone reproduced with a regular grid of marks whose size varies, so that a press with only one density of ink can print grey.
whatItIs: |
  A printing press can put ink down or leave it off. It has no way to put down half as much. Halftoning solves that by breaking the image into a regular grid and varying the area of the mark in each cell, so that from a normal viewing distance the eye averages ink and paper into a tone. Half coverage reads as mid grey even though every point on the sheet is either solid ink or bare paper.

  The grid has three properties that matter, and all three come from the press rather than from taste. Frequency, quoted in lines per inch, is set by how fine a dot the stock and the press can hold. Angle is set by what the other screens are doing, because two screens at the wrong relative angle produce moire. Dot shape decides what happens at fifty percent coverage, where the marks touch and the tone can jump.

  Colour printing is four of these screens stacked at different angles, and the small flower shape where they overlap is the rosette. It is a compromise, not a goal. The angles are chosen so the unavoidable interference is as fine and as neutral as it can be, and yellow gets the least favourable angle because the eye forgives its moire first.
renderer: webgl
motionDependent: false
controlsLayout: overlay
poster: /posters/halftone.png
parameters:
  - name: Screens
    what: A single ink, or four screens at the classic process angles. The single ink case is the one that teaches the mechanism. The four-screen case is the one that teaches why screen angles exist.
    lock: lock
  - name: Screen frequency
    what: How many cells fit across the frame, the direct equivalent of lines per inch. Everything else is subordinate to this, because it is the one setting the physical press actually constrains.
    lock: expose
  - name: Screen angle
    what: Rotation of the grid. In the four-screen mode it rotates all four together and keeps their relative offsets, which is the only safe way to expose it. Forty-five degrees is the default for a single ink because a diagonal grid is the least visible to the eye.
    lock: expose
  - name: Mark
    what: Dot, square or line. The choice decides the midtone, where marks meet and coverage jumps. Round dots are the press default, lines are the one that survives being used as a brand device.
    lock: lock
  - name: Edge hardness
    what: How sharply the mark edge is filtered against the pixel grid. Not a print control at all, a display one, and the reason the screen does not fall apart into its own moire at high frequency.
    lock: lock
  - name: Ink and paper
    what: The two colours in single-ink mode. Holding it to two is what keeps the result a halftone rather than a texture laid over a photograph.
    lock: expose
related:
  - ordered-dithering
  - moire
  - error-diffusion-dithering
sources:
  - title: Halftone
    url: https://en.wikipedia.org/wiki/Halftone
    kind: article
  - title: CMYK color model
    url: https://en.wikipedia.org/wiki/CMYK_color_model
    kind: article
  - title: Color printing
    url: https://en.wikipedia.org/wiki/Color_printing
    kind: history
---

## How it works

Rotate the coordinate system into the screen's angle, multiply by the frequency, and the fractional part gives a position inside one cell while the integer part names the cell. Read the source once, at the cell centre, and grow a mark to match that tone. Sampling at the cell centre rather than under the current pixel is the thing that makes it a screen rather than a texture multiplied over the image, and it is the step most implementations skip.

The mark size is the part people get wrong. Tone is area, not radius. A dot covering half its cell is mid grey, so its radius is the square root of the coverage, not the coverage itself. Drive the radius linearly and the midtones go dark, which is the signature of a halftone filter rather than a halftone.

Edges have to be filtered deliberately. At sixty cells across a frame the marks are only a few pixels wide, and a hard edge means each pixel takes one sample of something oscillating faster than the pixel grid can hold. Using `fwidth` to soften the edge by exactly one pixel, whatever the frequency, is what keeps the screen from producing a moire against the display.

The four-colour mode separates the image into cyan, magenta, yellow and black, then screens each at its own angle, thirty degrees apart with yellow at the odd one out. Thirty degrees is the widest separation four screens can have inside ninety, and the rosette you see is what is left over.

## Brand tool lens

Halftone is the effect most often specified by a client and least often specified correctly. The frequency is not a style choice, it is a property of the stock and the press, and if the tool lets someone pick 140 lines per inch for uncoated board the result will fill in and go solid. Get the number from the printer first, then build the tool around it.

So lock the mark shape and the edge handling, expose frequency within a range the printer has signed off, and expose the angle only as a rotation of the whole set. Never let four screen angles be independently editable in a client-facing tool. Someone will set two of them within fifteen degrees of each other and the job will come back ruined.

There is also a resolution contract here, the same one as every grid effect. A halftone is defined in cells per inch at the final size. Exporting the same artwork at twice the size must give twice as many cells, not the same cells enlarged. If the tool exports raster at a fixed pixel size, state the intended print size next to it, or the screen frequency means nothing.

For screen use, the constraint moves but does not go away. A fine halftone on a standard-density display aliases, and a video codec will smear it into mush. If the asset is going to video, test it after compression before it is approved.

## Easily confused with

**Dithering** also makes tone from a fixed set of marks, but it places marks of constant size at varying density. Halftone varies the size at constant spacing. Printers call the first frequency modulation and the second amplitude modulation, and the distinction is exactly that.

**Ben-Day dots** are a flat mechanical tint at one coverage, used in comic printing for a uniform colour. There is no image behind them. Lichtenstein made them famous, and nearly everything labelled Ben-Day in design work is actually a halftone.

**Moire** is what two screens produce when their angles are too close. It is the failure mode halftone angles exist to manage.

**Stochastic screening** is the modern FM alternative, with uniform microdots at varying density. It has no angle, so it cannot produce a rosette, and it needs a press that can hold a very small dot.
