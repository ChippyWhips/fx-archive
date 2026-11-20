---
slug: fluted-glass
name: Fluted glass
synonyms:
  - reeded glass
  - ribbed glass
  - lenticular distortion
collection: Distortion
tags:
  - shader
  - post-fx
oneLiner: An image seen through a surface of parallel ribs, each one bending the view sideways so the scene arrives sliced into vertical bands.
whatItIs: |
  Fluted glass is a sheet whose surface is a row of half-cylinders. Light crossing from air into glass bends by Snell's law, by an amount that depends on the angle the surface presents, and because that angle sweeps from one edge of a rib to the other, each rib acts as a narrow lens. What you see is the scene sampled at a different offset in every band, with the offsets repeating.

  The result is legible as light and colour but not as form, which is exactly why it is used in architecture. It is also why it reads so strongly in identity work. The bands are regular, the shift inside each band is continuous, and the two together give you a pattern that is clearly a material rather than a filter.

  Two details separate a convincing version from a plain sinusoidal warp. The seam between two ribs presents a grazing angle and reads as a dark line, which is what makes the ribs look like objects standing in front of the scene. And real glass disperses, bending blue further than red, so edges behind it break into colour. Leave both out and you have a wave, not glass.
renderer: webgl
motionDependent: false
controlsLayout: overlay
poster: /posters/fluted-glass.png
parameters:
  - name: Flutes across
    what: How many ribs span the frame. The whole character sits here. Few wide ribs read as architecture, many narrow ones read as texture, and somewhere between the two it stops being either.
    lock: expose
  - name: Profile
    what: The cross-section of one rib. Round is a half cylinder and the physically honest one. Bevel is two flat faces, which gives a hard split rather than a sweep. Wave is softer than either and the least like real glass.
    lock: lock
  - name: Refractive index
    what: How strongly the material bends light. Soda-lime glass is about 1.52 and water is 1.33, so anything much above 1.6 is no longer glass and will read as a special effect.
    lock: lock
  - name: Glass thickness
    what: How far the ray travels inside the material, which sets how far the view is displaced. In practice this and the refractive index do similar jobs, and exposing both is a quick way to let someone get lost.
    lock: expose
  - name: Dispersion
    what: Splits the three channels by refractive index, as real glass does. A small amount is the difference between glass and a warp. A large amount is chromatic aberration wearing a different hat.
    lock: lock
  - name: Seam darkness
    what: How dark the join between two ribs goes. It stands in for the grazing-angle reflection at the edge of each rib, and it is what makes the ribs read as standing in front of the scene.
    lock: lock
  - name: Pan
    what: Slides the glass across the scene over time. Worth having, because the effect is far more convincing in motion than in a still, and because it is how the thing behaves when someone walks past it.
    lock: expose
related:
  - chromatic-aberration
  - moire
  - pixelation
sources:
  - title: Refraction
    url: https://en.wikipedia.org/wiki/Refraction
    kind: article
  - title: Snell's law
    url: https://en.wikipedia.org/wiki/Snell%27s_law
    kind: article
  - title: Lenticular printing
    url: https://en.wikipedia.org/wiki/Lenticular_printing
    kind: history
---

## How it works

Take the coordinate across the ribs, multiply by the number of ribs, and the fractional part gives a position inside one rib running from minus one to plus one. From that position the profile gives the sine of the angle the surface presents at that point. For a half-cylinder it is simply the position itself, which is a pleasant consequence of a circle's geometry.

Then apply Snell's law directly. The sine of the refracted angle is the sine of the incident angle divided by the refractive index, and the lateral shift after travelling a given thickness is the difference of the two tangents, multiplied by that thickness. That is three lines of shader and it is the real thing, not an approximation. Sampling the source at the shifted coordinate finishes it.

The incident angle has to be clamped a little below ninety degrees, because the tangent runs away at the rib edge and an unclamped version will sample from anywhere. That clamp is where the seam lives, which is convenient, since the seam needs to be dark anyway.

Dispersion costs two extra samples. Offset the refractive index slightly per channel, sample three times, take one channel from each. It is the same gather the hardware does for free in a texture fetch, so it is cheap, and it is the detail that lifts the whole thing.

This has to be a shader because every pixel reads the source from somewhere else, three times. That is a gather, and a 2D canvas cannot gather without reading the whole image back into JavaScript.

## Brand tool lens

The one genuinely useful control is the number of flutes, and it is the one to expose. Everything else describes the material, and the material should be decided once and locked, in the same way a brand decides on a paper stock rather than offering a choice of eight.

The trap is scale. A flute count fixed in frame units means the ribs get wider as the artwork gets bigger, which is backwards: real glass has a fixed rib pitch in millimetres. If the tool produces assets at several sizes, the parameter exposed should be rib width in physical units with the count derived from it, otherwise a poster and a business card will not look like the same material.

Legibility needs a stated rule. Type behind fluted glass is unreadable, and that is the point, but someone will eventually put the logotype behind it and ask why it looks broken. Either the glass sits over imagery only, or there is a defined clear band where type can live. Write it down, because it will be tested.

## Easily confused with

**Chromatic aberration** is dispersion on its own, from a lens that fails to bring the three wavelengths to the same focus. Fluted glass includes dispersion but the displacement is the effect, not a defect.

**Lenticular printing** uses the same row of cylindrical lenses, but over a sliced composite of two or more images, so the view changes with the angle you stand at. Same optics, different purpose.

**Liquid or ripple distortion** displaces the image too, but from a continuous field with no repeating structure and no material behind it. The giveaway is the absence of seams.

**Glass morphism**, the interface style, is a blur with a light border. It shares a name and essentially nothing else.
