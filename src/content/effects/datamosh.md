---
slug: datamosh
name: Datamosh
synonyms:
  - datamoshing
  - I-frame removal
  - compression glitch
  - pixel bleed
collection: Digital and glitch
tags:
  - post-fx
  - motion-dependent
  - shader
oneLiner: The video file is told to keep moving the last picture it had, so one shot's colours are dragged around by the next shot's motion.
whatItIs: |
  Compressed video does not store most frames as pictures. It stores a keyframe, a whole picture, and then a run of predicted frames that each say how blocks of the previous picture moved and what small correction to add. Datamoshing is editing that stream so the predictions land on the wrong picture. Delete the keyframe at a cut and the decoder carries on moving the old shot's pixels with the new shot's motion, until the next keyframe arrives.

  The result is the signature bleed: a face or a landscape that melts in the direction of the next shot's movement, with its edges dissolving into blocky smears. The look was worked out by video artists in the mid-2000s, with Takeshi Murata among the best known, and reached a wide audience at the end of that decade in music videos such as Chairlift's "Evident Utensil" and Kanye West's "Welcome to Heartbreak".

  There are two classic moves. Keyframe removal produces the transition, where one shot is painted with the motion of the next. Frame repeat duplicates one predicted frame many times, so the same motion is applied over and over and pixels bloom outwards in a stream. Both are a decoder doing exactly what it was told with the wrong starting picture.
renderer: webgl
motionDependent: true
controlsLayout: overlay
poster: /posters/datamosh.png
parameters:
  - name: Technique
    what: Keyframe removal deletes the keyframe at each cut, so the next shot's motion drags the last shot's picture. Frame repeat replays one frame's motion over and over with no correction, so the picture blooms. Clean encode is the control, an honest stream with a keyframe at every cut.
    lock: lock
  - name: Residual
    what: How much of each frame's correction is applied. At one the moshed picture still picks up the edges and changes of the new shot. Lower it and the old picture survives longer, smeared further and faster.
    lock: expose
  - name: Keyframe every
    what: How often a keyframe heals the picture completely. Real streams carry one every few seconds, which is why a mosh rarely lasts. Raising it is the single biggest lever on how long the look holds.
    lock: expose
  - name: Macroblock
    what: The size of the blocks the encoder moves as one. Larger blocks give chunkier, more obviously digital smears; smaller ones flow more like paint. Fixed by the codec in real footage, so a deliberate choice here is a stylistic one.
    lock: lock
  - name: Shot length
    what: How long each shot runs before the next cut. Every cut is a moment the mosh can happen, so shorter shots mean more transitions.
    lock: lock
related:
  - pixel-sorting
  - motion-blur
  - echo-and-trails
sources:
  - title: Datamoshing
    url: https://en.wikipedia.org/wiki/Datamoshing
    kind: history
  - title: Video compression picture types
    url: https://en.wikipedia.org/wiki/Video_compression_picture_types
    kind: article
  - title: Motion compensation
    url: https://en.wikipedia.org/wiki/Motion_compensation
    kind: article
---

## How it works

The demo is a tiny codec. Each frame the source shot is drawn, shrunk to a greyscale copy, and compared block by block with the previous frame. For every macroblock the encoder searches nearby offsets and keeps the one that matches best. That is the motion vector, and it is the same search every real video encoder runs, just smaller.

Decoding happens in a shader. For each pixel it looks up its block's vector, copies the pixel from that offset in the last decoded picture, and adds the residual: the difference between the true new frame and the frame the encoder predicted from. When the last picture is the one the encoder had in mind, this rebuilds the source exactly. When it is not, the error never goes away, it is just moved around by every frame that follows.

Keyframe removal is then one rule. At a cut, where an encoder would write a keyframe, the decoder simply skips the frame and holds the old picture. From then on, the new shot's motion is applied to the old shot's pixels. The decoded picture is state, so the demo advances once per new time value and holds when time stands still.

Drag across the canvas to write your own motion into the vectors near the pointer. In clean encode it does nothing, because the residual corrects it at once. In a moshed picture it smears, which is the whole effect in one gesture.

## Brand tool lens

Datamosh is a transition, not a filter, so it belongs in tools that make sequences rather than stills. The defining choice is which two shots meet at the cut, and what the second one does. Slow camera moves drag the old picture gently; spins and zooms tear it. In a client tool, lock the technique and let the shot pairing be the creative input.

Expose duration as one control, built from the keyframe interval, since that is what decides how long the melt holds before the picture snaps back. Lock the macroblock size to suit the delivery resolution. Large blocks on a small social format look deliberate; the same blocks on a large display look broken.

Export is the trap. Datamosh is made from compression and is destroyed by it: a platform re-encode inserts new keyframes and quietly heals parts of the effect. Render the final look to frames and let the platform compress those, rather than trying to deliver a moshed stream.

## Easily confused with

**Pixel sorting** also streaks colour, but it works on a single still image by reordering pixels along a line. A datamosh needs footage, because the smear comes from motion.

**Compression artefacts** such as blocking and mosquito noise are what a stream looks like when it is short of data. A datamosh is what it looks like when the data is fine and the reference picture is wrong.

**Echo and trails** keep faded copies of past frames. A datamosh keeps only one picture and moves it, so there are no copies to count.
