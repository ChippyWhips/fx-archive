---
slug: ascii-art
name: ASCII art
synonyms:
  - text mode rendering
  - ANSI art
  - character mosaic
collection: Sampling and mosaic
tags:
  - post-fx
  - generative
oneLiner: An image resampled to a coarse grid, with each cell replaced by the character whose printed density best matches its tone.
whatItIs: |
  ASCII art is pixelation with a second step. The image is reduced to a grid of cells, exactly as it would be for a mosaic, and then each cell is swapped for a glyph chosen from a ramp ordered by how much ink it puts on the page. A full stop is nearly white, a hash is nearly black, and the twenty or so characters between them carry everything in the middle.

  The constraint that gives it its look is the character cell. A monospace glyph is roughly six units wide and ten tall, so the grid is never square, and the ramp is never evenly spaced, because glyph density was designed for reading rather than for tone. Both of those are inherited from terminals and teleprinters, which is also why the technique carries such a strong period association.

  It is worth separating the two things usually called ASCII art. One is this, an automatic conversion of an existing image. The other is hand-set work, where someone places characters deliberately and the shapes come from the glyph outlines rather than from their density. The second is typography. Only the first is an effect.
renderer: canvas2d
motionDependent: false
controlsLayout: overlay
poster: /posters/ascii-art.png
parameters:
  - name: Row height
    what: The cell height in pixels, with the column width following at 0.6 of it to match a monospace advance. This is the single control that decides whether the result reads as an image or as text.
    lock: expose
  - name: Ramp
    what: Which characters are available and in what order. A short ramp posterises hard, a long one gives smooth tone but needs a bigger cell to stay legible. Blocks are not really ASCII at all, they are a tone scale with no typographic noise.
    lock: lock
  - name: Contrast
    what: Stretches tone around mid grey before the glyph is picked. Almost every source needs this, because an untouched photograph uses only the middle of the ramp and the result looks muddy.
    lock: expose
  - name: Invert
    what: Swaps dark for light. Matters more than it sounds, because a ramp designed for dark ink on white paper is wrong when the output is light type on a dark field.
    lock: expose
  - name: Ink and paper
    what: The two colours. Keeping it to two is what keeps it honest, because the moment each cell gets its own colour the glyphs stop doing the work.
    lock: lock
related:
  - pixelation
  - ordered-dithering
  - posterisation
sources:
  - title: ASCII art
    url: https://en.wikipedia.org/wiki/ASCII_art
    kind: article
  - title: Text mode
    url: https://en.wikipedia.org/wiki/Text_mode
    kind: history
  - title: ASCIImation
    url: https://en.wikipedia.org/wiki/ASCIImation
    kind: history
---

## How it works

Draw the source into a tiny offscreen canvas, one pixel per cell, and let the browser do the downscale. That is not a shortcut. Resampling gives each cell the average of its whole area, where reading one pixel per cell would be a point sample, and point sampling a detailed image produces a result that crawls and flickers the moment anything moves.

Convert each cell to luminance using the Rec. 601 weights rather than a flat average of the three channels. Green carries most of the perceived brightness and blue almost none, so a flat average turns a saturated blue into mid grey and the picture loses its shape.

Then map that value to a character. The honest version measures the actual ink coverage of each glyph in the font being used and sorts the ramp by it. The usual version hard-codes a ramp that someone measured once in a terminal font, which is why most ASCII converters have slightly wrong midtones.

The implementation detail worth stealing is the glyph atlas. Calling `fillText` per cell re-shapes and re-rasterises the glyph every time, and at twenty thousand cells a frame that is the difference between smooth and unusable. Rendering each character once into a strip and blitting from it turns the inner loop into a `drawImage`.

## Brand tool lens

This is a safe effect to hand over, which is rare. The failure modes are mild and visible, and almost any setting produces something recognisable. Lock the ramp and the two colours, expose cell size and contrast, and the tool is close to foolproof.

The real decisions are upstream. Pick the ramp once, as a brand decision, and check it in the actual font the output will use. If the asset is ever going into a terminal, an email or a code block, the character set has to be restricted to ASCII proper, because box-drawing characters and block elements will not survive. If it is going into a design file, it is just text in a monospace font, which means it can be edited by hand afterwards, and that is usually a feature worth telling people about.

Watch the resolution contract. An ASCII render is defined by its grid, not its pixels, so exporting at twice the size should mean twice as many characters, not the same characters twice as large. Getting that wrong is the most common bug in tools of this kind.

## Easily confused with

**Pixelation** is the same resample with no glyph step. If you set the ramp to a single solid block you get pixelation back, which is a useful way to see that the mosaic is the substrate and the type is the finish.

**ANSI art** adds colour and the extended code page 437 character set, which includes the box-drawing and shading blocks. It is a superset, and it looks quite different because the shade blocks give it a tone scale ASCII never had.

**Ordered dithering** also maps tone to a repeating set of marks, but its marks are sub-pixel and chosen to average correctly, not to be read. Dithering wants to disappear; ASCII wants to be noticed.

**Hand-set character art**, including the figlet banner tradition and Japanese shift-JIS art, is drawn rather than converted. Nothing about this page applies to it.
