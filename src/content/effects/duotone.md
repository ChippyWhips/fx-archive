---
slug: duotone
name: Duotone
synonyms:
  - two-tone
  - gradient map
  - two-colour image
collection: Print and screen
tags:
  - print
  - post-fx
  - shader
oneLiner: An image reduced to its brightness and then rebuilt from two colours, so every photograph in a set carries the same palette whatever it started as.
whatItIs: |
  In print, a duotone is one greyscale image printed twice, with two inks and two different tone curves. It began as a way to get more depth out of a monochrome photograph: a single black plate cannot hold the full range of a print, so a second ink, often a grey or a warm brown, fills in the midtones and lifts the shadows. The second ink also tints the image, and designers soon started choosing it for colour rather than depth.

  On screen the word means something simpler. Each pixel's brightness picks a point on a straight line between two colours, black going to one and white to the other. Software calls this a gradient map. Spotify's campaign work around 2015 made it the default look for a generation of brand photography, because it turns any photograph, however badly lit or off-palette, into something that belongs to the brand.

  The two meanings share the principle that colour is thrown away first and then supplied by the designer. They differ in what happens next. The print version layers translucent inks on paper, so the lightest tone is always the paper. The screen version can map white to any colour at all, including one darker than the shadow colour, which no press could ever produce.
renderer: webgl
motionDependent: false
controlsLayout: overlay
poster: /posters/duotone.png
parameters:
  - name: Method
    what: Gradient map or two inks. The gradient map is what every design tool and CSS filter does. The two-ink mode shows the print original, where the paper is the highlight and each ink has its own curve.
    lock: lock
  - name: Shadow and highlight colours
    what: The two colours the image is rebuilt from. Almost all of the character lives here. A dark shadow and a light highlight keep the photograph legible; swap them and you get a negative.
    lock: lock
  - name: Contrast
    what: Stretches the brightness before it is mapped. Duotone flattens images, because two colours carry less separation than the original hues did, and a modest boost before mapping is usually needed to win it back.
    lock: expose
  - name: Midpoint
    what: Where mid grey lands on the line between the two colours. It decides which colour dominates the image. Per photograph, it is the one setting that genuinely needs adjusting.
    lock: expose
  - name: Colour ink weight
    what: In two-ink mode, how strongly the colour ink prints. Low weight gives a toned black and white photograph, high weight gives the saturated brand look.
    lock: lock
related:
  - posterisation
  - halftone
  - risograph-misregistration
  - multiply-and-screen
sources:
  - title: Duotone
    url: https://en.wikipedia.org/wiki/Duotone
    kind: article
  - title: Spot color
    url: https://en.wikipedia.org/wiki/Spot_color
    kind: history
  - title: The Book of Shaders, Colors
    url: https://thebookofshaders.com/06/
    kind: tutorial
---

## How it works

The shader reads the source, collapses it to a single luminance value with the standard Rec. 709 weights, and from that point on never looks at the original colour again. Contrast pivots the value around mid grey, and the midpoint is a gamma curve that slides where mid grey ends up. Then the gradient map is one line: a linear mix between the shadow colour and the highlight colour, with luminance as the mix amount.

The two-ink mode is closer to the press. Paper starts as the highlight. The colour ink is applied across the whole range on a gentle curve, so it carries the midtones. The dark ink is held back until the shadows, on a curve that starts at about a third of the way in. Each ink multiplies over the paper, because ink on paper subtracts light. That is why the print duotone can never be brighter than its paper, and why it has a softer, deeper look than the screen version.

On the web, the same mapping exists without a shader. An SVG `feComponentTransfer` filter with a table on each channel does it exactly. A CSS stack of `grayscale(1)` with two blended colour layers, one in `multiply` and one in `screen` or `lighten`, gets close, though it bends the line between the two colours rather than drawing it straight.

## Brand tool lens

Duotone is one of the most useful effects to put into a client tool, because it does a job nothing else does: it makes unrelated photography look like it belongs to one system. That only holds if the colour pairs are locked. Give the client a short list of approved pairs, never two free colour pickers, and test every pair on a bright photograph and on a dark one before signing it off.

Expose the midpoint and a small contrast range. Those are per-image corrections, and without them a light photograph washes out to all highlight and a dark one sinks into all shadow. They change nothing about the brand.

One example: a charity using duotone across campaign photography. Lock three pairs, each built from the brand's dark navy and one accent colour. Expose midpoint as a slider with the centre marked, so a volunteer can rescue an underexposed phone photograph without inventing a fourth palette.

If the output also goes to print, design the pairs as real two-ink duotones first. A screen gradient map with a highlight darker than paper cannot be printed, and will be quietly changed by whoever does the separations.

## Easily confused with

**Posterisation** reduces an image to a few flat levels. Duotone keeps the full continuous tone and only changes which colours carry it.

**Monotone or tinting** maps the image to one colour against white or black. A duotone needs two inks, or two chosen colours at both ends of the ramp.

**Colour overlay** places a flat colour over the image in multiply or colour mode. It keeps some of the original hue, so photographs with different colour casts stay different. A true duotone discards hue entirely, which is the point.

**Split toning** tints shadows and highlights separately but keeps the original colour in between. It is a grading move, not a two-colour reduction.
