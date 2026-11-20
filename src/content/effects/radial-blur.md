---
slug: radial-blur
name: Radial blur
synonyms:
  - zoom blur
  - zoom burst
  - streak blur
collection: Blur
tags:
  - post-fx
  - shader
oneLiner: A blur that smears everything along lines pointing at one centre, so the image looks as if the camera lunged forward while the shutter was open.
whatItIs: |
  Radial blur averages each pixel with the pixels on the straight line between it and a chosen centre. Nothing moves sideways; everything stretches towards or away from one point. The centre stays sharp, the edges smear hardest, and bright details turn into streaks that all aim at the same spot.

  The photographic original is the zoom burst: a slow shutter, and a twist of the zoom ring during the exposure. The lens changes focal length while light is landing, so the image is recorded at a run of different magnifications at once. Photoshop called its filter Radial Blur and offered a Zoom mode, which is where the two names got tangled. Zoom blur is the precise one; radial blur is the umbrella.

  It reads as speed, impact and arrival, which is why it turns up on sports graphics, title cards and every hyperspace jump. It also reads as light: give the bright pixels more weight and the streaks become shafts, the same technique games use for god rays.
renderer: webgl
motionDependent: false
controlsLayout: overlay
poster: /posters/radial-blur.png
parameters:
  - name: Centre
    what: The point everything streaks towards. Put it on the subject and the effect says focus, put it off frame and it says movement past the camera. Here it follows the pointer, and drifts when the pointer is away.
    lock: expose
  - name: Strength
    what: How far towards the centre each pixel is smeared, as a share of its distance. Because the smear is proportional to distance, edges always blur more than the middle without any extra work.
    lock: expose
  - name: Clear centre
    what: A radius around the centre that stays sharp before the blur ramps in. It protects a logo or a face, and is what keeps the effect from looking like a lens fault.
    lock: lock
  - name: Pulse
    what: Breathes the strength over time, the way a zoom pull looks when it is animated rather than frozen. Useful for showing the look in motion; rarely right in a delivered asset.
    lock: lock
  - name: Highlight gain
    what: Gives bright samples more weight, so lights throw longer streaks than shadows do. At zero it is a zoom burst. Turned up, it becomes light rays.
    lock: lock
  - name: Samples
    what: How many zoomed copies are averaged. Too few and the streaks break into a stack of visible rings. The number needed rises with strength and with frame size.
    lock: lock
  - name: Jitter
    what: Scatters each sample inside its slot, so too few samples show as grain rather than rings. The same trade as in motion blur, for the same reason.
    lock: lock
related:
  - motion-blur
  - dolly-zoom
  - echo-and-trails
sources:
  - title: Zoom burst
    url: https://en.wikipedia.org/wiki/Zoom_burst
    kind: history
  - title: 'GPU Gems 3: Volumetric light scattering as a post-process'
    url: https://developer.nvidia.com/gpugems/gpugems3/part-ii-light-and-shadows/chapter-13-volumetric-light-scattering-post-process
    kind: tutorial
  - title: Filter effects reference (Photoshop)
    url: https://helpx.adobe.com/photoshop/using/filter-effects-reference.html
    kind: article
---

## How it works

Take the vector from the centre to the pixel. Scale it by a little under one and sample the source there, then a little less, then a little less again, and average what you find. Every sample is the whole image scaled towards the centre by a slightly larger amount, so the result is literally a stack of zoomed copies, which is exactly what the zoom burst records on film.

Distance does the rest. A pixel near the centre moves a tiny amount between samples and stays sharp; a pixel at the corner moves a long way and smears. No falloff function is needed for that, it falls out of the geometry. The clear centre control only adds a ramp on top, for when the middle needs protecting absolutely.

The light version changes one line. Instead of a plain average, each sample is weighted by its brightness, so a lamp contributes far more than the dark around it and its streak survives the averaging. NVIDIA's volumetric light scattering chapter is this, with an occlusion pass in front so only the sky and the sun cast rays.

Too few samples produce rings rather than streaks, because the copies are distinct. Jitter offsets each one by a per-pixel random amount, which swaps the rings for fine noise the eye forgives.

## Brand tool lens

The two parameters that carry the look are centre and strength, and both are worth exposing, with limits. Centre is a composition decision the person making the asset should own. Strength needs a ceiling: past about a third of the distance the image stops being a picture with energy and becomes a tunnel.

Everything else is material and should be locked. Pick whether the identity's version is a clean zoom or carries light, set the highlight gain once, and fix the sample count high enough for the largest format the tool will export. A sample count that looks fine on a phone story can ring on a 4K screen.

Write a rule for type. A zoom burst over a wordmark is tempting and nearly always illegible. The practical version is a clear centre sized to the logo, or blur applied to the background plate only, with the mark composited sharp on top. For example, a sports club's matchday template might lock the centre to the player's face, expose strength between zero and 0.3, and keep the crest outside the blur entirely.

## Easily confused with

**Motion blur** smears along the path something actually moved. Radial blur smears along lines to one point regardless of what moved, which is why it looks like the camera rather than the subject.

**Spin blur** is its rotational sibling: it smears around the centre in arcs rather than along the radius. Same centre, perpendicular direction.

**Dolly zoom** changes the perspective of a scene over several frames by moving the camera while zooming the lens. Radial blur happens inside one frame and changes no perspective at all.

**Light rays or god rays** are radial blur weighted by brightness and masked by whatever blocks the light. If the streaks only come from bright areas, that is the variant you are looking at.
