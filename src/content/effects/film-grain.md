---
slug: film-grain
name: Film grain
synonyms:
  - grain
  - film noise
  - stock texture
collection: Optical and lens
tags:
  - post-fx
  - motion-dependent
  - shader
oneLiner: Fine random noise laid over the image on its own grid, so the picture reads as something recorded on a physical stock rather than rendered.
whatItIs: |
  Photographic film is an emulsion of silver halide crystals. Each crystal either develops or does not, so the image is built from a random scatter of discrete particles rather than a smooth field, and that scatter is visible as grain. The crystals vary in size, faster stocks use larger ones, and the texture is strongest in the midtones because clear film has nothing to clump and fully exposed film is already saturated.

  Digitally it is additive noise, but the detail that matters is that the noise sits on its own grid and has nothing to do with what is in the picture. It does not follow edges, it does not scale with the subject, and it renews itself every frame. Those three properties are what the eye reads as a physical recording medium, and getting any of them wrong turns grain into texture overlay, which reads as a filter instead.
renderer: webgl
motionDependent: true
controlsLayout: overlay
poster: /posters/film-grain.png
parameters:
  - name: Amount
    what: How far each pixel is pushed. The usable range is far smaller than it feels, because anything you can see clearly in a still is usually too much in motion.
    lock: expose
  - name: Grain size
    what: The grain cell in device pixels. Fixing it in device pixels rather than CSS pixels is what keeps the texture identical across displays, which is the single most important decision here.
    lock: lock
  - name: Midtone bias
    what: How much more grain the midtones get than the blacks and whites. Real film has almost none in either extreme, and grain in the blacks is the clearest sign of a digital fake.
    lock: lock
  - name: Colour noise
    what: How far the three channels disagree. Zero is monochrome grain over a colour image, which is what film stock does; higher values read as digital sensor noise instead.
    lock: lock
  - name: Freeze grain
    what: Stops the grain renewing each frame. Frozen grain reads as a texture stuck to the screen rather than as a recording, and is only right for stills.
    lock: lock
  - name: Exposure
    what: Brightness of the underlying image, here to show how much the grain response depends on what is beneath it.
    lock: expose
related:
  - chromatic-aberration
  - error-diffusion-dithering
sources:
  - title: Film grain
    url: https://en.wikipedia.org/wiki/Film_grain
    kind: article
  - title: The Book of Shaders - random
    url: https://thebookofshaders.com/10/
    kind: tutorial
  - title: fBM
    url: https://iquilezles.org/articles/fbm/
    kind: tutorial
---

## How it works

Hash the integer coordinates of the grain cell, together with a frame number, into a pseudo-random value. Using integer cell coordinates rather than the raw position is what gives the grain a fixed size on screen regardless of what the image does, and including the frame number is what makes it renew.

Uniform random noise is the wrong distribution. Real grain clusters near zero with occasional strong particles, which is roughly Gaussian, and the difference is obvious once you have seen both: uniform noise looks like television static, Gaussian noise looks like film. The Box-Muller transform turns two uniform samples into one normally distributed one in two lines, which is cheaper than any of the alternatives.

Then weight the noise by the underlying brightness. A response curve peaking in the midtones and falling to nothing at both ends matches the physics closely enough, and it is the difference between grain that sits in the image and grain that floats on top of it. Add rather than blend, clamp once at the end, and keep the whole thing in the same colour space as the image, because grain applied after a gamma curve behaves differently from grain applied before it.

## Brand tool lens

Grain is the effect clients most often ask to turn up and most often need turned down. The amount slider should have a hard ceiling well below what looks right in a static preview, because grain is evaluated in motion and in motion it reads perhaps twice as strong.

Everything except amount should be locked. Grain size, midtone bias and colour noise together define a stock, and a stock is a brand decision made once. If different assets have different grain sizes they will not look like a family, and the inconsistency is unusually visible because the eye is good at noticing texture mismatches between adjacent things.

The hard constraint is delivery. Grain is high-frequency, uncorrelated noise, which is the worst possible input for a video codec: it consumes bitrate that would otherwise go to the image, and at low bitrates the codec throws it away in patches, leaving blotches that look nothing like grain. If the asset is going to social video, add the grain last, test at the platform's real bitrate, and expect to use less than you wanted. For print, grain has to be generated at final resolution or it will be resampled into mud.

## Easily confused with

**Digital sensor noise** is a different artefact with a different character: it is stronger in the shadows, has far more chroma variation, and often shows a fixed pattern. Using one when the brief asked for the other is a common and visible mistake.

**Halation** is the glow around bright areas where light scatters inside the film base. It frequently accompanies grain in a film look but is a separate effect, and it is the one that does most of the work.

**Dithering** also adds a pattern, but to recover tonal range that has been removed. Grain adds noise to an image that keeps its full range.

**Texture overlays**, scanned paper or dust, are fixed images multiplied over the frame. They do not renew per frame and they do follow the composition, so they read as surface rather than as stock.
