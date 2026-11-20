---
slug: kaleidoscope
name: Kaleidoscope
synonyms:
  - mirror symmetry
  - radial mirror
  - dihedral symmetry
collection: Echoes, tiles and repeats
tags:
  - post-fx
  - shader
oneLiner: One wedge of an image, reflected round a centre until it fills the circle, so anything loose and random comes out as a symmetrical rosette.
whatItIs: |
  A kaleidoscope cuts one wedge out of a picture and repeats it round a point, flipping every other copy, so the edges always meet their own reflection. The source can be anything at all. The symmetry is imposed by the mirrors, which is why a handful of broken glass looks designed.

  David Brewster patented the instrument in 1817 and named it from the Greek for beautiful form, looking. Two mirrors set at an angle reflect the object cell at the end of the tube into a ring of copies. Sixty degrees gives six images; forty-five gives eight. The angle has to go into 360 degrees an even number of times, or the last reflections stop agreeing with each other.

  Mathematically the result has dihedral symmetry: a set of rotations plus a set of mirror lines through the centre. Drop the mirrors and keep only the rotations and you get a pinwheel instead, where every copy faces the same way round. Both are useful, and the difference between them is the most important choice in the effect.
renderer: webgl
motionDependent: false
controlsLayout: overlay
poster: /posters/kaleidoscope.png
parameters:
  - name: Segments
    what: How many wedges fill the circle. Each wedge is mirrored about its own centre line, so it holds two of the instrument's images and any count works. Low counts read as a reflected picture, six to twelve read as a rosette, and past about twenty the result turns into fine radial texture with no recognisable source.
    lock: expose
  - name: Mirror
    what: Whether each wedge is flipped to meet its neighbour. On is a true kaleidoscope and is seamless whatever the source. Off rotates the wedge without flipping it, which gives a pinwheel and lets the wedge edges show as hard seams.
    lock: lock
  - name: Zoom
    what: How much of the source one wedge takes in. Zoomed in, the pattern is made of large shapes and reads as bold; zoomed out, it is busy and closer to lace.
    lock: lock
  - name: Turn
    what: Rotates the wedge across the source over time, the way turning the tube does. This is what makes the pattern bloom and collapse, rather than just spin.
    lock: expose
  - name: Wander
    what: Drifts the point the wedge is cut from across the source. The pointer steers it directly. Small moves of the cut produce large changes in the pattern, which is the fun and the danger of it.
    lock: lock
  - name: View
    what: Switches to the source with the wedge being reflected left bright and everything else dimmed. The quickest way to see that the whole pattern comes from one sliver.
    lock: lock
related:
  - echo-and-trails
  - feedback-loops
  - moire
sources:
  - title: Kaleidoscope
    url: https://en.wikipedia.org/wiki/Kaleidoscope
    kind: history
  - title: Point groups in two dimensions
    url: https://en.wikipedia.org/wiki/Point_groups_in_two_dimensions
    kind: article
  - title: 'The Book of Shaders: Shapes and polar coordinates'
    url: https://thebookofshaders.com/07/
    kind: tutorial
---

## How it works

Convert each output pixel to polar coordinates: a distance from the centre and an angle. Divide the circle into wedges and take the angle modulo the wedge size, so every pixel learns where it sits inside its own wedge. That alone produces rotational copies.

The mirror is one more line. Measure the angle from the wedge's centre line and take its absolute value, so the two halves of every wedge read the same half of the source. Now each wedge is symmetrical, and the edge where two wedges meet is a place where both halves read the same pixel, so there is never a seam. This is why mirror symmetry works with any segment count, while rotation alone leaves a visible join wherever the source is not already continuous.

Turn the folded angle and distance back into a position, add the point the wedge is cut from, and sample the source there. Rotating the cut over time is the tube turning; moving it is shaking the object cell. The output itself never needs to rotate, and usually looks cheaper when it does.

Mirrored texture wrapping keeps a wedge that reaches past the edge of the source from smearing border pixels into the pattern.

## Brand tool lens

The segment count is the signature. Six reads as natural, snowflake and crystal; eight as architectural and Islamic tiling; odd counts as floral and slightly unsettled. Pick one or two for the identity and lock everything else around them, because the mirror choice, the zoom and the source together are what make the pattern recognisably the brand's own.

Expose the source and the turn. The source is where the variation belongs: the same kaleidoscope over a campaign's photography gives a different rosette for every image, all of them related. Turn, or a single position along it, lets someone pick a frame they like without being able to wreck the symmetry.

Keep type out of the wedge. A wordmark through a kaleidoscope comes out as unreadable lace, and if a mark must appear, composite it at the centre after the effect. For example, a festival's tool might lock eight mirrored segments, expose the source photograph and a turn slider, and place the festival's mark in a fixed clear circle at the middle.

## Easily confused with

**Step and repeat** tiles an image across a plane without reflection or rotation. Its copies are all the same way up and the pattern has no centre.

**Wallpaper groups** are the plane-filling relatives: mirror and rotation symmetries repeated across a grid rather than round a point. A kaleidoscope has one centre; a wallpaper pattern has infinitely many.

**Droste effect** repeats the image inside itself, scaling towards a point. Kaleidoscope repeats round the point at a fixed scale.

**Feedback loops** can produce kaleidoscopic symmetry when the frame is mirrored back into itself each pass, but the copies accumulate over time, and blur and drift as they do.
