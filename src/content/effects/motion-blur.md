---
slug: motion-blur
name: Motion blur
synonyms:
  - shutter blur
  - accumulation blur
  - exposure smear
collection: Blur
tags:
  - motion-dependent
  - shader
oneLiner: The smear a moving subject leaves because a frame is not an instant, it is everything that reached the sensor while the shutter was open.
whatItIs: |
  A camera frame is an integral. The shutter opens, light accumulates for a fixed slice of the frame interval, and the shutter closes. Anything that moved during that slice is recorded along its whole path, weighted by how long it spent at each point. Motion blur is not an effect applied to a photograph, it is what a photograph is.

  The amount is set by shutter angle, a term inherited from film cameras with a rotating disc. A 180 degree shutter is open for half the frame interval, which at 24 frames a second is 1/48 of a second. That number is the convention almost all film is shot at, and it is the reason footage with no blur reads as video or as animation rather than as film.

  Rendering it means sampling the scene at several moments inside the exposure and averaging. With too few samples the smear separates into distinct copies, which is the strobing you see in cheap renders and in games with low sample counts. The fix is more samples, or jitter, which scatters the sampling moments so the error arrives as noise rather than as a row of hard ghosts.
renderer: webgl
motionDependent: true
controlsLayout: overlay
poster: /posters/motion-blur.png
parameters:
  - name: Scene
    what: What is moving. The wheel shows rotation, where the blur is longer further from the centre. The sweep moves on a sine so it is fastest in the middle and still at each end, showing two extremes inside one exposure. The orbit shows three subjects at once.
    lock: lock
  - name: Subject speed
    what: How fast the scene moves. Blur length is speed multiplied by exposure, so this and the shutter do the same job to the image while meaning completely different things to a camera operator.
    lock: expose
  - name: Shutter angle
    what: How much of the frame interval the shutter is open. 180 degrees is the film standard, 360 is fully open and 45 is the hard stuttered look used for combat and action sequences. The single most useful control here.
    lock: expose
  - name: Frame rate
    what: The interval the shutter angle is a fraction of. Exposure is the angle divided by the frame rate, so halving the frame rate at a fixed angle doubles the blur. This is the relationship most people have backwards.
    lock: lock
  - name: Samples
    what: How many moments inside the exposure are averaged. One sample is no blur at all. Too few and the smear breaks into countable ghosts. The number needed rises with the blur length, not with the frame size.
    lock: lock
  - name: Jitter
    what: Scatters the sampling moments inside their slots, trading banding for noise. Drop the samples low and sweep this to see the ghosts dissolve into grain, which is the whole argument for stochastic sampling in one move.
    lock: lock
related:
  - film-grain
  - chromatic-aberration
  - particle-systems
sources:
  - title: Motion blur
    url: https://en.wikipedia.org/wiki/Motion_blur
    kind: article
  - title: Shutter angle
    url: https://en.wikipedia.org/wiki/Shutter_angle
    kind: article
  - title: Motion interpolation
    url: https://en.wikipedia.org/wiki/Motion_interpolation
    kind: article
---

## How it works

The scene is written as a function of position and time, so it can be asked for its state at any instant rather than being stepped forward frame by frame. That is the structural decision the whole demo rests on. With it, motion blur is a loop: pick a set of moments inside the exposure, evaluate the scene at each, average the results.

The exposure length is the shutter angle over 360, divided by the frame rate. Both numbers are in play, which is why a change of frame rate alters the look even when the angle is untouched, and why footage conformed from one rate to another never quite matches.

Evenly spaced samples put the error in a predictable place, and predictable error is visible as banding and as distinct ghosts. Jittering each sample inside its own slot turns that error into noise. The eye is far more tolerant of noise than of structure, which is the same argument that underlies stochastic screening in print and every modern path tracer.

This is accumulation blur, the honest version, and it is only affordable because each sample costs a few instructions. Real-time engines mostly cannot do it, so they use a velocity buffer instead: render once, record how far each pixel moved, and smear along that vector afterwards. Much cheaper, and wrong at every silhouette, because a pixel that was not covered by the object has no velocity to smear along.

## Brand tool lens

Motion blur is rarely a parameter a client should touch, and the reason is that it is not a style, it is a property of the camera. Fix it to match whatever the rest of the brand's motion is shot or rendered at, and expose nothing. If the identity's film work is 24 frames at 180 degrees, the animated assets should be too, or they will not cut together.

Where it does need to be exposed, expose shutter angle and only shutter angle, in a range with the standard values marked. Samples, jitter and frame rate are quality and format settings, and a client turning samples down to save render time will produce ghosting they cannot name and will blame on something else.

The practical check is the export path. Motion blur is expensive to render and nearly free to destroy: a GIF at 12 frames a second, or a video codec at a low bitrate, will flatten it into mud. Decide the delivery format first, then set the blur to suit it. And remember that blur and frame rate trade against each other, so a looping asset meant for a 60Hz display needs different settings from the same asset cut into a 24 frame film.

## Easily confused with

**Gaussian blur** is applied equally in all directions with no reference to movement. Motion blur follows a path, and the path is usually curved.

**Directional or linear blur**, the filter in image editors, smears along a single fixed vector. It is motion blur with the motion thrown away, which is why it never looks right on anything rotating.

**Echo and trails** repeat discrete past frames rather than integrating continuously. The difference is countability: if you can count the copies it is an echo, and if you can it is also usually a motion blur with too few samples.

**Frame interpolation**, the television feature that generates intermediate frames, actively removes the look motion blur gives. It is the cause of the soap opera effect, and it is what film-makers are objecting to when they ask you to turn it off.
