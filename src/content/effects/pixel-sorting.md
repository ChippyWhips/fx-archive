---
slug: pixel-sorting
name: Pixel sorting
synonyms:
  - pixel sort
  - sort glitch
  - ASDF pixel sort
collection: Digital and glitch
tags:
  - post-fx
oneLiner: Runs of pixels along each row or column are reordered by brightness, so parts of the image melt into streaks of sorted colour while the rest stays put.
whatItIs: |
  Pixel sorting takes a line of pixels, picks out stretches of it, and sorts each stretch by a value such as brightness or hue. Nothing new is drawn and nothing is lost. Every colour in the result was in the original, just moved along the line, which is why a sorted image keeps its palette even when the subject has gone to streaks.

  The technique belongs to Kim Asendorf, whose 2010 Processing script ASDFPixelSort turned a programming exercise into a recognisable look. The name of the script is also the name most people learned it by. It sits in the glitch family, but it is unusual there: datamoshing and corruption depend on breaking a file, and pixel sorting is a deliberate, repeatable operation with a small set of controls.

  Those controls are mostly about where sorting happens rather than how. The art is in the interval, the rule that decides which pixels are allowed to move. Sort a whole row and you get a gradient bar code with no trace of the image. Sort only the mid-tones and the shadows and highlights hold the drawing together while everything between them pours.
renderer: canvas2d
motionDependent: false
controlsLayout: overlay
poster: /posters/pixel-sorting.png
parameters:
  - name: Interval
    what: The rule that starts and ends each run. Brightness sorts everything between the two thresholds, edges breaks the run wherever contrast jumps, and whole line sorts everything. This is the decision that gives a sort its character.
    lock: lock
  - name: Lower and upper threshold
    what: The brightness band that is allowed to move. Pixels outside it are anchors that hold the image in place. Narrow the band and only a few tones streak; widen it and the image dissolves. In edges mode the lower value is the contrast step that ends a run.
    lock: expose
  - name: Run limit
    what: The longest run, as a fraction of the line. Short runs turn streaks into a woven texture; a full-length limit lets one bright area pour across the frame.
    lock: expose
  - name: Sort by
    what: The value each run is ordered by. Brightness gives smooth ramps, hue gives rainbow banding, and saturation pushes greys to one end. Pixels of equal value but different colour speckle, which is part of the look.
    lock: lock
  - name: Direction
    what: Horizontal or vertical. Vertical reads as dripping, horizontal as wind or motion. It should follow the composition, so it belongs to the brand rather than the user.
    lock: lock
  - name: Reverse the order
    what: Sorts dark to light or light to dark, which decides which end of a run the bright pixels collect at.
    lock: lock
  - name: Show the mask
    what: Shows which pixels the interval lets move, in white. The fastest way to understand why a sort looks the way it does.
    lock: lock
related:
  - datamosh
  - pixelation
  - posterisation
sources:
  - title: ASDFPixelSort
    url: https://github.com/kimasendorf/ASDFPixelSort
    kind: example
  - title: Pixel sorting
    url: https://satyarth.me/articles/pixel-sorting/
    kind: tutorial
  - title: Glitch art
    url: https://en.wikipedia.org/wiki/Glitch_art
    kind: history
---

## How it works

Each frame the source is drawn to an offscreen canvas and its pixels are read back. Every pixel gets a brightness value for the interval test and a key for sorting. Then each row, or each column, is walked from one end to the other. A run opens at the first pixel that passes the interval test and closes at the first that fails, or when it reaches the run limit, and the pixels inside it are sorted in place.

The sort uses one trick worth lifting. The key and the colour are packed into a single number, key times two to the thirty-two plus the colour, so the browser's native numeric sort moves them together. That is many times faster than sorting objects, and it is the difference between a sort that animates and one that stalls.

Sorting is sequential work along a line, so it runs on the CPU at a capped working size and is scaled up with smoothing off. A shader can do a version of it with many passes of neighbour swaps, but the result arrives gradually and the simple version is easier to read and to port.

## Brand tool lens

The interval and the direction are the look. Lock both. A brand that uses vertical drips on mid-tones should not be one click away from horizontal whole-line bar codes, because those are different images, not variations of one.

Expose the thresholds and the run limit as a single intensity control if you can. Users understand "more" and "less" sorting; they do not understand a brightness band. Map the slider so its low end leaves the image readable and its high end stops just short of losing the subject, and check the mapping against every source the tool will see, since a dark photograph and a pale one respond to the same thresholds very differently.

For a wordmark, sort the image around it and not the letters themselves, or exclude the type from the mask. Pixel sorting destroys the edges a wordmark depends on, and the anchor pixels are what you use to protect them.

## Easily confused with

**Datamoshing** also smears pixels, but it does so by moving blocks along motion vectors from the video codec. It needs footage and time; pixel sorting works on a single still.

**Motion blur and directional blur** average pixels along a path, so they soften and mix colours. Sorting never mixes: every pixel keeps its exact colour and only its position changes.

**Slit-scan** builds an image from one line sampled over time. Its streaks are a record of movement, not a rearrangement of a frame.
