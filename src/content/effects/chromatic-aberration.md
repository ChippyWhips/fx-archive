---
slug: chromatic-aberration
name: Chromatic aberration
synonyms:
  - RGB split
  - colour fringing
  - colour shift
collection: Optical and lens
tags:
  - post-fx
  - shader
  - motion-dependent
oneLiner: It offsets the red, green and blue channels slightly from each other, so edges pick up the coloured fringe a real lens leaves behind.
whatItIs: |
  Chromatic aberration is a lens defect. Glass refracts short wavelengths more than long ones, so blue light focuses slightly closer to the lens than red light does. The three channels land at marginally different scales, and every high-contrast edge picks up a coloured fringe — cyan on one side, orange or magenta on the other.

  Photographers spend money removing it. Designers add it back, because it is one of the strongest available signals that an image passed through a physical instrument rather than a renderer. The synonym RGB split usually means the deliberate, exaggerated version; colour fringing usually means the accidental one.
renderer: webgl
motionDependent: true
controlsLayout: overlay
poster: /posters/chromatic-aberration.png
parameters:
  - name: Split
    what: Base distance the red and blue channels move apart, as a fraction of the frame. Past about two per cent it stops reading as a lens and becomes a graphic device.
    lock: expose
  - name: Velocity response
    what: How far movement widens the split. This is what makes the effect feel like a lens under load rather than a static filter.
    lock: lock
  - name: Edge falloff
    what: Weights the split towards the edge of the frame. High falloff keeps the centre sharp, which is how a real lens behaves.
    lock: lock
  - name: Direction
    what: Whether the channels split along a fixed axis or outwards from the centre. Radial reads as optics; horizontal reads as a signal fault.
    lock: expose
  - name: Barrel
    what: Lens-style radial distortion applied before the split, since the two usually arrive together.
    lock: lock
related:
  - ordered-dithering
sources:
  - title: Chromatic aberration
    url: https://en.wikipedia.org/wiki/Chromatic_aberration
    kind: article
  - title: 3D Game Shaders For Beginners — Chromatic Aberration
    url: https://lettier.github.io/3d-game-shaders-for-beginners/chromatic-aberration.html
    kind: tutorial
  - title: Unity URP — Chromatic Aberration post-processing
    url: https://docs.unity3d.com/Packages/com.unity.render-pipelines.universal@17.0/manual/post-processing-chromatic-aberration.html
    kind: example
---

## How it works

The simulation is cheap: sample the source three times, once per channel, each at a slightly different offset, and recombine. Green stays where it is and acts as the reference, while red and blue move in opposite directions.

Two details separate a convincing version from an obvious one. First, the offset should grow with distance from the centre — real aberration is near-zero on the optical axis and worst at the corners — which is what the falloff control weights. Second, sampling outside the frame has nothing to read, so those samples fade to black rather than smearing the edge pixel across the border.

This demo also ties the offset to pointer velocity. Still frames of chromatic aberration are nearly unreadable: you cannot tell a deliberate two-pixel split from a misregistered export. In motion, where the fringe swells as something moves and settles as it stops, the effect announces itself immediately.

## Brand tool lens

Expose the split amount and the direction; lock the falloff, the barrel and the velocity response. Those three are what make it look like optics rather than a mistake, and they are exactly the ones a non-specialist will push too far.

Direction is worth exposing because it changes the meaning rather than the degree. Radial says _camera_. Horizontal says _broken signal_, and sits with glitch and CRT work. Letting a client choose between two named options is safer than giving them an angle dial.

A practical ceiling: cap the split at about two per cent of the frame width in the tool itself. Above that the three channels read as three separate images, and no amount of art direction recovers it.

## Easily confused with

**Datamosh and channel shift** displace whole channels by large, constant amounts with hard edges and no falloff. Chromatic aberration is small, continuous, and strongest at the frame edge.

**Halation** is a warm glow bleeding outwards from bright areas, caused by light scattering back off the film base. It has no channel offset — it is a bloom with a colour cast.

**Risograph misregistration** is a printing error: whole separations shifted by a fixed distance across the entire sheet, with flat ink and no falloff at all.
