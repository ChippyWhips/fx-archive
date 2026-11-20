---
slug: dolly-zoom
name: Dolly zoom
synonyms:
  - Vertigo shot
  - Hitchcock zoom
  - Jaws effect
  - zolly
collection: Motion cuts and transitions
tags:
  - 3d
  - motion-dependent
oneLiner: The camera moves towards or away from the subject while the lens zooms the other way, so the subject stays the same size and the world behind it stretches or collapses.
whatItIs: |
  A dolly zoom couples two moves that usually cancel each other out. The camera physically travels, on a dolly, towards or away from the subject, while the zoom lens changes its focal length in the opposite direction at exactly the rate needed to keep the subject the same size in frame. The subject holds still. Everything else does not, because perspective depends on where the camera is, not on the lens, and the camera is moving.

  The result is a feeling more than an image: the background slides, stretches or swells while the figure in the foreground stays fixed, which reads as dread, vertigo or sudden realisation. Hitchcock made it famous in Vertigo, looking down a stairwell that seems to stretch away beneath the hero, and Spielberg's shot of the police chief on the beach in Jaws, the world sliding behind him as he sees the attack, made it a standard.
renderer: three
motionDependent: true
controlsLayout: overlay
poster: /posters/dolly-zoom.png
parameters:
  - name: Direction
    what: Push in and zoom out, and the background stretches away; pull out and zoom in, and it swells forward behind the subject.
    lock: expose
  - name: Wide lens
    what: Field of view at the wide end of the move. Wider means more exaggerated perspective, and more stretch.
    lock: lock
  - name: Long lens
    what: Field of view at the long end. Narrower means flatter, more compressed background, and a longer dolly to match.
    lock: lock
  - name: Hold subject size
    what: Whether the zoom compensates for the dolly. Off gives a plain dolly over the same distance, which shows what the zoom is doing.
    lock: lock
  - name: Duration
    what: Length of the move. Short is a jolt; long is a slow, uneasy slide.
    lock: expose
  - name: Hold
    what: Time on the first and last frame. The effect is a comparison, so both ends need a moment.
    lock: expose
  - name: Easing
    what: The curve of the move. Ease in-out is the safe default; ease in makes the stretch accelerate into the final frame.
    lock: lock
related:
  - match-cut
  - radial-blur
  - impossible-objects
sources:
  - title: Dolly zoom
    url: https://en.wikipedia.org/wiki/Dolly_zoom
    kind: article
  - title: Vertigo (film)
    url: https://en.wikipedia.org/wiki/Vertigo_(film)
    kind: history
  - title: three.js manual, Cameras
    url: https://threejs.org/manual/#en/cameras
    kind: tutorial
---

## How it works

The size of a subject in frame depends on two things: how far away it is, and how wide the lens is. For a frame that is H metres tall at the subject, the distance is half of H divided by the tangent of half the field of view. Hold H constant and every field of view has exactly one distance that matches it. That single relationship is the effect.

The demo animates the camera's distance from one end of the move to the other, then solves for the field of view that keeps the subject's frame at 4.4 metres. The figure barely changes. The colonnade behind it changes enormously: at the long end the columns are stacked flat like scenery, and at the wide end they race away to a vanishing point. Nothing in the scene moves; only the camera's position, and with it the perspective.

Turn off "Hold subject size" and the lens stays fixed while the camera travels the same path. That is a plain dolly, and comparing the two makes clear that the stretch comes from the move, not the zoom. The zoom is only there to hide the move.

## Briefing an editor

This one is a camera brief rather than an edit, so it goes to whoever shoots or animates it. Give the start and end focal lengths (or fields of view, in 3D), the direction, and say explicitly that the subject's size in frame must not change. Everything else follows from those.

Timing is where it lives or dies. Say how long the move runs in frames, how long to hold on each end, and what easing to use: an ease in reads as something accelerating towards the viewer, an even move as a slow, sustained unease. On a real set the zoom and dolly have to be synchronised by hand, so expect small drifts in subject size; in 3D it can be exact, and it should be.

For example: "push in from 85mm to 24mm over 72 frames, ease in, subject's head held at a third of frame height, hold 24 frames each end". That is enough for a motion designer to build it once as a rig and swap the scene behind it.

## Easily confused with

**A zoom** changes only the lens. The subject and the background grow together, and the perspective does not change at all.

**A dolly or push-in** moves only the camera. Perspective changes, but the subject grows or shrinks with it, which is the whole thing a dolly zoom hides.

**Radial blur**, also called zoom blur, smears an image outward from a centre to suggest rapid movement. It is a post effect on a single image and changes nothing about perspective.

**Forced perspective** fixes the camera and arranges the scene to fool it. A dolly zoom fixes the subject and lets the camera move.
