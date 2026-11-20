---
slug: echo-and-trails
name: Echo and trails
synonyms:
  - echo effect
  - motion trails
  - ghosting
  - onion skinning
  - step and repeat in time
collection: Echoes, tiles and repeats
tags:
  - motion-dependent
  - generative
oneLiner: A moving subject leaves copies of itself behind, either as a row of discrete echoes or as a fading trail, so its path becomes part of the image.
whatItIs: |
  Echo and trails both make time visible by keeping some of the past on screen. An echo draws the subject again at fixed delays behind the present, each copy weaker than the last, so you see a row of distinct ghosts spaced along its path. A trail keeps the previous frame, fades it a little, and draws the new frame on top, so the past smears into a continuous tail that decays away.

  The two come from different places. Echoes descend from chronophotography, Étienne-Jules Marey's single plates exposed many times as a bird or a runner crossed them, and from the echo and time-displacement effects in video editing software. Trails descend from analogue video feedback and from the persistence of phosphor on a CRT, where the image literally took time to fade.

  Both depend on motion. A still subject piles its echoes on top of itself and they disappear, which is why this effect only exists on a timeline.
renderer: canvas2d
motionDependent: true
controlsLayout: overlay
poster: /posters/echo-and-trails.png
parameters:
  - name: Mode
    what: Echoes are discrete copies at fixed delays; trails are a fading accumulation. Echoes read as graphic and rhythmic, trails as fluid and photographic.
    lock: lock
  - name: Echo count
    what: How many copies trail the subject. With the delay, this sets how far back in time the image reaches.
    lock: expose
  - name: Echo delay
    what: The time between copies. Short delays merge into a solid sweep; long ones separate into a sequence, which is the version that reads as a deliberate graphic.
    lock: expose
  - name: Echo falloff
    what: The strength of each echo relative to the one before. Near one, every copy is equally loud and the oldest dominates; lower values put the emphasis on the present.
    lock: lock
  - name: Trail persistence
    what: How much of the previous image survives each sixtieth of a second. Small changes near the top of the range make very large differences in trail length, because the fade compounds.
    lock: expose
  - name: Subject and outline
    what: What moves, and whether it is filled or outlined. Outlines let every echo stay visible through the others, which is why most typographic echo work uses them.
    lock: lock
related:
  - motion-blur
  - feedback-loops
  - kaleidoscope
sources:
  - title: Chronophotography
    url: https://en.wikipedia.org/wiki/Chronophotography
    kind: history
  - title: Video feedback
    url: https://en.wikipedia.org/wiki/Video_feedback
    kind: history
  - title: Multiple exposure
    url: https://en.wikipedia.org/wiki/Multiple_exposure
    kind: article
---

## How it works

Echoes need no memory of previous frames, only of the subject's path. For each copy, ask where the subject was a fixed delay ago, and draw it there in a colour mixed between paper and ink by the falloff. Drawing the oldest first means each newer copy sits on top. Because every frame is computed from the clock alone, an echo is fully repeatable: pause, scrub or jump and the picture is the same.

Trails are the opposite. Each frame, the previous image is faded by painting a translucent rectangle over it, and the subject is drawn on top. The image is an accumulation of everything that has happened, which is why trails are smoother than echoes and also why they cannot be scrubbed: you have to play the whole history to reach a frame.

Two details matter in the trail. The fade has to be scaled by the real time between frames, or the trail is longer on a fast display than a slow one. And an 8-bit canvas fade stalls a few levels above black, because a small percentage of a small number rounds back to itself; left alone, every path ever drawn stays faintly visible. Subtracting one level each frame clears that residue.

## Brand tool lens

Lock the mode. Echoes and trails say different things, and a brand should pick one. Echoes are the more ownable of the two, because count, delay and falloff can be stated as numbers and reproduced exactly by anyone in any software. Trails depend on frame rate and history, and are harder to brief.

Expose count and delay over a tight range, and lock the falloff and the outline treatment, which are what make the result look like the brand rather than like a default plug-in. If the tool is used for stills, echoes are the right choice, since a trail needs a timeline to build.

For example, a sports brand could lock five outlined echoes at a fixed delay behind its wordmark, so every animated end frame resolves from the same rhythm of after-images.

## Easily confused with

**Motion blur** integrates the subject's movement inside a single frame's exposure, and its length is set by the shutter. Echoes and trails reach back across many frames, and their length is a design choice.

**Feedback loops** feed the whole previous frame back in with a transform, such as a zoom or rotation, so the past is warped as well as faded. A trail is a feedback loop with the identity transform.

**Step and repeat** copies a subject across space at fixed offsets. An echo copies it across time, and the spacing comes from the motion.

**Onion skinning** in animation software shows neighbouring frames faintly for the animator's reference. It looks the same but is a tool, not an output.
